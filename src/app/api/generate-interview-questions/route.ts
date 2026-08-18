import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT, generateQuestionsPrompt } from "@/lib/prompts/generate-questions";
import { chatCompletion } from "@/lib/llm";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("generate-interview-questions request received");
  const body = await req.json();

  try {
    const result = await chatCompletion({
      responseFormatJson: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: generateQuestionsPrompt(body) },
      ],
    });

    logger.info(
      `Interview questions generated via ${result.backend}/${result.model}`,
    );

    return NextResponse.json(
      {
        response: result.content,
        backend: result.backend,
        model: result.model,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error generating interview questions");
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
