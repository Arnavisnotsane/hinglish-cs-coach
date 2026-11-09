# Phase 3 Discussion Log — The Mouth + History

**Date:** 2026-11-09  
**Phase:** 03 — mouth-and-history  

---

## Areas Discussed & Decisions

| Area | Options Presented | Decision |
|---|---|---|
| **TTS Scope** | Verbal Summary only vs Summary+Score+Nailed vs Entire text | **Verbal Summary only:** Synthesize the 1-2 conversational sentences from `### 🎙️ Verbal Summary` for quick, punchy, spoken verdict. |
| **Playback Trigger** | Auto-play vs Manual click | **Auto-play:** Plays immediately once Gemini streaming finishes, accompanied by Play/Pause/Replay UI controls. |
| **Sidebar Interaction** | Click to inspect vs Inline expand | **Click to inspect:** Clicking a past session restores topic, transcript, and full scorecard back to the main terminal view. |
| **History Management** | Last 30 sessions with delete/clear vs Unlimited | **Last 30 sessions in localStorage:** Individual delete button per session + "Clear All" action. |

---

## Deferred Ideas
- Cross-device sync & cloud accounts $\to$ Post-MVP
