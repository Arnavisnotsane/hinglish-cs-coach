import { useState, useEffect, useRef, useCallback } from 'react'
import { TopicSelector } from './components/TopicSelector'
import { PTTButton } from './components/PTTButton'
import { HistorySidebar } from './components/HistorySidebar'
import { CoachFeedback } from './components/CoachFeedback'
import { AudioPlayerWidget } from './components/AudioPlayerWidget'
import { useRecorder } from './hooks/useRecorder'
import { transcribeAudio } from './services/gnaniStt'
import { streamCoachingEvaluation } from './services/geminiCoach'
import { extractVerbalSummary, extractScore, synthesizeSpeech } from './services/gnaniTts'
import { getStoredSessions, saveSession, deleteSession, clearAllSessions } from './services/historyStorage'

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

  // TTS & Voice feedback state (Phase 3)
  const [verbalSummaryText, setVerbalSummaryText] = useState('')
  const [ttsAudioBlob, setTtsAudioBlob] = useState(null)
  const [isTtsLoading, setIsTtsLoading] = useState(false)
  const [ttsError, setTtsError] = useState(null)

  // Session History state (Phase 3)
  const [sessions, setSessions] = useState(() => getStoredSessions())

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
      setTtsAudioBlob(null)
      setTtsError(null)
    } else if (recorder.state === 'error') {
      setAppPhase('error')
      setSttError(recorder.error || 'Microphone error')
    }
  }, [recorder.state, recorder.error, abortCurrentEvaluation])

  // Trigger Gemini streaming evaluation + automatic Gnani TTS voice synthesis
  const runCoachingEvaluation = useCallback(
    (targetTopic, targetTranscript) => {
      if (!targetTopic || !targetTranscript || targetTranscript.startsWith('(No speech')) {
        return
      }

      abortCurrentEvaluation()
      setCoachFeedback('')
      setCoachError(null)
      setVerbalSummaryText('')
      setTtsAudioBlob(null)
      setTtsError(null)
      setIsCoachStreaming(true)
      setAppPhase('coaching')

      const controller = new AbortController()
      abortControllerRef.current = controller

      let accumulatedFeedback = ''

      streamCoachingEvaluation({
        topic: targetTopic,
        transcript: targetTranscript,
        signal: controller.signal,
        onToken: (token) => {
          accumulatedFeedback += token
          setCoachFeedback((prev) => prev + token)
        },
        onDone: async () => {
          setIsCoachStreaming(false)
          setAppPhase('done')
          abortControllerRef.current = null

          // Phase 3: Extract verbal summary & numeric score
          const summary = extractVerbalSummary(accumulatedFeedback)
          const score = extractScore(accumulatedFeedback)
          setVerbalSummaryText(summary)

          // Persist completed evaluation into localStorage history
          const updatedSessions = saveSession({
            topic: targetTopic,
            transcript: targetTranscript,
            feedback: accumulatedFeedback,
            score,
            verbalSummary: summary,
          })
          setSessions(updatedSessions)

          // Phase 3: Automatically vocalize verbal verdict via Gnani Timbre Avinash
          if (summary) {
            setIsTtsLoading(true)
            setTtsError(null)
            try {
              const audioBlob = await synthesizeSpeech(summary)
              setTtsAudioBlob(audioBlob)
            } catch (err) {
              console.error('TTS synthesis failed:', err)
              setTtsError(err.message || 'Failed to synthesize coach audio.')
            } finally {
              setIsTtsLoading(false)
            }
          }
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
          // Automatically pipe transcribed text into Gemini coaching + TTS
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
    setVerbalSummaryText('')
    setTtsAudioBlob(null)
    setTtsError(null)
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

  // Restore past session when selected from History drawer
  const handleSelectSession = (session) => {
    if (!session) return
    abortCurrentEvaluation()
    setTopic(session.topic)
    setTranscript(session.transcript || '')
    setCoachFeedback(session.feedback || '')
    setVerbalSummaryText(session.verbalSummary || '')
    setTtsAudioBlob(null)
    setTtsError(null)
    setSttError(null)
    setCoachError(null)
    setAppPhase('done')
  }

  // On-demand TTS synthesis for restored session
  const handleSynthesizePastSession = async () => {
    if (!verbalSummaryText) return
    setIsTtsLoading(true)
    setTtsError(null)
    try {
      const audioBlob = await synthesizeSpeech(verbalSummaryText)
      setTtsAudioBlob(audioBlob)
    } catch (err) {
      console.error('TTS replay failed:', err)
      setTtsError(err.message || 'Failed to synthesize coach audio.')
    } finally {
      setIsTtsLoading(false)
    }
  }

  const handleDeleteSession = (sessionId) => {
    const updated = deleteSession(sessionId)
    setSessions(updated)
  }

  const handleClearAllSessions = () => {
    const updated = clearAllSessions()
    setSessions(updated)
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
              className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-green-400 font-mono text-sm border border-gray-700 flex items-center gap-2 transition-colors relative"
              title="Open History"
            >
              <span>☰</span>
              <span className="hidden sm:inline text-xs font-semibold">History</span>
              {sessions.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  {sessions.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <h1 className="font-mono font-bold tracking-tight text-sm sm:text-base text-gray-100">
                Hinglish<span className="text-green-400">CS</span> Coach
              </h1>
              <span className="hidden md:inline text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                Phase 3 Full Stack
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <span className="text-gray-500 hidden sm:inline">Ears:</span>
              <span className="text-gray-300">Prisma</span>
            </div>
            <span className="text-gray-700">•</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 hidden sm:inline">Brain:</span>
              <span className="text-green-400 font-semibold">Gemini 3.8</span>
            </div>
            <span className="text-gray-700">•</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 hidden sm:inline">Mouth:</span>
              <span className="text-purple-400 font-semibold">Avinash</span>
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
                Your Spoken Recording (16kHz mono WAV)
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

        {/* Terminal Card 4: Audio Voice Coach (Phase 3 Mouth) */}
        {(ttsAudioBlob || isTtsLoading || ttsError || verbalSummaryText) && (
          <section className="space-y-2">
            <AudioPlayerWidget
              audioBlob={ttsAudioBlob}
              isLoading={isTtsLoading}
              error={ttsError}
              verbalSummary={verbalSummaryText}
              autoPlay={true}
              onReplay={handleSynthesizePastSession}
            />
            {verbalSummaryText && !ttsAudioBlob && !isTtsLoading && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSynthesizePastSession}
                  className="text-xs font-mono text-green-400 hover:text-green-300 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-950/40 border border-green-800/50 hover:bg-green-950/70 transition-colors"
                >
                  <span>🔊</span> Listen to Coach Verdict
                </button>
              </div>
            )}
          </section>
        )}

        {/* Terminal Card 5: Coach Scorecard (Phase 2 Brain) */}
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
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
      />
    </div>
  )
}
