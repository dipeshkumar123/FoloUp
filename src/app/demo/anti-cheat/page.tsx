"use client";

/**
 * /demo/anti-cheat
 * ----------------
 * Interactive playground that wires the anti-cheat hook, fullscreen
 * enforcer, and the face-presence camera into a faux interview page.
 * Reviewers can poke at every signal: alt-tab, copy, paste, right-click,
 * try to open devtools, resize the window, leave the camera frame, etc.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/enhanced/shared/primitives";
import {
  AntiCheatMonitor,
  IntegrityBadge,
} from "@/components/enhanced/anti-cheat/AntiCheatMonitor";
import { useAntiCheat } from "@/components/enhanced/anti-cheat/useAntiCheat";
import { FacePresenceCamera } from "@/components/enhanced/anti-cheat/FacePresenceCamera";
import { FullscreenEnforcer } from "@/components/enhanced/anti-cheat/FullscreenEnforcer";
import { cn } from "@/components/enhanced/shared/cn";

const SIGNAL_GUIDE: {
  type: keyof typeof ACTIONS;
  label: string;
  hint: string;
  trigger: () => void;
}[] = [
  {
    type: "tab_switch",
    label: "Simulate tab switch",
    hint: "Alt-tab to another app, or use the dock.",
    trigger: () => {
      // We can't actually hide the document, so we surface a fake event.
      // In real usage, document.hidden becomes true when the user alt-tabs.
      window.dispatchEvent(new Event("blur"));
    },
  },
  {
    type: "copy_paste_attempt",
    label: "Try to copy this text",
    hint: "Select the sample text and press ⌘C / Ctrl+C.",
    trigger: () => {
      // No-op — copy / paste is detected via document listeners.
    },
  },
  {
    type: "right_click",
    label: "Right-click the page",
    hint: "Open the context menu anywhere on the page.",
    trigger: () => {
      // No-op — right-click is detected via the contextmenu listener.
    },
  },
  {
    type: "devtools_open",
    label: "Open devtools",
    hint: "Right-click → Inspect, or F12 / Cmd+Opt+I.",
    trigger: () => {
      window.dispatchEvent(new Event("resize"));
    },
  },
  {
    type: "fullscreen_exit",
    label: "Leave fullscreen",
    hint: "Click the button below to enter, then press Esc.",
    trigger: () => {
      // We surface a hint; the live signal comes from the fullscreenchange event.
    },
  },
  {
    type: "text_selected",
    label: "Select a long passage",
    hint: "Click-drag to select 20+ characters anywhere on the page.",
    trigger: () => {},
  },
];

// Just used for the type-narrowing keyof above
const ACTIONS = {
  tab_switch: true,
  copy_paste_attempt: true,
  right_click: true,
  devtools_open: true,
  fullscreen_exit: true,
  text_selected: true,
} as const;

export default function AntiCheatDemo() {
  const [running, setRunning] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const state = useAntiCheat({
    enabled: running,
    enforceFullscreen: true,
    enableFacePresence: interviewStarted,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All demos
          </Link>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
            Optional
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Anti-cheat suite
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            8 integrity signals, one hook
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            The existing app only tracked tab switches. This adds fullscreen
            enforcement, copy / paste / right-click blocking, devtools heuristic
            detection, text-selection monitoring, and webcam face-presence —
            all surfaced live in the integrity monitor.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Live interview sandbox
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Start the sandbox, then try the actions in the right column.
                  The integrity monitor updates in real time.
                </p>
              </div>
              <IntegrityBadge state={state} />
            </div>

            {!running ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Ready to start
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  When you start, the page will start watching for cheating
                  signals. Your camera will be requested when the interview
                  begins.
                </p>
                <Button
                  className="mt-3 bg-rose-600 hover:bg-rose-700"
                  onClick={() => setRunning(true)}
                >
                  Start sandbox
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <FullscreenEnforcer
                  active={!state.isFullscreen}
                  onEnter={() => setInterviewStarted(true)}
                />
                {state.isFullscreen && !interviewStarted && (
                  <button
                    type="button"
                    onClick={() => setInterviewStarted(true)}
                    className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Begin interview
                  </button>
                )}

                {interviewStarted && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Your camera
                        </p>
                        <div className="mt-1 h-44">
                          <FacePresenceCamera
                            enabled={interviewStarted}
                            className="h-full"
                            compact
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Sample interview content
                        </p>
                        <div className="rounded-xl bg-white p-3 text-xs leading-relaxed text-slate-700">
                          <p className="font-semibold text-slate-900">
                            AI Interviewer
                          </p>
                          <p className="mt-1">
                            "Tell me about a project where you had to learn a
                            new technology quickly. How did you approach it?"
                          </p>
                          <p className="mt-2 italic text-slate-500">
                            (try selecting this paragraph — selection events are
                            monitored)
                          </p>
                        </div>
                        <p className="rounded-lg bg-white p-2 font-mono text-[10px] text-slate-500">
                          tab_switch={state.counts.tab_switch ?? 0} ·
                          copy={state.counts.copy_paste_attempt ?? 0} ·
                          right_click={state.counts.right_click ?? 0} ·
                          devtools={state.isDevtoolsOpen ? 1 : 0} ·
                          face_presence={state.facePresencePct}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500">
                  All actions below are detected automatically — buttons are
                  just hints for what to try. In production they're not shown to
                  the candidate.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SIGNAL_GUIDE.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={s.trigger}
                      className={cn(
                        "rounded-xl border border-slate-200 bg-white p-3 text-left text-xs transition hover:border-rose-300 hover:bg-rose-50/30",
                      )}
                    >
                      <p className="font-semibold text-slate-900">{s.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {s.hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <AntiCheatMonitor state={state} />

            <Card>
              <SectionTitle title="Detection coverage" />
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Tab switch / window blur
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Fullscreen exit
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Copy / paste / cut
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Right-click
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  DevTools open (heuristic)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Long text selection
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Face-presence (webcam)
                </li>
              </ul>
            </Card>

            <Card>
              <SectionTitle title="Honest limits" />
              <p className="text-xs text-slate-600">
                None of these are unspoofable. A determined candidate with a
                second device can still cheat. The goal is to surface enough
                signal that a reviewer can spot anomalies — not to make
                cheating impossible.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
