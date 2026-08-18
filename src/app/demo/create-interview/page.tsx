"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  CreateInterviewTrigger,
  CreateInterviewWizard,
} from "@/components/enhanced/create-interview/CreateInterviewWizard";
import { Card } from "@/components/enhanced/shared/primitives";

export default function CreateInterviewDemo() {
  const [open, setOpen] = useState(false);
  const [publishedName, setPublishedName] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
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

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Create AI Interview
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            A friendlier 4-step wizard
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Replaces the existing 2-step modal. Adds a template gallery,
            a richer interviewer-picker with persona stats, an inline
            live preview of the candidate screen, and auto-saved drafts.
            Click the button below to launch it.
          </p>
        </div>

        <Card className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ready when you are
              </p>
              <p className="text-xs text-slate-500">
                Drafts auto-save to your browser. Publish gives a fake share link.
              </p>
            </div>
          </div>
          <CreateInterviewTrigger onOpen={() => setOpen(true)} />
        </Card>

        {publishedName && (
          <Card className="mt-4 border-emerald-200 bg-emerald-50/40">
            <p className="text-xs font-semibold text-emerald-700">
              Published: {publishedName}
            </p>
            {lastUrl && (
              <p className="mt-1 break-all rounded bg-white px-2 py-1 font-mono text-[11px] text-slate-700">
                {lastUrl}
              </p>
            )}
          </Card>
        )}

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <DesignNote
            title="Why a 4-step flow?"
            body="The original 2-step modal crammed every input into one screen and forced the user to mentally switch between 'describe the role' and 'review the questions'. Splitting into template → basics → interviewer → review lets the user see one decision at a time and gives us a natural place to drop the live preview."
          />
          <DesignNote
            title="Template gallery"
            body="Most users start from a known role (Senior FE, PM, SRE…). Pre-filling objective, question count, and a starter set of questions reduces time-to-publish from ~3 minutes to under 30 seconds and avoids blank-screen paralysis."
          />
          <DesignNote
            title="Live candidate preview"
            body="The right-pane preview shows exactly what the candidate will see, with the current name, description, and settings. This catches 'oops wrong role title' mistakes before they ship and makes the value of each setting concrete."
          />
        </div>
      </main>

      <CreateInterviewWizard
        open={open}
        onClose={() => setOpen(false)}
        onPublish={(r) => {
          setPublishedName(r.name);
          setLastUrl(r.shareUrl);
        }}
      />
    </div>
  );
}

function DesignNote({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{body}</p>
    </Card>
  );
}
