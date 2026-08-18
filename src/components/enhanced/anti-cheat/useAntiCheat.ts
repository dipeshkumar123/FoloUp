"use client";

/**
 * Anti-cheat signal hook.
 * -----------------------
 * Watches the page for events that are common cheating signals during
 * an interview and surfaces them as a structured list. Designed to be
 * the *signal layer* — it doesn't decide what's cheating, the dashboard
 * does. The call component is expected to:
 *   • call `useAntiCheat({ enabled: true })` once the interview starts
 *   • forward `signals` to the response payload on submit
 *   • render the matching UI overlays (warnings) when the hook returns them
 *
 * Signals tracked:
 *   - tab_switch          (page hidden, alt-tab away)
 *   - window_blur         (window lost focus, but not necessarily hidden)
 *   - fullscreen_exit     (left fullscreen mode)
 *   - copy_paste_attempt  (copy / paste / cut)
 *   - right_click         (context menu opened)
 *   - devtools_open       (heuristic: window.outerWidth-innerWidth > 200)
 *   - text_selected       (user selected > 20 chars of text)
 *   - face_absent         (webcam feed lost the user's face for >2s)
 *
 * The hook is best-effort: nothing in the browser is unspoofable. The
 * goal is to surface enough signal that a reviewer can spot anomalies,
 * not to make cheating impossible.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type AntiCheatSignalType =
  | "tab_switch"
  | "window_blur"
  | "fullscreen_exit"
  | "copy_paste_attempt"
  | "right_click"
  | "devtools_open"
  | "text_selected"
  | "face_absent";

export interface AntiCheatSignal {
  type: AntiCheatSignalType;
  timestamp: number;
  detail?: string;
}

export interface AntiCheatConfig {
  enabled: boolean;
  /** Whether to require the user to enter fullscreen mode. */
  enforceFullscreen?: boolean;
  /** Whether to use the webcam for face-presence detection. */
  enableFacePresence?: boolean;
}

export interface AntiCheatState {
  signals: AntiCheatSignal[];
  counts: Partial<Record<AntiCheatSignalType, number>>;
  isFullscreen: boolean;
  isDevtoolsOpen: boolean;
  isFacePresent: boolean;
  facePresencePct: number; // 0..100, rolling average
  /** True if any signal has fired at least once. */
  anySignal: boolean;
}

const SIGNAL_LABELS: Record<AntiCheatSignalType, string> = {
  tab_switch: "Tab switch",
  window_blur: "Window lost focus",
  fullscreen_exit: "Left fullscreen",
  copy_paste_attempt: "Copy / paste attempt",
  right_click: "Right-click",
  devtools_open: "DevTools open",
  text_selected: "Large text selection",
  face_absent: "Face not visible",
};

export function useAntiCheat(config: AntiCheatConfig): AntiCheatState {
  const { enabled, enforceFullscreen = true, enableFacePresence = false } = config;

  const [signals, setSignals] = useState<AntiCheatSignal[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDevtoolsOpen, setIsDevtoolsOpen] = useState(false);
  const [isFacePresent, setIsFacePresent] = useState(true);
  const [facePresencePct, setFacePresencePct] = useState(100);
  const [anySignal, setAnySignal] = useState(false);

  // We use a ref so event handlers can read the latest state without
  // re-binding on every change.
  const countsRef = useRef<Partial<Record<AntiCheatSignalType, number>>>({});
  const faceWindowRef = useRef<{ present: boolean; since: number }>({
    present: true,
    since: Date.now(),
  });
  const faceHistoryRef = useRef<{ present: boolean; t: number }[]>([]);

  const pushSignal = useCallback(
    (type: AntiCheatSignalType, detail?: string) => {
      if (!enabled) return;
      setSignals((prev) => {
        const next = [...prev, { type, timestamp: Date.now(), detail }];
        // keep the array bounded so the dashboard doesn't render forever
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
      countsRef.current[type] = (countsRef.current[type] ?? 0) + 1;
      setAnySignal(true);
    },
    [enabled],
  );

  // ---------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.hidden) pushSignal("tab_switch");
    };
    const onBlur = () => pushSignal("window_blur");
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      pushSignal(
        "copy_paste_attempt",
        `copied ${window.getSelection()?.toString().length ?? 0} chars`,
      );
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      pushSignal("copy_paste_attempt", "pasted content");
    };
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      pushSignal("copy_paste_attempt", "cut content");
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      pushSignal("right_click");
    };
    const onSelect = () => {
      const sel = window.getSelection()?.toString() ?? "";
      if (sel.length > 20) pushSignal("text_selected", `${sel.length} chars`);
    };
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (enforceFullscreen && !fs) pushSignal("fullscreen_exit");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("selectionchange", onSelect);
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("selectionchange", onSelect);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [enabled, enforceFullscreen, pushSignal]);

  // ---------------------------------------------------------------------
  // DevTools detection (window-size heuristic)
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      const threshold = 200;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen = widthDiff > threshold || heightDiff > threshold;
      setIsDevtoolsOpen((prev) => {
        if (isOpen && !prev) pushSignal("devtools_open");
        return isOpen;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [enabled, pushSignal]);

  // ---------------------------------------------------------------------
  // Face-presence (driven externally; the component calls setFacePresent)
  // ---------------------------------------------------------------------
  const setFacePresent = useCallback(
    (present: boolean) => {
      if (!enabled || !enableFacePresence) return;
      const now = Date.now();
      const win = faceWindowRef.current;
      if (present !== win.present) {
        // If face was missing for >2s before reappearing, count it.
        if (win.present === false && now - win.since > 2000) {
          pushSignal(
            "face_absent",
            `away for ${Math.round((now - win.since) / 1000)}s`,
          );
        }
        win.present = present;
        win.since = now;
      }
      setIsFacePresent(present);

      // Maintain a 30s rolling buffer for the dashboard percentage
      const buf = faceHistoryRef.current;
      buf.push({ present, t: now });
      while (buf.length > 0 && now - buf[0].t > 30_000) buf.shift();
      const pct = Math.round(
        (buf.filter((x) => x.present).length / Math.max(1, buf.length)) * 100,
      );
      setFacePresencePct(pct);
    },
    [enabled, enableFacePresence, pushSignal],
  );

  // Expose a global handle so the FacePresence component can call back
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__antiCheatSetFacePresent = setFacePresent;
    return () => {
      delete (window as any).__antiCheatSetFacePresent;
    };
  }, [setFacePresent]);

  // Initial fullscreen state
  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  return {
    signals,
    counts: { ...countsRef.current },
    isFullscreen,
    isDevtoolsOpen,
    isFacePresent,
    facePresencePct,
    anySignal,
  };
}

export { SIGNAL_LABELS };
