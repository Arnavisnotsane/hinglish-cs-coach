import { useState, useEffect, useRef } from 'react'

/**
 * Modern Edtech Evaluation Banner for Coach Avinash:
 * - Profile avatar with subtitle "FAANG DSA Interview Mentor"
 * - Numeric score pill badge
 * - Verbal Summary quote in a soft inset card
 * - Audio player controls with #2727E6 accents and rounded-full controls
 */
export function AudioPlayerWidget({
  audioBlob = null,
  isLoading = false,
  error = null,
  verbalSummary = '',
  score = null,
  isStreaming = false,
  autoPlay = true,
  onReplay = null,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)

  const audioRef = useRef(null)

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
  }

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const getScoreBadge = () => {
    if (score !== null && score !== undefined) {
      return (
        <span className="rounded-full bg-[#2727E6]/15 border border-[#2727E6]/30 text-white font-bold text-sm px-4 py-1.5 shadow-xs font-mono">
          SCORE: {score} / 10
        </span>
      )
    }

    if (isStreaming) {
      return (
        <span className="rounded-full bg-[#2727E6]/15 border border-[#2727E6]/30 text-white font-bold text-sm px-4 py-1.5 shadow-xs font-mono inline-flex items-center gap-1.5 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-[#2727E6]" />
          EVALUATING...
        </span>
      )
    }

    return (
      <span className="rounded-full bg-white/5 border border-white/10 text-zinc-400 font-bold text-sm px-4 py-1.5 font-mono">
        SCORE: -- / 10
      </span>
    )
  }

  return (
    <div className="sticky top-0 z-20 rounded-3xl bg-[#131422]/90 backdrop-blur-md border border-white/10 p-6 flex flex-col gap-4 shadow-lg shadow-black/20">
      {/* Profile Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2727E6] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#2727E6]/30 shrink-0">
            CA
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">Coach Avinash</h3>
              <span className="rounded-full px-2 py-0.5 bg-[#2727E6]/15 border border-[#2727E6]/30 text-[#6875F5] text-[10px] font-mono">
                Timbre v3
              </span>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3 px-1">
                  <span className="w-0.5 bg-[#2727E6] rounded-full animate-bounce [animation-delay:-0.3s] h-2.5" />
                  <span className="w-0.5 bg-[#2727E6] rounded-full animate-bounce [animation-delay:-0.15s] h-1.5" />
                  <span className="w-0.5 bg-[#2727E6] rounded-full animate-bounce h-3" />
                </div>
              )}
            </div>
            <span className="text-zinc-400 text-xs">FAANG DSA Interview Mentor</span>
          </div>
        </div>

        <div>{getScoreBadge()}</div>
      </div>

      {/* Verbal Summary Quote Inset Card */}
      {verbalSummary ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-zinc-200 text-sm leading-relaxed italic border-l-4 border-l-[#2727E6]">
          &ldquo;{verbalSummary}&rdquo;
        </div>
      ) : isStreaming ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-zinc-400 text-xs font-mono flex items-center gap-2.5">
          <span className="animate-spin text-[#6875F5]">⠋</span>
          <span>Gemini is generating interviewer analysis...</span>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-zinc-500 text-xs font-mono">
          Awaiting candidate explanation. Spoken coaching verdict and score will appear here.
        </div>
      )}

      {/* Audio Controls & Progress Bar */}
      {isLoading ? (
        <div className="rounded-2xl bg-[#2727E6]/10 border border-[#2727E6]/20 p-3 flex items-center justify-between text-xs font-mono text-[#6875F5]">
          <div className="flex items-center gap-2">
            <span className="animate-spin text-sm">⠋</span>
            <span>Synthesizing Coach Avinash voice verdict...</span>
          </div>
          <span className="text-zinc-500 text-[11px]">Gnani Timbre v3</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-950/40 border border-rose-900/60 p-3 flex items-center gap-2 text-xs font-mono text-rose-300">
          <span className="text-rose-400 font-bold">!</span>
          <span>Voice synthesis error: {error}</span>
        </div>
      ) : audioBlob ? (
        <div className="flex items-center gap-3 pt-1">
          {/* Rounded-full Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="h-9 w-9 rounded-full bg-[#2727E6] hover:bg-[#1F1FB8] text-white flex items-center justify-center shadow-md shadow-[#2727E6]/30 transition-all shrink-0 cursor-pointer focus:outline-none"
            aria-label={isPlaying ? 'Pause' : 'Play'}
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

          {/* Rounded-full Replay */}
          <button
            type="button"
            onClick={handleRestart}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center justify-center transition-colors text-xs font-mono shrink-0 cursor-pointer"
            title="Replay audio"
            aria-label="Replay audio"
          >
            ↺
          </button>

          {/* Progress Bar & Time */}
          <div className="flex-1 flex items-center gap-2.5 font-mono text-xs text-zinc-400">
            <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2727E6] h-full transition-all duration-100 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="whitespace-nowrap tabular-nums text-[11px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      ) : verbalSummary && onReplay ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-full px-4 py-1.5 bg-[#2727E6] hover:bg-[#1F1FB8] text-white text-xs font-medium shadow-md shadow-[#2727E6]/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔊</span> Listen to Coach Verdict
          </button>
        </div>
      ) : null}
    </div>
  )
}
