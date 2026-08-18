import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT, createUserPrompt } from "@/lib/prompts/generate-insights";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import { chatJson } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  logger.info("generate-insights request received");
  const body = await req.json();

  const responses = await ResponseService.getAllResponses(body.interviewId);
  const interview = await InterviewService.getInterviewById(body.interviewId);

  let callSummaries = "";
  if (responses) {
    for (const response of responses) {
      callSummaries += response.details?.call_analysis?.call_summary;
    }
  }

  try {
    const prompt = createUserPrompt(
      callSummaries,
      interview.name,
      interview.objective,
      interview.description,
    );

    const { data, raw, backend, model } = await chatJson<{ insights: string[] }>({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    await InterviewService.updateInterview(
      { insights: data.insights },
      body.interviewId,
    );

    logger.info(`Insights generated via ${backend}/${model}`);

    return NextResponse.json(
      {
        response: raw,
        backend,
        model,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error generating insights");
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
