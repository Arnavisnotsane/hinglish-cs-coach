# Phase 1 Plan — UI + STT Skeleton

**Project:** HinglishCS Coach [HCSC]  
**Phase:** 01 — ui-and-stt  
**Goal:** React UI shell + MediaRecorder/AudioWorklet → WAV → Gnani Prisma v3 STT → transcript on screen  
**Date:** 2026-11-09

---

## Task 1 — Project Scaffolding

> Scaffold the Vite + React + Tailwind project. This is the foundation everything else builds on.

**Prompt:**

You are building the HinglishCS Coach app — a React + Vite + Tailwind CSS project. Your job is to scaffold it completely from scratch.

Working directory: `e:\Antigravity\hinglish-cs-coach`

**Steps:**

1. Run the following to create the project (run from `e:\Antigravity\hinglish-cs-coach`):
   ```
   pnpm create vite@latest . --template react
   pnpm install
   pnpm add -D tailwindcss@3 postcss autoprefixer
   pnpm exec tailwindcss init -p
   ```

2. Configure `tailwind.config.js`:
   ```js
   /** @type {import('tailwindcss').Config} */
   export default {
     content: ['./index.html', './src/**/*.{js,jsx}'],
     darkMode: 'class',
     theme: { extend: {} },
     plugins: [],
   }
   ```

3. Replace `src/index.css` with:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

4. In `index.html`, add `class="dark"` to the `<html>` tag and update the title to `HinglishCS Coach`.

5. Replace `src/App.jsx` with a minimal placeholder:
   ```jsx
   export default function App() {
     return (
       <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
         <p className="text-green-400 font-mono">HinglishCS Coach — scaffolded ✓</p>
       </div>
     )
   }
   ```

6. Delete `src/App.css` and `src/assets/react.svg` if present.

7. Create `.env` in project root:
   ```
   GNANI_API_KEY=your_key_here
   ```

