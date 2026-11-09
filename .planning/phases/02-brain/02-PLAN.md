# Phase 2 Plan — The Brain (Gemini Coaching & Streaming)

**Project:** HinglishCS Coach [HCSC]  
**Phase:** 02 — brain  
**Goal:** Pass the STT transcript and DSA topic to Gemini; stream the structured scorecard feedback into the UI terminal letter-by-letter.  
**Date:** 2026-11-09  

---

## Task 1 — System Prompt & Coaching Instructions Module

> Define the strict system prompt for the CS Technical Interview Coach, enforcing dynamic Hinglish/English language matching and the structured scorecard format.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\services\coachingPrompt.js`.

This module defines the system prompt and instructions for the Gemini evaluation model.

**Requirements:**
1. Persona: Senior Technical Interviewer & CS Mentor specializing in Data Structures & Algorithms.
2. Dynamic Language Matching:
   - If the student speaks Hinglish/Hindi, respond in warm, constructive, natural Hinglish (*"Aapka logic overall sahi hai, par..."*).
   - If the student speaks English, respond in professional technical English.
   - All code symbols, Big-O notations, data structure names remain in standard English monospace.
3. Structured Output Format:
   Must strictly emit Markdown with these exact sections:
   - `### 🎙️ Verbal Summary` (1-2 spoken sentences summarizing the attempt — designed to bridge to Phase 3 TTS)
   - `### 📊 Score: X / 10` (numeric grade based on logic, edge cases, and clarity)
   - `### 🔍 Logic Check` (bullet points: "What you nailed", "Misconceptions / bugs")
   - `### ⚠️ Edge Cases Missed` (crucial boundary tests or missed constraints)
   - `### ⏱️ Time & Space Complexity` ("Your Stated / Implied" vs "Optimal")
   - `### 💡 Ideal Interview Explanation` (gold-standard FAANG interview explanation)

**Export:**
- `SYSTEM_INSTRUCTION`: string
- `formatUserPrompt(topic, transcript)`: helper function returning formatted user input string.

**Verification:** Module exports `SYSTEM_INSTRUCTION` and `formatUserPrompt`. No syntax errors.

---

## Task 2 — Vite Dev Server Streaming Middleware (`/api/gemini-stream`)

> Implement custom SSE (Server-Sent Events) streaming middleware in Vite to proxy requests to Gemini via `@google/genai`, protecting the API key on the server side.

**Prompt:**

Update `e:\Antigravity\hinglish-cs-coach\vite.config.js` to add custom middleware for `/api/gemini-stream`.

**Requirements:**
1. Import `GoogleGenAI` from `@google/genai`.
2. In `vite.config.js`, add a custom Vite plugin named `gemini-stream-server`.
3. In `configureServer(server)`, register middleware for `server.middlewares.use('/api/gemini-stream', async (req, res) => ...)`:
   - Verify `req.method === 'POST'`.
   - Read JSON body `{ topic, transcript }`.
   - Validate that `env.GEMINI_API_KEY` exists (return clear error if missing).
   - Initialize `new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })`.
   - Set SSE response headers:
     ```js
     res.writeHead(200, {
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache, no-transform',
       'Connection': 'keep-alive',
     })
     ```
   - Call `ai.models.generateContentStream({ model: 'gemini-3.8-flash', config: { systemInstruction }, contents: [...] })`.
   - Loop `for await (const chunk of stream)` and write `res.write('data: ' + JSON.stringify({ text: chunk.text }) + '\n\n')`.
   - Flush `res.write('data: [DONE]\n\n')` and call `res.end()`.
   - Handle errors gracefully by sending `res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n')` before ending.

**Verification:** Dev server starts without syntax or import errors.

---

## Task 3 — Client Streaming Evaluation Service (`geminiCoach.js`)

> Implement the frontend client service to initiate and consume the SSE stream from `/api/gemini-stream`.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\services\geminiCoach.js`.

This module provides a function `streamCoachingEvaluation({ topic, transcript, onToken, onDone, onError, signal })`.

**Requirements:**
1. Make a `fetch('/api/gemini-stream', { method: 'POST', ... signal })`.
2. Check `response.ok` (if not, throw with status and text).
3. Obtain `reader = response.body.getReader()` and decode UTF-8 byte chunks.
4. Parse Server-Sent Event lines starting with `data: `:
   - If line is `data: [DONE]`, invoke `onDone()`.
   - If line has `{ text }`, invoke `onToken(text)`.
   - If line has `{ error }`, invoke `onError(error)`.
5. Support `AbortSignal` for user cancellation / re-recording.

**Verification:** Module exports `streamCoachingEvaluation`. Correctly handles chunk boundary fragmentation.

---

## Task 4 — Coach Feedback Markdown Component (`CoachFeedback.jsx`)

> Build the Coach Feedback presentation component using `react-markdown` with terminal dark styling, live streaming cursor, and retry actions.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\components\CoachFeedback.jsx`.

**Requirements:**
1. Props:
   - `feedbackText`: string (accumulated markdown tokens)
   - `isStreaming`: boolean
   - `error`: string | null
   - `onRetry`: function
2. Uses `react-markdown` to render formatted markdown:
   - Custom element renderers for `h3`, `p`, `ul`, `li`, `strong`, `code` styled with Tailwind for a dark terminal look.
   - Code blocks and Big-O tags highlighted in monospace green (`text-green-400 font-mono`).
3. While `isStreaming` is true:
   - Append an active blinking terminal block cursor `▋` or pulse dot to indicate active generation.
4. When `error` is present:
   - Display a red-tinted error callout with a "Retry Evaluation" button.
5. If `feedbackText` is empty and not streaming:
   - Display an empty placeholder encouraging the student to record their explanation.

**Verification:** Component renders markdown properly without hydration issues or styling anomalies.

---

## Task 5 — Pipeline Integration in `App.jsx`

> Connect STT output directly into the Gemini streaming coach pipeline.

**Prompt:**

Update `e:\Antigravity\hinglish-cs-coach\src\App.jsx` to wire up Phase 2.

**Requirements:**
1. State management:
   - `coachFeedback`: string (accumulated streaming text)
   - `isCoachStreaming`: boolean
   - `coachError`: string | null
   - `abortControllerRef`: useRef for aborting in-flight streams
2. Trigger flow:
   - When STT finishes with a valid transcript, transition `appPhase` to `'coaching'`.
   - Automatically trigger `streamCoachingEvaluation`.
   - As tokens arrive via `onToken`, append to `coachFeedback`.
   - When `onDone` is called, set `appPhase = 'done'` and `isCoachStreaming = false`.
3. Edge case guards:
   - If transcript is empty or `"No speech detected"`, skip coaching call and display message.
   - If user starts a new recording, abort any active coaching stream via `abortControllerRef.current?.abort()`.
4. Replace the Phase 2 placeholder card in `App.jsx` with the live `<CoachFeedback />` component.
5. Add a "Re-evaluate" button in case the user wants to re-run the evaluation on the current transcript without re-recording.

**Verification:** End-to-end flow: Speak $\to$ STT transcribes $\to$ Gemini streams scorecard $\to$ UI updates in real-time.

---

## Task 6 — Build & Verification

> Test compilation and run smoke tests.

**Prompt:**

1. Run `pnpm run build` to ensure all JSX, imports, and Tailwind classes build cleanly.
2. Verify that `vite.config.js` loads and dev server starts without crash.
3. Test edge case: ensure missing `GEMINI_API_KEY` returns a friendly message instructing the user to add it to `.env`.

**Verification Criteria:**
- `pnpm run build` exits 0.
- All new files cleanly formatted with no syntax errors.
