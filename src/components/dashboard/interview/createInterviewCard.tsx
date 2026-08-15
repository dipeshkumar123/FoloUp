"use client";

/**
 * CreateInterviewCard
 * -------------------
 * The "new interview" tile on the dashboard. Now opens the enhanced
 * 4-step wizard instead of the old 2-step modal.
 *
 * The dashboard's flow:
 *   1. user clicks the tile
 *   2. wizard opens (state owned by this component)
 *   3. on publish, we hit /api/create-interview exactly the way the
 *      original flow did, then refresh the interview list
 *
 * Keeping the API call shape identical to the original means the
 * server-side route, the database, and the interviewer list all work
 * without any change.
 */

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
import { useInterviews } from "@/contexts/interviews.context";
import { useClerk, useOrganization } from "@clerk/nextjs";
import axios from "axios";
import {
  CreateInterviewWizard,
  type WizardResult,
} from "@/components/enhanced/create-interview/CreateInterviewWizard";

function CreateInterviewCard() {
  const [open, setOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { fetchInterviews } = useInterviews();
  const { user } = useClerk();
  const { organization } = useOrganization();

  const handlePublish = async (result: WizardResult) => {
    setPublishing(true);
    try {
      // Mirror the original payload shape so the existing
      // /api/create-interview route works without changes.
      const { interviewerId, ...resultData } = result;
      const sanitized = {
        ...resultData,
        // BigInt values cannot be sent in a JSON request. Keep only the
        // database field, converted to a regular number.
        interviewer_id: Number(interviewerId),
        logo_url: organization?.imageUrl || "",
        organization_id: organization?.id || null,
        user_id: user?.id || null,
        shareUrl: result.shareUrl,
      };
      await axios.post("/api/create-interview", {
        organizationName: organization?.name,
        organizationId: organization?.id,
        userId: user?.id,
        interviewData: sanitized,
      });
      await fetchInterviews();
      setOpen(false);
    } catch (err) {
      console.error("Create interview failed", err);
      throw err;
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <Card
        className="relative flex items-center border-dashed border-gray-700 border-2 cursor-pointer hover:scale-105 ease-in-out duration-300 h-60 w-56 ml-1 mr-3 mt-4 rounded-xl shrink-0 overflow-hidden shadow-md"
        onClick={() => setOpen(true)}
      >
        <CardContent className="flex items-center flex-col mx-auto">
          <div className="flex flex-col justify-center items-center w-full overflow-hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <Plus size={36} strokeWidth={1.5} className="-mt-2 text-gray-700" />
          </div>
          <CardTitle className="p-0 text-md text-center">Create an Interview</CardTitle>
          <p className="px-3 mt-1 text-center text-[10px] text-slate-500">
            4-step wizard with live preview
          </p>
        </CardContent>
      </Card>

      <CreateInterviewWizard
        open={open}
        onClose={() => setOpen(false)}
        onPublish={handlePublish}
      />
    </>
  );
}

export default CreateInterviewCard;
