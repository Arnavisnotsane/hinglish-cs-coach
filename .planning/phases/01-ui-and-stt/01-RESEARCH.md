# Phase 1 Research — UI + STT Skeleton

**Date:** 2026-11-09  
**Phase:** 01 — ui-and-stt

---

## 1. Gnani AI Prisma v3.0 STT — API Contract

**Endpoint:** `POST https://api.vachana.ai/stt/v3`  
**Auth:** `X-API-Key-ID: <YOUR_API_KEY>` header  
**Content-Type:** `multipart/form-data`

### Required form fields

| Field | Value |
|---|---|
| `audio_file` | WAV blob (or MP3, OGG, FLAC, AAC, M4A) |
| `model` | `prisma-v3.0` |
| `language_code` | `indic-auto` |
| `format` | `codemix` |

### Optional
- `keyterms` — JSON array of priority words (e.g. `["Binary Tree", "Heap", "O(log n)"]`). **Use this to bias toward DSA terminology.**
- `previous_text` — context string from previous chunk (for multi-chunk flows)

### ⚠️ Critical Constraint: 30-Second Audio Limit
Gnani Prisma v3 REST endpoint (`/stt/v3`) enforces a **hard 30-second maximum** per request. Files exceeding this return `MAX_AUDIO_DURATION_EXCEEDED` (HTTP 400).

**Mitigation strategy for Phase 1:** Enforce a **UI-side recording cap of 25 seconds** (with a visible countdown timer). Show a warning at 20s. Auto-stop at 25s. This keeps us under the limit with safety margin and matches the typical "explain in 30 seconds" use case perfectly.

**Future options (Phase 3+):** Chunked sequential requests with `previous_text` context bridging, or switch to Gnani's WebSocket streaming endpoint (`wss://api.vachana.ai/stt/v3/stream`).

### Response Shape
```json
{
  "success": true,
  "transcript": "Binary tree mein har node ke do children hote hain..."
}
```

---

## 2. Browser Audio Capture — WAV via AudioContext

### Why not MediaRecorder?
MediaRecorder produces `webm` or `ogg` by default. Gnani accepts WAV natively — using MediaRecorder would require a transcoding step or relying on browser support for `audio/wav` MIME type (inconsistent across browsers).

### Recommended approach: AudioWorklet + manual WAV encoding
Pure web-standard, no npm package needed.

**Two files:**

**`pcm-processor.js`** (AudioWorklet, runs on audio thread):
```js
class PCMProcessor extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(4096); this.written = 0; }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.buffer[this.written++] = ch[i];
      if (this.written >= 4096) {
        this.port.postMessage(this.buffer.slice(0, this.written));
        this.written = 0;
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
```

**Main thread** (`useRecorder.js` hook):
- `new AudioContext({ sampleRate: 16000 })`
- `getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } })`
- Load worklet, collect Float32Array chunks
- On stop: flatten → `Int16Array` (clamp + scale) → build RIFF/WAV header → `Blob`
- Send blob to Gnani proxy

### WAV Header (44 bytes)
Standard RIFF header: PCM format (`0x0001`), 1 channel, 16000 Hz, 16-bit.

### Key gotcha: AudioContext 16kHz
Browsers honor the `sampleRate` hint in `AudioContext` constructor — hardware resamples automatically. No manual downsampling needed.

---

## 3. Vite Proxy for Gnani STT

Vite `server.proxy` proxies `/api/gnani-stt` → `https://api.vachana.ai/stt/v3`.

```js
// vite.config.js
server: {
  proxy: {
    '/api/gnani-stt': {
      target: 'https://api.vachana.ai',
      changeOrigin: true,
      rewrite: (path) => '/stt/v3',
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('X-API-Key-ID', process.env.GNANI_API_KEY);
        });
      },
    },
  },
},
```

**Critical:** `GNANI_API_KEY` (no `VITE_` prefix) is used only in `vite.config.js` — it is NOT bundled into client JS. This is the correct secure pattern.

**Frontend sends to:** `POST /api/gnani-stt` with `FormData` (no `Content-Type` header — let browser set boundary).

---

## 4. React + Vite + Tailwind Project Setup

Standard setup commands:
```
pnpm create vite@latest . --template react
pnpm install
pnpm add -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

Tailwind config: `darkMode: 'class'` (always dark, add `dark` class to `<html>`).

---

## 5. Architecture Decisions Confirmed

| Decision | Confirmed approach |
|---|---|
| Recording format | AudioWorklet → Float32 → Int16 WAV (no library needed) |
| Proxy | Vite `server.proxy` with `configure` hook to inject API key header |
| 30s limit | UI-enforced 25s cap with countdown + auto-stop |
| DSA term biasing | Use Gnani `keyterms` with selected topic's key terms |
| State | `useReducer` for recording state machine |
| Worklet file location | `/public/pcm-processor.js` (served as static asset) |
