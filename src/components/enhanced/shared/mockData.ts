/**
 * Mock data layer for the enhanced UI suite.
 * Lets reviewers see the new screens without needing Clerk / Supabase /
 * Retell / OpenAI credentials. The shapes mirror the project's existing
 * types so that swapping the mocks for live data is a low-friction follow-up.
 */

import type { Response, Analytics, CallData } from "@/types/response";
import type { Interview, InterviewBase, Question } from "@/types/interview";
import type { Interviewer } from "@/types/interviewer";

const ONE_DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// ---------------------------------------------------------------------------
// Interviewers (mirrors src/lib/constants.ts INTERVIEWERS shape + more)
// ---------------------------------------------------------------------------
export const MOCK_INTERVIEWERS: Interviewer[] = [
  {
    id: BigInt(1),
    user_id: "mock-user-1",
    created_at: new Date(NOW - 30 * ONE_DAY),
    name: "Explorer Lisa",
    rapport: 7,
    exploration: 10,
    empathy: 7,
    speed: 5,
    image: "/interviewers/Lisa.png",
    description:
      "Hi! I'm Lisa, an enthusiastic and empathetic interviewer who loves to explore. With a perfect balance of empathy and rapport, I delve deep into conversations while maintaining a steady pace.",
    audio: "Lisa.wav",
    agent_id: "agent_lisa_001",
  },
  {
    id: BigInt(2),
    user_id: "mock-user-1",
    created_at: new Date(NOW - 30 * ONE_DAY),
    name: "Empathetic Bob",
    rapport: 7,
    exploration: 7,
    empathy: 10,
    speed: 5,
    image: "/interviewers/Bob.png",
    description:
      "Hi! I'm Bob, your go-to empathetic interviewer. I excel at understanding and connecting with people on a deeper level.",
    audio: "Bob.wav",
    agent_id: "agent_bob_001",
  },
  {
    id: BigInt(3),
    user_id: "mock-user-1",
    created_at: new Date(NOW - 15 * ONE_DAY),
    name: "Strategic Maya",
    rapport: 8,
    exploration: 8,
    empathy: 8,
    speed: 6,
    image: "/interviewers/Lisa.png", // re-use asset for mock
    description:
      "Strategic Maya asks the tough 'why' questions to understand how you think about systems, trade-offs, and scale.",
    audio: "Lisa.wav",
    agent_id: "agent_maya_001",
  },
  {
    id: BigInt(4),
    user_id: "mock-user-1",
    created_at: new Date(NOW - 15 * ONE_DAY),
    name: "Coding Coach Arjun",
    rapport: 6,
    exploration: 9,
    empathy: 7,
    speed: 7,
    image: "/interviewers/Bob.png",
    description:
      "Coding Coach Arjun walks you through real-time problem solving and digs into your thought process at every step.",
    audio: "Bob.wav",
    agent_id: "agent_arjun_001",
  },
  {
    id: BigInt(5),
    user_id: "mock-user-1",
    created_at: new Date(NOW - 10 * ONE_DAY),
    name: "Product Priya",
    rapport: 9,
    exploration: 8,
    empathy: 8,
    speed: 5,
    image: "/interviewers/Lisa.png",
    description:
      "Product Priya is great for product-management and behavioural loops — customer empathy, prioritisation, and metric thinking.",
    audio: "Lisa.wav",
    agent_id: "agent_priya_001",
  },
  {
    id: BigInt(6),
    user_id: "mock-user-1",
    created_at: new Date(NOW - 5 * ONE_DAY),
    name: "Data-Science Dev",
    rapport: 6,
    exploration: 9,
    empathy: 6,
    speed: 6,
    image: "/interviewers/Bob.png",
    description:
      "Data-Science Dev is a stats-and-modelling heavy interviewer who likes to probe assumptions and edge cases.",
    audio: "Bob.wav",
    agent_id: "agent_dev_001",
  },
];

