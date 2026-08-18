/**
 * /demo — landing page
 * --------------------
 * Showcase page for the four new features. No backend required.
 * Each card links to a dedicated demo screen.
 */

import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Mic,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { Card } from "@/components/enhanced/shared/primitives";

const FEATURES = [
  {
    href: "/demo/create-interview",
    title: "Create AI Interview",
    tag: "Mandatory",
    blurb:
      "4-step wizard with template gallery, live candidate-preview, and a polished stepper.",
    icon: <Sparkles className="h-5 w-5" />,
    accent: "from-indigo-500 to-indigo-700",
    bullets: [
      "Template gallery with 6 role presets",
      "Live candidate-side preview",
      "Auto-saves drafts to localStorage",
    ],
  },
  {
    href: "/demo/feedback-dashboard",
    title: "Candidate Feedback Dashboard",
    tag: "Mandatory",
    blurb:
      "Real KPIs, score distribution, sentiment, status breakdown, and per-candidate deep-dive.",
    icon: <Eye className="h-5 w-5" />,
    accent: "from-sky-500 to-indigo-600",
    bullets: [
      "6 headline stats at a glance",
      "Score histogram + sentiment bars",
      "Tabbed candidate detail (summary / transcript / integrity)",
    ],
  },
  {
    href: "/demo/anti-cheat",
    title: "Anti-Cheat Suite",
    tag: "Optional",
    blurb:
      "Tab-switch, fullscreen, copy/paste, devtools, and webcam face-presence — all in one hook.",
    icon: <ShieldCheck className="h-5 w-5" />,
    accent: "from-rose-500 to-orange-500",
    bullets: [
      "8 signal types tracked in real time",
      "Skin-tone face-presence heuristic (no model download)",
      "Live integrity monitor with rolling history",
    ],
  },
  {
    href: "/demo/video-interview",
    title: "AI Video Interviews",
    tag: "Optional",
    blurb:
      "Parallel video stream alongside the Retell audio call. Local recording, cloud-upload ready.",
    icon: <Video className="h-5 w-5" />,
    accent: "from-emerald-500 to-teal-600",
    bullets: [
      "Drops in next to the existing audio call",
      "MediaRecorder chunks, ready for S3 / Supabase",
      "Compact tile + read-only player card",
    ],
  },
] as const;

export default function DemoLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">FoloUp</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Enhanced UI suite · demo
              </p>
            </div>
          </div>
          <Link
            href="https://github.com/FoloUp/FoloUp"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            Original repo →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Technical assessment
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Two new UIs, two optional upgrades
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            This branch adds the four features from the brief, working
            end-to-end with mock data so you can click through without Clerk,
            Supabase, Retell, or OpenAI keys. Every component lives under{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              src/components/enhanced
            </code>
            .
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${f.accent}`}
              />
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white`}
                >
                  {f.icon}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    f.tag === "Mandatory"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {f.tag}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                {f.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{f.blurb}</p>
              <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-2 transition-all">
                Open demo <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <Card className="mt-10">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Want to see everything in one screen?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                The candidate-side interview combines the new wizard output,
                anti-cheat monitor, and the video layer into a single
                end-to-end experience.
              </p>
              <Link
                href="/demo/video-interview"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Try the candidate experience
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
