"use server";

import { SYSTEM_PROMPT, getInterviewAnalyticsPrompt } from "@/lib/prompts/analytics";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import { chatJson } from "@/lib/llm";
import type { Question } from "@/types/interview";
import type { Analytics } from "@/types/response";

export const generateInterviewAnalytics = async (payload: {
  callId: string;
  interviewId: string;
  transcript: string;
}) => {
  const { callId, interviewId, transcript } = payload;

  try {
    const response = await ResponseService.getResponseByCallId(callId);
    const interview = await InterviewService.getInterviewById(interviewId);

    if (response.analytics) {
      return { analytics: response.analytics as Analytics, status: 200 };
    }

    const interviewTranscript = transcript || response.details?.transcript;
    const questions = interview?.questions || [];
    const mainInterviewQuestions = questions
      .map((q: Question, index: number) => `${index + 1}. ${q.question}`)
      .join("\n");

    const prompt = getInterviewAnalyticsPrompt(interviewTranscript, mainInterviewQuestions);

    const { data: analyticsResponse } = await chatJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      // analytics is a bigger JSON payload than the others
      maxTokens: 4000,
    });

    (analyticsResponse as { mainInterviewQuestions?: string[] }).mainInterviewQuestions =
      questions.map((q: Question) => q.question);

    return { analytics: analyticsResponse, status: 200 };
  } catch (error) {
    console.error("Error in LLM analytics request:", error);
    return { error: "internal server error", status: 500 };
  }
};
