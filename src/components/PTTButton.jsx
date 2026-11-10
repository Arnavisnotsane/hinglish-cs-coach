import { useEffect, useRef } from 'react'

/**
 * Compact, tactile Push-to-Talk stage with live timer and [Space] keycap badge.
 * Supports both:
 * 1. Spacebar or click-and-hold (>300ms) to record, release to submit
 * 2. Quick tap / toggle (<300ms) to start, click again to stop
 */
export function PTTButton({
  recorderState = 'idle',
  secondsRecorded = 0,
  maxSeconds = 25,
  onStart,
  onStop,
  disabled = false,
}) {
  const holdTimerRef = useRef(null)
  const isHoldModeRef = useRef(false)
  const isSpaceHeldRef = useRef(false)

  const isRecording = recorderState === 'recording'
  const isProcessing = recorderState === 'processing'

  // Global Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code !== 'Space') return
      // Ignore if user is typing in an input or textarea
      const targetTag = e.target?.tagName?.toLowerCase()
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return
      }

      if (e.repeat) return // Prevent repeated keydown events
      e.preventDefault()

      if (disabled || isProcessing) return

      if (isRecording) {
        onStop?.()
        isSpaceHeldRef.current = false
      } else {
        isSpaceHeldRef.current = true
        onStart?.()
      }
    }

    const handleKeyUp = (e) => {
      if (e.code !== 'Space') return
      const targetTag = e.target?.tagName?.toLowerCase()
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return
      }

      e.preventDefault()
      if (isSpaceHeldRef.current && isRecording) {
        isSpaceHeldRef.current = false
        onStop?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [disabled, isProcessing, isRecording, onStart, onStop])

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    if (disabled || isProcessing) return

    if (isRecording) {
      return
    }

    holdTimerRef.current = setTimeout(() => {
      isHoldModeRef.current = true
      onStart?.()
    }, 300)
  }

  const handlePointerUp = () => {
    if (disabled || isProcessing) return

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    if (isHoldModeRef.current) {
      isHoldModeRef.current = false
      onStop?.()
    } else {
      if (isRecording) {
        onStop?.()
      } else {
        onStart?.()
      }
    }
  }

  const isWarning = secondsRecorded >= 20

  const formatSeconds = (sec) => {
    const s = Math.floor(sec)
    return s < 10 ? `0${s}` : `${s}`
  }

  return (
    <div className="w-full bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-3.5 flex flex-col items-center justify-center gap-2.5 select-none transition-colors">
      <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider text-zinc-400">
        <span className="uppercase font-semibold">PUSH-TO-TALK STUDIO</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 rounded border border-zinc-700/80 shadow-sm">
            Space
          </kbd>
          <span className="text-[10px] text-zinc-500">to speak</span>
        </div>
      </div>

      {/* Button Stage */}
      <div className="relative flex items-center justify-center my-1">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          disabled={disabled || isProcessing}
          aria-label={isRecording ? 'Stop recording' : 'Start push to talk recording'}
          className={`relative z-10 w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-zinc-600 ${
            isRecording
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-inner scale-102 ring-2 ring-rose-500/20'
              : isProcessing
              ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 cursor-not-allowed'
              : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 hover:border-zinc-500 text-zinc-200 active:scale-96 cursor-pointer shadow-sm'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <svg
              className="animate-spin h-5 w-5 text-amber-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isRecording ? (
            <span className="w-4 h-4 rounded-sm bg-rose-500 animate-pulse" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3v6a3 3 0 003 3z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Status Bar */}
      <div className="text-center font-mono text-[11px] h-4">
        {isRecording ? (
          <div
            className={`flex items-center gap-1.5 ${
              isWarning ? 'text-amber-400 font-bold' : 'text-rose-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>
              REC 00:{formatSeconds(secondsRecorded)} / 00:{formatSeconds(maxSeconds)}
            </span>
            {isWarning && <span className="text-[10px] text-amber-500">(limit approaching)</span>}
          </div>
        ) : isProcessing ? (
          <span className="text-amber-400/90 animate-pulse">
            Transcribing via Gnani Prisma v3...
          </span>
        ) : disabled ? (
          <span className="text-zinc-500">Select a topic above to enable mic</span>
        ) : (
          <span className="text-zinc-400">Hold Space or click to talk</span>
        )}
      </div>
    </div>
  )
}
