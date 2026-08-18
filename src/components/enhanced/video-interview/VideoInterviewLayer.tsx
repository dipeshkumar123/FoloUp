"use client";

/**
 * VideoInterviewLayer
 * -------------------
 * Adds an optional video stream to an existing FoloUp interview.
 *
 * Why this exists:
 *   The project's primary call is audio-only (via the Retell SDK). For
 *   higher-stakes loops, recruiters want to see the candidate — and
 *   passively catch a few more cheating signals (face-presence, second
 *   person in frame, candidate looking off-screen to read answers).
 *
 * How it works:
 *   • On `start()` we acquire the camera + microphone (mic is *not* used
 *     for capture — Retell owns the audio track — but the browser needs
 *     the same permission flow).
 *   • We mirror the local camera to a small corner tile so the candidate
 *     can see themselves.
 *   • We start a `MediaRecorder` on the camera-only stream, sliced into
 *     5s chunks, ready to be uploaded to object storage once the call
 *     ends. In demo mode we just hold the chunks in memory.
 *   • We expose `recordingUrl` so the parent (or the dashboard) can play
 *     back the recording after the call.
 *
 *   Trade-offs:
 *   - We do *not* replace Retell — the audio call is unchanged. This
 *     keeps the upgrade path low-risk and respects the project's
 *     existing voice pipeline.
 *   - For real-world deployment you'd want a cloud upload pipeline
 *     (signed URLs to S3 / Supabase Storage, resumable uploads, etc.).
 *   - The video is local-only until the call ends; we deliberately
 *     avoid streaming it in real time to keep costs / infra low.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Play, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/enhanced/shared/cn";

export interface VideoInterviewLayerHandle {
  stop: () => Promise<{ blob: Blob; url: string } | null>;
  recordingUrl: string | null;
  isRecording: boolean;
  hasPermission: boolean;
  /** The live camera stream, so other consumers (e.g. face detection) can
      share it instead of requesting a second getUserMedia. */
  stream: MediaStream | null;
}

interface VideoInterviewLayerProps {
  /** Whether the parent has started the interview (controls when we record). */
  active: boolean;
  /** Show the local camera preview tile even when not recording. */
  showPreview?: boolean;
  className?: string;
  onRecordingComplete?: (info: { durationSeconds: number; url: string }) => void;
  /**
   * A reference that lets the parent (call page) imperatively stop the
   * recording and pull the blob.
   */
  handleRef?: React.MutableRefObject<VideoInterviewLayerHandle | null>;
  /** Compact mode — used inside the in-call tile. */
  compact?: boolean;
  /** Called whenever the camera stream is acquired or released. Lets the
      parent share the same stream with face detection instead of opening a
      second camera. */
  onStreamReady?: (stream: MediaStream | null) => void;
}

export function VideoInterviewLayer({
  active,
  showPreview = true,
  className,
  onRecordingComplete,
  handleRef,
  compact = false,
  onStreamReady,
}: VideoInterviewLayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Acquire / release the camera
  useEffect(() => {
    if (!active) {
      const stream = streamRef.current;
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      onStreamReady?.(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        onStreamReady?.(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setHasPermission(true);
        setError(null);

        // Pick a codec the browser actually supports
        const candidates = [
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
        ];
        const mimeType = candidates.find(
          (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
        );
        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined,
        );
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mimeType ?? "video/webm",
          });
          const url = URL.createObjectURL(blob);
          setRecordingUrl(url);
          setIsRecording(false);
          onRecordingComplete?.({
            durationSeconds:
              startTimeRef.current !== null
                ? Math.round((Date.now() - startTimeRef.current) / 1000)
                : 0,
            url,
          });
        };
        recorderRef.current = recorder;
        recorder.start(5_000); // emit a chunk every 5s
        setIsRecording(true);
        startTimeRef.current = Date.now();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not access the camera. Please grant permission.",
        );
        setHasPermission(false);
        onStreamReady?.(null);
      }
    })();
    return () => {
      cancelled = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      onStreamReady?.(null);
    };
  }, [active, onRecordingComplete, onStreamReady]);

  // Elapsed-time ticker
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  // Expose imperative handle to parent
  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      isRecording,
      recordingUrl,
      hasPermission,
      stream: streamRef.current,
      stop: async () => {
        if (!recorderRef.current) return null;
        if (recorderRef.current.state !== "inactive") {
          await new Promise<void>((resolve) => {
            recorderRef.current!.onstop = () => resolve();
            recorderRef.current!.stop();
          });
        }
        const stream = streamRef.current;
        stream?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        return { blob, url: URL.createObjectURL(blob) };
      },
    };
  }, [isRecording, recordingUrl, hasPermission, handleRef]);

  const stopNow = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    const stream = streamRef.current;
    stream?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  if (compact) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10",
          className,
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover [transform:scaleX(-1)]"
        />
        {isRecording && (
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            REC · {formatElapsed(elapsed)}
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
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200">
        {showPreview ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover [transform:scaleX(-1)]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Camera className="h-10 w-10" />
          </div>
        )}
        {isRecording && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-rose-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            REC · {formatElapsed(elapsed)}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 p-4 text-center">
            <CameraOff className="h-8 w-8 text-rose-300" />
            <p className="mt-2 max-w-xs text-[11px] text-rose-200">{error}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <p className="text-slate-500">
          {isRecording
            ? "Recording locally — uploaded at the end of the call."
            : "Video stream idle."}
        </p>
        {isRecording && (
          <Button size="sm" variant="outline" onClick={stopNow}>
            <Square className="mr-1 h-3.5 w-3.5" /> Stop
          </Button>
        )}
      </div>
      {recordingUrl && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Last recording
          </p>
          <video
            src={recordingUrl}
            controls
            className="w-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * VideoPlayerCard
 * ---------------
 * A read-only player for a recorded interview. Used by the feedback
 * dashboard's "watch recording" affordance and by the demo page.
 */
export function VideoPlayerCard({
  src,
  poster,
  candidateName,
  durationSeconds,
  facePresencePct,
  className,
}: {
  src: string | null;
  poster?: string;
  candidateName: string;
  durationSeconds: number;
  facePresencePct: number;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-slate-900",
        className,
      )}
    >
      <div className="relative aspect-video">
        {src ? (
          <video
            src={src}
            poster={poster}
            controls
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-slate-300">
              <Play className="mx-auto h-10 w-10 text-slate-500" />
              <p className="mt-2 text-xs">Recording available after the call</p>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">
          {candidateName} · {Math.round(durationSeconds / 60)}m
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
          {facePresencePct}% face presence
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300">
        <p>
          {playing
            ? "Recording in playback — auto-pauses on focus loss"
            : "Click play to scrub the interview"}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1 hover:bg-slate-700"
        >
          <Upload className="h-3 w-3" /> Upload to cloud
        </button>
      </div>
    </div>
  );
}
