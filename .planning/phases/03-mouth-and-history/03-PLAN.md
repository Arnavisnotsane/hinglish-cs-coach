# Phase 3 Plan — The Mouth + History (TTS & Past Sessions)

**Project:** HinglishCS Coach [HCSC]  
**Phase:** 03 — mouth-and-history  
**Goal:** Convert Gemini's verbal evaluation into spoken audio via Gnani Timbre v3.0 (Avinash) with auto-play, and provide a persistent 30-session localStorage history drawer.  
**Date:** 2026-11-09  

---

## Task 1 — Vite Proxy Configuration for Gnani TTS

> Configure `/api/gnani-tts` in `vite.config.js` to proxy requests to `https://api.vachana.ai/api/v1/tts/inference` while securely injecting `GNANI_API_KEY` on the server side.

**Prompt:**

Update `e:\Antigravity\hinglish-cs-coach\vite.config.js` to add the `/api/gnani-tts` proxy endpoint.

**Requirements:**
1. In `server.proxy`, add:
   ```javascript
   '/api/gnani-tts': {
     target: 'https://api.vachana.ai',
     changeOrigin: true,
     secure: true,
     rewrite: () => '/api/v1/tts/inference',
     configure: (proxy) => {
       proxy.on('proxyReq', (proxyReq) => {
         proxyReq.setHeader('X-API-Key-ID', env.GNANI_API_KEY)
       })
     },
   }
   ```
2. Ensure both `/api/gnani-stt`, `/api/gnani-tts`, and `/api/gemini-stream` coexist cleanly in `vite.config.js`.

**Verification:** Dev server starts without configuration errors.

---

## Task 2 — Gnani TTS Service & Summary Extractor (`gnaniTts.js`)

