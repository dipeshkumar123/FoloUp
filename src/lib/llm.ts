/**
 * Unified LLM client.
 * --------------------
 * Single chokepoint for every OpenAI / Groq call in the app.
 *
 * Default backend is Groq (OpenAI-compatible API, much cheaper, no
 * strict rate limits on the free tier). The OpenAI client itself
 * works against Groq by pointing `baseURL` at `api.groq.com/openai/v1`.
 *
 *   - Set `GROQ_API_KEY` to use Groq (default)
 *   - Set `OPENAI_API_KEY` (and `LLM_BACKEND=openai`) to fall back to OpenAI
 *   - Set `LLM_MODEL` to override the default model
 *
 * The chat-completions interface we expose is a *narrow* subset of
 * the official SDK, just enough for our 4 call sites. We deliberately
 * don't try to wrap the whole SDK — that would be more code to maintain
 * than just calling the real client.
 */

import OpenAI from "openai";
import { logger } from "@/lib/logger";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ChatOptions {
  messages: ChatMessage[];
  /** JSON mode where supported. Groq + OpenAI both honour this. */
  responseFormatJson?: boolean;
  /** Override the default model. */
  model?: string;
  /** Max output tokens. Defaults to 2048. */
  maxTokens?: number;
  /** Sampling temperature. Defaults to 0.4 — low enough for stable JSON. */
  temperature?: number;
}

export interface ChatResult {
  content: string;
  model: string;
  backend: "groq" | "openai";
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// ---------------------------------------------------------------------------
// Backend selection
// ---------------------------------------------------------------------------
type Backend = "groq" | "openai";

function pickBackend(): Backend {
  const explicit = (process.env.LLM_BACKEND ?? "").toLowerCase();
  if (explicit === "openai" || explicit === "groq") {
    return explicit as Backend;
  }
  // Default to Groq when its key is set, otherwise fall back to OpenAI.
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  // Both keys missing — caller will get a clear error.
  return "groq";
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENAI_MODEL = "gpt-4o";

const KNOWN_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

// ---------------------------------------------------------------------------
// Cached client
// ---------------------------------------------------------------------------
let _client: OpenAI | null = null;
let _clientBackend: Backend | null = null;

function getClient(backend: Backend): OpenAI {
  if (_client && _clientBackend === backend) return _client;

  if (backend === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env or set LLM_BACKEND=openai to fall back to OpenAI.",
      );
    }
    _client = new OpenAI({
      apiKey,
      baseURL: GROQ_BASE_URL,
      maxRetries: 3,
    });
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set and LLM_BACKEND=openai.");
    }
    _client = new OpenAI({ apiKey, maxRetries: 3 });
  }
  _clientBackend = backend;
  return _client;
}

function pickModel(backend: Backend, override?: string): string {
  if (override) return override;
  if (process.env.LLM_MODEL) return process.env.LLM_MODEL;
  return backend === "groq" ? DEFAULT_GROQ_MODEL : DEFAULT_OPENAI_MODEL;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Send a chat completion. Always returns parsed JSON-friendly text.
 * Throws on transport errors or if both API keys are missing.
 */
export async function chatCompletion(opts: ChatOptions): Promise<ChatResult> {
  const backend = pickBackend();
  const client = getClient(backend);
  const model = pickModel(backend, opts.model);

  if (backend === "groq" && !KNOWN_GROQ_MODELS.includes(model)) {
    logger.warn(
      `Model ${model} is not in our known Groq list — Groq will reject if the model name is wrong. ` +
        `Known: ${KNOWN_GROQ_MODELS.join(", ")}`,
    );
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 2048,
      // JSON mode. Both Groq and OpenAI accept { type: "json_object" }.
      ...(opts.responseFormatJson
        ? { response_format: { type: "json_object" as const } }
        : {}),
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return {
      content,
      model,
      backend,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  } catch (err) {
    logger.error(`LLM call failed (${backend}/${model}): ${String(err)}`);
    throw err;
  }
}

/**
 * Convenience for JSON-mode completions. Returns the parsed object and
 * throws if the model returned non-JSON.
 */
export async function chatJson<T = unknown>(opts: ChatOptions): Promise<{
  data: T;
  raw: string;
  content: string;
  model: string;
  backend: "groq" | "openai";
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}> {
  const result = await chatCompletion({ ...opts, responseFormatJson: true });
  try {
    // Groq occasionally wraps JSON in ```json fences. Strip them.
    const cleaned = result.content
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "");
    return { data: JSON.parse(cleaned) as T, raw: result.content, ...result };
  } catch (err) {
    logger.error(`LLM returned non-JSON: ${result.content.slice(0, 200)}…`);
    throw err;
  }
}

/**
 * Test the LLM connection. Useful for the /setup health check.
 */
export async function llmHealthCheck(): Promise<{
  ok: boolean;
  backend: Backend;
  model: string;
  error?: string;
}> {
  const backend = pickBackend();
  try {
    const result = await chatCompletion({
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 8,
      model: pickModel(backend),
    });
    return { ok: true, backend, model: result.model };
  } catch (err) {
    return {
      ok: false,
      backend,
      model: pickModel(backend),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