8. Create `.gitignore` ensuring `.env` is included (Vite's default already includes it, verify).

9. Run `pnpm run dev` briefly to confirm the app starts and shows the green placeholder text. Then stop it.

**Verification:** `pnpm run dev` succeeds, browser shows dark background with green "HinglishCS Coach — scaffolded ✓" text.

---

## Task 2 — Vite Proxy Configuration

> Configure Vite's dev server proxy to route `/api/gnani-stt` to Gnani's API endpoint, injecting the API key server-side so it never reaches the browser bundle.

**Prompt:**

Configure `vite.config.js` in `e:\Antigravity\hinglish-cs-coach` to proxy Gnani STT requests.

Replace `vite.config.js` with:

```js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/gnani-stt': {
          target: 'https://api.vachana.ai',
          changeOrigin: true,
          secure: true,
          rewrite: () => '/stt/v3',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('X-API-Key-ID', env.GNANI_API_KEY)
            })
          },
        },
      },
    },
  }
})
```

**Key details:**
- `loadEnv` with `''` prefix loads ALL env vars (not just `VITE_`-prefixed ones), so `GNANI_API_KEY` in `.env` is accessible in config but NOT bundled into client JS.
- The `rewrite` function maps `/api/gnani-stt` → `/stt/v3` on the target host.
- The `configure` hook injects the `X-API-Key-ID` header on every proxied request.

**Verification:** `vite.config.js` loads without error when `pnpm run dev` is run.

---

## Task 3 — AudioWorklet Processor

> Create the AudioWorklet processor file that runs on the audio rendering thread to capture raw PCM samples.

**Prompt:**

Create the file `e:\Antigravity\hinglish-cs-coach\public\pcm-processor.js` with this content:

```js
/**
 * PCM Processor — AudioWorkletProcessor
 * Captures raw Float32 PCM samples from the microphone stream,
 * buffers them, and posts chunks to the main thread.
 * Runs on the audio rendering thread (not the main JS thread).
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._bufferSize = 4096
    this._buffer = new Float32Array(this._bufferSize)
    this._written = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true

    // Take first channel only (mono)
    const channelData = input[0]

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._written++] = channelData[i]

      if (this._written >= this._bufferSize) {
        this.port.postMessage(this._buffer.slice(0, this._written))
        this._written = 0
      }
    }

    return true // Keep processor alive
  }
}

registerProcessor('pcm-processor', PCMProcessor)
```

**Why `/public`?** Files in `/public` are served as-is at the root URL. `AudioContext.audioWorklet.addModule('/pcm-processor.js')` requires the worklet to be served from the same origin — `/public` satisfies this.

**Verification:** File exists at `public/pcm-processor.js`. No syntax errors.

---

## Task 4 — `useRecorder` Hook

> Implement the core audio recording hook. This hook manages the full recording lifecycle: mic permission → AudioContext setup → worklet recording → WAV encoding → Blob output.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\hooks\useRecorder.js`.

This hook manages the full audio recording pipeline. It must:

1. Request microphone permission via `navigator.mediaDevices.getUserMedia`
2. Create an `AudioContext` at 16000 Hz
3. Load `pcm-processor.js` as an AudioWorklet
4. Collect Float32Array chunks from the worklet's `port.onmessage`
5. On stop: flatten chunks → convert to Int16 PCM → build RIFF WAV header → return `Blob`

**Implement the following interface:**

```js
// Returns: { state, startRecording, stopRecording, audioBlob, error, secondsRecorded }
// state: 'idle' | 'recording' | 'stopped' | 'error'
// MAX_SECONDS = 25 (enforced hard limit — Gnani 30s cap with 5s safety margin)
```

**Full implementation:**

```js
import { useState, useRef, useCallback, useEffect } from 'react'

const MAX_SECONDS = 25
const SAMPLE_RATE = 16000

function floatToInt16(floatArray) {
  const int16 = new Int16Array(floatArray.length)
  for (let i = 0; i < floatArray.length; i++) {
    const s = Math.max(-1, Math.min(1, floatArray[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return int16
}

function buildWav(int16Array, sampleRate) {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataLength = int16Array.length * 2
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)       // PCM subchunk size
  view.setUint16(20, 1, true)        // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeStr(36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < int16Array.length; i++) {
    view.setInt16(offset, int16Array[i], true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export function useRecorder() {
  const [state, setState] = useState('idle')
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [secondsRecorded, setSecondsRecorded] = useState(0)

  const audioCtxRef = useRef(null)
  const streamRef = useRef(null)
  const workletNodeRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    if (sourceNodeRef.current) { try { sourceNodeRef.current.disconnect() } catch {} }
    if (workletNodeRef.current) { try { workletNodeRef.current.disconnect() } catch {} }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
    }
  }, [])

  const stopRecording = useCallback((fromTimer = false) => {
    if (!fromTimer) clearInterval(timerRef.current)
    cleanup()

    // Flush remaining buffer in worklet (send disconnect signal)
    const chunks = chunksRef.current
    if (chunks.length === 0) {
      setState('idle')
      return
    }

    // Flatten all chunks
    let totalLen = 0
    for (const c of chunks) totalLen += c.length
    const flat = new Float32Array(totalLen)
    let offset = 0
    for (const c of chunks) { flat.set(c, offset); offset += c.length }

    const int16 = floatToInt16(flat)
    const blob = buildWav(int16, SAMPLE_RATE)
    setAudioBlob(blob)
    setState('stopped')
  }, [cleanup])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setSecondsRecorded(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: SAMPLE_RATE, echoCancellation: true },
      })
      streamRef.current = stream

      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioCtxRef.current = ctx

      await ctx.audioWorklet.addModule('/pcm-processor.js')

      const source = ctx.createMediaStreamSource(stream)
      sourceNodeRef.current = source

      const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
      workletNodeRef.current = worklet

      worklet.port.onmessage = (e) => {
        chunksRef.current.push(e.data)
      }

      source.connect(worklet)
      // Do NOT connect worklet to ctx.destination (no feedback loop)

      setState('recording')

      let secs = 0
      timerRef.current = setInterval(() => {
        secs += 1
        setSecondsRecorded(secs)
        if (secs >= MAX_SECONDS) {
          stopRecording(true)
        }
      }, 1000)
    } catch (err) {
      setError(err.message || 'Microphone access denied')
      setState('error')
    }
  }, [stopRecording])

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup])

  return { state, startRecording, stopRecording: () => stopRecording(false), audioBlob, error, secondsRecorded, maxSeconds: MAX_SECONDS }
}
```

**Verification:** Hook exports correct interface. No syntax errors. `floatToInt16` and `buildWav` are pure functions that can be unit-tested in isolation.

---

## Task 5 — Gnani STT Service

> Implement the function that sends a WAV blob to Gnani via the Vite proxy and returns the transcript.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\services\gnaniStt.js`.

