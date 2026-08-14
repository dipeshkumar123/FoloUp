"use client";

/**
 * Enhanced Create-Interview Wizard
 * ---------------------------------
 * 4-step flow that replaces the project's existing 2-step modal.
 *
 *   Step 1 — Pick a template   (optional, can be "blank")
 *   Step 2 — Interview basics   (name, objective, duration, anonymity, #Qs)
 *   Step 3 — Choose interviewer (with a richer stats card per persona)
 *   Step 4 — Review & publish   (live candidate-page preview + share link)
 *
 * The wizard is fully self-contained: it owns its state, can persist
 * drafts to localStorage, and exposes a single `onPublish` callback.
 * In demo mode the publish step shows a fake shareable URL.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  ClipboardCheck,
  FileText,
  Globe,
  Loader2,
  Mic,
  ShieldCheck,
  Sparkles,
  User,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/components/enhanced/shared/cn";
import {
  Card,
  InitialsAvatar,
  ProgressSteps,
  ScoreCircle,
  SectionTitle,
  Toggle,
} from "@/components/enhanced/shared/primitives";
import {
  JD_PRESETS,
  MOCK_INTERVIEWERS,
  SAMPLE_QUESTIONS,
  type MockResponseSeed,
} from "@/components/enhanced/shared/mockData";
import type { Interviewer } from "@/types/interviewer";
import type { Question } from "@/types/interview";

const STORAGE_KEY = "foloup.enhanced.createInterview.draft.v1";

export interface WizardResult {
  name: string;
  objective: string;
  description: string;
  questionCount: number;
  timeDuration: number;
  isAnonymous: boolean;
  interviewerId: bigint;
  questions: Question[];
  shareUrl: string;
  readTimeSeconds: number;
}

const STEPS = [
  { id: "template", title: "Template", description: "Start from a preset or blank" },
  { id: "basics", title: "Basics", description: "Role, objective, settings" },
  { id: "interviewer", title: "Interviewer", description: "AI persona" },
  { id: "publish", title: "Review & share", description: "Preview & publish" },
];

interface WizardState {
  templateId: string | null;
  name: string;
  objective: string;
  description: string;
  questionCount: number;
  timeDuration: number;
  isAnonymous: boolean;
  interviewerId: bigint | null;
  questions: Question[];
}

const blankState = (): WizardState => ({
  templateId: null,
  name: "",
  objective: "",
  description: "",
  questionCount: 5,
  timeDuration: 6,
  isAnonymous: false,
  interviewerId: null,
  questions: SAMPLE_QUESTIONS.map((q) => ({ ...q })),
});

function loadDraft(): WizardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(state: WizardState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function CreateInterviewWizard({
  open,
  onClose,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  onPublish?: (result: WizardResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(() => blankState());
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const draft = loadDraft();
      setState(draft ?? blankState());
      setStep(0);
      setPublishedUrl(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) saveDraft(state);
  }, [state, open]);

  const setField = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const selectedInterviewer = useMemo(
    () => MOCK_INTERVIEWERS.find((i) => i.id === state.interviewerId) ?? null,
    [state.interviewerId],
  );

  const canGoNext = useMemo(() => {
    if (step === 0) return true; // template is optional
    if (step === 1)
      return (
        state.name.trim().length > 0 &&
        state.objective.trim().length > 0 &&
        state.questionCount > 0 &&
        state.timeDuration > 0
      );
    if (step === 2) return state.interviewerId !== null;
    if (step === 3) {
      const filled = state.questions.filter((q) => q.question.trim().length > 0);
      return filled.length === state.questionCount && state.description.trim().length > 0;
    }
    return true;
  }, [step, state]);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate an OpenAI round-trip in demo mode
    await new Promise((r) => setTimeout(r, 1400));
    const generated = SAMPLE_QUESTIONS.map((q, i) => ({
      ...q,
      id: `gen-${Date.now()}-${i}`,
      question:
        state.objective.toLowerCase().includes("data")
          ? [
              "Walk me through a model you took from notebook to production. What broke?",
              "How do you communicate model uncertainty to non-technical partners?",
              "Tell me about a time the data was wrong. How did you find out?",
              "How do you monitor for data drift in production?",
              "Describe a time you pushed back on a metric choice.",
            ][i] ?? q.question
          : state.objective.toLowerCase().includes("design") ||
              state.objective.toLowerCase().includes("ux")
            ? [
                "Walk me through your design process from research to ship.",
                "Tell me about a time research changed your mind.",
                "How do you handle scope creep in a design project?",
                "Describe a design critique that changed your work.",
                "How do you measure the success of a design?",
              ][i] ?? q.question
            : q.question,
    }));
    setState((s) => ({
      ...s,
      questions: generated,
      description:
        s.description ||
        "We're excited to learn more about you. The interview is conversational and adaptive — feel free to take a moment to think before answering.",
    }));
    setGenerating(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 900));
    const slug =
      state.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32) || "interview";
    const id = Math.random().toString(36).slice(2, 8);
    const url = `https://demo.folo-up.co/call/${slug}-${id}`;
    setPublishedUrl(url);
    setPublishing(false);
    onPublish?.({
      name: state.name,
      objective: state.objective,
      description: state.description,
      questionCount: state.questionCount,
      timeDuration: state.timeDuration,
      isAnonymous: state.isAnonymous,
      interviewerId: state.interviewerId ?? BigInt(1),
      questions: state.questions,
      shareUrl: url,
      readTimeSeconds: state.questions.length * 12,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                Create an AI interview
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Takes about 90 seconds. You can edit anything before sharing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3">
          <ProgressSteps steps={STEPS} currentIndex={step} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <StepTemplate
              selected={state.templateId}
              onSelect={(id, preset) => {
                if (preset) {
                  setState((s) => ({
                    ...s,
                    templateId: id,
                    name: preset.title,
                    objective: preset.objective,
                    questions: preset.suggestedQuestions.map((q, i) => ({
                      id: `preset-${i}`,
                      question: q,
                      follow_up_count: 1,
                    })),
                    questionCount: preset.suggestedQuestions.length,
                  }));
                } else {
                  setState((s) => ({ ...s, templateId: id }));
                }
              }}
            />
          )}

          {step === 1 && (
            <StepBasics state={state} setField={setField} />
          )}

          {step === 2 && (
            <StepInterviewer
              selected={state.interviewerId}
              onSelect={(id) => setField("interviewerId", id)}
            />
          )}

          {step === 3 && (
            <StepReview
              state={state}
              interviewer={selectedInterviewer}
              onQuestionsChange={(qs) => setField("questions", qs)}
              onDescriptionChange={(d) => setField("description", d)}
              onGenerate={handleGenerate}
              generating={generating}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-xs text-slate-500">
            Step {step + 1} of {STEPS.length}
            {step === 3 && state.questions.length > 0 && (
              <> · ~{Math.ceil(state.questions.length * 1.2)} min interview</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
              className="text-slate-600"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <PublishButton
                publishing={publishing}
                publishedUrl={publishedUrl}
                copied={copied}
                onPublish={handlePublish}
                onCopy={async () => {
                  if (!publishedUrl) return;
                  await navigator.clipboard.writeText(publishedUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                onReset={() => {
                  setState(blankState());
                  setStep(0);
                  setPublishedUrl(null);
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem(STORAGE_KEY);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Template gallery
// ---------------------------------------------------------------------------
function StepTemplate({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string, preset: (typeof JD_PRESETS)[number] | null) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle
          title="Pick a starting point"
          description="Templates pre-fill the objective, role title, and a question set you can edit next."
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TemplateCard
          active={selected === "blank"}
          title="Start from scratch"
          blurb="Just give me a job description and I'll figure out the questions."
          icon={<FileText className="h-5 w-5" />}
          tone="indigo"
          onClick={() => onSelect("blank", null)}
        />
        {JD_PRESETS.map((preset) => (
          <TemplateCard
            key={preset.id}
            active={selected === preset.id}
            title={preset.title}
            blurb={preset.blurb}
            industry={preset.industry}
            icon={<Sparkles className="h-5 w-5" />}
            tone="slate"
            onClick={() => onSelect(preset.id, preset)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  title,
  blurb,
  industry,
  icon,
  active,
  tone,
  onClick,
}: {
  title: string;
  blurb: string;
  industry?: string;
  icon: React.ReactNode;
  active: boolean;
  tone: "indigo" | "slate";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200"
          : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          tone === "indigo"
            ? "bg-indigo-100 text-indigo-600"
            : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600",
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {industry && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {industry}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">{blurb}</p>
      </div>
      {active && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600">
          <Check className="h-3 w-3" /> Selected
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Basics
// ---------------------------------------------------------------------------
function StepBasics({
  state,
  setField,
}: {
  state: WizardState;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <SectionTitle
            title="What role are you hiring for?"
            description="A clear role title helps the AI interviewer ask the right level of question."
          />
          <Field label="Interview name">
            <input
              value={state.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Senior Frontend Engineer — Round 1"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
          <Field
            label="Objective"
            hint="What does a great answer look like for this interview?"
          >
            <Textarea
              value={state.objective}
              onChange={(e) => setField("objective", e.target.value)}
              placeholder="e.g. Find a senior frontend engineer with strong React, design-systems, and accessibility experience, who can collaborate across product and design."
              className="min-h-[120px] border-slate-200 focus-visible:ring-indigo-200"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Number of questions">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={state.questionCount}
                  onChange={(e) => setField("questionCount", Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <div className="w-10 text-center text-base font-semibold tabular-nums text-slate-900">
                  {state.questionCount}
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Each question is followed by 1–2 adaptive follow-ups.
              </p>
            </Field>
            <Field label="Duration (minutes)">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={state.timeDuration}
                  onChange={(e) => setField("timeDuration", Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <div className="w-10 text-center text-base font-semibold tabular-nums text-slate-900">
                  {state.timeDuration}
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                The interview ends gracefully at this time.
              </p>
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle title="Privacy" description="Decide what to collect." />
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <Toggle
              checked={!state.isAnonymous}
              onChange={(v) => setField("isAnonymous", !v)}
              label="Collect candidate name & email"
              description="Recommended for applicant tracking. Disable for blind screening rounds."
            />
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" />
              <div className="text-xs text-slate-700">
                <p className="font-medium text-slate-900">Integrity checks</p>
                <p className="mt-0.5">
                  We automatically track tab switches, fullscreen state, copy-paste
                  attempts, and (in video mode) face presence. Toggle them in the
                  candidate screen.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Interviewer picker
// ---------------------------------------------------------------------------
function StepInterviewer({
  selected,
  onSelect,
}: {
  selected: bigint | null;
  onSelect: (id: bigint) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Choose your AI interviewer"
        description="Each persona has a different blend of rapport, depth, and pace. Pick the one that fits the role."
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_INTERVIEWERS.map((interviewer) => (
          <InterviewerCard
            key={interviewer.id.toString()}
            interviewer={interviewer}
            active={selected === interviewer.id}
            onSelect={() => onSelect(interviewer.id)}
          />
        ))}
      </div>
    </div>
  );
}

function InterviewerCard({
  interviewer,
  active,
  onSelect,
}: {
  interviewer: Interviewer;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex h-full flex-col items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-all",
        active
          ? "border-indigo-500 ring-2 ring-indigo-200"
          : "border-slate-200 hover:border-indigo-300 hover:shadow-md",
      )}
    >
      <div className="flex w-full items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white">
          <Image
            src={interviewer.image}
            alt={interviewer.name}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-slate-900">
              {interviewer.name}
            </h3>
            {active && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                Selected
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Voice agent · {interviewer.audio}</p>
        </div>
      </div>
      <p className="text-xs text-slate-600">{interviewer.description}</p>
      <div className="grid w-full grid-cols-2 gap-2 text-[11px]">
        <TraitBar label="Rapport" value={interviewer.rapport} color="bg-pink-400" />
        <TraitBar label="Exploration" value={interviewer.exploration} color="bg-indigo-400" />
        <TraitBar label="Empathy" value={interviewer.empathy} color="bg-emerald-400" />
        <TraitBar label="Pace" value={interviewer.speed} color="bg-amber-400" />
      </div>
    </button>
  );
}

function TraitBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-slate-500">
        <span>{label}</span>
        <span className="tabular-nums text-slate-700">{value}/10</span>
      </div>
      <div className="mt-0.5 h-1.5 rounded-full bg-slate-100">
        <div
          className={cn("h-1.5 rounded-full", color)}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Review & publish (with live candidate-page preview)
// ---------------------------------------------------------------------------
function StepReview({
  state,
  interviewer,
  onQuestionsChange,
  onDescriptionChange,
  onGenerate,
  generating,
}: {
  state: WizardState;
  interviewer: Interviewer | null;
  onQuestionsChange: (qs: Question[]) => void;
  onDescriptionChange: (d: string) => void;
  onGenerate: () => Promise<void> | void;
  generating: boolean;
}) {
  const [previewMode, setPreviewMode] = useState<"candidate" | "summary">(
    "candidate",
  );

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle
              title="Questions"
              description="The AI will ask these in order, with 1–2 adaptive follow-ups per question."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={generating}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Wand2 className="mr-1 h-3.5 w-3.5" /> Regenerate with AI
                </>
              )}
            </Button>
          </div>
          <div className="space-y-2">
            {state.questions.map((q, idx) => (
              <div
                key={q.id}
                className="group flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                  {idx + 1}
                </div>
                <textarea
                  value={q.question}
                  onChange={(e) => {
                    const next = [...state.questions];
                    next[idx] = { ...q, question: e.target.value };
                    onQuestionsChange(next);
                  }}
                  className="min-h-[40px] flex-1 resize-none border-none bg-transparent text-sm text-slate-800 outline-none"
                  rows={1}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (state.questions.length <= 1) return;
                    onQuestionsChange(state.questions.filter((_, i) => i !== idx));
                  }}
                  className="opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove question"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <SectionTitle
            title="Candidate-facing description"
            description="This is what the candidate reads on the welcome screen before the call starts."
          />
          <Textarea
            value={state.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="min-h-[100px] border-slate-200 focus-visible:ring-indigo-200"
            placeholder="Tell candidates what to expect, how long it'll take, and anything they should prepare."
          />
        </Card>
      </div>

      <div className="xl:col-span-2">
        <div className="sticky top-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
              <PreviewToggle
                active={previewMode === "candidate"}
                onClick={() => setPreviewMode("candidate")}
                label="Candidate"
              />
              <PreviewToggle
                active={previewMode === "summary"}
                onClick={() => setPreviewMode("summary")}
                label="Summary"
              />
            </div>
          </div>

          {previewMode === "candidate" ? (
            <CandidatePreview
              state={state}
              interviewer={interviewer}
            />
          ) : (
            <SummaryPreview state={state} interviewer={interviewer} />
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 font-medium transition",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {label}
    </button>
  );
}

function CandidatePreview({
  state,
  interviewer,
}: {
  state: WizardState;
  interviewer: Interviewer | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <span>demo.folo-up.co/call/…</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2">
          {interviewer && (
            <Image
              src={interviewer.image}
              alt={interviewer.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              AI interview
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {state.name || "Your interview name"}
            </p>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-600">
          {state.description ||
            "Welcome! This is a quick conversational interview. The AI will ask you a few questions and follow up where useful."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <Globe className="h-3 w-3" /> Web · audio
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <Mic className="h-3 w-3" /> Microphone
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <User className="h-3 w-3" />{" "}
            {state.isAnonymous ? "Anonymous" : "Name + email"}
          </span>
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white"
        >
          Start interview
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Estimated {state.timeDuration} min
        </p>
      </div>
    </div>
  );
}

function SummaryPreview({
  state,
  interviewer,
}: {
  state: WizardState;
  interviewer: Interviewer | null;
}) {
  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-900">Config</p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            Ready to publish
          </span>
        </div>
        <SummaryRow label="Interviewer" value={interviewer?.name ?? "—"} />
        <SummaryRow label="Questions" value={`${state.questions.length}`} />
        <SummaryRow label="Duration" value={`${state.timeDuration} min`} />
        <SummaryRow label="Anonymous" value={state.isAnonymous ? "Yes" : "No"} />
      </Card>
      <Card className="space-y-3">
        <p className="text-xs font-semibold text-slate-900">Predicted reach</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Apply rate" value="62%" />
          <MiniStat label="Completion" value="84%" />
          <MiniStat label="Avg score" value="76" />
        </div>
        <p className="text-[10px] text-slate-500">
          Based on past interviews with similar objective and length.
        </p>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-sm font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Publish footer button
// ---------------------------------------------------------------------------
function PublishButton({
  publishing,
  publishedUrl,
  copied,
  onPublish,
  onCopy,
  onReset,
}: {
  publishing: boolean;
  publishedUrl: string | null;
  copied: boolean;
  onPublish: () => void;
  onCopy: () => void;
  onReset: () => void;
}) {
  if (publishedUrl) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" /> Published
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? (
            <>
              <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" /> Copied
            </>
          ) : (
            <>
              <Clipboard className="h-3.5 w-3.5" /> Copy link
            </>
          )}
        </button>
        <Button variant="ghost" onClick={onReset} className="text-slate-500">
          New
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={onPublish}
      disabled={publishing}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      {publishing ? (
        <>
          <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Publishing…
        </>
      ) : (
        <>
          Publish & generate link <ArrowRight className="ml-1 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Trigger button (used by the demo page to launch the wizard)
// ---------------------------------------------------------------------------
export function CreateInterviewTrigger({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
    >
      <Sparkles className="h-4 w-4" />
      New AI interview
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </button>
  );
}
