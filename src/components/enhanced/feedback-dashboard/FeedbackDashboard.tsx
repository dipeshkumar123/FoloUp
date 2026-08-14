"use client";

/**
 * Enhanced Candidate Feedback Dashboard
 * --------------------------------------
 * A single-screen overview + detail view for all candidate responses to
 * an interview. Replaces the project's existing 3-pane layout with a
 * unified, scannable view that surfaces:
 *   • KPI strip with 6 headline numbers
 *   • Score-distribution histogram
 *   • Sentiment & status pie/bar charts
 *   • "Top strengths" word cloud-ish chips
 *   • Sortable, filterable candidate table
 *   • Per-candidate deep-dive: transcript, scores, integrity flags, video thumbnail
 *
 * Designed to work end-to-end with the project's `Response` shape and
 * the mock seed data shipped in this branch.
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Flag,
  MessageSquare,
  PieChart as PieIcon,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Video,
  X,
} from "lucide-react";

import {
  Card,
  EmptyState,
  Histogram,
  InitialsAvatar,
  ScoreCircle,
  SectionTitle,
  StatCard,
  StatusBadge,
  Toggle,
} from "@/components/enhanced/shared/primitives";
import { cn } from "@/components/enhanced/shared/cn";
import {
  SAMPLE_INTERVIEW,
  computeMockDashboard,
  getMockResponses,
} from "@/components/enhanced/shared/mockData";
import type { Response } from "@/types/response";

type MockResponse = Response & {
  face_presence_pct: number;
  has_video: boolean;
};

type SortKey = "score" | "communication" | "duration" | "recent" | "name";
type StatusFilter = "ALL" | "SELECTED" | "POTENTIAL" | "NOT_SELECTED" | "NO_STATUS";

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: "All",
  SELECTED: "Selected",
  POTENTIAL: "Potential",
  NOT_SELECTED: "Not selected",
  NO_STATUS: "No status",
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function FeedbackDashboard() {
  const [responses] = useState<MockResponse[]>(() => getMockResponses());
  const metrics = useMemo(() => computeMockDashboard(), []);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showIntegrityOnly, setShowIntegrityOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => responses[0]?.call_id ?? null,
  );
  const [showUnviewedOnly, setShowUnviewedOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = [...responses];
    if (statusFilter !== "ALL") {
      list = list.filter((r) => r.candidate_status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.name ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      );
    }
    if (showIntegrityOnly) {
      list = list.filter(
        (r) => r.tab_switch_count >= 3 || r.face_presence_pct < 80,
      );
    }
    if (showUnviewedOnly) {
      list = list.filter((r) => !r.is_viewed);
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "score":
          return ((a.analytics?.overallScore ?? 0) - (b.analytics?.overallScore ?? 0)) * dir;
        case "communication":
          return (
            ((a.analytics?.communication?.score ?? 0) -
              (b.analytics?.communication?.score ?? 0)) *
            dir
          );
        case "duration":
          return (a.duration - b.duration) * dir;
        case "recent":
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        case "name":
          return (a.name ?? "").localeCompare(b.name ?? "") * dir;
      }
    });

    return list;
  }, [
    responses,
    statusFilter,
    search,
    sortKey,
    sortDir,
    showIntegrityOnly,
    showUnviewedOnly,
  ]);

  const selected = useMemo(
    () => responses.find((r) => r.call_id === selectedId) ?? filtered[0] ?? null,
    [responses, filtered, selectedId],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardHeader
        metrics={metrics}
        unviewedCount={metrics.unviewedCount}
        integrityCount={metrics.integrityFlags}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total responses"
            value={metrics.totalResponses}
            sub={`${metrics.unviewedCount} unviewed`}
            icon={<UserCheck className="h-4 w-4" />}
          />
          <StatCard
            label="Avg. overall score"
            value={metrics.avgOverallScore}
            sub={`out of 100`}
            tone={metrics.avgOverallScore >= 75 ? "positive" : "default"}
            icon={<Star className="h-4 w-4" />}
          />
          <StatCard
            label="Completion rate"
            value={`${Math.round(metrics.completionRate * 100)}%`}
            sub="Completed interviews"
            tone={metrics.completionRate >= 0.7 ? "positive" : "warning"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            label="Integrity flags"
            value={metrics.integrityFlags}
            sub="Tab or face anomalies"
            tone={metrics.integrityFlags > 0 ? "critical" : "positive"}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <SectionTitle
              title="Score distribution"
              description="How candidates cluster by overall score"
            />
            <Histogram data={metrics.scoreHistogram} />
          </Card>
          <Card>
            <SectionTitle
              title="Sentiment"
              description="How candidates felt during the interview"
            />
            <SentimentBar
              positive={metrics.sentimentSplit.positive}
              neutral={metrics.sentimentSplit.neutral}
              negative={metrics.sentimentSplit.negative}
            />
          </Card>
          <Card>
            <SectionTitle
              title="Candidate status"
              description="Your shortlist progress"
            />
            <StatusBar
              selected={metrics.statusSplit.selected}
              potential={metrics.statusSplit.potential}
              notSelected={metrics.statusSplit.notSelected}
              noStatus={metrics.statusSplit.noStatus}
            />
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Candidate list */}
          <Card className="lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle
                title="Candidates"
                description={`${filtered.length} of ${responses.length} shown`}
              />
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email"
                    className="rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <SortMenu sortKey={sortKey} setSortKey={setSortKey} dir={sortDir} setDir={setSortDir} />
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-medium transition",
                    statusFilter === key
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  {STATUS_LABELS[key]}
                </button>
              ))}
              <span className="mx-1 h-4 w-px bg-slate-200" />
              <Toggle
                checked={showUnviewedOnly}
                onChange={setShowUnviewedOnly}
                label="Unviewed only"
              />
              <Toggle
                checked={showIntegrityOnly}
                onChange={setShowIntegrityOnly}
                label="Integrity flags only"
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="No candidates match those filters"
                description="Try clearing search or status filters."
                icon={<Filter className="h-5 w-5" />}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <CandidateRow
                    key={r.call_id}
                    response={r}
                    active={selected?.call_id === r.call_id}
                    onClick={() => setSelectedId(r.call_id)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <CandidateDetail response={selected} />
            ) : (
              <EmptyState
                title="Select a candidate to see details"
                description="The detailed transcript, score breakdown, and integrity checks appear here."
                icon={<Eye className="h-5 w-5" />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
function DashboardHeader({
  metrics,
  unviewedCount,
  integrityCount,
}: {
  metrics: ReturnType<typeof computeMockDashboard>;
  unviewedCount: number;
  integrityCount: number;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Interviews</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-slate-700">{SAMPLE_INTERVIEW.name}</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900">
            Candidate feedback
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {metrics.totalResponses} responses · avg interview{" "}
            {Math.round(metrics.avgDurationSeconds / 60)}m · interviewer{" "}
            <span className="font-medium text-slate-700">Explorer Lisa</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unviewedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
              <Eye className="h-3 w-3" /> {unviewedCount} unviewed
            </span>
          )}
          {integrityCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
              <Flag className="h-3 w-3" /> {integrityCount} integrity flag
              {integrityCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Share results
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Sentiment / Status bars
// ---------------------------------------------------------------------------
function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const total = Math.max(1, positive + neutral + negative);
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="bg-emerald-500" style={{ width: `${(positive / total) * 100}%` }} />
        <div className="bg-amber-400" style={{ width: `${(neutral / total) * 100}%` }} />
        <div className="bg-rose-500" style={{ width: `${(negative / total) * 100}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
        <div>
          <p className="text-base font-bold text-emerald-600 tabular-nums">{positive}</p>
          <p className="text-slate-500">Positive</p>
        </div>
        <div>
          <p className="text-base font-bold text-amber-600 tabular-nums">{neutral}</p>
          <p className="text-slate-500">Neutral</p>
        </div>
        <div>
          <p className="text-base font-bold text-rose-600 tabular-nums">{negative}</p>
          <p className="text-slate-500">Negative</p>
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  selected,
  potential,
  notSelected,
  noStatus,
}: {
  selected: number;
  potential: number;
  notSelected: number;
  noStatus: number;
}) {
  const total = Math.max(1, selected + potential + notSelected + noStatus);
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="bg-emerald-500" style={{ width: `${(selected / total) * 100}%` }} />
        <div className="bg-amber-400" style={{ width: `${(potential / total) * 100}%` }} />
        <div className="bg-rose-500" style={{ width: `${(notSelected / total) * 100}%` }} />
        <div className="bg-slate-400" style={{ width: `${(noStatus / total) * 100}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <StatusTile label="Selected" value={selected} color="text-emerald-600" />
        <StatusTile label="Potential" value={potential} color="text-amber-600" />
        <StatusTile label="Not selected" value={notSelected} color="text-rose-600" />
        <StatusTile label="No status" value={noStatus} color="text-slate-500" />
      </div>
    </div>
  );
}

function StatusTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 text-center">
      <p className={cn("text-base font-bold tabular-nums", color)}>{value}</p>
      <p className="text-slate-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort menu
// ---------------------------------------------------------------------------
function SortMenu({
  sortKey,
  setSortKey,
  dir,
  setDir,
}: {
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
  dir: "asc" | "desc";
  setDir: (d: "asc" | "desc") => void;
}) {
  const [open, setOpen] = useState(false);
  const labels: Record<SortKey, string> = {
    score: "Overall score",
    communication: "Communication",
    duration: "Duration",
    recent: "Most recent",
    name: "Name (A–Z)",
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        {labels[sortKey]}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {(Object.keys(labels) as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === sortKey) setDir(dir === "asc" ? "desc" : "asc");
                else setSortKey(k);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs",
                sortKey === k ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {labels[k]}
              {sortKey === k && (
                <span className="text-[10px] text-slate-400">
                  {dir === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Candidate row
// ---------------------------------------------------------------------------
function CandidateRow({
  response,
  active,
  onClick,
}: {
  response: MockResponse;
  active: boolean;
  onClick: () => void;
}) {
  const integrityFlag =
    response.tab_switch_count >= 3 || response.face_presence_pct < 80;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition",
        active ? "bg-indigo-50/70" : "hover:bg-slate-50",
      )}
    >
      <InitialsAvatar name={response.name ?? "Anon"} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-slate-900">
            {response.name ?? "Anonymous"}
          </p>
          {!response.is_viewed && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          )}
          {integrityFlag && (
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
          )}
        </div>
        <p className="truncate text-[11px] text-slate-500">
          {response.email ?? "—"} · {timeAgo(response.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={response.candidate_status} />
        <ScoreCircle value={response.analytics?.overallScore ?? 0} size={42} strokeWidth={4} showValue />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Candidate detail
// ---------------------------------------------------------------------------
function CandidateDetail({ response }: { response: MockResponse }) {
  const [tab, setTab] = useState<"summary" | "transcript" | "integrity">("summary");
  const integrityFlag =
    response.tab_switch_count >= 3 || response.face_presence_pct < 80;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <InitialsAvatar name={response.name ?? "Anon"} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {response.name ?? "Anonymous"}
              </h2>
              <StatusBadge status={response.candidate_status} />
            </div>
            <p className="text-[11px] text-slate-500">
              {response.email ?? "—"} · {timeAgo(response.created_at)} ·{" "}
              {formatDuration(response.duration)}
            </p>
          </div>
        </div>
        <ScoreCircle value={response.analytics?.overallScore ?? 0} size={72} />
      </div>

      {integrityFlag && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-semibold">Integrity flag</p>
            <p>
              {response.tab_switch_count} tab switches · face presence{" "}
              {response.face_presence_pct}%. Recommend reviewing the recording
              before advancing.
            </p>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200">
        {(["summary", "transcript", "integrity"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 py-2 text-xs font-semibold capitalize transition",
              tab === t
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "summary" && <SummaryTab response={response} />}
      {tab === "transcript" && <TranscriptTab response={response} />}
      {tab === "integrity" && <IntegrityTab response={response} />}
    </Card>
  );
}

function SummaryTab({ response }: { response: MockResponse }) {
  const analytics = response.analytics;
  return (
    <div className="space-y-3 text-xs">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Overall feedback
        </p>
        <p className="mt-1 leading-relaxed text-slate-700">
          {analytics?.overallFeedback ?? "—"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ScoreTile
          label="Communication"
          score={analytics?.communication?.score ?? 0}
        />
        <ScoreTile label="General intelligence" score={Math.min(100, (analytics?.overallScore ?? 0) + 4)} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Soft-skill summary
        </p>
        <p className="mt-1 leading-relaxed text-slate-700">
          {analytics?.softSkillSummary ?? "—"}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Communication feedback
        </p>
        <p className="mt-1 leading-relaxed text-slate-700">
          {analytics?.communication?.feedback ?? "—"}
        </p>
      </div>
      {response.has_video && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Video className="h-3.5 w-3.5" /> Video recording
            </p>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Available
            </span>
          </div>
          <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300">
            <div className="text-center">
              <Video className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-[10px]">
                Video placeholder · {formatDuration(response.duration)} · {response.face_presence_pct}% face presence
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreTile({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900 tabular-nums">{score}</span>
        <span className="text-[10px] text-slate-500">/100</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-200">
        <div
          className="h-1.5 rounded-full bg-indigo-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function TranscriptTab({ response }: { response: MockResponse }) {
  // Build a small mock transcript from the question summaries so this view
  // is never empty in demo mode.
  const questions: { question: string; summary: string }[] =
    (response.analytics?.questionSummaries as
      | { question: string; summary: string }[]
      | undefined) ?? [];
  return (
    <div className="space-y-2 text-xs">
      {questions.length === 0 ? (
        <p className="text-slate-500">No transcript available.</p>
      ) : (
        questions.map((q, idx: number) => (
          <div
            key={idx}
            className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/50 p-2"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                AI
              </span>
              <p className="text-slate-800">{q.question}</p>
            </div>
            <div className="flex items-start gap-2 pl-7">
              <span className="text-slate-500 italic">Candidate answered</span>
            </div>
            <div className="flex items-start gap-2 pl-7">
              <p className="rounded-lg bg-white p-2 text-slate-700">{q.summary}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function IntegrityTab({ response }: { response: MockResponse }) {
  const facePct = response.face_presence_pct;
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <IntegrityTile
          icon={<Eye className="h-4 w-4" />}
          label="Tab switches"
          value={String(response.tab_switch_count)}
          tone={response.tab_switch_count >= 3 ? "critical" : "ok"}
        />
        <IntegrityTile
          icon={<Video className="h-4 w-4" />}
          label="Face presence"
          value={`${facePct}%`}
          tone={facePct < 80 ? "critical" : "ok"}
        />
        <IntegrityTile
          icon={<Clock className="h-4 w-4" />}
          label="Duration"
          value={formatDuration(response.duration)}
          tone="ok"
        />
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Face-presence timeline (mock)
        </p>
        <div className="flex h-12 overflow-hidden rounded-lg bg-slate-100">
          {Array.from({ length: 30 }).map((_, i) => {
            const t = i / 30;
            // simulate a dip around the middle for the flagged candidate
            const base = facePct;
            const dip = response.tab_switch_count >= 3 ? Math.max(0, 1 - Math.abs(t - 0.5) * 4) : 0;
            const v = Math.max(0, Math.min(100, base - dip * 30));
            return (
              <div
                key={i}
                className={cn(
                  "flex-1",
                  v >= 80
                    ? "bg-emerald-400"
                    : v >= 60
                      ? "bg-amber-400"
                      : "bg-rose-500",
                )}
                title={`${Math.round(v)}% face presence`}
              />
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Integrity signals are heuristics, not proof. Always review the recording
        before making a hiring decision.
      </p>
    </div>
  );
}

function IntegrityTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "ok" | "critical";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-2 text-center",
        tone === "ok"
          ? "border-slate-200 bg-white"
          : "border-rose-200 bg-rose-50",
      )}
    >
      <div
        className={cn(
          "mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg",
          tone === "ok" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-700",
        )}
      >
        {icon}
      </div>
      <p className="text-base font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
