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
  view.setUint32(16, 16, true)        // PCM subchunk size
  view.setUint16(20, 1, true)         // PCM format
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
    if (sourceNodeRef.current) { try { sourceNodeRef.current.disconnect() } catch (_) {} }
    if (workletNodeRef.current) { try { workletNodeRef.current.disconnect() } catch (_) {} }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
    }
    audioCtxRef.current = null
    streamRef.current = null
    workletNodeRef.current = null
    sourceNodeRef.current = null
  }, [])

  const stopRecording = useCallback((fromTimer = false) => {
    if (!fromTimer) clearInterval(timerRef.current)

    const chunks = [...chunksRef.current]
    cleanup()

    if (chunks.length === 0) {
      setState('idle')
      return
    }

    // Flatten all Float32Array chunks
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
        chunksRef.current.push(new Float32Array(e.data))
      }

      source.connect(worklet)
      // Do NOT connect to ctx.destination — prevents audio feedback loop

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

  return {
    state,
    startRecording,
    stopRecording: () => stopRecording(false),
    audioBlob,
    error,
    secondsRecorded,
    maxSeconds: MAX_SECONDS,
  }
}
