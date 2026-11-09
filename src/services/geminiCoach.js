/**
 * Client service to stream Gemini coaching evaluations via Server-Sent Events (SSE).
 *
 * @param {Object} options
 * @param {string} options.topic - Selected DSA topic
 * @param {string} options.transcript - Transcribed Hinglish speech
 * @param {function(string): void} options.onToken - Callback for incoming text tokens
 * @param {function(): void} options.onDone - Callback when streaming is fully completed
 * @param {function(string): void} options.onError - Callback when an error occurs
 * @param {AbortSignal} [options.signal] - AbortSignal for user cancellation
 */
export async function streamCoachingEvaluation({
  topic,
  transcript,
  onToken,
  onDone,
  onError,
  signal,
}) {
  try {
    const response = await fetch('/api/gemini-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, transcript }),
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Server error')
      throw new Error(`Server returned ${response.status}: ${errText}`)
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE messages separated by double newlines
      const messages = buffer.split('\n\n')
      // The last element is either empty (if ended on \n\n) or incomplete chunk
      buffer = messages.pop() || ''

      for (const message of messages) {
        const trimmed = message.trim()
        if (!trimmed.startsWith('data:')) continue

        const dataStr = trimmed.replace(/^data:\s*/, '')
        if (dataStr === '[DONE]') {
          onDone?.()
          return
        }

        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.error) {
            onError?.(parsed.error)
            return
          }
          if (parsed.text) {
            onToken?.(parsed.text)
          }
        } catch {
          // If not valid JSON, treat as raw text
          if (dataStr) onToken?.(dataStr)
        }
      }
    }

    // Flush any remaining buffer if stream ended
    if (buffer.trim().startsWith('data:')) {
      const dataStr = buffer.trim().replace(/^data:\s*/, '')
      if (dataStr === '[DONE]') {
        onDone?.()
      } else {
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.error) onError?.(parsed.error)
          else if (parsed.text) onToken?.(parsed.text)
        } catch {
          // ignore incomplete trailing bits
        }
        onDone?.()
      }
    } else {
      onDone?.()
    }
  } catch (err) {
    if (signal?.aborted || err.name === 'AbortError') {
      // Intentionally cancelled
      return
    }
    onError?.(err.message || 'Error communicating with coach.')
  }
}
