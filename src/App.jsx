import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

  // Coach Feedback state
  const [coachFeedback, setCoachFeedback] = useState('')
  const [isCoachStreaming, setIsCoachStreaming] = useState(false)
  const [coachError, setCoachError] = useState(null)

  // TTS & Spoken Voice feedback state
  const [verbalSummaryText, setVerbalSummaryText] = useState('')
  const [ttsAudioBlob, setTtsAudioBlob] = useState(null)
  const [isTtsLoading, setIsTtsLoading] = useState(false)
  const [ttsError, setTtsError] = useState(null)

  // Session History state
  const [sessions, setSessions] = useState(() => getStoredSessions())

  const recorder = useRecorder()
  const abortControllerRef = useRef(null)

  // Compute live score from feedback text if available
  const currentScore = useMemo(() => {
    return extractScore(coachFeedback)
  }, [coachFeedback])

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

  // Trigger Gemini streaming evaluation + automatic parallel Gnani TTS voice synthesis
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
      let ttsTriggered = false

      streamCoachingEvaluation({
        topic: targetTopic,
        transcript: targetTranscript,
        signal: controller.signal,
        onToken: (token) => {
          accumulatedFeedback += token
          setCoachFeedback((prev) => prev + token)

          // Latency Optimization: As soon as the Score heading appears, the Verbal Summary
          // is complete. Immediately trigger Gnani TTS speech synthesis in parallel!
          if (
            !ttsTriggered &&
            (accumulatedFeedback.includes('### Score') ||
              accumulatedFeedback.includes('### 📊 Score') ||
              accumulatedFeedback.includes('Score:'))
          ) {
            const earlySummary = extractVerbalSummary(accumulatedFeedback)
            if (earlySummary) {
              ttsTriggered = true
              setVerbalSummaryText(earlySummary)
              setIsTtsLoading(true)
              setTtsError(null)

              synthesizeSpeech(earlySummary)
                .then((audioBlob) => {
                  if (!controller.signal.aborted) {
                    setTtsAudioBlob(audioBlob)
                  }
                })
                .catch((err) => {
                  if (!controller.signal.aborted) {
                    console.error('Parallel TTS synthesis failed:', err)
                    setTtsError(err.message || 'Failed to synthesize coach audio.')
                  }
                })
                .finally(() => {
                  if (!controller.signal.aborted) {
                    setIsTtsLoading(false)
                  }
                })
            }
          }
        },
        onDone: async () => {
          setIsCoachStreaming(false)
          setAppPhase('done')
          abortControllerRef.current = null

          const summary = extractVerbalSummary(accumulatedFeedback)
          const score = extractScore(accumulatedFeedback)
          if (summary) setVerbalSummaryText(summary)

          // Persist completed evaluation into localStorage history
          const updatedSessions = saveSession({
            topic: targetTopic,
            transcript: targetTranscript,
            feedback: accumulatedFeedback,
            score,
            verbalSummary: summary,
          })
          setSessions(updatedSessions)

          // Fallback: If TTS was not triggered early, synthesize now
          if (!ttsTriggered && summary) {
            ttsTriggered = true
            setIsTtsLoading(true)
            setTtsError(null)
            try {
              const audioBlob = await synthesizeSpeech(summary)
              if (!controller.signal.aborted) {
                setTtsAudioBlob(audioBlob)
              }
            } catch (err) {
              if (!controller.signal.aborted) {
                console.error('Fallback TTS synthesis failed:', err)
                setTtsError(err.message || 'Failed to synthesize coach audio.')
              }
            } finally {
              if (!controller.signal.aborted) {
                setIsTtsLoading(false)
              }
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
    <div className="lg:h-screen lg:overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header: 48px Compact Bar */}
      <header className="h-12 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur shrink-0 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          {/* History Drawer Trigger */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 font-mono text-xs border border-zinc-800 flex items-center gap-1.5 transition-colors"
            title="Open History"
          >
            <span>☰</span>
            <span className="hidden sm:inline font-semibold">History</span>
            {sessions.length > 0 && (
              <span className="inline-flex items-center justify-center px-1 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {sessions.length}
              </span>
            )}
          </button>

          {/* App Title */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h1 className="font-mono font-bold tracking-tight text-sm text-zinc-100">
              Hinglish<span className="text-emerald-400">CS</span> Coach
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 hidden md:inline">
              Workbench
            </span>
          </div>
        </div>

        {/* Compact System Status Pills */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="text-zinc-600 hidden sm:inline">EARS:</span>
            <span className="text-zinc-300">Prisma</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1">
            <span className="text-zinc-600 hidden sm:inline">BRAIN:</span>
            <span className="text-emerald-400 font-semibold">Gemini 3.8</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1">
            <span className="text-zinc-600 hidden sm:inline">MOUTH:</span>
            <span className="text-purple-400 font-semibold">Avinash</span>
          </div>
        </div>
      </header>

      {/* Main Split-Pane Workbench */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane — Candidate Studio (38% width on desktop, fixed non-scrolling) */}
        <aside className="w-full lg:w-[38%] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800/80 flex flex-col p-4 gap-3.5 bg-zinc-950 overflow-hidden">
          {/* 1. Target DSA Topic Selector */}
          <div className="shrink-0">
            <TopicSelector value={topic} onChange={setTopic} />
          </div>

          {/* 2. Compact Push-to-Talk Stage */}
          <div className="shrink-0">
            <PTTButton
              recorderState={appPhase === 'coaching' ? 'idle' : appPhase}
              secondsRecorded={recorder.secondsRecorded}
              maxSeconds={recorder.maxSeconds}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              disabled={!topic || topic.trim() === ''}
            />
          </div>

          {/* 3. Candidate Transcript Card (Internally scrollable + WAV player in footer) */}
          <section className="flex-1 min-h-0 flex flex-col bg-zinc-900/70 rounded-xl border border-zinc-800/80 overflow-hidden shadow-xs">
            {/* Card Header */}
            <div className="px-3.5 py-2.5 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-900/50">
              <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-zinc-400">
                CANDIDATE TRANSCRIPT
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                {transcript && !transcript.startsWith('(No speech') && (
                  <span className="text-emerald-400">✓ Transcribed</span>
                )}
                {appPhase === 'processing' && (
                  <span className="text-amber-400 animate-pulse">Transcribing...</span>
                )}
              </div>
            </div>

            {/* Card Body (Scrollable transcript text) */}
            <div className="flex-1 min-h-[120px] overflow-y-auto p-3.5 font-mono text-xs leading-relaxed text-zinc-200 bg-zinc-950/80">
              {transcript ? (
                <p className="whitespace-pre-wrap">{transcript}</p>
              ) : appPhase === 'processing' ? (
                <div className="flex items-center gap-2 text-amber-400/90 py-4">
                  <span className="inline-block animate-spin">⠋</span>
                  <span>Transcribing Hinglish audio via Gnani Prisma v3...</span>
                </div>
              ) : (
                <p className="text-zinc-600 italic">
                  Your spoken Hinglish or English explanation will be transcribed here in real-time...
                </p>
              )}
            </div>

            {/* STT Error Banner */}
            {sttError && (
              <div className="shrink-0 p-2.5 bg-rose-950/60 border-t border-rose-800/80 text-rose-300 font-mono text-[11px] flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">!</span>
                <div className="flex-1 whitespace-pre-wrap">{sttError}</div>
              </div>
            )}

            {/* Card Footer: Recorded WAV Mini-Player */}
            {audioUrl && appPhase !== 'recording' && (
              <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-900/80 px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="hidden sm:inline">Candidate Audio</span>
                  <span className="text-zinc-600">(16kHz)</span>
                </div>
                <audio controls src={audioUrl} className="h-6 w-44 max-w-full opacity-80" />
              </div>
            )}
          </section>
        </aside>

        {/* Right Pane — Interviewer Evaluation (62% width on desktop, independent scroll) */}
        <section className="w-full lg:w-[62%] flex-1 min-h-0 overflow-y-auto p-4 lg:p-5 space-y-4 bg-zinc-950/50">
          {/* 1. Sticky Top Header Banner: Unified Score + Audio Player + Verbal Summary */}
          <AudioPlayerWidget
            audioBlob={ttsAudioBlob}
            isLoading={isTtsLoading}
            error={ttsError}
            verbalSummary={verbalSummaryText}
            score={currentScore}
            isStreaming={isCoachStreaming}
            autoPlay={true}
            onReplay={handleSynthesizePastSession}
          />

          {/* 2. Structured Scorecard Grid: Remaining Sections */}
          <CoachFeedback
            feedbackText={coachFeedback}
            isStreaming={isCoachStreaming}
            error={coachError}
            onRetry={handleRetryCoaching}
          />
        </section>
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
