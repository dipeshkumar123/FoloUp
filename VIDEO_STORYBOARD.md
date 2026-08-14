# Demo Video Storyboard

A 7-minute screen-recorded walkthrough of the enhanced UI suite.
Read this top-to-bottom once, then screen-record yourself going through the
actions in each scene.

**Target length:** 7:00 (5–10 min range allowed)
**Tools:** `yarn dev` already running, OBS / Loom / QuickTime, your face optionally in a corner

---

## Pre-roll (0:00 – 0:25) — 25 sec

**On screen:** Repo `ENHANCED_README.md` open in your editor, scrolled to the
"What's in the box" diagram. Then switch to the `/demo` landing page.

**Say:**

> "Hi, this is the demo of my technical assessment on the FoloUp project.
> I built four new UIs on a single feature branch — `feature/enhanced-ui-suite`.
> Two of them are mandatory: a redesigned Create Interview flow and a
> new Candidate Feedback Dashboard. Two are optional: a full anti-cheat
> suite and a parallel video layer for the interview. The whole thing
> works without Clerk, Supabase, Retell, or OpenAI keys — let me show
> you."

**Action:** Click the "Create AI Interview" card on `/demo`.

---

## Scene 1 (0:25 – 2:20) — 1 min 55 sec

**On screen:** `/demo/create-interview`. Click "New AI interview".

### Step 1 — Template gallery (~25 sec)

> "The original create flow was a 2-step modal that crammed six fields
> and a question editor into a 600-pixel dialog. I split it into four
> focused steps."

Click the **"Senior Frontend Engineer"** template.

> "Pre-built templates pre-fill the role, objective, and a starter set of
> questions. The recruiter only has to review and tweak."

### Step 2 — Basics (~30 sec)

Click **Continue**.

> "Step two is the basics — role name, objective, question count, and
> duration. The sliders are bound to a small numeric readout so you can
> see exactly what you're picking. Note the integrity-check callout on
> the right — it's a preview of what the candidate will see."

Click **Continue** without editing anything (the template already filled it in).

### Step 3 — Interviewer (~35 sec)

> "Step three is the interviewer picker. Each persona shows its
> rapport, exploration, empathy, and pace scores, plus a description.
> The original just had a tiny avatar carousel with no info."

Click **Strategic Maya** to show the selection state. Then re-select **Explorer Lisa**.

Click **Continue**.

### Step 4 — Review & share (~25 sec)

> "The last step has the questions and description on the left, and a
> live candidate-side preview on the right. Toggle to 'Summary' to see
> the predicted reach and a config check."

Click **"Summary"** toggle, then back to **"Candidate"**.

Click **"Publish & generate link"**.

> "On publish we generate a shareable URL. The wizard auto-saves the
> draft to localStorage so a recruiter can come back later and finish."

Show the published card with the link. Click **"Copy link"**.

**End scene:** Close the wizard.

---

## Scene 2 (2:20 – 4:30) — 2 min 10 sec

**On screen:** Click the back-arrow to return to `/demo`, then click
**"Candidate Feedback Dashboard"**.

### Top KPIs (~30 sec)

> "The original dashboard buried the headline numbers inside pie charts.
> Here they are at the top: total responses, average overall score,
> completion rate, and integrity flags. A hiring manager can scan
> this in five seconds and know if they need to dig deeper."

Slow pan across the KPI strip. Hover over the **integrity flags** card.

### Distribution row (~30 sec)

> "Below the KPIs: a score distribution histogram, a sentiment split,
> and a candidate-status breakdown. The histogram in particular makes
> bimodal outcomes — a strong top-of-pile vs. a weak bottom —
> immediately visible. That's exactly the signal recruiters want when
> comparing two interview rounds."

### Candidate list (~40 sec)

> "Then the candidate list with filter pills for status, a search box,
> and a sort menu. Click on a candidate to see the deep-dive."

Click **"Selected"** filter, then **"All"**.

Sort by **"Overall score"**, then by **"Most recent"**.

### Candidate deep-dive (~30 sec)

Click on **Aanya Sharma** in the list.

> "The detail panel has three tabs. Summary is the AI's overall
> feedback, soft-skill summary, and a video recording if there is
> one. Transcript shows the actual exchange. Integrity surfaces
> tab switches, face presence, and a timeline."

