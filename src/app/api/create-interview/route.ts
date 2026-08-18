import { logger } from "@/lib/logger";
import { InterviewService } from "@/services/interviews.service";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

function getPublicOrigin(request: Request) {
  // The request origin is the reliable source in local development. Only use
  // an environment override when it is a complete, valid URL.
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_LIVE_URL;
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      // A value such as "localhost:3000" has no protocol; fall back below.
    }
  }

  return new URL(request.url).origin;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = body.interviewData ?? {};
    const url_id = payload.id || nanoid();
    const baseUrl = getPublicOrigin(req);

    let readableSlug = null;
    const sourceName = String(payload.name || "interview");
    const normalizedName = sourceName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);
    readableSlug = `${normalizedName || "interview"}-${url_id}`;
    // Never persist a preview/mock URL supplied by the client. This keeps the
    // published URL on the same host as the app serving the interview.
    const finalUrl = `${baseUrl}/call/${readableSlug}`;

    logger.info("create-interview request received");

    const normalizedPayload = {
      id: url_id,
      name: payload.name ?? "Interview",
      description: payload.description ?? "",
      objective: payload.objective ?? "",
      organization_id: payload.organization_id ?? body.organizationId ?? null,
      user_id: payload.user_id ?? body.userId ?? null,
      interviewer_id: payload.interviewer_id
        ? Number(payload.interviewer_id)
        : payload.interviewerId
          ? Number(payload.interviewerId)
          : null,
      is_active: payload.is_active ?? true,
      is_anonymous: Boolean(payload.is_anonymous ?? payload.isAnonymous ?? false),
      logo_url: payload.logo_url ?? payload.logoUrl ?? "",
      theme_color: payload.theme_color ?? "#4F46E5",
      url: finalUrl,
      readable_slug: readableSlug,
      questions: Array.isArray(payload.questions) ? payload.questions : [],
      quotes: payload.quotes ?? [],
      insights: payload.insights ?? [],
      respondents: payload.respondents ?? [],
      question_count: Number(payload.question_count ?? payload.questionCount ?? 0),
      response_count: Number(payload.response_count ?? payload.responseCount ?? 0),
      time_duration: String(payload.time_duration ?? payload.timeDuration ?? "6"),
    };

    await InterviewService.createInterview(normalizedPayload);

    logger.info("Interview created successfully");

    return NextResponse.json(
      { response: "Interview created successfully", interview: normalizedPayload },
      { status: 200 },
    );
  } catch (err) {
    logger.error("Error creating interview");

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
