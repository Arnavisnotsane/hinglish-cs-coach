# Phase 3 Research — The Mouth + History (TTS & Past Sessions)

**Date:** 2026-11-09  
**Phase:** 03 — mouth-and-history  
**Project:** HinglishCS Coach [HCSC]

---

## 1. Gnani AI Timbre v3.0 REST API Verification

**Endpoint:** `POST https://api.vachana.ai/api/v1/tts/inference`  
**Authentication Header:** `X-API-Key-ID: <GNANI_API_KEY>`  
**Content-Type:** `application/json`

### Request Payload Schema
```json
{
  "text": "Aapka approach overall solid tha.",
  "model": "timbre-v3.0",
  "voice": "Avinash",
  "language": "hi-IN",
  "speed": 1.0,
  "audio_config": {
    "sample_rate": 24000,
    "encoding": "linear_pcm",
    "container": "wav"
  }
}
```

### Verified Behaviors
- **Response Format:** Direct raw binary `audio/wav` bytes (~100KB for a typical 2-sentence summary).
- **Supported Voices:** `Avinash` (professional, firm masculine Indian voice, optimal for technical mentor feedback).
- **Languages:** `hi-IN` natively handles both pure Hindi and Hinglish code-switching; `en-IN` handles technical English.
- **Latency:** ~1.0–1.4 seconds for 20–30 words, making auto-play feel immediate.

---

## 2. Vite Dev Server Proxy for TTS

Just like `/api/gnani-stt`, we can proxy `/api/gnani-tts` in `vite.config.js`:
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
This keeps `GNANI_API_KEY` hidden server-side and streams the binary WAV response back to the client.

---

## 3. Verbal Summary Extraction & Audio Player

### Summary Parser
Isolates the conversational sentences from Gemini's markdown:
```javascript
export function extractVerbalSummary(markdownText) {
  if (!markdownText) return ''
  const match = markdownText.match(/###\s*(?:🎙️\s*)?Verbal Summary\s*([\s\S]*?)(?=###|$)/i)
  if (!match || !match[1]) return ''
  return match[1]
    .replace(/[*_#`~>]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}
```

### Browser Audio Playback
- Creates an object URL from the WAV blob: `URL.createObjectURL(wavBlob)`.
- Reusable HTML5 `Audio` instance with event handlers for `play`, `pause`, `ended`, `timeupdate`.
- UI controller component with Play/Pause, Replay, and speaker visualizer.

---

## 4. `localStorage` History Storage (Cap: 30 Sessions)

- Stores max 30 items under key `hinglish_cs_coach_history`.
- Stores metadata: `id`, `timestamp`, `topic`, `transcript`, `feedback`, `score`, `verbalSummary`.
- Text-only storage keeps total footprint under ~50KB (well within the browser's 5MB localStorage limit).
- Audio blobs are cached in-memory per session or synthesized on-demand if the user requests replay from an old session.