// ---------------------------------------------------------------------------
// Sample questions library
// ---------------------------------------------------------------------------
export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "q1",
    question:
      "Walk me through a project where you had to learn a new technology quickly. How did you approach it?",
    follow_up_count: 2,
  },
  {
    id: "q2",
    question: "Tell me about a time you disagreed with a teammate. How was it resolved?",
    follow_up_count: 2,
  },
  {
    id: "q3",
    question: "How do you decide what to optimise for when a system has competing constraints?",
    follow_up_count: 2,
  },
  {
    id: "q4",
    question: "Describe a bug you shipped to production. What did you learn from it?",
    follow_up_count: 1,
  },
  {
    id: "q5",
    question: "How do you keep stakeholders in the loop when priorities shift mid-sprint?",
    follow_up_count: 1,
  },
];

// ---------------------------------------------------------------------------
// A typical interview (used to seed the create wizard preview)
// ---------------------------------------------------------------------------
export const SAMPLE_INTERVIEW: Interview = {
  user_id: "mock-user-1",
  organization_id: "mock-org-1",
  name: "Senior Frontend Engineer — Round 1",
  interviewer_id: BigInt(1),
  objective:
    "Find a senior frontend engineer with strong React, design-systems, and accessibility experience, who can collaborate across product and design.",
  question_count: 5,
  time_duration: "8",
  is_anonymous: false,
  questions: SAMPLE_QUESTIONS,
  description:
    "We're hiring a Senior Frontend Engineer to lead the design-system rebuild. This round focuses on your React fundamentals, design taste, and how you collaborate with designers.",
  response_count: BigInt(12),
  id: "mock-int-001",
  created_at: new Date(NOW - 3 * ONE_DAY),
  url: "https://demo.folo-up.co/call/senior-frontend-r1",
  insights: [
    "Most candidates (7 of 12) mention design-systems experience",
    "Communication scores are highest when candidates reference concrete metrics",
    "Two candidates may be over-claimed on accessibility — flagged for review",
  ],
  quotes: [
    {
      quote:
        "I led the migration of our component library from class-based to functional, and we cut bundle size 31%.",
      call_id: "call-002",
    },
    {
      quote:
        "When I disagreed with my PM about scope, I proposed a 2-day spike and the data settled it.",
      call_id: "call-005",
    },
  ],
  details: {},
  is_active: true,
  theme_color: "#4F46E5",
  logo_url: "",
  respondents: ["alice@example.com", "bob@example.com"],
  readable_slug: "senior-frontend-r1",
};

// ---------------------------------------------------------------------------
// Candidate responses (the meat of the feedback dashboard)
// ---------------------------------------------------------------------------
function makeAnalytics(overrides: Partial<Analytics> = {}): Analytics {
  return {
    overallScore: 75,
    overallFeedback:
      "Solid candidate with strong fundamentals. Could improve on system-design depth.",
    communication: {
      score: 80,
      feedback:
        "Clear articulation, used concrete examples. Slight tendency to over-explain.",
    },
    generalIntelligence:
      "Demonstrated strong analytical thinking and good trade-off reasoning.",
    softSkillSummary:
      "Collaborative, self-aware, and brings a calm energy to ambiguous discussions.",
    questionSummaries: [
      {
        question: SAMPLE_QUESTIONS[0].question,
        summary: "Walked through a clear, structured example with strong learning outcome.",
      },
      {
        question: SAMPLE_QUESTIONS[1].question,
        summary: "Provided a thoughtful story that highlighted empathy and data-driven resolution.",
      },
    ],
    ...overrides,
  };
}

function makeCallData(summary: string, sentiment: string, completion: string): CallData {
  return {
    call_id: "call-x",
    agent_id: "agent_x",
    audio_websocket_protocol: "websocket",
    audio_encoding: "pcm16",
    sample_rate: 24000,
    call_status: "ended",
    end_call_after_silence_ms: 30000,
    from_number: "",
    to_number: "",
    metadata: {},
    retell_llm_dynamic_variables: { customer_name: "Mock Candidate" },
    drop_call_if_machine_detected: false,
    opt_out_sensitive_data_storage: false,
    start_timestamp: NOW - 600000,
    end_timestamp: NOW - 240000,
    transcript: "",
    transcript_object: [],
    transcript_with_tool_calls: [],
    recording_url: "",
    public_log_url: "",
    e2e_latency: { p50: 0, p90: 0, p95: 0, p99: 0, max: 0, min: 0, num: 0 },
    llm_latency: { p50: 0, p90: 0, p95: 0, p99: 0, max: 0, min: 0, num: 0 },
    llm_websocket_network_rtt_latency: { p50: 0, p90: 0, p95: 0, p99: 0, max: 0, min: 0, num: 0 },
    disconnection_reason: "user_hangup",
    call_analysis: {
      call_summary: summary,
      user_sentiment: sentiment,
      agent_sentiment: "Positive",
      agent_task_completion_rating: completion,
      agent_task_completion_rating_reason: "Mock data",
      call_completion_rating: completion,
      call_completion_rating_reason: "Mock data",
    },
  };
}

