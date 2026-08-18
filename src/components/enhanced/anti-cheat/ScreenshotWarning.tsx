"use client";

/**
 * ScreenshotWarning
 * -----------------
 * Shows a visible warning overlay the moment a screenshot attempt is
 * detected (PrintScreen, Win+Shift+S, Cmd+Shift+3/4, or an image copied
 * to the clipboard). Auto-dismisses after a few seconds so it doesn't
 * block the interview, but it appears immediately to deter further
 * attempts.
 */

import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AntiCheatSignal } from "./useAntiCheat";

interface ScreenshotWarningProps {
  /** The raw anti-cheat signal list; we look for screenshot_attempt entries. */
  signals: AntiCheatSignal[];
}

export function ScreenshotWarning({ signals }: ScreenshotWarningProps) {
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch for the most recent screenshot_attempt and pop the warning
  useEffect(() => {
    const last = [...signals].reverse().find((s) => s.type === "screenshot_attempt");
    if (!last) return;

    // Show a fresh warning for every new screenshot event, even if it's
    // rapid-fire — the user should *feel* that it's being tracked.
    setDetail(last.detail ?? null);
    setVisible(true);

    // Auto-dismiss after 4s so it doesn't stack up / block the UI
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => setVisible(false), 4000);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [signals]);

  if (!visible) return null;

  return (
    <div className="pointer-events-auto fixed left-1/2 top-6 z-[100] w-[min(92vw,420px)] -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-lg">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Camera className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-rose-800">Screenshot detected</p>
          <p className="mt-0.5 text-xs leading-relaxed text-rose-700">
            Taking screenshots is tracked and will be reported to the interviewer. Please continue
            looking at the camera.
          </p>
          {detail && (
            <p className="mt-1 rounded-md bg-rose-100/60 px-2 py-1 text-[11px] text-rose-600">
              {detail}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-md p-1 text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
