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
function extractErrorMessage(dataStr) {
  let errMsg = 'Error from Gemini coach'
  try {
    const parsed = JSON.parse(dataStr)
    errMsg = parsed.message || parsed.error || errMsg
  } catch {
    if (dataStr) errMsg = dataStr
  }

  // Google API often nests JSON error strings inside message
  if (typeof errMsg === 'string' && (errMsg.startsWith('{') || errMsg.includes('{"error"'))) {
    try {
      const nested = JSON.parse(errMsg)
      if (nested.error?.message) {
        try {
          const inner = JSON.parse(nested.error.message)
          if (inner.error?.message) return inner.error.message
        } catch {
          return nested.error.message
        }
      }
    } catch {}
  }

  return errMsg
}

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
        if (!trimmed) continue

        let eventType = 'message'
        let dataStr = ''

        const lines = trimmed.split('\n')
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.replace(/^event:\s*/, '').trim()
          } else if (line.startsWith('data:')) {
            dataStr = line.replace(/^data:\s*/, '').trim()
          }
        }

        if (eventType === 'done' || dataStr === '[DONE]') {
          onDone?.()
          return
        }

        if (eventType === 'error') {
          const errMsg = extractErrorMessage(dataStr)
          onError?.(errMsg)
          return
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.error) {
              onError?.(parsed.error)
              return
            }
            if (parsed.message && !parsed.text) {
              onError?.(parsed.message)
              return
            }
            if (parsed.text) {
              onToken?.(parsed.text)
            }
          } catch {
            onToken?.(dataStr)
          }
        }
      }
    }

    // Flush any remaining buffer if stream ended
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      let eventType = 'message'
      let dataStr = ''

      const lines = trimmed.split('\n')
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.replace(/^event:\s*/, '').trim()
        } else if (line.startsWith('data:')) {
          dataStr = line.replace(/^data:\s*/, '').trim()
        }
      }

      if (eventType === 'done' || dataStr === '[DONE]') {
        onDone?.()
      } else if (eventType === 'error') {
        const errMsg = extractErrorMessage(dataStr)
        onError?.(errMsg)
      } else if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.error) onError?.(parsed.error)
          else if (parsed.message && !parsed.text) onError?.(parsed.message)
          else if (parsed.text) onToken?.(parsed.text)
        } catch {
          onToken?.(dataStr)
        }
        onDone?.()
      } else {
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
