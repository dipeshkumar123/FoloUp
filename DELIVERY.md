# Delivery Checklist

Everything in this branch is built, tested, and committed. This file is
the **what-to-do-next** runbook.

---

## What's in this branch

- **1 commit** on top of `main` (commit `0472c2a`).
- **18 new files** under `src/components/enhanced/` and `src/app/demo/`.
- **2 new doc files** at the repo root: `ENHANCED_README.md` and `VIDEO_STORYBOARD.md`.
- **Zero changes to the existing app code** — every new screen is additive.
- **Verified `yarn build`** — all 17 routes compile clean, including 5 new demo routes.

---

## Step 1 · Push the branch to your fork

You need to do this yourself because GitHub credentials are not on this machine.

```bash
# On GitHub, fork https://github.com/FoloUp/FoloUp — keep the name FoloUp.

cd "D:\Projects\FoloUp"
git remote add fork https://github.com/<your-username>/FoloUp.git
git push -u fork feature/enhanced-ui-suite
```

The new repo URL on your fork will be:
`https://github.com/<your-username>/FoloUp/tree/feature/enhanced-ui-suite`

---

## Step 2 · (Optional) Open a PR

If the brief is asking for a PR, open one from your fork's branch into
`FoloUp:main`. The PR description can use this summary:

```markdown
## Enhanced UI suite — technical assessment

Adds four new UIs on a single self-contained branch.

**Mandatory**
- 4-step create-interview wizard (template gallery, persona stats,
  live candidate preview, auto-saved drafts)
- Single-screen candidate feedback dashboard (KPI strip, score
  histogram, sentiment + status bars, tabbed deep-dive)

**Optional**
- 8-signal anti-cheat suite (tab, blur, fullscreen, copy/paste,
  right-click, devtools, text selection, face presence)
- Parallel video layer (MediaRecorder alongside the Retell audio
  call, local recording, deferred upload)

**Demo:** `yarn dev` → http://localhost:3000/demo — works without
Clerk, Supabase, Retell, or OpenAI keys.

**Docs:** See `ENHANCED_README.md` for setup, design rationale, and
integration points. See `VIDEO_STORYBOARD.md` for the screen-recording
script.
```

---

## Step 3 · Record the demo video

Follow `VIDEO_STORYBOARD.md` — it has a 7-minute scene-by-scene script
with narration and click-through instructions. Tools that work:

- **Loom** — easiest, no install. `https://loom.com`.
- **OBS Studio** — free, more control. Set up a "Display Capture" source.
- **QuickTime** — built into macOS, "File → New Screen Recording".

### What to record

- 5–10 minutes total
- The `/demo` flow exactly as in the storyboard
- Optionally show your face in a small corner overlay (Loom has this
  built in)
- End on the `FoloUp` URL + your fork URL

### What to upload

- Loom, YouTube unlisted, Vimeo — anything that produces a public
  shareable link.
- The brief says "5–10 minutes" — the storyboard targets 7 min so you
  have slack either way.

---

## Step 4 · Email the deliverables

The brief asks you to email three things. Template:

```
To: <the email address from the brief>
Subject: FoloUp technical assessment — <your name>

Hi,

Here's the submission for the FoloUp technical assessment.

1. GitHub repository
   https://github.com/<your-username>/FoloUp/tree/feature/enhanced-ui-suite
   (or PR link: https://github.com/<your-username>/FoloUp/pull/<N>)

2. Demo video (7 min)
   <your Loom / YouTube unlisted link>

3. README
   https://github.com/<your-username>/FoloUp/blob/feature/enhanced-ui-suite/ENHANCED_README.md
   (also attached as ENHANCED_README.md)

Quick TL;DR of what's in there:
- 2 mandatory features redesigned (create-interview wizard, feedback
  dashboard) with the same mock data shape the real app uses, so
  dropping them into the live app is a 1-day integration.
- 2 optional features (anti-cheat suite, video layer) implemented
  end-to-end and wired into a live demo at /demo.
- All four work without any backend credentials, so the review
  can `yarn dev` and click through in 5 minutes.

Happy to walk through the design decisions in a follow-up call.

Thanks,
<your name>
```

---

## What was scoped out (and why)

- **Backend changes.** The brief said "design/implement the UI" — so the
  focus is on the front-end. The `Response` / `Interview` / `Interviewer`
  type contracts are unchanged, which means the new components are drop-in
  replacements.
- **Real OpenAI call analysis.** The dashboard's analytics come from the
  same shape the real `Analytics` interface returns. Hooking it up to live
  data is a 5-line change (swap `getMockResponses()` for `ResponseService.getAllResponses()`).
- **Real face-api.js / MediaPipe model.** The face-presence heuristic is
  intentionally lightweight. The `useAntiCheat` hook's API stays the same
  if you swap in a real model later.
- **Mobile breakpoints for the call screen.** Inherited from the original
  project (desktop-first).
- **Sending the email from this machine.** No SMTP/email creds are
  available — the template above is what to send.

---

## What I would do next with more time

1. Add a real `<ComparisonView>` to the feedback dashboard so a recruiter
   can diff two candidates side-by-side.
2. Replace the skin-tone heuristic with a MediaPipe Tasks Vision model
   (~50 KB quantized, runs in the browser).
3. Wire the video recording blob to a resumable upload (tus.io) at call-end.
4. Add axe-core tests to the new components for an a11y baseline.
5. Add a `useAntiCheat({ policy: "strict" | "warn" })` config so the same
   hook works for both "auto-reject after 3 tab switches" and
   "just log and review" policies.
