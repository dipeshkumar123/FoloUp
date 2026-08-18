import { logger } from "@/lib/logger";
import {
  SYSTEM_PROMPT,
  getCommunicationAnalysisPrompt,
} from "@/lib/prompts/communication-analysis";
import { chatJson } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  logger.info("analyze-communication request received");

  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const { data, backend, model } = await chatJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: getCommunicationAnalysisPrompt(transcript) },
      ],
    });

    logger.info(`Communication analysis via ${backend}/${model}`);

    return NextResponse.json(
      { analysis: data, backend, model },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error analyzing communication skills");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
