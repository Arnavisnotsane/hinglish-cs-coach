# Phase 1 Context — UI + STT Skeleton

**Date:** 2026-11-08  
**Phase:** 01 — ui-and-stt  
**Project:** HinglishCS Coach [HCSC]

---

<domain>
Deliver the full audio capture → Gnani STT → transcript display pipeline on top of a complete React UI shell. At the end of this phase a user can: select a topic, record their Hinglish explanation (hold OR toggle PTT), see the transcribed text on screen, and navigate to the history sidebar (empty for now).
</domain>

---

<decisions>

## 1. PTT Button Interaction Design

**Decision:** Single button, two modes — hold AND toggle both supported on the same element.

- **Hold mode:** `mousedown`/`touchstart` → start recording; `mouseup`/`touchend` → stop + submit. No explicit mode switch needed — if the user holds > 300ms before releasing, it's hold mode.
- **Toggle mode:** A quick click (< 300ms hold) toggles recording on/off.
- **Visual state machine:**
  - Idle: dark button with mic icon, subtle border
  - Recording: red pulsing ring, animated waveform placeholder, "Recording..." label
  - Processing: spinner, "Analyzing..." label, button disabled
- **Explicit mode indicator optional** — the gesture-based detection is the primary UX. A small "Hold or Click" hint label below the button is sufficient.

## 2. Gnani STT Request Flow — Browser-Direct vs Proxy

**Decision:** Thin Vite proxy middleware (`server.proxy` in `vite.config.js`) to forward `/api/gnani-stt` to Gnani's endpoint.

- Keeps Gnani API key in `.env` server-side (not exposed in bundle)
- Zero extra infrastructure — Vite dev proxy is built-in
- In production (if ever deployed), replace with a small Vercel/Netlify function
- **Key env var:** `VITE_GNANI_API_KEY` — accessed only in the proxy handler, NOT in frontend JS

## 3. Recording Format — Codec

**Decision:** Use `AudioContext` + `AudioWorkletNode` (or `ScriptProcessorNode` fallback) to record raw PCM and encode to WAV in-browser before sending to Gnani.

- Gnani Prisma v3.0 accepts WAV (PCM 16-bit, 16kHz mono) natively
- MediaRecorder produces webm/ogg which Gnani may not accept reliably
- Use a lightweight helper library (`recorder.js` or `extendable-media-recorder` with WAV encoder) to handle the encoding
- Sample rate: 16000 Hz, mono, 16-bit PCM

## 4. UI Layout

**Decision:** Two-panel layout within a single page:

```
┌─────────────────────────────────────────────────────┐
│  [☰ History]                    HinglishCS Coach    │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  [Sidebar]   │  [Topic Dropdown]                    │
│  (collapsed  │  [PTT Button — large, centered]      │
│   by default)│  [Transcript Panel — scrollable]     │
│              │  [Coach Feedback Panel — placeholder]│
└──────────────┴──────────────────────────────────────┘
```

- **Sidebar:** Hidden by default, slides in from the left on `[☰ History]` click. Renders a placeholder "No history yet" card in Phase 1.
- **Main area:** Vertically stacked, centered, max-width ~720px, dark theme.
- **Responsive:** Sidebar overlays on mobile (doesn't push content).

## 5. Topic List (Locked)

Pre-loaded DSA/algorithm topics (at least 15):

1. Arrays & Sliding Window  
2. Linked Lists  
3. Stacks & Queues  
4. Binary Trees  
5. Binary Search Trees (BST)  
6. Heaps & Priority Queues  
7. Graphs — BFS & DFS  
8. Dynamic Programming — Knapsack  
9. Dynamic Programming — LCS  
10. Tries  
11. Hashing & Hash Maps  
12. Sorting Algorithms  
13. Binary Search  
14. Recursion & Backtracking  
15. Running Median (Two Heaps)  
+ "Other (type your own)" — text input appears when this option is selected

## 6. State Management

**Decision:** React `useState` / `useReducer` only — no external state library for Phase 1.

- Recording state machine: `idle | recording | processing | done`
- Transcript stored in component state; not persisted yet (Phase 3)
- History sidebar receives an empty array in Phase 1 (wire-up only)

</decisions>

---

<canonical_refs>
- `.planning/PROJECT.md` — stack, key decisions, phase overview
- `.planning/REQUIREMENTS.md` — functional and non-functional requirements (FR-01 through FR-07, NFR-01 through NFR-03)
- `.planning/ROADMAP.md` — phase scope boundaries
- External: Gnani AI Prisma v3.0 REST API docs (STT endpoint, `indic-auto`, `codemix` params) — confirm URL/auth scheme from credentials
- External: Vite `server.proxy` docs — https://vitejs.dev/config/server-options.html#server-proxy
</canonical_refs>

---

<code_context>
New project — no existing code. Researcher and planner start from scratch with:
- `e:\Antigravity\hinglish-cs-coach\` as the project root
- Stack: React + Vite + Tailwind CSS
- Key packages expected: `@google/genai`, `extendable-media-recorder` (or `recorder-js`), Tailwind v3+
</code_context>

---

<deferred>
- Actual Gemini system prompt engineering → Phase 2
- TTS Timbre integration → Phase 3
- localStorage history persistence → Phase 3
- Mobile polish, accessibility audit → Phase 3
- Production deployment / API key security hardening → Post-MVP
</deferred>
