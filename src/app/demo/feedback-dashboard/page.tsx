"use client";

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { FeedbackDashboard } from "@/components/enhanced/feedback-dashboard/FeedbackDashboard";
import { Card } from "@/components/enhanced/shared/primitives";

export default function FeedbackDashboardDemo() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All demos
          </Link>
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
            Mandatory
          </span>
        </div>
      </header>

      <FeedbackDashboard />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6">
        <h2 className="text-lg font-bold text-slate-900">Design notes</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DesignNote
            title="KPI strip up top"
            body="Original dashboard buried the headline numbers in pie charts. Putting total responses, average score, completion, and integrity flags front-and-centre means a hiring manager can scan the page in 5 seconds and know if they need to dig in."
          />
          <DesignNote
            title="Score distribution histogram"
            body="A pie chart of 'sentiment' or 'status' hides the spread. The histogram makes bimodal outcomes (a strong top-of-pile vs. a weak bottom) immediately visible — exactly the signal recruiters want when comparing two interview rounds."
          />
          <DesignNote
            title="Tabbed candidate detail"
            body="Original put transcript, scores, and metadata in one endless scroll. We split into Summary / Transcript / Integrity so the reviewer can stay focused on one mode at a time. Integrity is its own tab because it shouldn't colour the rest of the review."
          />
          <DesignNote
            title="Filter pills + search"
            body="Sticky filter pills let you pivot between 'Selected' and 'Integrity flags' without losing your scroll. Search covers name and email so you can answer 'did Aanya interview yet?' in one keystroke."
          />
          <DesignNote
            title="Per-candidate integrity tile"
            body="A simple tab-switch count + face-presence % surfaces the most actionable signal. The face-presence timeline gives the reviewer a fast visual sanity-check before they commit to a decision."
          />
          <DesignNote
            title="Honest about uncertainty"
            body="The Integrity tab text says 'heuristics, not proof' on purpose. False positives hurt candidates, and the goal is to give reviewers a strong nudge, not a verdict."
          />
        </div>
      </section>
    </div>
  );
}

function DesignNote({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{body}</p>
    </Card>
  );
}
