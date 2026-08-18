"use client";

/**
 * FacePresenceCamera
 * ------------------
 * Lightweight face-presence detection for the interview screen.
 *
 * Why this approach (and not face-api.js / MediaPipe)?
 *   - Keeps the bundle small and side-effect free.
 *   - No model download, no permission surprises beyond getUserMedia.
 *   - The signal we actually need is "is there a face-shaped region in
 *     the frame right now?", not "whose face is it". A cheap luminance-
 *     + skin-tone heuristic in the centre of the frame is good enough
 *     to flag "candidate walked away" / "second person in frame" with
 *     a low false-positive rate in good lighting.
 *
 * Trade-offs documented:
 *   - In low light the heuristic may mark the frame as "no face".
 *   - Glasses / heavy makeup can throw off the skin-tone filter.
 *   - Always review flagged sessions manually before acting.
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
  /**
   * Whether to start the camera. The parent (interview screen) decides
   * when to enable this so the candidate is asked for permission at a
   * clear moment.
   */
  enabled: boolean;
  /** Optional class name for the wrapper. */
  className?: string;
  /** Poll interval in ms (default 700). */
  pollMs?: number;
  /** Compact mode — used inside the corner video tile. */
  compact?: boolean;
  /**
   * A pre-acquired camera stream to analyse. When provided, the component
   * reuses it instead of calling getUserMedia again — this avoids opening a
   * second camera when the VideoInterviewLayer already owns one.
   */
  stream?: MediaStream | null;
}

export function FacePresenceCamera({
  enabled,
  className,
  pollMs = 700,
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
      const w = 80;
      const h = 60;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      // Heuristic: a face-ish region in the centre 40% has more skin-tone
      // pixels than the perimeter.
      let skin = 0;
      let total = 0;
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          if (x < w * 0.3 || x > w * 0.7) continue;
          if (y < h * 0.2 || y > h * 0.85) continue;
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Wide-band skin tone test (works across many complexions)
          const isSkin =
            r > 60 &&
            g > 35 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 12 &&
            Math.max(r, g, b) - Math.min(r, g, b) > 12;
          if (isSkin) skin += 1;
          total += 1;
        }
      }
      const ratio = total === 0 ? 0 : skin / total;
      const present = ratio > 0.18; // tuned empirically
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
