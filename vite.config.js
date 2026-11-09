import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { GoogleGenAI } from '@google/genai'
import { SYSTEM_INSTRUCTION, formatUserPrompt } from './src/services/coachingPrompt.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'gemini-stream-server',
        configureServer(server) {
          server.middlewares.use('/api/gemini-stream', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              return res.end('Method Not Allowed')
            }

            // Accumulate request body
            let rawBody = ''
            for await (const chunk of req) {
              rawBody += chunk
            }

            let topic = ''
            let transcript = ''
            try {
              const cleaned = rawBody.replace(/^\uFEFF/, '').trim()
              const parsed = JSON.parse(cleaned || '{}')
              topic = parsed.topic || ''
              transcript = parsed.transcript || ''
            } catch (err) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Invalid JSON payload: ' + err.message }))
            }

            if (!transcript.trim()) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Transcript is required' }))
            }

            const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

            // Set Server-Sent Events headers
            res.setHeader('X-Accel-Buffering', 'no')
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
            })
            res.flushHeaders?.()

            let isAborted = false
            req.on('close', () => {
              isAborted = true
            })

            try {
              if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
                throw new Error(
                  'GEMINI_API_KEY is missing or empty. Please set your Gemini API key in the .env file in the project root.',
                )
              }

              const ai = new GoogleGenAI({ apiKey })
              const response = await ai.models.generateContentStream({
                model: 'gemini-3.8-flash',
                config: {
                  systemInstruction: SYSTEM_INSTRUCTION,
                  temperature: 0.4,
                  thinkingConfig: {
                    thinkingBudget: 0,
                  },
                },
                contents: [formatUserPrompt(topic, transcript)],
              })

              const stream = response.stream || response
              for await (const chunk of stream) {
                if (isAborted) break
                const chunkText = chunk.text || ''
                if (chunkText) {
                  console.log('Gemini stream chunk:', chunkText)
                  res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
                }
              }

              if (!isAborted) {
                res.write('event: done\ndata: {}\n\n')
                res.end()
              }
            } catch (err) {
              console.error('Gemini error:', err)
              if (!isAborted) {
                res.write(
                  `event: error\ndata: ${JSON.stringify({
                    message: err.message || 'Unknown error',
                  })}\n\n`,
                )
                res.end()
              }
            }
          })
        },
      },
    ],
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
        },
      },
    },
  }
})
