# Roadmap — HinglishCS Coach

## Phase 1 — UI + STT Skeleton
**Goal:** Build the complete React UI shell and wire up the full audio capture → Gnani STT → transcript display pipeline. User can select a topic, record their explanation (hold OR toggle PTT), and see the transcribed Hinglish text on screen.

**Scope:**
- Vite + React + Tailwind project scaffolding
- Dark-mode UI: topic dropdown (pre-loaded DSA list + "Other" custom input), PTT button (hold + toggle modes), transcript display panel, loading state, coach feedback panel (empty placeholder)
- MediaRecorder API: capture mic input as WAV blob
- Gnani Prisma v3.0 STT integration (`indic-auto`, `codemix` format)
- Render STT transcript on screen

**Out of scope:** LLM calls, TTS, history

---

## Phase 2 — The Brain (Gemini)
**Goal:** Pass the STT transcript to Gemini with a strict system prompt; stream the technical feedback evaluation to the UI letter-by-letter.

**Scope:**
- google-genai SDK integration (server-side thin proxy or direct from frontend with env key)
- System prompt engineering for CS coaching persona
- Streamed Gemini response rendered in the feedback panel
- Error handling (empty transcript, API failures)

**Out of scope:** TTS, history

---

## Phase 3 — The Mouth + History
**Goal:** Convert Gemini's text evaluation to audio via Gnani Timbre v3.0 and play it back in the browser. Add a full session history sidebar backed by localStorage.

**Scope:**
- Gnani Timbre v3.0 TTS integration (persona: Avinash)
- Audio playback in browser (HTML5 Audio or Web Audio API)
- localStorage session history: save each session (topic, transcript, feedback text, timestamp)
- Sidebar to browse past attempts, re-read feedback, replay audio if cached
- Polish: accessibility, mobile responsiveness for core flow

**Out of scope:** Auth, server-side persistence, sharing
