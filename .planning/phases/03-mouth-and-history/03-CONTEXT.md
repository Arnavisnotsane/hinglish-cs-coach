# Phase 3 Context — The Mouth + History (TTS & Past Sessions)

**Date:** 2026-11-09  
**Phase:** 03 — mouth-and-history  
**Project:** HinglishCS Coach [HCSC]  

---

<domain>
Deliver spoken voice feedback ("The Mouth") using Gnani AI Timbre v3.0 (Avinash persona) and persistent past session storage ("History") via browser localStorage. Automatically vocalize the coach's verbal verdict when streaming completes, and provide a full-featured history drawer to browse, reload, and manage past evaluations.
</domain>

---

<decisions>

## 1. TTS Synthesis Scope & Extraction

**Decision:** Synthesize only the `### 🎙️ Verbal Summary` section.
- Parse the completed Markdown output from Gemini to isolate the 1-2 conversational sentences under `### 🎙️ Verbal Summary`.
- Strips any residual markdown characters (e.g., asterisks, quotes) so the TTS engine receives clean, spoken-word text.
- Why: Keeps audio synthesis fast (<1.5s latency), punchy, and natural. Prevents TTS from awkwardly reading Markdown tables, Big-O code syntax, or bullet points.

## 2. Audio Playback Experience

**Decision:** Auto-play with interactive playback controls.
- When Gemini finishes streaming and the Verbal Summary is extracted, the app automatically triggers Gnani Timbre v3.0 TTS.
- The returned audio automatically plays in the browser.
- A prominent audio controller card is displayed in the Coach feedback section featuring:
  - Play / Pause toggle
  - Replay button
  - Audio waveform or progress bar
  - Status indicator (e.g. "Coach Avinash speaking...")

## 3. Gnani Timbre v3.0 API & Security

**Decision:** Vite dev server proxy middleware (`/api/gnani-tts`).
- Protects `GNANI_API_KEY` server-side in `.env` (never exposed to browser bundles).
- Forwards requests to Gnani's Timbre v3 API endpoint with persona `Avinash` (professional, firm Indian male voice).
- Returns audio binary/base64 to the client for HTML5 `Audio` or Web Audio API playback.

## 4. History Storage & Sidebar Interaction

**Decision:** `localStorage` persistence with full session reload capability.
- **Storage Cap:** Circular buffer keeping the last **30 sessions** in `localStorage` (`hinglish_cs_coach_history`).
- **Session Data Model:**
  ```typescript
  interface CoachSession {
    id: string; // crypto.randomUUID()
    timestamp: number; // Date.now()
    topic: string;
    transcript: string;
    feedback: string;
    score?: number; // Parsed score out of 10 if available
    verbalSummary?: string;
  }
  ```
- **Click to Inspect:** Clicking any past session item in the slide-out history sidebar restores that session's topic, transcript, and full scorecard into the main view for thorough review.
- **Management:**
  - Individual session deletion (trash icon per item).
  - Global "Clear All History" with a quick confirmation prompt.

## 5. UI Polish & Mobile Responsiveness

**Decision:** Terminal theme polish.
- Sidebar drawer smooth transition on desktop and mobile backdrop blur.
- Sound indicator / speaker icon next to the Verbal Summary heading when audio is active.
- Keyboard accessible controls.

</decisions>

---

<canonical_refs>
- `.planning/PROJECT.md` — Stack, key decisions, milestone overview
- `.planning/REQUIREMENTS.md` — FR-06 (TTS Timbre v3.0) & FR-07 (Session History)
- `.planning/ROADMAP.md` — Phase 3 scope boundaries
- `.planning/phases/01-ui-and-stt/01-SUMMARY.md` — UI Shell & AudioWorklet foundation
- `.planning/phases/02-brain/02-SUMMARY.md` — Gemini streaming & scorecard format
</canonical_refs>

---

<code_context>
Existing assets to build upon:
- `src/components/HistorySidebar.jsx` — currently a drawer shell with empty placeholder; update to render real session list, inspect click, delete, and clear all.
- `src/App.jsx` — manages `appPhase`, `transcript`, `coachFeedback`, `sidebarOpen`. Add `sessions` state with `localStorage` synchronization and session load handler.
- `vite.config.js` — add `/api/gnani-tts` proxy or custom middleware.
</code_context>

---

<deferred>
- User authentication / cloud database sync (Post-MVP / future roadmap)
</deferred>