Click on **"Integrity"** tab. Then click on **Diego Alvarez** to show a
flagged candidate with the red warning banner.

> "Notice the integrity flag on Diego — five tab switches and 70%
> face presence. The UI is honest about it: 'integrity signals are
> heuristics, not proof — always review the recording.'"

Click on **"Transcript"** tab, then back to **"Summary"**.

---

## Scene 3 (4:30 – 6:10) — 1 min 40 sec

**On screen:** Back to `/demo`, click **"Anti-Cheat Suite"**.

### Sandbox setup (~20 sec)

> "The original app only tracked tab switches. I added a hook that
> collects eight different signals and a live monitor that surfaces
> them. Try the sandbox to see each one fire."

Click **"Start sandbox"**.

### Fullscreen enforcer (~20 sec)

Click **"Enter fullscreen"** at the top of the sandbox.

> "The fullscreen enforcer pulls the candidate back in if they leave.
> In the real app this would be hard-required to start the call."

Press **Esc** to leave fullscreen — show the enforcer reappearing. Click **"Enter fullscreen"** again.

### Begin interview + camera (~25 sec)

Click **"Begin interview"**.

> "Once the interview starts, we ask for camera access. The webcam
> feed is mirrored so the candidate can see themselves, and the
> skin-tone heuristic in the centre 40% of the frame is the face-
> presence signal."

Move off-screen (or cover the camera) for 3 seconds, then come back.

> "Walk away and the face-presence signal dips. Step back and it
> recovers. The same camera stream also feeds the recording that
> the reviewer sees later."

### Trigger every signal (~30 sec)

> "The right column lists every signal we track. Let's fire a few."

Try to **select** the paragraph in the sample text. Show the "Long text selection" signal.

Press **Cmd+C** or **Ctrl+C** (after selecting something). Show the "Copy / paste attempt" signal.

**Right-click** anywhere on the page. Show the "Right-click" signal.

Open **devtools** (F12 or Cmd+Opt+I). Show the "DevTools open" signal.

> "And the integrity monitor on the right shows the live state of
> each signal — green when nothing's happening, red when something
> is. The reviewer watches this in real time, and the recruiter
> sees the accumulated count in the dashboard."

**End scene:** Leave devtools open, click back-arrow to `/demo`.

---

## Scene 4 (6:10 – 6:55) — 45 sec

**On screen:** `/demo`, click **"AI Video Interviews"**.

Click **"Start recording"**.

> "The video layer is additive — it does not replace the Retell
> audio call. The MediaRecorder captures the camera locally in
> 5-second chunks, ready to upload to S3 or Supabase storage at
> the end of the call."

Walk away from the camera for a second, then come back.

> "Same camera stream, two consumers: the recording, and the face-
> presence heuristic we saw earlier."

Click **"Stop & finalize"**.

> "When the call ends, the recruiter gets a recording card right
> here in the feedback dashboard. Click play to scrub the
> interview."

**End scene:** Show the VideoPlayerCard playing the recording.

---

## Wrap (6:55 – 7:15) — 20 sec

**On screen:** Back to `/demo` landing page.

> "That's the four new UIs. Two of them are mandatory features
> from the brief, two are optional. The code lives in one branch,
> the demos work without any backend keys, and the README has
> the design rationale and the steps to merge it into the main
> app. Thanks for watching — happy to answer any questions."

**Action:** Fade out / end recording.

---

## Recording tips

- **Audio:** A USB mic 4–6 inches from your mouth. Quiet room. No fan noise.
- **Resolution:** 1920×1080. Browser zoom at 100%.
- **Browser:** Chrome. Open one tab. Hide bookmarks bar. Use a clean profile.
- **Devtools open during recording:** if you want devtools visible in the anti-cheat scene, drag it out into a separate window first.
- **Webcam permission popup:** click "Allow" before you start scene 3, so it doesn't appear on camera.
- **Final cut:** trim "ums" and any reloads. Add a title card with the repo URL in the first 3 seconds.

## Fallback: animated walkthrough

If you can't record a voiceover, render a screen recording without audio and
add AI narration in post using the `batch_synthesize_speech` tool with this
script. The voice settings (voice_id `female-shaonv` or `male-qn-jingying`,
speed 0.95) work well for a "tech product walkthrough" tone.
