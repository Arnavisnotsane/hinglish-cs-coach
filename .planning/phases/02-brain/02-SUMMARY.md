# Phase 2 Summary — The Brain (Gemini Coaching & Streaming)

**Phase:** 02 — brain  
**Project:** HinglishCS Coach [HCSC]  
**Status:** Complete  
**Date:** 2026-11-09  

---

## Accomplishments

1. **System Prompt & Evaluation Instructions (`src/services/coachingPrompt.js`):**
   - Implemented dynamic language matching: detects student's language and replies in friendly conversational Hinglish if Hinglish/Hindi was spoken, or professional technical English if English was spoken.
   - Enforced structured scorecard schema:
     - `### 🎙️ Verbal Summary` (conversational summary designed to bridge into Phase 3 TTS)
     - `### 📊 Score: X / 10`
     - `### 🔍 Logic Check` ("What you nailed" and "Misconceptions & bugs")
     - `### ⚠️ Edge Cases Missed`
     - `### ⏱️ Time & Space Complexity`
     - `### 💡 Ideal Interview Explanation`

2. **Vite Dev Server SSE Streaming Middleware (`vite.config.js`):**
   - Configured custom Connect middleware at `/api/gemini-stream` via the `gemini-stream-server` Vite plugin.
   - Directly connects to `@google/genai` (`gemini-3.8-flash`) on the server side so that `GEMINI_API_KEY` is never exposed in the browser bundle.
   - Streams tokens via Server-Sent Events (`text/event-stream`).
   - Integrated client abort detection (`req.on('close')`) to stop upstream AI generation when the user cancels or re-records.
   - Built-in friendly check and instruction if `GEMINI_API_KEY` is not yet configured.

3. **Client Evaluation Service (`src/services/geminiCoach.js`):**
   - Implemented streaming SSE parser with `ReadableStream` reader and `TextDecoder`.
   - Handles multi-line SSE message fragmentation and dispatches `onToken`, `onDone`, and `onError` callbacks.
   - Supports `AbortController` cancellation.

4. **Terminal Markdown Component (`src/components/CoachFeedback.jsx`):**
   - Integrated `react-markdown` with customized terminal dark-mode elements (colored monospace headings, Big-O highlight pills, code styling).
   - Live blinking typewriter block cursor `▋` during streaming.
   - Error callout with a one-click "Retry" button.
   - "Re-evaluate" action button allowing the student to re-run the coach on the current transcript without re-recording.

5. **Pipeline Integration (`src/App.jsx`):**
   - Wired STT transcript completion directly into `runCoachingEvaluation`.
   - When speech is transcribed, status shifts to `coaching` and Gemini streams the feedback into the UI in real time.
   - Starting a new PTT recording immediately aborts any in-flight coaching stream.

6. **Verification & Smoke Tests:**
   - Production build `pnpm run build` completed with 0 errors (`built in 1.10s`).
   - Probed `/api/gemini-stream` with mock requests; verified SSE stream headers and event delivery.

---

## Verification Evidence
- Build artifact generated: `dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`.
- Verified SSE response format: `data: {...}\n\n` and `data: [DONE]\n\n`.