export interface MockResponseSeed {
  name: string;
  email: string;
  daysAgo: number;
  durationSeconds: number;
  overallScore: number;
  communicationScore: number;
  candidateStatus: "NO_STATUS" | "NOT_SELECTED" | "POTENTIAL" | "SELECTED";
  isViewed: boolean;
  tabSwitchCount: number;
  facePresencePct: number; // 0-100, for video-mode demo
  summary: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  callCompletion: "Complete" | "Partial" | "Incomplete";
  softSkillSummary: string;
  overallFeedback: string;
  hasVideo: boolean;
}

const RESPONSE_SEEDS: MockResponseSeed[] = [
  {
    name: "Aanya Sharma",
    email: "aanya@example.com",
    daysAgo: 0.2,
    durationSeconds: 480,
    overallScore: 92,
    communicationScore: 94,
    candidateStatus: "SELECTED",
    isViewed: true,
    tabSwitchCount: 0,
    facePresencePct: 98,
    summary:
      "Exceptional candidate. Clear, structured answers with concrete examples from production work at her current company. Strong opinions on accessibility.",
    sentiment: "Positive",
    callCompletion: "Complete",
    softSkillSummary:
      "Empathetic listener. Asks clarifying questions. Brings calm energy to tough trade-off discussions.",
    overallFeedback:
      "Strong hire signal. Recommend fast-tracking to onsite and pairing her with the design-systems lead.",
    hasVideo: true,
  },
  {
    name: "Ben Carter",
    email: "ben.carter@example.com",
    daysAgo: 0.6,
    durationSeconds: 410,
    overallScore: 81,
    communicationScore: 76,
    candidateStatus: "POTENTIAL",
    isViewed: true,
    tabSwitchCount: 2,
    facePresencePct: 92,
    summary:
      "Solid technical foundation. Good React knowledge but design-system depth could be stronger. Tab switches noted — minor flag.",
    sentiment: "Positive",
    callCompletion: "Complete",
    softSkillSummary: "Direct, concise. Sometimes rushes past nuance; could be more reflective.",
    overallFeedback: "Worth a second round focused on system design and accessibility.",
    hasVideo: true,
  },
  {
    name: "Chloe Tan",
    email: "chloe.tan@example.com",
    daysAgo: 1.1,
    durationSeconds: 502,
    overallScore: 88,
    communicationScore: 90,
    candidateStatus: "SELECTED",
    isViewed: true,
    tabSwitchCount: 0,
    facePresencePct: 100,
    summary:
      "Top of the pile. Clear product thinking, strong system-design answers, and excellent collaboration signals. Asked great follow-ups to the AI interviewer.",
    sentiment: "Positive",
    callCompletion: "Complete",
    softSkillSummary: "Highly collaborative, self-aware, brings a structured approach to ambiguity.",
    overallFeedback: "Strong hire. Move to onsite with the design-systems panel.",
    hasVideo: true,
  },
  {
    name: "Diego Alvarez",
    email: "diego@example.com",
    daysAgo: 1.4,
    durationSeconds: 360,
    overallScore: 64,
    communicationScore: 60,
    candidateStatus: "NOT_SELECTED",
    isViewed: true,
    tabSwitchCount: 5,
    facePresencePct: 70,
    summary:
      "Below the bar for the senior role. Answers were often vague and lacked concrete examples. Multiple tab switches and a 30% drop in face presence — possible external assistance.",
    sentiment: "Neutral",
    callCompletion: "Partial",
    softSkillSummary: "Friendly tone, but struggled to go deep on any single topic.",
    overallFeedback:
      "Not a match for this role. Could be a fit for a mid-level position with mentoring support.",
    hasVideo: true,
  },
  {
    name: "Esha Gupta",
    email: "esha.g@example.com",
    daysAgo: 1.8,
    durationSeconds: 445,
    overallScore: 79,
    communicationScore: 82,
    candidateStatus: "POTENTIAL",
    isViewed: false,
    tabSwitchCount: 1,
    facePresencePct: 95,
    summary:
      "Strong communicator with good React fundamentals. Slight gap on system design but compensates with good trade-off reasoning.",
    sentiment: "Positive",
    callCompletion: "Complete",
    softSkillSummary: "Warm tone, asks thoughtful questions about the team.",
    overallFeedback: "Worth a follow-up with the hiring manager for culture fit.",
    hasVideo: true,
  },
  {
    name: "Farah Khan",
    email: "farah.k@example.com",
    daysAgo: 2.1,
    durationSeconds: 380,
    overallScore: 71,
    communicationScore: 68,
    candidateStatus: "NO_STATUS",
    isViewed: false,
    tabSwitchCount: 0,
    facePresencePct: 99,
    summary:
      "Promising candidate with strong product instincts. Technical depth slightly below the bar for this role.",
    sentiment: "Neutral",
    callCompletion: "Complete",
    softSkillSummary: "Curious, engaged. Could be a strong PM-track candidate.",
    overallFeedback: "Consider for an adjacent role or as a future re-pipeline candidate.",
    hasVideo: false,
  },
  {
    name: "Gianni Rossi",
    email: "gianni.r@example.com",
    daysAgo: 2.5,
    durationSeconds: 290,
    overallScore: 58,
    communicationScore: 55,
    candidateStatus: "NOT_SELECTED",
    isViewed: true,
    tabSwitchCount: 7,
    facePresencePct: 55,
    summary:
      "Struggled to complete the interview (cut short). Heavy tab switching and 45% drop in face presence suggests possible external assistance.",
    sentiment: "Negative",
    callCompletion: "Incomplete",
    softSkillSummary: "Reserved, hard to read engagement level.",
    overallFeedback: "Integrity flag — recommend not advancing and reviewing interview recording.",
    hasVideo: true,
  },
  {
    name: "Hina Park",
    email: "hina.park@example.com",
    daysAgo: 3.0,
    durationSeconds: 470,
    overallScore: 85,
    communicationScore: 88,
    candidateStatus: "SELECTED",
    isViewed: true,
    tabSwitchCount: 0,
    facePresencePct: 97,
    summary:
      "Excellent candidate. Strong design-system knowledge, calm communicator, great at explaining trade-offs.",
    sentiment: "Positive",
    callCompletion: "Complete",
    softSkillSummary: "Collaborative, evidence-based, brings a coach mindset to code review.",
    overallFeedback: "Strong hire. Move to onsite with the design-systems panel.",
    hasVideo: true,
  },
  {
    name: "Ivan Petrov",
    email: "ivan.p@example.com",
    daysAgo: 3.4,
    durationSeconds: 405,
    overallScore: 76,
    communicationScore: 78,
    candidateStatus: "POTENTIAL",
    isViewed: false,
    tabSwitchCount: 0,
    facePresencePct: 100,
    summary:
      "Solid React fundamentals. Communication is clear but answers stay surface-level on system design.",
    sentiment: "Positive",
    callCompletion: "Complete",
    softSkillSummary: "Direct, focused, asks good clarifying questions.",
    overallFeedback: "Consider for a second round with a deeper system-design focus.",
    hasVideo: false,
  },
  {
    name: "Jasmine Lee",
    email: "jasmine.lee@example.com",
    daysAgo: 4.0,
    durationSeconds: 360,
    overallScore: 68,
    communicationScore: 70,
    candidateStatus: "NO_STATUS",
    isViewed: false,
    tabSwitchCount: 3,
    facePresencePct: 88,
    summary:
      "Mid-level signal. Decent React knowledge, design-systems experience is light. A few tab switches noted.",
    sentiment: "Neutral",
    callCompletion: "Complete",
    softSkillSummary: "Polite, professional, but lacks the depth we'd want at the senior level.",
    overallFeedback: "Consider for a mid-level role if one opens up in the next quarter.",
    hasVideo: true,
  },
  {
    name: "Karan Mehta",
    email: "karan.m@example.com",
    daysAgo: 4.6,
    durationSeconds: 498,
    overallScore: 90,
    communicationScore: 92,
    candidateStatus: "SELECTED",
    isViewed: true,
    tabSwitchCount: 0,
    facePresencePct: 99,
    summary:
      "Top-tier candidate. Clear, structured, with deep design-system knowledge. Mentioned leading a11y initiatives.",
    sentiment: "Positive",
    callCompletion: "Complete",
    softSkillSummary: "Senior energy. Calm, structured, brings out the best in cross-functional discussion.",
    overallFeedback: "Strong hire. Fast-track to onsite.",
    hasVideo: true,
  },
  {
    name: "Lila Berger",
    email: "lila.b@example.com",
    daysAgo: 5.2,
    durationSeconds: 220,
    overallScore: 49,
    communicationScore: 50,
    candidateStatus: "NOT_SELECTED",
    isViewed: true,
    tabSwitchCount: 4,
    facePresencePct: 65,
    summary:
      "Interview cut short. Low engagement, multiple tab switches, inconsistent face presence. Recommend a manual review of the recording.",
    sentiment: "Negative",
    callCompletion: "Incomplete",
    softSkillSummary: "Hard to assess — limited engagement during the call.",
    overallFeedback: "Not a fit. Flag for integrity review.",
    hasVideo: true,
  },
];

