/**
 * Gnani AI Timbre v3.0 Speech Synthesis & Summary Parser Service.
 */

/**
 * Extracts conversational verbal summary from Gemini scorecard markdown.
 *
 * @param {string} markdownText
 * @returns {string}
 */
export function extractVerbalSummary(markdownText) {
  if (!markdownText) return ''

  // Look for ### Verbal Summary (with or without preceding emojis/icons) up to the next ### or end of text
  const match = markdownText.match(/###\s*(?:[^\w\s]+\s*)?Verbal Summary\s*([\s\S]*?)(?=###|$)/i)
  if (!match || !match[1]) return ''

  // Clean out markdown formatting symbols (*, _, `, #, >, ~) and normalize spacing
  return match[1]
    .replace(/[*_#`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extracts integer score (1-10) from Gemini scorecard markdown if present.
 *
 * @param {string} markdownText
 * @returns {number|null}
 */
export function extractScore(markdownText) {
  if (!markdownText) return null
  const match = markdownText.match(/###\s*(?:[^\w\s]+\s*)?Score:\s*(\d+)\s*\/\s*10/i)
  if (match && match[1]) {
    const val = parseInt(match[1], 10)
    return isNaN(val) ? null : val
  }
  return null
}

/**
 * Synthesizes text to spoken audio via Gnani Timbre v3.0 REST API (proxied via /api/gnani-tts).
 *
 * @param {string} text - Spoken text to vocalize
 * @param {string} [language='hi-IN'] - 'hi-IN' (supports Hindi/Hinglish) or 'en-IN' (English)
 * @returns {Promise<Blob>} - Returns audio/wav Blob
 */
export async function synthesizeSpeech(text, language = 'hi-IN') {
  const cleanText = text?.trim()
  if (!cleanText) {
    throw new Error('No text provided for speech synthesis.')
  }

  const payload = {
    text: cleanText,
    model: 'timbre-v3.0',
    voice: 'Avinash',
    language: language || 'hi-IN',
    speed: 1.0,
    audio_config: {
      sample_rate: 24000,
      encoding: 'linear_pcm',
      container: 'wav',
    },
  }

  const response = await fetch('/api/gnani-tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'TTS service error')
    throw new Error(`Gnani TTS error ${response.status}: ${errorText}`)
  }

  // Response is direct binary WAV audio
  const arrayBuffer = await response.arrayBuffer()
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
