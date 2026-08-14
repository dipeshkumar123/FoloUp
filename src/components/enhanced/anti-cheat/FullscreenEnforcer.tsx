"use client";

/**
 * FullscreenEnforcer
 * ------------------
 * A "you must be in fullscreen to start" gate, plus a watcher that
 * pulls the candidate back in if they exit mid-interview.
 *
 * The intent is to limit the realistic surface area for tab-switching,
 * screenshot tools, and "ask the guy next to me" cheating.
 */

import { useEffect, useState } from "react";
import { Maximize2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/enhanced/shared/cn";

export function FullscreenEnforcer({
  active,
  onEnter,
  className,
}: {
  active: boolean;
  onEnter?: () => void;
  className?: string;
}) {
  const [isFs, setIsFs] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const update = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", update);
    update();
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const enter = async () => {
    setRequested(true);
    try {
      await document.documentElement.requestFullscreen();
      onEnter?.();
    } catch (err) {
      // Browser may refuse outside a user gesture
      console.error(err);
    }
  };

  if (!active) return null;

  if (isFs) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700",
          className,
        )}
      >
        <ShieldCheck className="h-3 w-3" /> Fullscreen
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3",
        className,
      )}
    >
      <Maximize2 className="h-4 w-4 text-indigo-600" />
      <p className="flex-1 text-xs text-slate-700">
        <span className="font-semibold text-slate-900">Enter fullscreen</span>{" "}
        to start the interview. This limits the chance of tab-switching and
        external help.
      </p>
      <Button
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
        onClick={enter}
      >
        {requested ? "Try again" : "Enter fullscreen"}
      </Button>
      <button
        type="button"
        className="rounded-md p-1 text-slate-400 hover:bg-white"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