This module exports one function: `transcribeAudio(wavBlob, topic)` → `Promise<string>`.

**DSA topic → keyterms map** — include key terms for each topic to bias Gnani's recognition toward technical vocabulary:

```js
const TOPIC_KEYTERMS = {
  'Arrays & Sliding Window': ['array', 'sliding window', 'subarray', 'pointer', 'O(n)'],
  'Linked Lists': ['linked list', 'node', 'pointer', 'head', 'tail', 'next'],
  'Stacks & Queues': ['stack', 'queue', 'push', 'pop', 'LIFO', 'FIFO', 'deque'],
  'Binary Trees': ['binary tree', 'root', 'leaf', 'inorder', 'preorder', 'postorder', 'BFS', 'DFS'],
  'Binary Search Trees (BST)': ['BST', 'binary search tree', 'inorder', 'left subtree', 'right subtree'],
  'Heaps & Priority Queues': ['heap', 'priority queue', 'min heap', 'max heap', 'heapify', 'O(log n)'],
  'Graphs — BFS & DFS': ['graph', 'BFS', 'DFS', 'adjacency list', 'visited', 'queue', 'stack'],
  'Dynamic Programming — Knapsack': ['dynamic programming', 'knapsack', 'memoization', 'tabulation', 'subproblem'],
  'Dynamic Programming — LCS': ['LCS', 'longest common subsequence', 'DP table', 'memoization'],
  'Tries': ['trie', 'prefix tree', 'insert', 'search', 'children', 'node'],
  'Hashing & Hash Maps': ['hash map', 'hash table', 'collision', 'bucket', 'O(1)', 'key value'],
  'Sorting Algorithms': ['merge sort', 'quick sort', 'bubble sort', 'O(n log n)', 'pivot', 'in-place'],
  'Binary Search': ['binary search', 'O(log n)', 'mid', 'sorted array', 'left right pointer'],
  'Recursion & Backtracking': ['recursion', 'base case', 'backtracking', 'call stack', 'DFS'],
  'Running Median (Two Heaps)': ['median', 'max heap', 'min heap', 'balance', 'O(log n)'],
}

export async function transcribeAudio(wavBlob, topic) {
  const formData = new FormData()
  formData.append('audio_file', wavBlob, 'recording.wav')
  formData.append('model', 'prisma-v3.0')
  formData.append('language_code', 'indic-auto')
  formData.append('format', 'codemix')

  const keyterms = TOPIC_KEYTERMS[topic]
  if (keyterms) {
    formData.append('keyterms', JSON.stringify(keyterms))
  }

  // DO NOT set Content-Type header — browser sets it automatically with boundary
  const response = await fetch('/api/gnani-stt', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gnani STT error ${response.status}: ${text}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Transcription failed')
  }

  return data.transcript
}
```

**Verification:** Module exports `transcribeAudio`. All 15 topics have keyterms. No hardcoded API key anywhere in this file.

---

## Task 6 — Topic Selector Component

> Build the topic dropdown component with pre-loaded DSA topics and the "Other (type your own)" custom input.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\components\TopicSelector.jsx`.

**Requirements:**
- Renders a styled `<select>` dropdown with Tailwind dark-mode classes
- Lists all 15 DSA topics as `<option>` elements plus an `Other (type your own)` option
- When "Other" is selected, renders a text `<input>` below the dropdown
- Props: `value`, `onChange` (called with the final topic string)
- Visually matches VS Code terminal aesthetic: dark background (`bg-gray-800`), `text-green-400`, `font-mono`, rounded border

**Topics:**
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
+ Other (type your own)

**Example structure:**
```jsx
const TOPICS = [ /* all 15 */ , 'Other (type your own)']

export function TopicSelector({ value, onChange }) {
  const [customTopic, setCustomTopic] = useState('')
  const isOther = value === 'Other (type your own)'

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs text-gray-400 font-mono uppercase tracking-widest">
        Select Topic
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-800 text-green-400 font-mono text-sm border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-green-500 w-full"
      >
        <option value="">— pick a topic —</option>
        {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      {isOther && (
        <input
          type="text"
          placeholder="e.g. Segment Trees, AVL Trees..."
          value={customTopic}
          onChange={(e) => { setCustomTopic(e.target.value); onChange(e.target.value) }}
          className="bg-gray-800 text-green-400 font-mono text-sm border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-green-500 w-full"
        />
      )}
    </div>
  )
}
```

**Verification:** Component renders correctly, "Other" reveals text input, `onChange` is called with the custom value as the user types.

---

## Task 7 — PTT Button Component

> Build the Push-to-Talk button that supports both hold-to-record and click-to-toggle modes with a clear visual state machine.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\components\PTTButton.jsx`.

