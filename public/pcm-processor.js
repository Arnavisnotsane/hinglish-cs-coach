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
