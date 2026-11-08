# Requirements — HinglishCS Coach

## Functional Requirements

### FR-01 Topic Selection
- Pre-loaded dropdown of 15–20 curated DSA/algorithm topics
- "Other (type your own)" option in the dropdown
- Selected topic is passed as context to the Gemini system prompt

### FR-02 Push-to-Talk (PTT)
- **Hold mode:** Press and hold button → recording; release → stop + submit
- **Toggle mode:** Click to start recording; click again to stop + submit
- Both modes must be supported on the same button (UI clearly indicates active mode)
- Visual feedback: button state changes during recording (pulsing, red border, etc.)

### FR-03 Audio Capture
- Uses browser MediaRecorder API
- Captures mic input as WAV blob
- Must request microphone permission with a clear user prompt on first use

### FR-04 Speech-to-Text (Gnani Prisma v3.0)
- Language: `indic-auto`
- Format: `codemix` (handles Hinglish naturally)
- Displays loading state while STT is processing
- Renders transcribed text in a "What you said" panel

### FR-05 LLM Evaluation (Gemini)
- Passes topic + transcript to Gemini with a strict technical coaching system prompt
- Response is **streamed** — text appears letter-by-letter in the feedback panel
- System prompt ensures: technical accuracy check, Hinglish-friendly, identifies gaps, provides corrections

### FR-06 Text-to-Speech (Gnani Timbre v3.0)
- Persona: Avinash (firm, professional)
- Converts Gemini feedback text to audio
- Plays back through the browser automatically after streaming completes

### FR-07 Session History
- Every completed session is saved to localStorage
- Saved data per session: topic, STT transcript, Gemini feedback text, timestamp
- History sidebar accessible from the main UI
- User can browse past attempts, re-read transcript and feedback
- Sidebar can be hidden/shown

## Non-Functional Requirements

### NFR-01 Performance
- STT round-trip target: < 5 seconds for a 60-second recording
- Gemini first token: < 2 seconds

### NFR-02 UI/UX
- Dark-mode code-editor aesthetic (think VS Code terminal)
- Mobile-responsive for the core PTT flow (at minimum)
- Accessible: keyboard navigable PTT, screen-reader labels

### NFR-03 Security
- API keys stored in `.env` (never committed)
- Gnani credentials: `VITE_GNANI_API_KEY`
- Gemini key: `VITE_GEMINI_API_KEY`
