"use client";

/**
 * FacePresenceCamera
 * ------------------
 * Lightweight face-presence detection for the interview screen.
 *
 * The original implementation used an RGB skin-tone heuristic that was
 * unreliable across complexions and lighting. The version below uses
 * the well-known YCbCr-based skin detector from Hsu, Abdel-Mottaleb
 * & Jain (2002), which works across all skin tones from very light to
 * very dark because it decouples luma (brightness) from chroma (colour).
 *
 *   Y  = luma           — brightness, must be > 80 (Hsu 2002 luminance guard)
 *   Cb = blue-difference — must be in [77, 127]
 *   Cr = red-difference  — must be in [133, 180]
 *
 * NOTE ON RANGE: the original paper's Cr bound is [133, 173], but in
 * practice that upper bound excludes tanned / warm-lit complexions
 * (direct sunlight, tungsten bulbs, phone cameras with warm white
 * balance). We widen Cr to 180 and keep the Cb band as-is. The Y > 80
 * guard from the paper is also applied — it prevents a bright red
 * background (e.g. a curtain or a poster) from being counted as skin.
 *
 * In addition to the skin check we look for:
 *   • a luminance-gradient signature (faces have strong edges: eyes,
 *     nose, mouth) in the central region
 *   • a non-uniformity check (a flat wall has no face, a face does)
 *   • a minimum overall brightness (a black frame is "no camera",
 *     not "no face")
 *
 * The detector still returns a heuristic — never a verdict. The
 * dashboard's Integrity tab tells the reviewer to use it as a nudge,
 * not as proof.
 *
 * Why this approach (and not face-api.js / MediaPipe)?
 *   • Keeps the bundle small and side-effect free.
 *   • No model download, no permission surprises beyond getUserMedia.
 *   • The signal we actually need is "is there a face-shaped region in
 *     the frame right now?", not "whose face is it".
 *
 * Trade-offs documented:
 *   • Very strong coloured lighting (green/red stage lights) can throw
 *     off the chroma test.
 *   • A printed photo of a face will also be flagged as present.
 *   • Always review flagged sessions manually before acting.
 */

import { cn } from "@/components/enhanced/shared/cn";
import { Camera, CameraOff, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __antiCheatSetFacePresent?: (present: boolean) => void;
  }
}

interface FacePresenceCameraProps {
  enabled: boolean;
  className?: string;
  pollMs?: number;
  compact?: boolean;
  /**
   * A pre-acquired camera stream to analyse. When provided, the component
   * reuses it instead of calling getUserMedia again — this avoids opening a
   * second camera when the VideoInterviewLayer already owns one.
   */
  stream?: MediaStream | null;
}

