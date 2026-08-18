# FoloUp — Technical Assessment Video Walkthrough (5–10 min)

This guide walks you through recording a **5–10 minute** demo video of the **real FoloUp application** for The Jobs Jungle technical assessment — not the `/demo/*` pages. Every step below uses the actual routes and real data flowing through Supabase, Retell, and the candidate-facing call screen.

---

## 🎬 Before You Record

### 1. Prerequisites (real app)
- ✅ Environment variables configured (`.env` — Clerk, Supabase, Retell, OpenAI)
- ✅ Local dev server running: `yarn dev`
- ✅ A Clerk account signed in (you'll see the **Dashboard**)
- ✅ At least **one real interview & one real response** already in Supabase (so the Feedback Dashboard has data to show)
- ✅ Webcam + microphone (for the video / face-presence segment)
- ✅ Screen recorder: **OBS Studio** (recommended)

### 2. Recording Settings (OBS)
| Setting | Value |
|---------|-------|
| Canvas | 1920×1080 (1080p) |
| FPS | 30 |
| Bitrate | 6000–8000 Kbps (CBR) |
| Audio | Microphone |
| Format | MP4 (via remux) or MKV |

---

## 📋 Script — Real-Application Walkthrough

### Part 1: Introduction (0:00 – 0:45)
> _"Hi, I'm [name]. This is my submission for The Jobs Jungle technical assessment on the FoloUp repository. I analysed the existing codebase and implemented two mandatory features — a **Create AI Interview** wizard and a **Candidate Feedback Dashboard** — plus two optional enhancements: **anti-cheat monitoring** and **AI-powered video interviews**. Both mandatory features are integrated directly into the real dashboard, and both optional features run live inside the candidate call screen."*

**On screen:**
- Show the fork of `github.com/FoloUp/FoloUp`.
- Open the real app URL: `http://localhost:3000/dashboard` (logged in via Clerk).

---

### Part 2: Create AI Interview — Real Dashboard Integration (0:45 – 3:30) ⭐ Mandatory #1

> _"The first mandatory feature is the Create AI Interview flow. It's integrated into the real dashboard — the **+ Create Interview** card opens the new 4-step wizard."*

**On screen (`/dashboard`):**
1. Point to the **"My Interviews"** grid.
2. Click the **"+ Create Interview"** card — the enhanced 4-step wizard opens as a modal.

**Step 1 — Template gallery**
- Show the **template grid**: "Start from scratch" + 6 role presets (Frontend, Data Science, Design, etc.).
- Pick a preset (e.g. **Senior Frontend Engineer**) — it pre-fills the objective + suggested questions.

**Step 2 — Interview basics**
- Show the name & objective fields (pre-filled).
- Drag the **questions** (3–10) and **duration** (3–15 min) sliders.
- Show the **privacy toggle** (collect name/email vs anonymous).
- Mention the **integrity checks** callout: tab-switches, fullscreen, copy-paste, face-presence are tracked automatically.

**Step 3 — Choose AI interviewer**
- Show the **persona cards** (rapport / exploration / empathy / pace bars).
- Pick one (e.g. **Aisha**).

**Step 4 — Review & publish**
- Show the **editable question list** — click **"Regenerate with AI"** to see adaptive questions based on the objective.
- Show the **live candidate preview** (exact page candidates will see).
- Click **Publish** — the interview is created via `/api/create-interview` and saved to Supabase.

**Back on `/dashboard`:**
- The new interview appears in the **"My Interviews"** grid — real data, persisted in Supabase.

**Design decisions to mention:**
- `CreateInterviewWizard` is mounted from `CreateInterviewCard` — replaces the old 2-step modal without changing the surrounding dashboard.
- Draft auto-saves to `localStorage`.
- The live candidate preview shows the candidate exactly what they'll get.

---

### Part 3: Candidate Feedback Dashboard — Real Interview Page (3:30 – 6:00) ⭐ Mandatory #2

> _"The second mandatory feature is the Candidate Feedback Dashboard. It's mounted on the real per-interview page — `/interviews/[interviewId]` — and renders actual responses fetched from Supabase via the responses service."*

**On screen:**
1. Back on `/dashboard`, click the interview card you just created → navigates to `/interviews/[interviewId]`.
2. The **top bar** (Share / Preview / Theme color / Edit / Active toggle) remains from the original page — show it.
3. Below, the **enhanced FeedbackDashboard** replaces the old 3-pane layout:

**KPI strip**
- Total candidates, average score, shortlisted count, talk-to-listen ratio, etc. — computed from real `Response` records.

**Analytics**
- **Score histogram** — where candidates cluster.
- **Status breakdown** (Selected / Potential / Not selected).
- **Communication / sentiment** bars.

**Candidate table**
- Sort by score / duration / recency / name.
- Filter by status.
- Search box.

**Per-candidate deep-dive (click one)**
- **Summary tab:** score circle, strengths chips, duration.
- **Transcript tab:** full interview transcript.
- **Integrity tab:** the real anti-cheat signal log + face-presence % — persisted from the candidate's call.

**Design decisions to mention:**
- `FeedbackDashboard` receives `responses` from `ResponseService.getAllResponses(interviewId)` — same data source the old 3-pane layout used, just presented better.
- Color-coded status badges follow the existing Tailwind design language.
- The top-bar interview-management controls were intentionally kept (they belong to the management surface).

---

### Part 4: (Optional) Anti-Cheat — Real Candidate Call Screen (6:00 – 7:15)

> _"The first optional enhancement is the anti-cheat suite. It runs during the **real** candidate call at `/call/[interviewId]` — the public link candidates receive."*

**On screen:**
1. Click **Share** (top bar) → copy the real share link, or open the preview page.
2. Open `/call/[interviewId]` in a **separate incognito window**.
3. Enter email + name → click **Start Interview** (fullscreen is requested automatically).

**In-call demo (one at a time):**
1. **Look at the camera** → the integrity monitor's **Face** tile shows ~100%, camera badge says **"Face OK"**.
2. **Look away 3+ seconds** → Face tile flips to **"Missing"**, a `face_absent` signal is logged.
3. **Return to camera** → percentage recovers.
4. **Alt-Tab / switch tab** → the **"Warning: Tab Switching"** dialog appears.
5. **Exit fullscreen** → the monitor's **Fullscreen** tile turns red (FullscreenEnforcer nudges back in).
6. **Right-click** / copy text → `right_click` / `copy_paste_attempt` signals logged.

**Explain the architecture:**
- `useAntiCheat()` — single hook tracking 9 signal types (tab, blur, fullscreen, copy/paste, right-click, DevTools, text selection, face absence, screenshot).
- `FacePresenceCamera` — YCbCr skin-tone heuristic (Hsu 2002) that runs every 600ms on the shared video stream; no model download.
- On call end, `ResponseService.saveIntegrity()` persists `integrity_signals` + `face_presence_pct` to Supabase — exactly what appears in the Feedback Dashboard's **Integrity tab** (ties both mandatory features together).

---

### Part 5: (Optional) AI-Powered Video Interviews — Real Call Screen (7:15 – 8:15)

> _"The second optional enhancement upgrades the audio-only call to an **AI video interview** — without replacing the existing Retell voice pipeline."*

**On screen (same `/call/[interviewId]` window):**
1. The **camera preview tile** appears in the top-right corner with a live feed and a **REC badge**.
2. Explain: `VideoInterviewLayer` acquires the camera (shared with face detection — no second `getUserMedia`), mirrors the preview, and runs a `MediaRecorder` that emits 5-second chunks.
3. Toggle the **Camera On/Off** button.
4. **End the interview** → the `persistCallEnd` effect uploads the blob to **Supabase Storage** via `StorageService.uploadInterviewVideo()` (best-effort).

**Back on `/interviews/[interviewId]`:**
- The response now has a **video URL** — open the candidate's deep-dive and play the **recorded video** in the VideoPlayerCard, alongside the face-presence % badge.

**Explain the architecture:**
- Runs parallel to the Retell audio call (zero disruption to the voice pipeline).
- Recording bytes go to Supabase Storage, the public URL is stored on the response row.
- `VideoPlayerCard` in the dashboard lets reviewers watch the interview with the integrity data side-by-side.

---

### Part 6: Recap & Outro (8:15 – 9:00)
> _"To recap — both mandatory features are integrated into the real application: the Create AI Interview wizard on the dashboard, and the Candidate Feedback Dashboard on the per-interview page. The two optional enhancements run live inside the candidate call: the anti-cheat suite tracks 9 signal types and face-presence, and the video layer records the interview for review. All data flows through the real Supabase schema, and everything is fully typed following the project's existing patterns."*

| Deliverable | Real route |
|-------------|-----------|
| Create AI Interview | `/dashboard` → "+ Create Interview" card |
| Candidate Feedback Dashboard | `/interviews/[interviewId]` |
| Anti-Cheat Suite | `/call/[interviewId]` (candidate call screen) |
| AI Video Interviews | `/call/[interviewId]` + review in `/interviews/[interviewId]` |
| Component source | `src/components/enhanced/` |
| Candidate call integration | `src/components/call/index.tsx` |

- End with: *"Thank you for reviewing my submission — I'd be happy to walk through the implementation in the technical discussion."*

---

## 🎥 Post-Production Checklist

- [ ] Trim the start/end silence.
- [ ] Blur / hide any personal data (real emails, names) if using production data.
- [ ] If the call agent doesn't connect (Retell key missing), pause and start a screen-recording timer so you can trim it later.
- [ ] Export at 1080p, H.264, ~8 Mbps.
- [ ] Upload to YouTube / Loom (unlisted) and paste the link in your email.

---

## ⚠️ Common Gotchas (Real App)

| Gotcha | Workaround |
|--------|-----------|
| Retell call won't connect | Requires a valid Retell API key + interviewer with audio. If unavailable, demo the anti-cheat UI with the camera tile / in-call monitor only. |
| Feedback Dashboard empty | Create a test response in Supabase (or run a call first) so the dashboard has data to show. |
| Fullscreen denied | Browser must receive the request from a user gesture — click **Start Interview** directly (don't await an API first). |
| Camera permission | Allow in the browser; close Zoom/OBS if they're holding the webcam. |
| Face shows "No face" | Ensure good lighting and face fills ~20–30% of the frame center. |

---

## 📁 Files Referenced in This Demo

| File | Role |
|------|------|
| `src/components/enhanced/create-interview/CreateInterviewWizard.tsx` | 4-step wizard (mounted by `CreateInterviewCard`) |
| `src/components/dashboard/interview/createInterviewCard.tsx` | Real dashboard integration point for the wizard |
| `src/components/enhanced/feedback-dashboard/FeedbackDashboard.tsx` | Real per-interview dashboard (mounted in `/interviews/[interviewId]`) |
| `src/app/(client)/interviews/[interviewId]/page.tsx` | Real route that mounts the FeedbackDashboard with real responses |
| `src/components/enhanced/anti-cheat/useAntiCheat.ts` | 9-type signal hook |
| `src/components/enhanced/anti-cheat/FacePresenceCamera.tsx` | YCbCr face-presence detector (no model) |
| `src/components/enhanced/anti-cheat/AntiCheatMonitor.tsx` | Live integrity panel |
| `src/components/enhanced/video-interview/VideoInterviewLayer.tsx` | Parallel video stream + MediaRecorder chunks |
| `src/components/call/index.tsx` | Candidate call screen — integrates anti-cheat + video + wizard output |
| `src/app/(user)/call/[interviewId]/page.tsx` | Real public candidate route |

---

**Total expected runtime: ~9 minutes.** 🎬