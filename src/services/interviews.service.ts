import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

const normalizeInterviewPayload = (payload: any) => {
  const id = payload?.interviewer_id;
  if (id === undefined || id === null) {
    return payload;
  }
  if (String(id) === "0") {
    return { ...payload, interviewer_id: null };
  }

  return payload;
};

const getAllInterviews = async (userId?: string, organizationId?: string) => {
  try {
    let query = supabase.from("interview").select("*");

    if (organizationId && userId) {
      query = query.or(`organization_id.eq.${organizationId},user_id.eq.${userId}`);
    } else if (organizationId) {
      query = query.eq("organization_id", organizationId);
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.limit(0);
    }

    const { data: clientData, error: clientError } = await query.order("created_at", {
      ascending: false,
    });

    return [...(clientData || [])];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const getInterviewById = async (id: string) => {
  try {
    const normalizedId = id.replace(/^.*\/call\//, "").replace(/\/$/, "");
    const { data, error } = await supabase
      .from("interview")
      .select("*")
      .or(`id.eq.${normalizedId},readable_slug.eq.${normalizedId}`);

    if (error) {
      console.log(error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.log(error);

    return null;
  }
};

const updateInterview = async (payload: any, id: string) => {
  const normalizedPayload = normalizeInterviewPayload(payload);
  const { error, data } = await supabase
    .from("interview")
    .update({ ...normalizedPayload })
    .eq("id", id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const deleteInterview = async (id: string) => {
  const { error, data } = await supabase.from("interview").delete().eq("id", id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const getAllRespondents = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select("respondents")
      .eq("interview_id", interviewId);

    return data || [];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const createInterview = async (payload: any) => {
  const normalizedPayload = normalizeInterviewPayload(payload);
  const { error, data } = await supabase.from("interview").insert({ ...normalizedPayload });
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }

  return data;
};

const deactivateInterviewsByOrgId = async (organizationId: string) => {
  try {
    const { error } = await supabase
      .from("interview")
      .update({ is_active: false })
      .eq("organization_id", organizationId)
      .eq("is_active", true); // Optional: only update if currently active

    if (error) {
      console.error("Failed to deactivate interviews:", error);
    }
  } catch (error) {
    console.error("Unexpected error disabling interviews:", error);
  }
};

export const InterviewService = {
  getAllInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  getAllRespondents,
  createInterview,
  deactivateInterviewsByOrgId,
};
