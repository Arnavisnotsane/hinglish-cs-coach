import { useState, useEffect, useRef, useCallback } from 'react'
import { TopicSelector } from './components/TopicSelector'
import { PTTButton } from './components/PTTButton'
import { HistorySidebar } from './components/HistorySidebar'
import { CoachFeedback } from './components/CoachFeedback'
import { useRecorder } from './hooks/useRecorder'
import { transcribeAudio } from './services/gnaniStt'
import { streamCoachingEvaluation } from './services/geminiCoach'

export default function App() {
  const [topic, setTopic] = useState('')
  const [appPhase, setAppPhase] = useState('idle') // 'idle' | 'recording' | 'processing' | 'coaching' | 'done' | 'error'
  const [transcript, setTranscript] = useState('')
  const [sttError, setSttError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)

  // Coach Feedback state (Phase 2)
  const [coachFeedback, setCoachFeedback] = useState('')
  const [isCoachStreaming, setIsCoachStreaming] = useState(false)
  const [coachError, setCoachError] = useState(null)

  const recorder = useRecorder()
  const abortControllerRef = useRef(null)

  // Cancel any active streaming evaluation
  const abortCurrentEvaluation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsCoachStreaming(false)
  }, [])

  // Sync recorder state with appPhase during active recording
  useEffect(() => {
    if (recorder.state === 'recording') {
      abortCurrentEvaluation()
      setAppPhase('recording')
      setSttError(null)
      setCoachError(null)
    } else if (recorder.state === 'error') {
      setAppPhase('error')
      setSttError(recorder.error || 'Microphone error')
    }
  }, [recorder.state, recorder.error, abortCurrentEvaluation])

  // Trigger Gemini streaming evaluation
  const runCoachingEvaluation = useCallback(
    (targetTopic, targetTranscript) => {
      if (!targetTopic || !targetTranscript || targetTranscript.startsWith('(No speech')) {
        return
      }

      abortCurrentEvaluation()
      setCoachFeedback('')
      setCoachError(null)
      setIsCoachStreaming(true)
      setAppPhase('coaching')

      const controller = new AbortController()
      abortControllerRef.current = controller

      streamCoachingEvaluation({
        topic: targetTopic,
        transcript: targetTranscript,
        signal: controller.signal,
        onToken: (token) => {
          setCoachFeedback((prev) => prev + token)
        },
        onDone: () => {
          setIsCoachStreaming(false)
          setAppPhase('done')
          abortControllerRef.current = null
        },
        onError: (err) => {
          setCoachError(err)
          setIsCoachStreaming(false)
          setAppPhase('error')
          abortControllerRef.current = null
        },
      })
    },
    [abortCurrentEvaluation],
  )

  // Handle audio processing when recorder stops with a valid blob
  useEffect(() => {
    if (recorder.state === 'stopped' && recorder.audioBlob) {
      if (!topic || topic.trim() === '') {
        setSttError('Please select a DSA topic first before speaking.')
        setAppPhase('error')
        return
      }

      setAppPhase('processing')
      setSttError(null)

      // Create preview URL for the recorded WAV
      const url = URL.createObjectURL(recorder.audioBlob)
      setAudioUrl(url)

      transcribeAudio(recorder.audioBlob, topic)
        .then((text) => {
          const cleanText = text?.trim() || ''
          if (!cleanText) {
            setTranscript('(No speech detected. Please speak clearly and try again.)')
            setAppPhase('done')
            return
          }

          setTranscript(cleanText)
          // Automatically pipe transcribed text into the Gemini coach evaluation
          runCoachingEvaluation(topic, cleanText)
        })
        .catch((err) => {
          console.error('Transcription failure:', err)
          setSttError(err.message || 'Speech-to-text failed. Check Gnani API key and network.')
          setAppPhase('error')
        })
    }
  }, [recorder.state, recorder.audioBlob, topic, runCoachingEvaluation])

  const handleStartRecording = () => {
    if (!topic || topic.trim() === '') {
      setSttError('Please select or enter a target DSA topic first.')
      return
    }
    abortCurrentEvaluation()
    setSttError(null)
    setCoachError(null)
    setTranscript('')
    setCoachFeedback('')
    recorder.startRecording()
  }

  const handleStopRecording = () => {
    recorder.stopRecording()
  }

  const handleRetryCoaching = () => {
    if (topic && transcript && !transcript.startsWith('(No speech')) {
      runCoachingEvaluation(topic, transcript)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-green-500/30 selection:text-green-300">
      {/* Top Navbar */}
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-green-400 font-mono text-sm border border-gray-700 flex items-center gap-2 transition-colors"
              title="Open History"
            >
              <span>☰</span>
              <span className="hidden sm:inline text-xs font-semibold">History</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <h1 className="font-mono font-bold tracking-tight text-sm sm:text-base text-gray-100">
                Hinglish<span className="text-green-400">CS</span> Coach
              </h1>
              <span className="hidden md:inline text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                Phase 2 Brain
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 hidden sm:inline">STT:</span>
              <span className="text-gray-300">Gnani Prisma</span>
            </div>
            <span className="text-gray-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 hidden sm:inline">Brain:</span>
              <span className="text-green-400 font-semibold">Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        {/* Terminal Card 1: Setup */}
        <section className="bg-gray-900/80 rounded-xl border border-gray-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-gray-400 ml-2">session://setup</span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">
              Hinglish codemix • indic-auto
            </span>
          </div>

          <TopicSelector value={topic} onChange={setTopic} />
        </section>

        {/* Terminal Card 2: Audio Interaction */}
        <section className="bg-gray-900/80 rounded-xl border border-gray-800 p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-gray-800/80 pb-3 mb-2">
            <span className="text-xs font-mono text-gray-400">audio://input-stream</span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded ${
                appPhase === 'recording'
                  ? 'bg-red-950 text-red-400 border border-red-800/80 animate-pulse'
                  : appPhase === 'processing'
                  ? 'bg-yellow-950 text-yellow-400 border border-yellow-800/80'
                  : appPhase === 'coaching'
                  ? 'bg-purple-950 text-purple-400 border border-purple-800/80'
                  : appPhase === 'done'
                  ? 'bg-green-950 text-green-400 border border-green-800/80'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              status: {appPhase}
            </span>
          </div>

          {/* Large PTT Button */}
          <PTTButton
            recorderState={appPhase === 'coaching' ? 'idle' : appPhase}
            secondsRecorded={recorder.secondsRecorded}
            maxSeconds={recorder.maxSeconds}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            disabled={!topic || topic.trim() === ''}
          />

          {!topic && (
            <p className="text-xs font-mono text-gray-500 text-center">
              ▲ Select a topic above to enable the microphone
            </p>
          )}

          {/* Audio Preview if available */}
          {audioUrl && appPhase !== 'recording' && (
            <div className="w-full pt-2 flex flex-col items-center">
              <span className="text-[11px] font-mono text-gray-500 mb-1">
                Last recorded WAV (16kHz mono)
              </span>
              <audio controls src={audioUrl} className="h-8 w-full max-w-md opacity-80" />
            </div>
          )}

          {/* STT Error Banner */}
          {sttError && (
            <div className="w-full mt-2 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 font-mono text-xs flex items-start gap-2">
              <span className="text-red-400 font-bold">!</span>
              <div className="flex-1 whitespace-pre-wrap">{sttError}</div>
            </div>
          )}
        </section>

        {/* Terminal Card 3: Transcript Output */}
        <section className="bg-gray-900/80 rounded-xl border border-gray-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
            <span className="text-xs font-mono text-gray-400">stt://transcript-output</span>
            {transcript && !transcript.startsWith('(No speech') && (
              <span className="text-[11px] font-mono text-green-400">
                ✓ Transcribed successfully
              </span>
            )}
          </div>

          <div className="min-h-24 max-h-60 overflow-y-auto p-3.5 rounded-lg bg-gray-950/90 border border-gray-800 font-mono text-sm leading-relaxed">
            {transcript ? (
              <p className="text-gray-100 whitespace-pre-wrap">{transcript}</p>
            ) : appPhase === 'processing' ? (
              <div className="flex items-center gap-2 text-yellow-400/90">
                <span className="inline-block animate-spin">⠋</span>
                <span>Transcribing Hinglish audio via Gnani Prisma v3...</span>
              </div>
            ) : (
              <p className="text-gray-600 italic">
                Your transcribed speech will appear here after you speak in Hinglish...
              </p>
            )}
          </div>
        </section>

        {/* Terminal Card 4: Coach Feedback (Phase 2 Active) */}
        <CoachFeedback
          feedbackText={coachFeedback}
          isStreaming={isCoachStreaming}
          error={coachError}
          onRetry={handleRetryCoaching}
        />
      </main>

      {/* History Slide-out Drawer */}
      <HistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={[]}
      />
    </div>
  )
}
