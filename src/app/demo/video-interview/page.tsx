"use client";

/**
 * /demo/video-interview
 * ---------------------
 * Two parts:
 *   1. A live "candidate" screen that runs the VideoInterviewLayer
 *      against the user's webcam. Try it: click Start, then walk away
 *      from the camera and watch the face-presence signal drop.
 *   2. A read-only VideoPlayerCard showing how a finished recording
 *      looks in the feedback dashboard.
 */

import Link from "next/link";
import { ArrowLeft, Mic, Video } from "lucide-react";
import { useRef, useState } from "react";
import {
  VideoInterviewLayer,
  type VideoInterviewLayerHandle,
  VideoPlayerCard,
} from "@/components/enhanced/video-interview/VideoInterviewLayer";
import { Card } from "@/components/enhanced/shared/primitives";
import { Button } from "@/components/ui/button";

export default function VideoInterviewDemo() {
  const [active, setActive] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const handleRef = useRef<VideoInterviewLayerHandle | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All demos
          </Link>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
            Optional
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            AI video interviews
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            A parallel video stream, not a replacement
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            FoloUp's voice call stays on Retell. This adds a camera track
            that records locally, ready to upload to object storage at the
            end of the call. The result is a richer review surface for
            higher-stakes loops without rearchitecting the audio pipeline.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Video className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Candidate screen (live)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click start to grant camera access. Walk away to see the
                    face-presence dip.
                  </p>
                </div>
              </div>
              {!active ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setActive(true)}
                >
                  Start recording
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const result = await handleRef.current?.stop();
                    if (result) {
                      setRecordingUrl(result.url);
                    }
                    setActive(false);
                  }}
                >
                  Stop & finalize
                </Button>
              )}
            </div>

            <div className="mt-4">
              <VideoInterviewLayer
                active={active}
                handleRef={handleRef}
                onRecordingComplete={(info) => {
                  setRecordingUrl(info.url);
                  setDuration(info.durationSeconds);
                }}
              />
            </div>
          </Card>

          <Card className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Mic className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Audio call (unchanged)
                </p>
                <p className="text-[11px] text-slate-500">
                  The Retell voice call is unchanged — this layer is purely
                  additive.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                AI Interviewer · Explorer Lisa
              </p>
              <p className="mt-2 text-sm italic text-slate-700">
                "Walk me through a project where you had to learn a new
                technology quickly. How did you approach it?"
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
                  Mic · live
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
                  Retell SDK
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">Design note</p>
              <p className="mt-1">
                We deliberately do not stream the video live. The MediaRecorder
                records in 5-second chunks to memory; on call end, you upload
                to S3 / Supabase via signed URLs. This keeps infra costs flat
                regardless of interview length.
              </p>
            </div>
          </Card>
        </div>

        <h2 className="mt-10 text-lg font-bold text-slate-900">
          What the reviewer sees
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          The same video layer surfaces in the feedback dashboard as a
          recording card. Click play to scrub through the interview.
        </p>

        <div className="mt-4">
          <VideoPlayerCard
            src={recordingUrl}
            candidateName="Aanya Sharma"
            durationSeconds={duration || 480}
            facePresencePct={98}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <DesignNote
            title="Why a parallel video track"
            body="Retell is excellent at low-latency voice. Rewriting the call pipeline for video would be a 4-week project with a real risk to the existing audio quality. Adding a separate MediaRecorder track is one afternoon of work and zero risk to the audio call."
          />
          <DesignNote
            title="Local recording, deferred upload"
            body="The video is held in memory chunks until the call ends, then uploaded in one shot. This avoids needing a real-time video pipeline (WebRTC SFU, TURN servers) and keeps the architecture simple."
          />
          <DesignNote
            title="Plays well with anti-cheat"
            body="The same camera stream feeds the face-presence heuristic, so a candidate who walks away both gets an integrity signal *and* the reviewer can scrub the recording to see what happened."
          />
        </div>
      </main>
    </div>
  );
}

function DesignNote({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{body}</p>
    </Card>
  );
}
