# Phase 2 Research — The Brain (Gemini Coaching & Streaming)

**Date:** 2026-11-09  
**Phase:** 02 — brain  
**Project:** HinglishCS Coach [HCSC]

---

## 1. Google Gen AI SDK (`@google/genai`) Streaming API

**Package:** `@google/genai` (v3.0.0 installed)  
**Import:** `import { GoogleGenAI } from '@google/genai'`

### Initialization
```javascript
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
```

### Streaming Pattern
```javascript
const responseStream = await ai.models.generateContentStream({
  model: 'gemini-3.8-flash',
  config: {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.4, // lower temperature for consistent technical grading
  },
  contents: [
    `Target DSA Topic: ${topic}\n\nStudent's Spoken Explanation:\n"${transcript}"`
  ],
});

for await (const chunk of responseStream) {
  if (chunk.text) {
    // chunk.text contains the delta tokens
  }
}
```

---

## 2. Vite Dev Server Middleware for SSE (`/api/gemini-stream`)

Rather than exposing `GEMINI_API_KEY` in the browser client, Vite dev server supports custom Connect middleware via `configureServer` in a plugin.

### Server Implementation (`vite.config.js`):
```javascript
{
  name: 'gemini-stream-server',
  configureServer(server) {
    server.middlewares.use('/api/gemini-stream', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        return res.end('Method Not Allowed');
      }

      let body = '';
      for await (const chunk of req) body += chunk;
      const { topic, transcript } = JSON.parse(body || '{}');

      if (!transcript || transcript.trim() === '') {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Transcript is required' }));
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      });

      try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const stream = await ai.models.generateContentStream({ ... });

        for await (const chunk of stream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
      } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      } finally {
        res.end();
      }
    });
  }
}
```

### Client Frontend Consumption (`fetch` + `ReadableStream`):
```javascript
const response = await fetch('/api/gemini-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic, transcript }),
  signal: abortController.signal,
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  // parse SSE line-by-line ('data: ...')
}
```

---

## 3. Markdown Rendering with `react-markdown`

**Package:** `react-markdown` (v10.1.0 installed)  
Works natively with React 18 and Tailwind CSS.
We can customize elements to match our terminal dark-theme:
- `h3`: `font-mono text-sm font-bold text-green-400 mt-4 mb-1`
- `p`: `font-sans text-sm text-gray-200 leading-relaxed my-2`
- `ul` / `li`: `list-disc list-inside text-sm text-gray-300 space-y-1`
- `code`: `bg-gray-800 text-green-300 px-1 py-0.5 rounded font-mono text-xs`
- `strong`: `font-semibold text-gray-100`

---

## 4. Key Learnings & Guardrails
- **API Key Security:** `GEMINI_API_KEY` stays in `.env` and is accessed only via Vite `loadEnv` on the server.
- **Empty Transcripts:** If Gnani returned empty or `"No speech detected"`, skip the Gemini request and present a prompt to speak louder.
- **Abort on Re-record:** If the student starts a new recording while Gemini is streaming, `abortController.abort()` cancels the connection.
