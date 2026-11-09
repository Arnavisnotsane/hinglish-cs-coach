# Phase 2 Discussion Log — The Brain (Gemini)

**Date:** 2026-11-09  
**Phase:** 02 — brain  

---

## Areas Discussed & Decisions

| Area | Options Presented | User Choice / Decision |
|---|---|---|
| **Evaluation Structure** | Scorecard vs Spoken prose vs Dual output | **Structured interview scorecard:** Score (1-10), Logic Check, Edge Cases Missed, Ideal Answer (+ concise verbal summary for TTS bridge). |
| **Language & Tone** | Hinglish vs English vs Dynamic Match | **Dynamic language matching:** If student spoke Hinglish, reply in Hinglish; if English, reply in English. |
| **Streaming Architecture** | Client SDK vs Server-side Vite proxy | **Vite dev server SSE proxy (`/api/gemini-stream`):** Secure `GEMINI_API_KEY` on server side, streaming chunks via SSE. |
| **UI Presentation** | Raw monospace vs Rendered Markdown | **Rendered Markdown:** Styled terminal dark theme, colored headings, code syntax formatting, live streaming cursor. |

---

## Deferred Ideas
- Feeding the Verbal Summary into Gnani Timbre TTS $\to$ Phase 3
- Saving scorecard & history items into localStorage $\to$ Phase 3
