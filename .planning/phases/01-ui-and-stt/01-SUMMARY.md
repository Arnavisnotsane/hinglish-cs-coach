# Phase 1 Summary — UI + STT Skeleton

**Phase:** 01 — ui-and-stt  
**Project:** HinglishCS Coach [HCSC]  
**Status:** Complete  
**Date:** 2026-11-09  

---

## Accomplishments

1. **Project Scaffolding:**
   - Scaffolded React 18 + Vite 6 + Tailwind CSS v3 dark-mode application.
   - Configured `.gitignore` ensuring `.env` is never committed.
   - Configured custom terminal/code editor dark theme with custom monospace styling.

2. **Vite Dev Server Proxy (Gnani STT):**
   - Configured `vite.config.js` to proxy `/api/gnani-stt` -> `https://api.vachana.ai/stt/v3`.
   - Injected `X-API-Key-ID` header securely on the server-side proxy so that `GNANI_API_KEY` is never exposed in the client bundle.

3. **Audio Capture Engine (AudioWorklet + WAV Encoder):**
   - Implemented `public/pcm-processor.js` on the browser audio thread for glitch-free 16kHz mono PCM sample capture.
   - Built custom `useRecorder` hook that captures 16kHz mono audio, converts `Float32Array` to 16-bit PCM `Int16Array`, formats standard RIFF/WAV headers, and returns an audio `Blob`.
   - Built-in 25-second auto-stop guardrail to stay safely within Gnani's 30-second API limit, with countdown and amber warning.

4. **Gnani AI Prisma v3.0 STT Service:**
   - Implemented `src/services/gnaniStt.js` targeting `prisma-v3.0` with `indic-auto` language detection and `codemix` format.
   - Integrated topic-specific `keyterms` dictionary across 15 DSA domains to bias transcription toward technical nomenclature (e.g. "O(log n)", "inorder", "heapify").

5. **UI Components:**
   - `TopicSelector`: 15 curated DSA topics + "Other (type your own)" custom text input.
   - `PTTButton`: Dual-mode gesture button (hold > 300ms to speak and release to stop, or single click to toggle). Accessible via Space/Enter key.
   - `HistorySidebar`: Slide-out left drawer showing past session logs (placeholder shell for Phase 3).
   - `App.jsx`: Fully responsive two-panel terminal interface with audio preview, live status indicator, and scrollable transcript card.

6. **Verification:**
   - Full build verified with `pnpm run build` (0 warnings, 0 errors).
   - Development server HTTP check passed.
   - Static asset serving for `/pcm-processor.js` verified.

---

## Verification Evidence
- Build artifact generated: `dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`, `dist/pcm-processor.js`.
- Git ignores `.env` with Gnani API key intact.
