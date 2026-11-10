import { useState, useEffect, useRef } from 'react'

/**
 * Unified Sticky Header Banner for the Interviewer Evaluation pane:
 * Combines:
 * 1. Interviewer status + Coach Avinash voice indicator
 * 2. Semantic Numeric Score Badge
 * 3. Verbal Summary quote
 * 4. Spoken audio playback widget with equalizer
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
      const isHigh = score >= 7
      const isMed = score >= 4 && score < 7
      const colorClass = isHigh
        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80'
        : isMed
        ? 'bg-amber-950/90 text-amber-300 border-amber-800/80'
        : 'bg-rose-950/90 text-rose-300 border-rose-800/80'

      return (
        <span
          className={`px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider border shadow-sm ${colorClass}`}
        >
          SCORE: {score} / 10
        </span>
      )
    }

    if (isStreaming) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-zinc-800 text-amber-300 border border-zinc-700 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          EVALUATING...
        </span>
      )
    }

    return (
      <span className="px-2.5 py-1 rounded text-xs font-mono text-zinc-500 border border-zinc-800 bg-zinc-950">
        SCORE: -- / 10
      </span>
    )
  }

  return (
    <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-md border border-zinc-800/90 rounded-xl p-4 shadow-lg space-y-3">
      {/* Header Row: Label & Score Pill */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/70 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase font-semibold">
            INTERVIEWER EVALUATION
          </span>
          <span className="text-zinc-600">•</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Coach Avinash</span>
            <span className="text-zinc-500 text-[10px] hidden sm:inline">(Timbre v3)</span>
          </div>

          {/* Equalizer animation when playing */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3 px-1">
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-2.5" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-1.5" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-3" />
            </div>
          )}
        </div>

        <div>{getScoreBadge()}</div>
      </div>

      {/* Verbal Summary Quote */}
      {verbalSummary ? (
        <div className="border-l-2 border-emerald-500/80 bg-zinc-950/70 p-2.5 rounded-r border-t border-r border-b border-zinc-800/40">
          <p className="text-xs sm:text-[13px] text-zinc-200 font-sans italic leading-relaxed">
            &ldquo;{verbalSummary}&rdquo;
          </p>
        </div>
      ) : isStreaming ? (
        <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-800/40">
          <p className="text-xs text-zinc-400 font-mono flex items-center gap-2">
            <span className="animate-spin text-amber-400">⠋</span>
            <span>Gemini is generating interviewer analysis...</span>
          </p>
        </div>
      ) : (
        <div className="bg-zinc-950/40 p-2.5 rounded border border-zinc-800/40 text-xs text-zinc-500 font-mono">
          Awaiting candidate explanation. Spoken coaching verdict and score will appear here.
        </div>
      )}

      {/* Spoken Voice Audio Controls */}
      {isLoading ? (
        <div className="flex items-center justify-between p-2 rounded bg-zinc-950/80 border border-emerald-900/40 text-xs font-mono text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="animate-spin text-sm">⠋</span>
            <span>Synthesizing spoken feedback...</span>
          </div>
          <span className="text-zinc-500 text-[10px]">Gnani Timbre v3</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-2 rounded bg-rose-950/40 border border-rose-900/60 text-xs font-mono text-rose-300">
          <span className="text-rose-400 font-bold">!</span>
          <span>Voice synthesis error: {error}</span>
        </div>
      ) : audioBlob ? (
        <div className="flex items-center gap-2.5 pt-0.5">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="h-7 w-7 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center transition-colors focus:outline-none shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={handleRestart}
            className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 border border-zinc-700 flex items-center justify-center transition-colors text-xs font-mono shrink-0"
            title="Replay audio"
            aria-label="Replay audio"
          >
            ↺
          </button>

          {/* Progress Bar & Time */}
          <div className="flex-1 flex items-center gap-2 font-mono text-[10px] text-zinc-400">
            <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-100 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="whitespace-nowrap tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      ) : verbalSummary && onReplay ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReplay}
            className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-950/70 transition-colors"
          >
            <span>🔊</span> Listen to Coach Verdict
          </button>
        </div>
      ) : null}
    </div>
  )
}