**Requirements:**
- Single large circular button (96px diameter)
- Gesture detection: mousedown/touchstart timer — if held > 300ms, hold mode; if released before 300ms, toggle mode
- Visual states:
  - `idle`: dark gray, mic icon, `border-gray-600`
  - `recording`: red pulsing ring (`animate-pulse border-red-500`), "Recording..." label
  - `processing`: spinner animation, `border-yellow-500`, disabled
  - `done`: green checkmark, `border-green-500`
- Props: `recorderState` (`'idle'|'recording'|'processing'|'stopped'`), `onStart`, `onStop`
- Keyboard accessible: `Space` or `Enter` triggers toggle mode
- Small hint text below: "Hold or click to record"
- Countdown display: when `secondsRecorded > 0` and `state === 'recording'`, show `{secondsRecorded}s / 25s`
- Warning: when `secondsRecorded >= 20`, pulse the countdown in amber

**Key implementation note — gesture detection:**
```jsx
const holdTimer = useRef(null)
const isHoldMode = useRef(false)

const handlePointerDown = () => {
  holdTimer.current = setTimeout(() => {
    isHoldMode.current = true
    onStart()
  }, 300)
}

const handlePointerUp = () => {
  if (holdTimer.current) {
    clearTimeout(holdTimer.current)
    holdTimer.current = null
  }
  if (isHoldMode.current) {
    // Hold mode: release = stop
    isHoldMode.current = false
    onStop()
  } else if (recorderState === 'idle') {
    // Quick click = toggle start
    onStart()
  } else if (recorderState === 'recording') {
    // Quick click again = toggle stop
    onStop()
  }
}
```

**Verification:** Button renders in all states. Hold 300ms+ starts recording, release stops. Quick click toggles. Space/Enter works as toggle.

---

## Task 8 — History Sidebar Component (Phase 1 Shell)

> Build the history sidebar shell. It slides in from the left, shows "No history yet" in Phase 1. The wire-up for real data happens in Phase 3.

**Prompt:**

Create `e:\Antigravity\hinglish-cs-coach\src\components\HistorySidebar.jsx`.

**Requirements:**
- Props: `isOpen` (boolean), `onClose` (function), `sessions` (array, empty in Phase 1)
- Renders as a fixed left panel that slides in with CSS `transform translate-x`
- Overlay backdrop (semi-transparent) when open on mobile
- When `sessions` is empty: show a placeholder card with a ghost icon and "No history yet. Complete your first explanation to see it here."
- When `sessions` has items (Phase 3): render a list (map over sessions showing topic + timestamp). Wire-up only for now — a `{sessions.length} sessions` count header is sufficient.
- Tailwind classes: `bg-gray-900`, `border-r border-gray-700`, `w-72`, `h-full`, `fixed left-0 top-0`
- Close button (×) in the top-right corner of the sidebar

**Verification:** Sidebar slides in/out when `isOpen` changes. Empty state renders placeholder message correctly.

---

## Task 9 — Main App Layout (`App.jsx`)

> Wire all components together into the final App layout. Connect the recorder hook, STT service, and state flow end-to-end.

**Prompt:**

Rewrite `e:\Antigravity\hinglish-cs-coach\src\App.jsx` to assemble the complete Phase 1 UI and wire up the full pipeline.

**State managed in `App.jsx`:**
```js
const [topic, setTopic] = useState('')
const [appPhase, setAppPhase] = useState('idle')
// appPhase: 'idle' | 'recording' | 'processing' | 'done' | 'error'
const [transcript, setTranscript] = useState('')
const [sttError, setSttError] = useState(null)
const [sidebarOpen, setSidebarOpen] = useState(false)
```

