/**
 * /api/llm-health
 * ----------------
 * Lightweight probe that confirms the LLM provider (Groq by default,
 * OpenAI as fallback) is reachable. Returns the active backend, the
 * model in use, and the error if anything failed.
 *
 * Used by /setup or any operator-facing tool. Safe to hit from the
 * browser — the response contains no secrets.
 */

import { NextResponse } from "next/server";
import { llmHealthCheck } from "@/lib/llm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const result = await llmHealthCheck();
    const elapsedMs = Date.now() - start;
    if (!result.ok) {
      logger.error(`LLM health check failed: ${result.error}`);
      return NextResponse.json(
        { ...result, elapsedMs },
        { status: 503 },
      );
    }
    return NextResponse.json({ ...result, elapsedMs }, { status: 200 });
  } catch (err) {
    logger.error(`LLM health check threw: ${String(err)}`);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Date.now() - start,
      },
      { status: 500 },
    );
  }
}
