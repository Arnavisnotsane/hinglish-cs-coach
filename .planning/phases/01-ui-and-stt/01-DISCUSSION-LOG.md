# Phase 1 Discussion Log — UI + STT Skeleton

**Date:** 2026-11-08  
**Phase:** 01 — ui-and-stt

---

## Areas Presented

| Area | Options Presented | Decision |
|------|-------------------|----------|
| PTT button interaction design | Hold vs toggle vs mode-switcher | Agent default: gesture-based (hold = long press, toggle = quick click) |
| Gnani STT request flow | Direct browser vs Vite proxy | Agent default: Vite `server.proxy` (key protection) |
| Recording format | MediaRecorder webm vs WAV via AudioContext | Agent default: WAV via AudioContext (Gnani compatibility) |
| UI layout | Single-page vs split-panel | Agent default: Left sidebar (collapsed) + main panel |
| Topic list | Curated set | Agent default: 15 topics + "Other" custom input |
| State management | Redux / Zustand / useState | Agent default: useState/useReducer (no library needed for Phase 1) |

**User action:** Skipped gray area selection → agent applied sensible defaults for all areas.

---

## Deferred Ideas (from prior discussion)
- Full history sidebar functionality → Phase 3
- Gemini coaching prompt → Phase 2
- TTS audio playback → Phase 3
