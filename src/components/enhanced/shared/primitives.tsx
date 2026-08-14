"use client";

/**
 * Shared UI primitives for the enhanced suite.
 * These are lightweight, self-contained components that all four
 * new screens (create-interview, feedback-dashboard, anti-cheat, video)
 * can compose without pulling in heavy third-party UI libs.
 */

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// ScoreCircle — animated radial score indicator
// ---------------------------------------------------------------------------
interface ScoreCircleProps {
  value: number; // 0..100
  size?: number; // px
  strokeWidth?: number;
  label?: string;
  className?: string;
  showValue?: boolean;
  /**
   * Color stops keyed by thresholds. Default is a 3-stop gradient.
   * The first matching threshold (>=) wins.
   */
  thresholds?: { min: number; color: string; label: string }[];
}

const DEFAULT_THRESHOLDS: ScoreCircleProps["thresholds"] = [
  { min: 90, color: "#16a34a", label: "Excellent" },
  { min: 75, color: "#4f46e5", label: "Strong" },
  { min: 60, color: "#ca8a04", label: "Solid" },
  { min: 1, color: "#dc2626", label: "Below bar" },
];

export function ScoreCircle({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  className,
  showValue = true,
  thresholds = DEFAULT_THRESHOLDS,
}: ScoreCircleProps) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safe / 100);

  const threshold = thresholds!.find((t) => safe >= t.min) ?? thresholds![thresholds!.length - 1];

  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    const start = animatedValue;
    const end = safe;
    const startTime = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safe]);

  return (
    <div
      className={cn("inline-flex flex-col items-center justify-center", className)}
      style={{ width: size }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={threshold.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - animatedValue / 100)}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: "stroke-dashoffset 80ms linear" }}
          />
        </svg>
        {showValue && (
          <div
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums"
            style={{ fontSize: size * 0.32, color: threshold.color }}
          >
            {Math.round(animatedValue)}
          </div>
        )}
      </div>
      {(label ?? threshold.label) && (
        <div
          className="mt-1 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: threshold.color }}
        >
          {label ?? threshold.label}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge — coloured pill for candidate status / sentiment
// ---------------------------------------------------------------------------
type StatusVariant =
  | "SELECTED"
  | "POTENTIAL"
  | "NOT_SELECTED"
  | "NO_STATUS"
  | "Positive"
  | "Neutral"
  | "Negative"
  | "Complete"
  | "Partial"
  | "Incomplete"
  | "Active"
  | "Inactive"
  | "Flagged"
  | "default";

const STATUS_STYLES: Record<StatusVariant, string> = {
  SELECTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  POTENTIAL: "bg-amber-100 text-amber-700 border-amber-200",
  NOT_SELECTED: "bg-rose-100 text-rose-700 border-rose-200",
  NO_STATUS: "bg-slate-100 text-slate-600 border-slate-200",
  Positive: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Neutral: "bg-amber-100 text-amber-700 border-amber-200",
  Negative: "bg-rose-100 text-rose-700 border-rose-200",
  Complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Partial: "bg-amber-100 text-amber-700 border-amber-200",
  Incomplete: "bg-rose-100 text-rose-700 border-rose-200",
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
  Flagged: "bg-rose-100 text-rose-700 border-rose-200",
  default: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Partial<Record<StatusVariant, string>> = {
  SELECTED: "Selected",
  POTENTIAL: "Potential",
  NOT_SELECTED: "Not selected",
  NO_STATUS: "No status",
  Complete: "Complete",
  Partial: "Partial",
  Incomplete: "Incomplete",
  Active: "Active",
  Inactive: "Inactive",
  Flagged: "Flagged",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = (STATUS_STYLES[status as StatusVariant] ??
    STATUS_STYLES.default) as string;
  const label = STATUS_LABELS[status as StatusVariant] ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        variant,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StatCard — small KPI tile for the dashboard
// ---------------------------------------------------------------------------
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  tone?: "default" | "positive" | "warning" | "critical";
}) {
  const toneRing: Record<string, string> = {
    default: "ring-slate-200",
    positive: "ring-emerald-200",
    warning: "ring-amber-200",
    critical: "ring-rose-200",
  };
  const toneText: Record<string, string> = {
    default: "text-slate-900",
    positive: "text-emerald-700",
    warning: "text-amber-700",
    critical: "text-rose-700",
  };
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-4 ring-1 shadow-sm",
        toneRing[tone],
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p
            className={cn(
              "mt-1.5 text-2xl font-bold tabular-nums",
              toneText[tone],
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && (
          <div className="rounded-xl bg-slate-50 p-2 text-slate-500">{icon}</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressSteps — wizard step indicator
// ---------------------------------------------------------------------------
interface Step {
  id: string;
  title: string;
  description?: string;
}

export function ProgressSteps({
  steps,
  currentIndex,
  className,
  onStepClick,
}: {
  steps: Step[];
  currentIndex: number;
  className?: string;
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol
      className={cn(
        "flex w-full items-center gap-2 sm:gap-4",
        className,
      )}
    >
      {steps.map((step, idx) => {
        const done = idx < currentIndex;
        const active = idx === currentIndex;
        return (
          <li
            key={step.id}
            className="flex flex-1 items-center"
          >
            <button
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(idx)}
              className={cn(
                "group flex items-center gap-3 text-left",
                onStepClick && "cursor-pointer",
                !onStepClick && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  done &&
                    "border-indigo-600 bg-indigo-600 text-white",
                  active &&
                    "border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-100",
                  !done &&
                    !active &&
                    "border-slate-200 bg-white text-slate-400",
                )}
              >
                {done ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    active
                      ? "text-indigo-600"
                      : done
                        ? "text-slate-700"
                        : "text-slate-500",
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="truncate text-[11px] text-slate-400">
                    {step.description}
                  </p>
                )}
              </div>
            </button>
            {idx < steps.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full",
                  idx < currentIndex ? "bg-indigo-500" : "bg-slate-200",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Histogram — simple bar chart for the score distribution
// ---------------------------------------------------------------------------
export function Histogram({
  data,
  className,
}: {
  data: { bucket: string; count: number }[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className={cn("flex h-32 items-end gap-2", className)}>
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.count / max) * 100));
        const color =
          d.bucket === "90-100"
            ? "bg-emerald-500"
            : d.bucket === "80-89"
              ? "bg-indigo-500"
              : d.bucket === "70-79"
                ? "bg-sky-500"
                : d.bucket === "60-69"
                  ? "bg-amber-500"
                  : d.bucket === "50-59"
                    ? "bg-orange-500"
                    : "bg-rose-500";
        return (
          <div key={d.bucket} className="flex flex-1 flex-col items-center gap-1">
            <div className="text-[10px] font-semibold text-slate-600 tabular-nums">
              {d.count}
            </div>
            <div
              className={cn("w-full rounded-t-md", color)}
              style={{ height: `${h}%` }}
              aria-label={`${d.count} candidates in ${d.bucket}`}
            />
            <div className="text-[10px] text-slate-500">{d.bucket}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar — colored initials fallback (since we can't rely on real photos)
// ---------------------------------------------------------------------------
export function InitialsAvatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  // Hash the name into a stable hue 0..360
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${
          (hue + 40) % 360
        } 70% 45%))`,
        fontSize: size * 0.4,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle — animated, accessible, works without Radix
// ---------------------------------------------------------------------------
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer select-none items-start gap-3",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-indigo-600" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-slate-800">{label}</span>}
          {description && (
            <span className="text-xs text-slate-500">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Card — thin wrapper to keep visuals consistent
// ---------------------------------------------------------------------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
