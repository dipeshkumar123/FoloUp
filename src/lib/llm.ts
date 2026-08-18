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
 * Robust to model deprecation: if the configured model 404s, the
 * client walks down a fallback chain (most-capable -> smallest) so
 * the app keeps working even if Groq retires a model. The first call
 * after a Groq model retirement triggers the fallback; subsequent
 * calls use the working model until the process restarts.
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

// Ordered: most-capable production model first, then progressively smaller.
// The client tries each in order on 404 "model_not_found" so deprecations
// don't take the app down between code updates.
const GROQ_MODEL_FALLBACK_CHAIN = [
  "openai/gpt-oss-120b",   // current Groq production default
  "openai/gpt-oss-20b",    // smaller production model
  "qwen/qwen3.6-27b",      // preview, multimodal
  "llama-3.1-70b-versatile", // legacy Llama 3.1 (likely also deprecated)
  "llama-3.1-8b-instant",  // legacy small Llama
] as const;

const OPENAI_MODEL_FALLBACK_CHAIN = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
] as const;

const DEFAULT_OPENAI_MODEL = "gpt-4o";

// ---------------------------------------------------------------------------
// Cached client + last-known-good model
// ---------------------------------------------------------------------------
let _client: OpenAI | null = null;
let _clientBackend: Backend | null = null;
let _lastGoodModel: string | null = null;

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
      maxRetries: 2,
    });
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set and LLM_BACKEND=openai.");
    }
    _client = new OpenAI({ apiKey, maxRetries: 2 });
  }
  _clientBackend = backend;
  return _client;
}

/**
 * Order to try models in. If we've already discovered a working model
 * for this backend (e.g. via the fallback chain on a previous call),
 * use it first to avoid the ~500ms penalty of re-probing a deprecated
 * default.
 */
function modelChainFor(backend: Backend, override?: string): string[] {
  if (override) return [override];
  const explicit = process.env.LLM_MODEL?.trim();
  if (explicit) return [explicit];

  const fallback =
    backend === "openai"
      ? [DEFAULT_OPENAI_MODEL, ...OPENAI_MODEL_FALLBACK_CHAIN.filter((m) => m !== DEFAULT_OPENAI_MODEL)]
      : [...GROQ_MODEL_FALLBACK_CHAIN];

  // If we have a last-known-good model for this backend, put it first.
  if (_lastGoodModel && !fallback.includes(_lastGoodModel as never)) {
    return [_lastGoodModel, ...fallback];
  }
  if (_lastGoodModel && fallback.includes(_lastGoodModel as never)) {
    return [_lastGoodModel, ...fallback.filter((m) => m !== _lastGoodModel)];
  }
  return fallback;
}

function rememberGoodModel(model: string) {
  _lastGoodModel = model;
}

/** True if the error is a Groq/OpenAI 404 (model not found). */
function isModelNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; code?: string };
  return e.status === 404 || e.code === "model_not_found";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Send a chat completion. Tries the configured model first, then walks
 * the fallback chain on 404. Returns the first successful result.
 */
export async function chatCompletion(opts: ChatOptions): Promise<ChatResult> {
  const backend = pickBackend();
  const client = getClient(backend);
  const chain = modelChainFor(backend, opts.model);

  let lastError: unknown = null;
  for (const model of chain) {
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
      logger.info(`LLM call ok: ${backend}/${model}`);
      rememberGoodModel(model);
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
      lastError = err;
      if (isModelNotFoundError(err)) {
        logger.warn(
          `LLM model ${backend}/${model} not found (likely deprecated). ` +
            `Trying the next model in the fallback chain.`,
        );
        continue;
      }
      // Non-404 — log and surface immediately. No point in trying other
      // models, the failure is the same (auth, quota, network, etc.).
      logger.error(`LLM call failed (${backend}/${model}): ${String(err)}`);
      throw err;
    }
  }

  // All models in the chain returned 404. Surface the last error.
  logger.error(
    `All ${chain.length} models in the ${backend} fallback chain returned 404. ` +
      `Set LLM_MODEL to a currently-supported model. Last error: ${String(lastError)}`,
  );
  throw lastError ?? new Error(`No working model found for backend ${backend}`);
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
    });
    return { ok: true, backend, model: result.model };
  } catch (err) {
    return {
      ok: false,
      backend,
      model: process.env.LLM_MODEL ?? GROQ_MODEL_FALLBACK_CHAIN[0],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
