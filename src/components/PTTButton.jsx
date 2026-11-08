import { useRef } from 'react'

/**
 * Push-To-Talk Button supporting both:
 * 1. Hold mode: Press & hold (>300ms) to record, release to submit
 * 2. Toggle mode: Quick click (<300ms) to start, click again to stop
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

  const isRecording = recorderState === 'recording'
  const isProcessing = recorderState === 'processing'

  const handlePointerDown = (e) => {
    // Only react to main button click (left click / touch)
    if (e.button !== undefined && e.button !== 0) return
    if (disabled || isProcessing) return

    if (isRecording) {
      // If already recording in toggle mode, clicking stops it
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
      // Hold mode ended -> stop
      isHoldModeRef.current = false
      onStop?.()
    } else {
      // Quick tap / click detected (<300ms)
      if (isRecording) {
        onStop?.()
      } else {
        onStart?.()
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      if (disabled || isProcessing) return
      if (isRecording) {
        onStop?.()
      } else {
        onStart?.()
      }
    }
  }

  const isWarning = secondsRecorded >= 20

  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring during recording */}
        {isRecording && (
          <span className="absolute inline-flex h-28 w-28 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
        )}

        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          disabled={disabled || isProcessing}
          aria-label={isRecording ? 'Stop recording' : 'Start push to talk recording'}
          className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 border-2 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/30 ${
            isRecording
              ? 'bg-red-950/80 border-red-500 text-red-400 shadow-red-900/40 scale-105'
              : isProcessing
              ? 'bg-yellow-950/40 border-yellow-500/80 text-yellow-400 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-750 border-gray-600 hover:border-green-500/70 text-gray-200 hover:text-green-400 active:scale-95'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isProcessing ? (
            <svg
              className="animate-spin h-8 w-8 text-yellow-400"
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
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-sm bg-red-500 mb-1 animate-pulse" />
              <span className="text-[10px] font-mono tracking-wider font-bold">STOP</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Mic Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <span className="text-[10px] font-mono tracking-wider mt-0.5 text-gray-400">
                PTT
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Countdown and Mode Hint */}
      <div className="text-center">
        {isRecording ? (
          <div
            className={`font-mono text-xs font-semibold tracking-wider ${
              isWarning ? 'text-amber-400 animate-pulse font-bold' : 'text-red-400'
            }`}
          >
            ● REC {secondsRecorded}s / {maxSeconds}s {isWarning && '(Gnani 30s limit)'}
          </div>
        ) : isProcessing ? (
          <div className="font-mono text-xs text-yellow-400 tracking-wider animate-pulse">
            Transcribing via Gnani Prisma v3...
          </div>
        ) : (
          <div className="text-xs text-gray-400 font-mono">
            Hold to talk <span className="text-gray-600">|</span> Click to toggle
          </div>
        )}
      </div>
    </div>
  )
}