> Implement audio synthesis and verbal summary text extraction utilities.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\services\gnaniTts.js`.

**Requirements:**
1. `extractVerbalSummary(markdownText)`:
   - Uses regex to parse the text under `### 🎙️ Verbal Summary`.
   - Strips markdown formatting characters (`*`, `_`, `#`, `` ` ``, `~`, `>`) and normalizes whitespace.
   - Returns clean conversational string.
2. `extractScore(markdownText)`:
   - Parses the numeric score from `### 📊 Score: X / 10`.
   - Returns number or null.
3. `synthesizeSpeech(text, language = 'hi-IN')`:
   - Makes `POST /api/gnani-tts` with JSON payload:
     ```json
     {
       "text": text,
       "model": "timbre-v3.0",
       "voice": "Avinash",
       "language": language,
       "speed": 1.0,
       "audio_config": {
         "sample_rate": 24000,
         "encoding": "linear_pcm",
         "container": "wav"
       }
     }
     ```
   - Checks `response.ok`; if error, throws with status text.
   - Converts response into a `Blob([arrayBuffer], { type: 'audio/wav' })`.
   - Returns `Promise<Blob>`.

**Verification:** Module exports `extractVerbalSummary`, `extractScore`, and `synthesizeSpeech`.

---

## Task 3 — Audio Player Controller Widget (`AudioPlayerWidget.jsx`)

> Build an interactive voice feedback player component with Play/Pause, Replay, and animated audio indicators.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\components\AudioPlayerWidget.jsx`.

**Requirements:**
1. Props:
   - `audioBlob`: Blob | null
   - `isLoading`: boolean (when TTS is actively synthesizing)
   - `error`: string | null
   - `verbalSummary`: string
   - `autoPlay`: boolean
2. Behavior:
   - Initializes an `Audio` instance with `URL.createObjectURL(audioBlob)`.
   - Plays automatically if `autoPlay` is true when audioBlob becomes available.
   - Play/Pause toggle button with icon.
   - Replay button (resets to 0:00 and plays).
   - Shows audio duration and playback progress.
   - Displays animated green soundwave bars when actively playing audio.
   - Styled to match the VS Code / terminal dark aesthetic (`bg-gray-950/80 border border-gray-800`).

**Verification:** Component mounts without errors, handles play/pause transitions, and cleans up object URLs on unmount.

---

## Task 4 — Session History Storage Manager (`historyStorage.js`)

> Implement localStorage persistence utilities with a 30-session circular buffer cap.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\services\historyStorage.js`.

**Requirements:**
1. Storage key: `hinglish_cs_coach_history`.
2. Max limit: 30 sessions.
3. Functions:
   - `getStoredSessions()`: Reads and JSON parses localStorage; returns array of sessions (sorted newest first).
   - `saveSession({ topic, transcript, feedback, score, verbalSummary })`:
     - Creates session object with `id: crypto.randomUUID()` and `timestamp: Date.now()`.
     - Prepends to existing list.
     - Slices array to max 30 items.
     - Saves to localStorage and returns updated list.
   - `deleteSession(sessionId)`: Filters out matching session and updates localStorage.
   - `clearAllSessions()`: Empties the localStorage list.

**Verification:** Module handles empty localStorage, malformed JSON, and respects the 30-item cap.

---

## Task 5 — History Sidebar Component Update (`HistorySidebar.jsx`)

> Update the slide-out history drawer to render real past sessions with click-to-inspect, individual delete, and clear all.

**Prompt:**

Update `e:\Antigravity\hinglish-cs-coach\src\components\HistorySidebar.jsx`.

**Requirements:**
1. Props:
   - `isOpen`: boolean
   - `onClose`: function
   - `sessions`: Array of sessions
   - `onSelectSession`: function(session) — restores session in main view
   - `onDeleteSession`: function(sessionId)
   - `onClearAll`: function
2. UI Features:
   - Renders session cards showing:
     - Topic name in green font
     - Relative or formatted date/time
     - Score badge (`Score: X/10`) if present
     - 2-line truncated preview of the transcript
     - Trash icon button for individual deletion (with event propagation stopped)
   - "Clear All" button in the header when sessions exist.
   - Clicking a card triggers `onSelectSession(session)` and closes the sidebar.
   - Smooth slide-out animation with backdrop blur.

**Verification:** Clicking a session triggers selection; trash button deletes session without triggering card select; empty state still displays placeholder.

---

## Task 6 — Full Pipeline Integration (`App.jsx`)

> Wire up audio auto-play, history saving, and session restoration in the main app.

**Prompt:**

Update `e:\Antigravity\hinglish-cs-coach\src\App.jsx`.

**Requirements:**
1. State & Storage:
   - Initialize `sessions` from `getStoredSessions()`.
   - Add state for `ttsAudioBlob`, `isTtsLoading`, `ttsError`.
2. Pipeline Completion:
   - In `runCoachingEvaluation`, when Gemini streaming completes (`onDone`):
     - Extract `verbalSummary = extractVerbalSummary(fullFeedback)` and `score = extractScore(fullFeedback)`.
     - Automatically trigger `synthesizeSpeech(verbalSummary)` $\to$ set `ttsAudioBlob`.
     - Automatically save completed session via `saveSession({ topic, transcript, feedback: fullFeedback, score, verbalSummary })`.
3. Session Restoration:
   - Implement `handleSelectSession(session)`:
     - Restores `topic`, `transcript`, and `coachFeedback`.
     - Sets `appPhase = 'done'`.
     - If session has `verbalSummary`, optionally triggers TTS or resets audio player.
4. Integrate `<AudioPlayerWidget />` right below the Verbal Summary section or inside the Coach Feedback card.
5. Provide `<HistorySidebar />` with active `sessions`, `onSelectSession`, `onDeleteSession`, and `onClearAll`.

**Verification:** End-to-end flow: Speak $\to$ Transcribe $\to$ Stream scorecard $\to$ Auto-play Avinash voice $\to$ Save in sidebar $\to$ Inspect past session.

---

## Task 7 — Build & Verification

> Run production build and test end-to-end functionality.

**Prompt:**

1. Run `pnpm run build` to verify all modules, CSS, and JSX compile with 0 errors.
2. Verify dev server proxies for `/api/gnani-tts` and `/api/gnani-stt`.
3. Confirm browser storage and audio playback capabilities.

**Verification Criteria:**
- `pnpm run build` exits with code 0.
- All Phase 3 requirements (FR-06 and FR-07) verified.
