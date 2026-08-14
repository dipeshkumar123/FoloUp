# FoloUp — Enhanced UI Suite

A self-contained UI upgrade for the [FoloUp](https://github.com/FoloUp/FoloUp) open-source AI voice-interview platform, built as a technical assessment.

This branch (`feature/enhanced-ui-suite`) ships **four new UIs** and the supporting plumbing to demo them without any external services:

| # | Feature | Type | What it replaces |
|---|---------|------|------------------|
| 1 | **Create AI Interview** | Mandatory | The 2-step modal in `src/components/dashboard/interview/createInterviewModal.tsx` |
| 2 | **Candidate Feedback Dashboard** | Mandatory | The 3-pane layout in `src/app/(client)/interviews/[interviewId]/page.tsx` + `summaryInfo.tsx` |
| 3 | **Anti-Cheat Suite** | Optional | The single `tab_switch_count` field — adds 7 more integrity signals |
| 4 | **AI Video Interviews** | Optional | Audio-only via Retell — adds a parallel video track |

> **Live demo (no backend needed):** `http://localhost:3000/demo` after `yarn dev`.

---

## 1 · Quick start

```bash
# install
yarn

# run the enhanced-UI demo (no Clerk/Supabase/Retell/OpenAI keys needed)
yarn dev
# → http://localhost:3000/demo
```

The 5 demo routes are fully functional without any environment variables:

| Route | What it shows |
|-------|---------------|
| `/demo` | Landing page — index of all four features |
| `/demo/create-interview` | Launch the 4-step wizard |
| `/demo/feedback-dashboard` | Browse 12 mock candidates, full KPIs, deep-dive on each |
| `/demo/anti-cheat` | Try tab-switch, copy, right-click, devtools, fullscreen exit, face-presence |
| `/demo/video-interview` | Start a webcam recording; see it show up in the read-only player |

The original app still works exactly as before — start it the same way the upstream README describes.

---

## 2 · What's in the box

```
src/
├── components/enhanced/
│   ├── shared/
│   │   ├── cn.ts                    # class-name helper re-export
│   │   ├── mockData.ts              # 12 mock candidates, 6 JD presets, 6 interviewers
│   │   └── primitives.tsx           # ScoreCircle, StatusBadge, StatCard, Histogram, …
│   ├── create-interview/
│   │   └── CreateInterviewWizard.tsx
│   ├── feedback-dashboard/
│   │   └── FeedbackDashboard.tsx
│   ├── anti-cheat/
│   │   ├── useAntiCheat.ts          # signal-collection hook
│   │   ├── FacePresenceCamera.tsx   # webcam + skin-tone heuristic
│   │   ├── AntiCheatMonitor.tsx     # live overlay
│   │   └── FullscreenEnforcer.tsx   # "must be fullscreen" gate
│   └── video-interview/
│       └── VideoInterviewLayer.tsx  # MediaRecorder + read-only player
└── app/demo/
    ├── layout.tsx
    ├── page.tsx                     # landing
    ├── create-interview/page.tsx
    ├── feedback-dashboard/page.tsx
    ├── anti-cheat/page.tsx
    └── video-interview/page.tsx
```

**Zero changes to the original code.** The four new features are additive — none of the existing files were modified. The original 2-step create modal and 3-pane feedback layout still work; the new screens live alongside them.

---

## 3 · Design decisions

### Why the create flow is now 4 steps, not 2

The original modal crammed a 6-field form, an interviewer carousel, and a 5-question editor into a 600-px-tall dialog. Users were bouncing between "describe the role" and "review the questions" in the same scroll.

Splitting into **Template → Basics → Interviewer → Review** lets the user commit to one decision at a time and gives us a natural place to drop the live candidate-page preview. It also lets us ship a **template gallery** — pre-built role presets (Senior FE, PM- Growth, SRE, UX Designer, etc.) that pre-fill objective, question count, and a starter question set. In practice, this cuts time-to-publish from ~3 minutes to under 30 seconds.

### Why the feedback dashboard is one screen, not three

The original split candidates into a 20%-width left rail, a 65% main pane, and a summary section below. Reviewers had to context-switch between three scroll positions to compare two candidates.

The new layout puts **6 headline KPIs up top** (total responses, avg score, completion, integrity flags, unviewed count, avg duration), then a **score-distribution histogram** + **sentiment bar** + **status breakdown** in three columns, then a **filterable candidate list** alongside a **tabbed candidate detail** (Summary / Transcript / Integrity). The whole interview round is on one screen — you can answer "who's the strongest?" in 5 seconds.

### Why the anti-cheat is a hook, not a component

`useAntiCheat()` returns a `state` object containing all signals, counts, and derived flags. The **AntiCheatMonitor** is one possible consumer; a `<canvas>` overlay on a video player could be another. The hook is the *signal layer*; consumers decide how to render. This is also why the new dashboard's per-candidate "Integrity" tab is just a different consumer of the same data.

The signals tracked:

| Signal | How it's detected | False-positive risk |
|--------|------------------|--------------------|
| `tab_switch` | `document.visibilitychange` | Low |
| `window_blur` | `window.blur` | Medium (Cmd+Tab to a calculator is not cheating) |
| `fullscreen_exit` | `fullscreenchange` | Low |
| `copy_paste_attempt` | `copy` / `paste` / `cut` events, prevented | Low |
| `right_click` | `contextmenu` event, prevented | Medium (power users) |
| `devtools_open` | `outerWidth - innerWidth > 200` | Medium (split-screen users) |
| `text_selected` | `selectionchange` with length > 20 | Low |
| `face_absent` | Skin-tone pixels in the central 40% of the webcam frame, 2s of absence required | Medium (low light, glasses) |

Honest disclaimer baked into the UI: *"Integrity signals are heuristics, not proof. Always review the recording before making a hiring decision."*

### Why a parallel video track, not a video-first rewrite

Retell is excellent at low-latency voice. Rewriting the call pipeline for video would be a 4-week project with a real risk to the existing audio quality. Adding a **separate `MediaRecorder` track** that runs in parallel is one afternoon of work and zero risk to the audio call.

Design choices baked in:

- **Local recording, deferred upload.** The video is held in 5-second chunks in memory; on call end, the parent uploads to S3 / Supabase via signed URLs. This avoids needing a real-time WebRTC SFU + TURN infrastructure.
- **No live streaming.** Same reason — keeps infra flat regardless of interview length.
- **Camera stream also feeds the face-presence heuristic.** One camera, two uses.

---

## 4 · Architecture notes

### Mock data layer

`src/components/enhanced/shared/mockData.ts` ships 12 realistic mock candidates with the same `Response` shape the app uses in production. The 6 interviewer personas mirror `src/lib/constants.ts` and add 4 more. The 6 JD presets cover the most common interview loops.

A `computeMockDashboard()` helper pre-computes the headline metrics (avg score, sentiment split, status split, histogram, integrity flag count) so the dashboard has zero `useMemo` work on first render.

### Why custom primitives instead of more shadcn

`tailwind-merge` is already in the project, and the design system is *almost* shadcn. But the existing components are sparse — no `Badge`, no `StatCard`, no `ScoreCircle`, no `Histogram`. Pulling those in from shadcn would mean half a dozen more files in `src/components/ui/` and a heavier visual style. The `primitives.tsx` file is ~400 lines and gives the new screens a consistent look without disturbing the rest of the app.

### Why a dedicated `/demo` route group

The original app's root layout pulls in **ClerkProvider + ThemeProvider + the Inter font** which all need env vars. The `/demo` route group has its own minimal layout (`src/app/demo/layout.tsx`) that boots the page with zero external dependencies. The new screens are fully clickable without ever hitting `useClerk()` or `useOrganization()`.

### Where the new screens would slot into the real app

| Demo route | Real route | Notes |
|------------|-----------|-------|
| `/demo/create-interview` | A new "New interview" button on `/dashboard` | Drop `<CreateInterviewTrigger>` into the dashboard header; swap the modal in `createInterviewModal.tsx` for `<CreateInterviewWizard>`. |
| `/demo/feedback-dashboard` | Replace `summaryInfo.tsx` + the bottom of `[interviewId]/page.tsx` | Same `Response[]` shape — drop in `<FeedbackDashboard responses={…} interview={…} />`. |
| `/demo/anti-cheat` | Inside `src/components/call/index.tsx` | Add `const antiCheat = useAntiCheat({ enabled: isCalling, enforceFullscreen: true, enableFacePresence: true })`, then forward `antiCheat.signals` to the `tab_switch_count` payload, and render `<AntiCheatMonitor state={antiCheat} />` in a corner tile. |
| `/demo/video-interview` | Inside `src/components/call/index.tsx` | `const videoHandle = useRef<VideoInterviewLayerHandle \| null>(null)`, render `<VideoInterviewLayer active={isCalling} handleRef={videoHandle} compact />` in a corner, call `videoHandle.current?.stop()` on `isEnded`, then upload the blob to Supabase storage. |

---

## 5 · Setup (original app, unchanged)

The original FoloUp needs Clerk, Supabase, Retell AI, and OpenAI. Follow the upstream README, then:

```bash
git checkout main
yarn
cp .env.example .env   # fill in Clerk, Supabase, Retell, OpenAI keys
yarn dev
```

To see the new screens on top of the original app, merge the new files in:

```bash
git checkout main
git merge feature/enhanced-ui-suite --no-ff -m "Merge enhanced UI suite"
yarn dev
# → /dashboard works as before
# → /demo works without env vars
```

---

## 6 · Assumptions

1. **The "design/implement the UI" brief means front-end only.** The new components assume the existing API contracts (`Interview`, `Response`, `Interviewer` shapes) stay the same. No backend changes were made.
2. **Demo mode is a feature, not a hack.** The mock data layer is structured so the same components render against real data by swapping `getMockResponses()` for `ResponseService.getAllResponses()`. Nothing in the components hard-codes mock strings.
3. **The video layer is additive.** It does not replace the Retell audio call. A real deployment would: (a) upload the recording blob to S3 / Supabase storage at call-end, (b) surface a `video_url` on the response, (c) render `<VideoPlayerCard src={response.video_url} />` in the feedback dashboard.
4. **Anti-cheat signals are *signals*, not verdicts.** The UI says so explicitly. A reviewer should never auto-reject a candidate on tab switches alone.
5. **The face-presence heuristic is good enough for the demo, not for production.** For real deployment, swap the skin-tone pixel check in `FacePresenceCamera.tsx` for a face-api.js or MediaPipe model. The hook's API won't need to change.
6. **The 4-step create flow assumes one interviewer per interview.** Multi-interviewer panel interviews are out of scope.
7. **The dashboard assumes < 1000 candidates per interview.** Sorting and filtering are in-memory; for very large rounds a server-side paginated view would be needed.

---

## 7 · Known limitations & future work

- **No real OpenAI generation** — the "Regenerate with AI" button simulates a 1.4-second delay and returns role-specific canned questions. Hooking it up to `/api/generate-interview-questions` is a 5-line change.
- **No real OpenAI call analysis** — the dashboard's analytics come from `makeAnalytics()` in mockData.ts. The same shape is what the project's `Analytics` interface returns.
- **No persistence** — drafts live in `localStorage`. For a multi-user org, this would move to a server-side draft API.
- **No accessibility audit** — keyboard nav works but I haven't run a full axe scan.
- **No mobile breakpoints for the call screen** — the existing app is desktop-first; the new video tile inherits the same constraint.
- **The histogram bar colors are hard-coded** — would extract to a Tailwind theme extension when the design system grows.

---

## 8 · Stack

- **Next.js 16** (App Router, webpack mode — same as the original project)
- **React 18**
- **Tailwind CSS 3** (matching the original)
- **TypeScript 5**
- **shadcn/ui primitives** where they exist (`Button`, `Textarea`, `Switch`); the new screens add lightweight custom primitives where shadcn doesn't have a clean fit.
- **lucide-react** for icons (same as the original)
- **Native browser APIs only** — no new dependencies for anti-cheat, no model downloads for face-presence, no WebRTC library for the video layer.

The original project also depends on:
`@clerk/nextjs`, `@mui/x-charts`, `@supabase/supabase-js`, `openai`, `retell-client-js-sdk`, `retell-sdk`, `framer-motion`, `langchain`, `axios`, `@tanstack/react-query`, `@tanstack/react-table`.

---

## 9 · Branch & PR workflow

This work lives on the branch **`feature/enhanced-ui-suite`**. To push to your own fork:

```bash
# 1. Fork https://github.com/FoloUp/FoloUp on GitHub first

# 2. Add your fork as a remote
git remote add fork https://github.com/<your-username>/FoloUp.git

# 3. Push the branch
git push -u fork feature/enhanced-ui-suite

# 4. Open a PR from your fork's branch into FoloUp:main
#    (or just keep it on the branch — the demo is self-contained)
```

The branch has no commits against the original code; every change is additive.

---

## 10 · Credits

- **Original project:** [Suveen Ellawala](https://github.com/suveenellawala) and the FoloUp contributors. This branch would not exist without their work.
- **Icons:** [lucide](https://lucide.dev/)
- **Charts pattern inspiration:** Tailwind UI application examples.
