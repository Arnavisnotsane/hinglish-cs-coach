# Project: HinglishCS Coach

## Vision
An interactive web application where CS students select a complex data structure or algorithm, explain how it works out loud in Hinglish (Hindi + English codemix), and receive immediate spoken technical feedback on their logic.

## Project Code
`HCSC`

## Stack
- **Frontend:** React + Vite + Tailwind CSS (dark-mode code-editor theme)
- **Audio Capture:** Browser MediaRecorder API → WAV blob
- **Speech-to-Text:** Gnani AI Prisma v3.0 REST API (`indic-auto`, `codemix`)
- **Brain / LLM:** Gemini (google-genai SDK) — streamed text responses
- **Text-to-Speech:** Gnani AI Timbre v3.0 API (persona: Avinash — firm, professional)

## Key Decisions (Locked)
- **Location:** `e:\Antigravity\hinglish-cs-coach`
- **LLM:** Gemini via google-genai SDK (free tier, streamed output)
- **Gnani AI:** Real credentials (STT + TTS), not mocks
- **Deployment:** Local dev only (Vite dev server)
- **PTT UX:** Supports BOTH hold-to-talk AND click-to-toggle
- **Topic Selection:** Pre-loaded dropdown (15–20 curated DSA/algo topics) + "Other (type your own)" option
- **History:** Full session history saved in localStorage, browsable via sidebar
- **LLM Response Display:** Streamed (letter-by-letter as Gemini responds)

## Phase Structure (3 Phases)
1. **Phase 1 — UI + STT Skeleton:** React UI + MediaRecorder + Gnani STT wired end-to-end
2. **Phase 2 — The Brain:** Gemini integration with streamed feedback
3. **Phase 3 — The Mouth + History:** Gnani TTS audio playback + localStorage history sidebar