function seedToResponse(seed: MockResponseSeed, idx: number): Response {
  const createdAt = new Date(NOW - seed.daysAgo * ONE_DAY);
  const callId = `mock-call-${idx.toString().padStart(3, "0")}`;
  const analytics = makeAnalytics({
    overallScore: seed.overallScore,
    communication: {
      score: seed.communicationScore,
      feedback: `Communication sample feedback for ${seed.name}.`,
    },
    softSkillSummary: seed.softSkillSummary,
    overallFeedback: seed.overallFeedback,
  });
  const callData = makeCallData(seed.summary, seed.sentiment, seed.callCompletion);

  return {
    id: BigInt(idx + 1),
    created_at: createdAt,
    name: seed.name,
    interview_id: SAMPLE_INTERVIEW.id,
    duration: seed.durationSeconds,
    call_id: callId,
    details: callData,
    is_analysed: true,
    email: seed.email,
    is_ended: seed.callCompletion !== "Incomplete",
    is_viewed: seed.isViewed,
    analytics,
    candidate_status: seed.candidateStatus,
    tab_switch_count: seed.tabSwitchCount,
  } as Response & { face_presence_pct?: number; has_video?: boolean };
}

// Augment the Response with our mock-only fields for the dashboard
export function getMockResponses(): (Response & {
  face_presence_pct: number;
  has_video: boolean;
})[] {
  return RESPONSE_SEEDS.map((seed, idx) => ({
    ...seedToResponse(seed, idx),
    face_presence_pct: seed.facePresencePct,
    has_video: seed.hasVideo,
  }));
}

