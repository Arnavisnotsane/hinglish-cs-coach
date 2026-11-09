import { useState, useEffect, useRef } from 'react'

/**
 * Audio Player Widget for Coach Voice Feedback (Gnani Timbre Avinash).
 */
export function AudioPlayerWidget({
  audioBlob = null,
  isLoading = false,
  error = null,
  verbalSummary = '',
  autoPlay = true,
  onReplay = null,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)

  const audioRef = useRef(null)

  // Handle blob changes
  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }

    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0)
      if (autoPlay) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio auto-play prevented by browser policy:', err)
            setIsPlaying(false)
          })
      }
    }

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime || 0)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.onpause = () => {
      setIsPlaying(false)
    }

    audio.onplay = () => {
      setIsPlaying(true)
    }

    return () => {
      audio.pause()
      audio.src = ''
      URL.revokeObjectURL(url)
      audioRef.current = null
    }
  }, [audioBlob, autoPlay])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(console.error)
    }
  }

  const handleRestart = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error)
    onReplay?.()
  }

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (isLoading) {
    return (
      <div className="p-3.5 rounded-lg bg-gray-950/80 border border-green-900/40 flex items-center justify-between text-xs font-mono text-green-400">
        <div className="flex items-center gap-2.5">
          <span className="animate-spin text-sm">⠋</span>
          <span>Synthesizing Coach Avinash voice feedback...</span>
        </div>
        <span className="text-gray-500 text-[11px]">Gnani Timbre v3</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-xs font-mono text-red-300 flex items-center gap-2">
        <span className="text-red-400 font-bold">!</span>
        <span>Voice synthesis failed: {error}</span>
      </div>
    )
  }

  if (!audioBlob) return null

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-gray-950/90 border border-gray-800 shadow-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-300">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-semibold text-green-400">Coach Avinash</span>
          <span className="text-gray-500 text-[11px]">(Timbre v3 Voice)</span>
        </div>

        {/* Animated Equalizer Waveform indicator */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3.5 px-2">
            <span className="w-1 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
            <span className="w-1 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
            <span className="w-1 bg-green-400 rounded-full animate-bounce h-3.5" />
            <span className="w-1 bg-green-400 rounded-full animate-bounce [animation-delay:-0.25s] h-2.5" />
          </div>
        )}
      </div>

      {verbalSummary && (
        <p className="text-xs text-gray-300 font-sans italic border-l-2 border-green-500/70 pl-2.5 my-1">
          &ldquo;{verbalSummary}&rdquo;
        </p>
      )}

      {/* Controls Bar */}
      <div className="flex items-center gap-3 pt-1">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="h-9 w-9 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40"
          aria-label={isPlaying ? 'Pause spoken feedback' : 'Play spoken feedback'}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Replay Button */}
        <button
          type="button"
          onClick={handleRestart}
          className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-green-400 border border-gray-700 flex items-center justify-center transition-colors text-xs font-mono"
          title="Replay from beginning"
          aria-label="Replay audio"
        >
          ↺
        </button>

        {/* Progress Bar & Timestamp */}
        <div className="flex-1 flex items-center gap-2.5 font-mono text-[11px] text-gray-400">
          <div className="flex-1 bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-100 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