**Pipeline flow:**
1. User selects topic → `setTopic(value)`
2. User activates PTT → `recorder.startRecording()`
3. User releases PTT → `recorder.stopRecording()`
4. When `recorder.state === 'stopped'` and `recorder.audioBlob` is set → call `transcribeAudio(blob, topic)` → set transcript, set `appPhase = 'done'`
5. During transcription: `appPhase = 'processing'`
6. On error: `appPhase = 'error'`, show error message

**Layout:**
```
┌─────────────────────────────────────┐
│ header: [☰] HinglishCS Coach  🎓   │
├─────────────────────────────────────┤
│                                     │
│  TopicSelector                      │
│                                     │
│        PTTButton (centered)         │
│                                     │
│  ┌─ Transcript Panel ─────────────┐ │
│  │ "What you said:"               │ │
│  │ {transcript text, scrollable}  │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ Coach Feedback ───────────────┐ │
│  │ [Phase 2 placeholder]          │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘

HistorySidebar (overlay, left)
```

**useEffect to trigger STT when recording stops:**
```js
useEffect(() => {
  if (recorder.state === 'stopped' && recorder.audioBlob) {
    if (!topic) {
      setSttError('Please select a topic first.')
      setAppPhase('error')
      return
    }
    setAppPhase('processing')
    setSttError(null)
    transcribeAudio(recorder.audioBlob, topic)
      .then((text) => { setTranscript(text); setAppPhase('done') })
      .catch((err) => { setSttError(err.message); setAppPhase('error') })
  }
}, [recorder.state, recorder.audioBlob, topic])
```

**Styling requirements:**
- Dark background: `bg-gray-950`
- Main content: `max-w-2xl mx-auto px-4 py-8`
- Header: `font-mono text-green-400`
- Panels: `bg-gray-900 rounded-lg border border-gray-700 p-4`
- Transcript text: `font-mono text-sm text-gray-200 whitespace-pre-wrap`
- Error text: `text-red-400 font-mono text-sm`
- Coach feedback placeholder: `text-gray-500 italic text-sm` with text "Coach feedback will appear here after Phase 2 is complete."

**Verification:** Full pipeline works — select topic, record (hold or toggle), see transcript appear. Sidebar opens/closes. Error states display correctly.

---

## Task 10 — End-to-End Smoke Test

> Manually verify the complete Phase 1 pipeline works end-to-end with real Gnani credentials.

**Prompt:**

Perform an end-to-end smoke test of the Phase 1 pipeline in `e:\Antigravity\hinglish-cs-coach`.

**Steps:**

1. Confirm `.env` has a real `GNANI_API_KEY` value. If not, skip the STT test and note it.

2. Run `pnpm run dev` and open the browser.

3. Test checklist:
   - [ ] App loads with dark background, no console errors
   - [ ] Topic dropdown shows all 15 topics + "Other"
   - [ ] "Other" reveals a custom text input
   - [ ] PTT button is visible and large
   - [ ] Clicking mic button requests microphone permission
   - [ ] Hold for 1s → recording starts (red pulse)
   - [ ] Release → recording stops → "Analyzing..." spinner shows
   - [ ] After ~3s → transcript text appears in the transcript panel
   - [ ] 25-second countdown stops recording automatically
   - [ ] History sidebar opens/closes via the ☰ button
   - [ ] "No history yet" placeholder shows in sidebar

4. If Gnani key is not set, test up to the "Analyzing..." step and confirm the proxy routes correctly (check Network tab for a POST to `/api/gnani-stt`).

5. Run `pnpm run build` and confirm it completes without errors.

**Report:** List which checklist items passed and any issues found.

---

## Verification Criteria

| Check | Expected |
|---|---|
| `pnpm run dev` | Starts without errors |
| `pnpm run build` | Builds without errors, no TypeScript/ESLint blocking errors |
| Topic dropdown | All 15 topics listed, "Other" shows custom input |
| PTT hold mode | Hold 300ms → recording starts, release → stops |
| PTT toggle mode | Quick click → starts; quick click again → stops |
| Auto-stop | Recording auto-stops at 25 seconds |
| Countdown | Shows `Xs / 25s`, amber warning at 20s+ |
| STT pipeline | WAV blob POSTed to `/api/gnani-stt`, transcript rendered |
| Proxy security | No `GNANI_API_KEY` value visible in browser bundle or Network tab request |
| Sidebar | Opens/closes, shows "No history yet" |
| Error handling | Missing topic → error message shown; API failure → error message shown |
| Mic permission | Permission dialog shown on first record attempt |