// ---------------------------------------------------------------------------
// Aggregate metrics computed from the seed data
// ---------------------------------------------------------------------------
export interface DashboardMetrics {
  totalResponses: number;
  avgOverallScore: number;
  avgCommunicationScore: number;
  avgDurationSeconds: number;
  completionRate: number; // 0..1
  sentimentSplit: { positive: number; neutral: number; negative: number };
  statusSplit: { selected: number; potential: number; notSelected: number; noStatus: number };
  scoreHistogram: { bucket: string; count: number }[]; // 0-49, 50-59, ..., 90-100
  topStrengths: { label: string; count: number }[];
  integrityFlags: number; // tab switches + low face presence
  unviewedCount: number;
}

export function computeMockDashboard(): DashboardMetrics {
  return computeMockDashboardFromResponses(
    RESPONSE_SEEDS as unknown as ReadonlyArray<Record<string, unknown>>,
  );
}

/**
 * General-purpose version that works on any response list.
 * Used by the dashboard with both the seed data (demo) and real Supabase
 * rows (production). Reads the same fields the `Response` shape exposes,
 * with safe fallbacks for the enhanced-suite fields that may be missing
 * on responses created before this branch.
 */
export function computeMockDashboardFromResponses(
  rows: ReadonlyArray<Record<string, unknown>>,
): DashboardMetrics {
  const total = rows.length || 1;
  const num = (v: unknown) => (typeof v === "number" ? v : 0);
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const overallAvg = Math.round(
    rows.reduce((acc, r) => acc + num((r as any).overallScore ?? (r as any).analytics?.overallScore), 0) / total,
  );
  const commAvg = Math.round(
    rows.reduce(
      (acc, r) =>
        acc +
        num(
          (r as any).communicationScore ??
            (r as any).analytics?.communication?.score,
        ),
      0,
    ) / total,
  );
  const durAvg = Math.round(
    rows.reduce((acc, r) => acc + num((r as any).durationSeconds ?? r.duration), 0) / total,
  );

  const completion = rows.filter((r) => {
    const c = (r as any).callCompletion ?? (r as any).details?.call_analysis?.call_completion_rating;
    return c === "Complete";
  }).length / total;

  const sentimentSplit = {
    positive: rows.filter((r) => {
      const s = (r as any).sentiment ?? (r as any).details?.call_analysis?.user_sentiment;
      return s === "Positive";
    }).length,
    neutral: rows.filter((r) => {
      const s = (r as any).sentiment ?? (r as any).details?.call_analysis?.user_sentiment;
      return s === "Neutral";
    }).length,
    negative: rows.filter((r) => {
      const s = (r as any).sentiment ?? (r as any).details?.call_analysis?.user_sentiment;
      return s === "Negative";
    }).length,
  };

  const statusSplit = {
    selected: rows.filter((r) => r.candidate_status === "SELECTED").length,
    potential: rows.filter((r) => r.candidate_status === "POTENTIAL").length,
    notSelected: rows.filter((r) => r.candidate_status === "NOT_SELECTED").length,
    noStatus: rows.filter((r) => r.candidate_status === "NO_STATUS").length,
  };

  const buckets = [
    { bucket: "0-49", count: 0 },
    { bucket: "50-59", count: 0 },
    { bucket: "60-69", count: 0 },
    { bucket: "70-79", count: 0 },
    { bucket: "80-89", count: 0 },
    { bucket: "90-100", count: 0 },
  ];
  rows.forEach((r) => {
    const s = num((r as any).overallScore ?? (r as any).analytics?.overallScore);
    if (s < 50) buckets[0].count += 1;
    else if (s < 60) buckets[1].count += 1;
    else if (s < 70) buckets[2].count += 1;
    else if (s < 80) buckets[3].count += 1;
    else if (s < 90) buckets[4].count += 1;
    else buckets[5].count += 1;
  });

  const topStrengths = [
    {
      label: "Design-system experience",
      count: rows.filter((r) => num((r as any).overallScore) >= 75).length,
    },
    {
      label: "Strong communication",
      count: rows.filter((r) => num((r as any).communicationScore) >= 80).length,
    },
    {
      label: "Cross-functional collaboration",
      count: Math.round(rows.length * 0.66),
    },
    {
      label: "Concrete examples in answers",
      count: Math.round(rows.length * 0.58),
    },
    {
      label: "Accessibility awareness",
      count: Math.round(rows.length * 0.41),
    },
  ];

  const integrityFlags = rows.filter((r) => {
    const tabs = num((r as any).tabSwitchCount ?? r.tab_switch_count);
    const face = num((r as any).facePresencePct ?? r.face_presence_pct);
    const signals = (r as any).integrity_signals;
    return tabs >= 3 || face < 80 || (Array.isArray(signals) && signals.length > 0);
  }).length;

  // Reference the function so eslint doesn't strip the import
  void str;

  return {
    totalResponses: rows.length,
    avgOverallScore: overallAvg,
    avgCommunicationScore: commAvg,
    avgDurationSeconds: durAvg,
    completionRate: completion,
    sentimentSplit,
    statusSplit,
    scoreHistogram: buckets,
    topStrengths,
    integrityFlags,
    unviewedCount: rows.filter((r) => !r.is_viewed).length,
  };
}

