# Phase 2 Context — The Brain (Gemini Coaching & Streaming)

**Date:** 2026-11-09  
**Phase:** 02 — brain  
**Project:** HinglishCS Coach [HCSC]  

---

<domain>
Deliver the automated technical coaching evaluation layer ("The Brain"). Pass the transcribed Hinglish speech and selected DSA topic to Gemini via a server-side streaming proxy endpoint, evaluate logic with an interview scorecard prompt, and stream formatted markdown feedback in real-time to the frontend terminal UI.
</domain>

---

<decisions>

## 1. Coach Evaluation Structure

**Decision:** Structured Interview Scorecard.

The system prompt will enforce an evaluation structure consisting of:
1. **Verbal Summary (1-2 sentences):** A punchy, spoken verdict (acts as the bridge for Phase 3 TTS to speak naturally without reading symbols or tables).
2. **Score (1-10):** Quantitative assessment of technical depth and conceptual accuracy.
3. **Logic Check:** What the student got right vs. conceptual bugs or flawed assumptions in their explanation.
4. **Edge Cases Missed:** Critical boundary conditions, null/empty states, overflow, or duplicate handling they forgot to mention.
5. **Time & Space Complexity:** Big-O evaluation of the stated approach vs. optimal approach.
6. **Ideal Answer:** Concise, production-grade explanation of the concept/algorithm as it should be stated in a technical interview.

## 2. Language & Tone Persona

**Decision:** Dynamic language matching with coach persona.
- If the student spoke in Hinglish or Hindi, the coach responds in Hinglish (natural, respectful Indian tech-mentor tone, e.g., *"Aapka approach overall solid tha, lekin..."*).
- If the student spoke primarily in English, the coach responds in clear, professional English.
- Code snippets, keywords, and Big-O notation remain in standard English/code syntax.

## 3. Streaming Architecture & Security

**Decision:** Vite dev server proxy middleware (`/api/gemini-stream`) with Server-Sent Events (SSE).
- `GEMINI_API_KEY` stays strictly server-side in `.env` (never exposed to client bundles).
- Vite dev server middleware in `vite.config.js` receives `POST /api/gemini-stream` with `{ topic, transcript }`.
- Backend uses the official `@google/genai` SDK to call `ai.models.generateContentStream` with model `gemini-3.8-flash`.
- Streams chunks to client via `text/event-stream` (SSE format: `data: <chunk>\n\n`).
- Client frontend reads the stream via `fetch` + `ReadableStreamDefaultReader` and appends tokens into the UI in real time.

## 4. UI Feedback Presentation

**Decision:** Rendered Markdown with syntax highlighting and terminal styling.
- Render streamed response dynamically using `react-markdown` (or lightweight markdown parser) with Tailwind dark terminal styling.
- Headers styled with terminal colors (`text-green-400`, `text-yellow-400`, `text-red-400` for edge cases).
- Code blocks styled in monospace with distinct background and border.
- Live blinking cursor `▋` or pulse dot while tokens are actively streaming.

## 5. Error & Edge Case Handling

- **Empty / No speech detected:** If the transcript is empty or indicates no speech, abort LLM call and display an inline warning prompting the user to re-record.
- **Quota / API Errors:** Graceful error banner in the coach card with retry button without losing the recorded transcript.
- **Abort controller:** Cancelling or re-recording aborts any in-flight streaming response.

</decisions>

---

<canonical_refs>
- `.planning/PROJECT.md` — Core vision, architecture decisions
- `.planning/REQUIREMENTS.md` — FR-05 (LLM Evaluation)
- `.planning/ROADMAP.md` — Phase 2 scope boundaries
- `.planning/phases/01-ui-and-stt/01-SUMMARY.md` — Phase 1 state & component hierarchy
- `@google/genai` SDK reference for Node streaming
</canonical_refs>

---

<code_context>
Existing Phase 1 assets to integrate with:
- `src/App.jsx` — has `transcript`, `topic`, `appPhase`, and placeholder card `<section className="bg-gray-900/40 ... coach://gemini-evaluation">`
- `vite.config.js` — already contains dev server proxy pattern for Gnani; add custom middleware for `/api/gemini-stream`
- `.env` — currently has `GNANI_API_KEY`; add `GEMINI_API_KEY`
</code_context>

---

<deferred>
- Voice synthesis of the verdict via Gnani Timbre v3 (Avinash) $\to$ Phase 3
- Persisting completed evaluation & score to localStorage history $\to$ Phase 3
</deferred>
