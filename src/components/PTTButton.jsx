import { useEffect, useRef } from 'react'

/**
 * Modern Edtech Interactive Pill Push-to-Talk button.
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

      if (e.repeat) return
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
    <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center gap-3 select-none">
      {/* Stage Header */}
      <div className="w-full flex items-center justify-between text-xs font-mono tracking-wider text-zinc-400">
        <span className="uppercase text-[11px] font-semibold text-zinc-400">
          PUSH-TO-TALK STUDIO
        </span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white/10 text-white/90 rounded-full border border-white/10 shadow-xs">
            Space
          </kbd>
          <span className="text-[10px] text-zinc-500">to speak</span>
        </div>
      </div>

      {/* Interactive Pill Button */}
      <div className="w-full flex items-center justify-center my-0.5">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          disabled={disabled || isProcessing}
          aria-label={isRecording ? 'Stop recording' : 'Start push to talk recording'}
          className={`w-full rounded-full px-8 py-4 font-medium text-white text-base flex items-center justify-center gap-2.5 select-none transition-all duration-200 group cursor-pointer ${
            isRecording
              ? 'bg-rose-600 scale-95 shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/20'
              : isProcessing
              ? 'bg-amber-600/80 cursor-not-allowed shadow-md shadow-amber-600/20'
              : 'bg-[#2727E6] hover:bg-[#1F1FB8] hover:scale-102 active:scale-98 shadow-md shadow-[#2727E6]/30'
          } ${disabled ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:bg-[#2727E6]' : ''}`}
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white shrink-0"
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
              <span>Transcribing Audio...</span>
            </>
          ) : isRecording ? (
            <>
              <span className="w-3.5 h-3.5 rounded-sm bg-white animate-pulse shrink-0" />
              <span>Tap to Finish</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3v6a3 3 0 003 3z"
                />
              </svg>
              <span>Push to Talk</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Countdown & Status Hint */}
      <div className="text-center font-mono text-xs h-4 flex items-center justify-center">
        {isRecording ? (
          <div
            className={`flex items-center gap-1.5 ${
              isWarning ? 'text-amber-400 font-bold' : 'text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              REC 00:{formatSeconds(secondsRecorded)} / 00:{formatSeconds(maxSeconds)}
            </span>
            {isWarning && <span className="text-[10px] text-amber-400">(limit approaching)</span>}
          </div>
        ) : isProcessing ? (
          <span className="text-amber-300 animate-pulse">
            Transcribing via Gnani Prisma v3...
          </span>
        ) : disabled ? (
          <span className="text-zinc-500">Select a topic above to enable mic</span>
        ) : (
          <span className="text-zinc-400">Hold Space or click to speak</span>
        )}
      </div>
    </div>
  )
}