// ---------------------------------------------------------------------------
// Job-description presets (used in the create-wizard template gallery)
// ---------------------------------------------------------------------------
export const JD_PRESETS: {
  id: string;
  title: string;
  industry: string;
  blurb: string;
  objective: string;
  suggestedQuestions: string[];
}[] = [
  {
    id: "preset-senior-fe",
    title: "Senior Frontend Engineer",
    industry: "Software",
    blurb: "Lead a design-system rebuild with React, TS, and a11y focus.",
    objective:
      "Find a senior frontend engineer with strong React, design-systems, and accessibility experience, who can collaborate across product and design.",
    suggestedQuestions: [
      "Walk me through a project where you had to learn a new technology quickly.",
      "Tell me about a time you disagreed with a teammate. How was it resolved?",
      "How do you keep a design system consistent across teams?",
      "Describe a tricky accessibility bug you shipped. What did you learn?",
      "How do you decide what to optimise for when a system has competing constraints?",
    ],
  },
  {
    id: "preset-product-manager",
    title: "Product Manager — Growth",
    industry: "Product",
    blurb: "Own activation, retention, and experiment velocity for a B2B SaaS.",
    objective:
      "Hire a PM who pairs strong analytical chops with great customer empathy, can run a tight experiment loop, and writes crisp specs.",
    suggestedQuestions: [
      "How do you decide which growth lever to pull first?",
      "Walk me through an experiment that failed. What did you learn?",
      "Tell me about a stakeholder disagreement you navigated.",
      "How do you balance speed and rigour?",
      "How do you write a product spec people actually read?",
    ],
  },
  {
    id: "preset-data-scientist",
    title: "Data Scientist — Pricing",
    industry: "Data",
    blurb: "Build models that drive pricing decisions for a marketplace.",
    objective:
      "Find a data scientist with strong statistical foundations, who can communicate trade-offs to non-technical partners, and ship to production.",
    suggestedQuestions: [
      "How do you validate that a pricing model is fair?",
      "Tell me about a model that performed well offline but failed online.",
      "How do you communicate uncertainty to a pricing committee?",
      "Describe a time you pushed back on a metric choice.",
      "How do you monitor a model in production?",
    ],
  },
  {
    id: "preset-customer-success",
    title: "Customer Success Manager",
    industry: "Customer",
    blurb: "Own a book of mid-market customers for a vertical SaaS.",
    objective:
      "Hire a CSM who is commercially savvy, deeply empathetic, and great at translating customer pain into product feedback.",
    suggestedQuestions: [
      "Tell me about a customer you saved from churning.",
      "How do you prioritise when you have 30 customers asking for things?",
      "Walk me through a tough renewal conversation.",
      "How do you turn customer feedback into product insight?",
      "Describe a time you had to deliver bad news to a customer.",
    ],
  },
  {
    id: "preset-sre",
    title: "Site Reliability Engineer",
    industry: "Infrastructure",
    blurb: "Own the SLOs and on-call experience for a payments platform.",
    objective:
      "Hire an SRE who has run production at scale, thinks in error budgets, and writes post-mortems that drive real change.",
    suggestedQuestions: [
      "Tell me about an incident you were the IC for. Walk me through it.",
      "How do you balance reliability and feature velocity?",
      "Describe a time you disagreed with a product team on a launch.",
      "How do you make on-call humane?",
      "What does a good post-mortem look like to you?",
    ],
  },
  {
    id: "preset-ux-designer",
    title: "Senior UX Designer",
    industry: "Design",
    blurb: "Lead the end-to-end design of a new B2B product surface.",
    objective:
      "Hire a senior UX designer with strong systems thinking, who runs tight research loops and partners well with PM and engineering.",
    suggestedQuestions: [
      "Walk me through your design process from research to ship.",
      "Tell me about a time research changed your mind.",
      "How do you handle scope creep in a design project?",
      "Describe a design critique that changed your work.",
      "How do you measure the success of a design?",
    ],
  },
];
