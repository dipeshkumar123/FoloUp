"use client";

/**
 * AntiCheatMonitor
 * ----------------
 * Visualises the live anti-cheat signals in a small overlay inside the
 * interview screen. Designed to be subtle: it doesn't distract the
 * candidate, but a reviewer watching a recording can read everything
 * that's happening at a glance.
 */

import { cn } from "@/components/enhanced/shared/cn";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { type AntiCheatSignal, type AntiCheatState, SIGNAL_LABELS } from "./useAntiCheat";

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  tab_switch: <Eye className="h-3 w-3" />,
  window_blur: <Eye className="h-3 w-3" />,
  fullscreen_exit: <Maximize2 className="h-3 w-3" />,
  copy_paste_attempt: <AlertTriangle className="h-3 w-3" />,
  right_click: <AlertTriangle className="h-3 w-3" />,
  devtools_open: <AlertTriangle className="h-3 w-3" />,
  text_selected: <AlertTriangle className="h-3 w-3" />,
  face_absent: <ShieldAlert className="h-3 w-3" />,
  screenshot_attempt: <Camera className="h-3 w-3" />,
};

export function AntiCheatMonitor({
  state,
  className,
  showLog = true,
}: {
  state: AntiCheatState;
  className?: string;
  showLog?: boolean;
}) {
  const { signals, isFullscreen, isDevtoolsOpen, isFacePresent, facePresencePct, anySignal } =
    state;

  const overallTone = !anySignal
    ? "ok"
    : signals.length > 5 || isDevtoolsOpen
      ? "critical"
      : "warning";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-3 shadow-sm",
        overallTone === "ok" && "border-emerald-200",
        overallTone === "warning" && "border-amber-200",
        overallTone === "critical" && "border-rose-300",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {overallTone === "ok" ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <ShieldAlert
              className={cn(
                "h-4 w-4",
                overallTone === "warning" ? "text-amber-600" : "text-rose-600",
              )}
            />
          )}
          <p className="text-xs font-semibold text-slate-900">Integrity monitor</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            overallTone === "ok" && "bg-emerald-50 text-emerald-700",
            overallTone === "warning" && "bg-amber-50 text-amber-700",
            overallTone === "critical" && "bg-rose-50 text-rose-700",
          )}
        >
          {overallTone === "ok"
            ? "All clear"
            : overallTone === "warning"
              ? "Minor signals"
              : "Review recommended"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <MonitorTile label="Fullscreen" ok={isFullscreen} okText="On" badText="Off" />
        <MonitorTile label="DevTools" ok={!isDevtoolsOpen} okText="Closed" badText="Open" />
        <MonitorTile
          label="Face"
          ok={isFacePresent}
          okText={`${facePresencePct}%`}
          badText="Missing"
        />
      </div>

      {showLog && signals.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Recent signals
          </p>
          <ul className="max-h-32 space-y-1 overflow-y-auto pr-1">
            {signals
              .slice(-6)
              .reverse()
              .map((s, idx) => (
                <SignalRow key={`${s.timestamp}-${idx}`} signal={s} />
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MonitorTile({
  label,
  ok,
  okText,
  badText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2 text-center",
        ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
      )}
    >
      <p className={cn("text-[11px] font-semibold", ok ? "text-emerald-700" : "text-rose-700")}>
        {ok ? okText : badText}
      </p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function SignalRow({ signal }: { signal: AntiCheatSignal }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        {SIGNAL_ICONS[signal.type] ?? <AlertTriangle className="h-3 w-3" />}
      </span>
      <span className="flex-1">
        {SIGNAL_LABELS[signal.type]}
        {signal.detail ? <span className="ml-1 text-slate-500">· {signal.detail}</span> : null}
      </span>
      <span className="text-[10px] text-slate-400">
        {new Date(signal.timestamp).toLocaleTimeString()}
      </span>
    </li>
  );
}

export function IntegrityBadge({ state }: { state: AntiCheatState }) {
  const { anySignal, isFacePresent, isFullscreen, isDevtoolsOpen } = state;
  if (!anySignal && isFacePresent && isFullscreen && !isDevtoolsOpen) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> All clear
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
      <AlertTriangle className="h-3 w-3" /> Signals detected
    </span>
  );
}