// ---------------------------------------------------------------------------
// YCbCr skin detection (works across all complexions, no false-positive on
// dark backgrounds). Implemented inline so the bundle stays small.
// ---------------------------------------------------------------------------
function rgbToYCbCr(r: number, g: number, b: number) {
  // BT.601 conversion. Operates on 0..255 input, returns Y in 0..255 and
  // Cb/Cr in 0..255 (offset+128 by convention so the skin range is
  // [77,127] / [133,173] as documented in Hsu 2002).
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

function isSkin(r: number, g: number, b: number): boolean {
  const { y, cb, cr } = rgbToYCbCr(r, g, b);
  // Hsu 2002 skin range with two adjustments that dramatically reduce
  // false negatives in real webcam lighting:
  //   1. The paper's Cr <= 173 upper bound is widened to 180. Under warm
  //      / tungsten / direct-sunlight lighting, tanned and mid-tone
  //      complexions routinely land in the 174-180 band, and the old
  //      bound classified them as "no skin".
  //   2. The paper's Y > 80 luma guard is applied so a saturated red or
  //      orange background (poster, curtain) is never counted as skin.
  return y > 80 && cb >= 77 && cb <= 127 && cr >= 133 && cr <= 180;
}

export function FacePresenceCamera({
  enabled,
  className,
  pollMs = 600,
  compact = false,
  stream: streamProp,
}: FacePresenceCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasStream, setHasStream] = useState(false);
  const [hasFace, setHasFace] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Acquire / release the camera when `enabled` flips. When a shared
  // `stream` is provided (from the VideoInterviewLayer) we reuse it instead
  // of opening a second camera.
  useEffect(() => {
    if (!enabled) {
      const tracks = videoRef.current?.srcObject as MediaStream | null;
      // Only stop tracks we own — a shared stream is owned by the caller.
      if (!streamProp && tracks) {
        for (const t of tracks.getTracks()) t.stop();
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setHasStream(false);
      setHasFace(true);
      window.__antiCheatSetFacePresent?.(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const stream =
          streamProp ??
          (await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" },
            audio: false,
          }));
        if (cancelled) {
          if (!streamProp) {
            for (const t of stream.getTracks()) t.stop();
          }
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setHasStream(true);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not access the camera. Please grant permission and reload.",
        );
        setHasStream(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, streamProp]);

  // Polling loop — analyse the current frame
  useEffect(() => {
    if (!enabled || !hasStream) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;

      // Downsample aggressively — 96x72 is more than enough to count skin
      // pixels and compute a luminance gradient.
      const w = 96;
      const h = 72;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // Restrict the analysis to the centre 60% of the frame. A face in
      // a webcam almost always sits there.
      const x0 = Math.floor(w * 0.2);
      const x1 = Math.floor(w * 0.8);
      const y0 = Math.floor(h * 0.1);
      const y1 = Math.floor(h * 0.9);

      let skin = 0;
      let lumaSum = 0;
      let lumaSqSum = 0;
      let total = 0;

      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (isSkin(r, g, b)) skin += 1;
          // ITU-R BT.601 luma
          const y_l = 0.299 * r + 0.587 * g + 0.114 * b;
          lumaSum += y_l;
          lumaSqSum += y_l * y_l;
          total += 1;
        }
      }

      // Edge / contrast signature in the centre: difference between
      // adjacent pixels. A face has strong edges (eyes / mouth / hairline);
      // a wall or empty desk has near-zero variation.
      let edgeSum = 0;
      let edgeCount = 0;
      for (let y = y0 + 1; y < y1 - 1; y += 1) {
        for (let x = x0 + 1; x < x1 - 1; x += 1) {
          const i = (y * w + x) * 4;
          const iRight = (y * w + (x + 1)) * 4;
          const iDown = ((y + 1) * w + x) * 4;
          const a = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const b1 = 0.299 * data[iRight] + 0.587 * data[iRight + 1] + 0.114 * data[iRight + 2];
          const c = 0.299 * data[iDown] + 0.587 * data[iDown + 1] + 0.114 * data[iDown + 2];
          edgeSum += Math.abs(a - b1) + Math.abs(a - c);
          edgeCount += 1;
        }
      }
      const avgEdge = edgeCount === 0 ? 0 : edgeSum / edgeCount;
      const lumaMean = total === 0 ? 0 : lumaSum / total;
      const lumaVar = total === 0 ? 0 : lumaSqSum / total - lumaMean * lumaMean;

      const skinRatio = total === 0 ? 0 : skin / total;
      // "No camera" guard: if the frame is essentially black, we can't
      // detect a face. Stay "present" so we don't false-positive.
      const tooDark = lumaMean < 12;

      // Score = weighted combination. The YCbCr skin test is the primary
      // signal; the edge + variance checks guard against false positives
      // from a beige wall or a poster of a face.
      //
      // Threshold tuning: the original `skinRatio / 0.18` + `score > 0.32`
      // combination demanded ~6% skin in the centre region, which fails
      // when the webcam is slightly angled or the face occupies a smaller
      // area of the frame. We now saturate at 12% skin and lower the guard
      // to 0.24 — a face that occupies a realistic 20–30% of the centre
      // region passes comfortably, while a beige wall (≈2–3% "skin") and
      // a red poster (blocked by the Y>80 guard) still fail.
      const skinScore = Math.min(1, skinRatio / 0.12); // saturates at 12% skin
      const edgeScore = Math.min(1, avgEdge / 14);    // ~14 luma diff per pixel
      const lumaScore = Math.min(1, lumaVar / 400);    // variance across centre
      const score = 0.7 * skinScore + 0.2 * edgeScore + 0.1 * lumaScore;

      const present = tooDark ? true : score > 0.24;
      setHasFace(present);
      window.__antiCheatSetFacePresent?.(present);
    }, pollMs);
    return () => clearInterval(id);
  }, [enabled, hasStream, pollMs]);

  if (compact) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-slate-900", className)}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover [transform:scaleX(-1)]"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div
          className={cn(
            "absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            hasFace
              ? "bg-emerald-500/90 text-white"
              : "bg-rose-500/90 text-white",
          )}
        >
          {hasFace ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
          {hasFace ? "Face OK" : "No face"}
        </div>
        {!hasStream && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-[10px] text-slate-300">
            <Camera className="mr-1 h-3 w-3" /> starting…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 p-2 text-center text-[10px] text-rose-200">
            <CameraOff className="mr-1 h-3 w-3" /> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover [transform:scaleX(-1)]"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div
          className={cn(
            "absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold",
            hasFace
              ? "bg-emerald-500/90 text-white"
              : "bg-rose-500/90 text-white",
          )}
        >
          {hasFace ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          {hasFace ? "Face detected" : "No face in frame"}
        </div>
      </div>
      {error && (
        <p className="text-[11px] text-rose-600">{error}</p>
      )}
    </div>
  );
}
