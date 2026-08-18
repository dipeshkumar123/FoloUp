"use client";

/**
 * /interviews/[interviewId]
 * -------------------------
 * Per-interview landing page. Hosts the dashboard's top-bar controls
 * (share / preview / edit / active toggle, theme colour picker) and
 * mounts the enhanced FeedbackDashboard below.
 *
 * The original 3-pane layout (CallInfo, summaryInfo, custom dataTable)
 * is replaced by the new single-screen dashboard. The page header
 * controls stay because they belong to the interview-management
 * surface, not the candidate-feedback surface.
 */

import EditInterview from "@/components/dashboard/interview/editInterview";
import SharePopup from "@/components/dashboard/interview/sharePopup";
import LoaderWithText from "@/components/loaders/loader-with-text/loaderWithText";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInterviews } from "@/contexts/interviews.context";
import { ClientService } from "@/services/clients.service";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import type { Interview } from "@/types/interview";
import type { Response } from "@/types/response";
import { useOrganization } from "@clerk/nextjs";
import { Eye, Palette, Pencil, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, use } from "react";
import { ChromePicker } from "react-color";
import { toast } from "sonner";
import { FeedbackDashboard } from "@/components/enhanced/feedback-dashboard/FeedbackDashboard";

interface Props {
  params: Promise<{
    interviewId: string;
  }>;
  searchParams: Promise<{
    call: string;
    edit: boolean;
  }>;
}

function InterviewHome({ params, searchParams }: Props) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [interview, setInterview] = useState<Interview>();
  const [responses, setResponses] = useState<Response[]>();
  const { getInterviewById } = useInterviews();
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const router = useRouter();
  const [isActive, setIsActive] = useState<boolean>(true);
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<string>("#4F46E5");
  const [iconColor, seticonColor] = useState<string>("#4F46E5");
  const { organization } = useOrganization();

  const seeInterviewPreviewPage = () => {
    if (interview?.url) {
      const url = interview?.readable_slug
        ? `${window.location.origin}/call/${interview.readable_slug}`
        : interview.url.startsWith("http")
          ? interview.url
          : `https://${interview.url}`;
      window.open(url, "_blank");
    } else {
      console.error("Interview URL is null or undefined.");
    }
  };

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await getInterviewById(resolvedParams.interviewId);
        setInterview(response);
        setIsActive(response.is_active);
        setThemeColor(response.theme_color ?? "#4F46E5");
        seticonColor(response.theme_color ?? "#4F46E5");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (!interview || !isGeneratingInsights) {
      fetchInterview();
    }
  }, [getInterviewById, resolvedParams.interviewId, isGeneratingInsights, interview]);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        if (organization?.id) {
          const data = await ClientService.getOrganizationById(organization.id);
          if (data?.plan) {
            setCurrentPlan(data.plan);
          }
        }
      } catch (error) {
        console.error("Error fetching organization data:", error);
      }
    };
    fetchOrganizationData();
  }, [organization]);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await ResponseService.getAllResponses(
          resolvedParams.interviewId,
        );
        setResponses(response);
      } catch (error) {
        console.error(error);
      }
    };
    fetchResponses();
  }, [resolvedParams.interviewId]);

  const handleToggle = async () => {
    try {
      const updatedIsActive = !isActive;
      setIsActive(updatedIsActive);
      await InterviewService.updateInterview(
        { is_active: updatedIsActive },
        resolvedParams.interviewId,
      );
      toast.success("Interview status updated", {
        description: `The interview is now ${updatedIsActive ? "active" : "inactive"}.`,
        position: "bottom-right",
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "Failed to update the interview status.",
        duration: 3000,
      });
    }
  };

  const handleThemeColorChange = async (newColor: string) => {
    try {
      await InterviewService.updateInterview(
        { theme_color: newColor },
        resolvedParams.interviewId,
      );
      toast.success("Theme color updated", {
        position: "bottom-right",
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "Failed to update the theme color.",
        duration: 3000,
      });
    }
  };

  const openSharePopup = () => setIsSharePopupOpen(true);
  const closeSharePopup = () => setIsSharePopupOpen(false);

  const handleColorChange = (color: { hex: string }) => setThemeColor(color.hex);
  const applyColorChange = () => {
    if (themeColor !== iconColor) {
      seticonColor(themeColor);
      handleThemeColorChange(themeColor);
    }
    setShowColorPicker(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80%] w-full">
        <LoaderWithText />
      </div>
    );
  }

  if (resolvedSearchParams.edit) {
    return <EditInterview interview={interview} />;
  }

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* Top bar — interview-management controls (kept from the original page) */}
      <div className="flex flex-row p-3 pt-4 justify-center gap-6 items-center sticky top-2 bg-white z-10 border-b border-slate-100">
        <div className="font-bold text-md">{interview?.name}</div>
        <div
          className="w-5 h-5 rounded-full border-2 border-white shadow"
          style={{ backgroundColor: iconColor }}
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-transparent shadow-none relative text-xs text-indigo-600 px-1 h-7 hover:scale-110 hover:bg-transparent"
                variant={"secondary"}
                onClick={(event) => {
                  event.stopPropagation();
                  openSharePopup();
                }}
              >
                <Share2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-300" side="bottom" sideOffset={4}>
              <span className="text-black flex flex-row gap-4">Share</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-transparent shadow-none text-xs text-indigo-600 px-0 h-7 hover:scale-110 relative"
                onClick={(event) => {
                  event.stopPropagation();
                  seeInterviewPreviewPage();
                }}
              >
                <Eye />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-300" side="bottom" sideOffset={4}>
              <span className="text-black flex flex-row gap-4">Preview</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-transparent shadow-none text-xs text-indigo-600 px-0 h-7 hover:scale-110 relative"
                onClick={() => setShowColorPicker((s) => !s)}
              >
                <Palette size={19} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-300" side="bottom" sideOffset={4}>
              <span className="text-black flex flex-row gap-4">Theme Color</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-transparent shadow-none text-xs text-indigo-600 px-0 h-7 hover:scale-110 relative"
                onClick={() =>
                  router.push(`/interviews/${resolvedParams.interviewId}?edit=true`)
                }
              >
                <Pencil size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-300" side="bottom" sideOffset={4}>
              <span className="text-black flex flex-row gap-4">Edit</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="inline-flex cursor-pointer">
          {currentPlan === "free_trial_over" ? (
            <span className="ms-3 my-auto text-sm">Inactive</span>
          ) : (
            <>
              <span className="ms-3 my-auto text-sm">
                {isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={isActive}
                className={`ms-3 my-auto ${isActive ? "bg-indigo-600" : "bg-[#E6E7EB]"}`}
                onCheckedChange={handleToggle}
              />
            </>
          )}
        </div>
      </div>

      {/* Inline color picker popover */}
      {showColorPicker && (
        <div className="absolute right-8 top-16 z-50 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <ChromePicker color={themeColor} onChange={handleColorChange} />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowColorPicker(false)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={applyColorChange}
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* New dashboard — replaces the original 3-pane body */}
      <FeedbackDashboard
        interview={interview}
        responses={responses as any}
      />

      {/* Share popup */}
      {isSharePopupOpen && (
        <SharePopup
          open={isSharePopupOpen}
          onClose={closeSharePopup}
          shareContent={
            interview?.readable_slug
              ? `${window.location.origin}/call/${interview.readable_slug}`
              : (interview?.url as string)
          }
        />
      )}
    </div>
  );
}

export default InterviewHome;
