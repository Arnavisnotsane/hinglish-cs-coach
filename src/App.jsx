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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#0D0E1A] text-zinc-100 font-sans selection:bg-[#2727E6]/30 selection:text-white">
      {/* 1. Floating Pill Navigation Bar */}
      <header className="p-3 md:p-4 shrink-0 z-30">
        <div className="max-w-[128rem] mx-auto bg-[#131422]/90 backdrop-blur-md border border-white/10 rounded-3xl px-5 h-14 md:h-16 flex items-center justify-between shadow-lg shadow-black/20">
          {/* Left: History Button + App Brand */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* History Toggle Pill */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              title="Open History"
            >
              <span className="h-2 w-2 rounded-full bg-[#2727E6] animate-pulse" />
              <span className="font-semibold">History</span>
              {sessions.length > 0 && (
                <span className="rounded-full px-1.5 py-0.2 text-[10px] font-bold bg-[#2727E6]/30 text-white border border-[#2727E6]/40">
                  {sessions.length}
                </span>
              )}
            </button>

            {/* App Brand Avatar & Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#2727E6] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#2727E6]/30 shrink-0">
                H
              </div>
              <h1 className="font-sans font-bold tracking-tight text-sm md:text-base text-white">
                Hinglish<span className="text-[#6875F5]">CS</span> Coach
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10 hidden md:inline">
                Workbench
              </span>
            </div>
          </div>

          {/* Right: Compact System Status Pills */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="rounded-full px-3 py-1 bg-white/5 border border-white/10 text-white flex items-center gap-1.5">
              <span className="text-zinc-400 hidden sm:inline">STT:</span>
              <span className="text-zinc-200">Prisma</span>
            </span>
            <span className="rounded-full px-3 py-1 bg-white/5 border border-white/10 text-white flex items-center gap-1.5">
              <span className="text-zinc-400 hidden sm:inline">Brain:</span>
              <span className="text-[#6875F5] font-semibold">Gemini 3.8</span>
            </span>
            <span className="rounded-full px-3 py-1 bg-white/5 border border-white/10 text-white flex items-center gap-1.5">
              <span className="text-zinc-400 hidden sm:inline">Voice:</span>
              <span className="text-[#2727E6] font-semibold">Avinash</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Split-Pane Workbench */}
      <main className="flex-1 min-h-0 px-3 md:px-4 pb-3 md:pb-4 flex flex-col lg:flex-row gap-4 overflow-hidden max-w-[128rem] mx-auto w-full">
        {/* Left Pane — Candidate Studio (38% width on desktop, fixed non-scrolling) */}
        <aside className="w-full lg:w-[38%] shrink-0 rounded-3xl bg-[#131422]/70 backdrop-blur-md border border-white/10 p-6 flex flex-col gap-5 overflow-hidden shadow-lg shadow-black/20">
          {/* Target DSA Topic Selector */}
          <div className="shrink-0">
            <TopicSelector value={topic} onChange={setTopic} />
          </div>

          {/* Compact Push-to-Talk Stage */}
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

          {/* Candidate Transcript Inset Card */}
          <section className="flex-1 min-h-0 rounded-2xl bg-black/40 border border-white/10 p-4 flex flex-col gap-3 shadow-inner">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-zinc-400">
                CANDIDATE TRANSCRIPT
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {transcript && !transcript.startsWith('(No speech') && (
                  <span className="rounded-full px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px]">
                    ✓ Transcribed
                  </span>
                )}
                {appPhase === 'processing' && (
                  <span className="rounded-full px-2.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px] animate-pulse">
                    Transcribing...
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Transcript Text */}
            <div className="flex-1 min-h-[110px] overflow-y-auto text-xs sm:text-sm font-sans leading-relaxed text-zinc-200">
              {transcript ? (
                <p className="whitespace-pre-wrap">{transcript}</p>
              ) : appPhase === 'processing' ? (
                <div className="flex items-center gap-2 text-amber-400 py-4">
                  <span className="inline-block animate-spin">⠋</span>
                  <span>Transcribing Hinglish audio via Gnani Prisma v3...</span>
                </div>
              ) : (
                <p className="text-zinc-500 italic">
                  Your spoken Hinglish or English explanation will be transcribed here in real-time...
                </p>
              )}
            </div>

            {/* STT Error Banner */}
            {sttError && (
              <div className="shrink-0 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 font-mono text-xs flex items-start gap-2">
                <span className="text-rose-400 font-bold">!</span>
                <div className="flex-1 whitespace-pre-wrap">{sttError}</div>
              </div>
            )}

            {/* Recorded WAV Mini-Player */}
            {audioUrl && appPhase !== 'recording' && (
              <div className="shrink-0 pt-2.5 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-[#2727E6]" />
                  <span>WAV Audio (16kHz)</span>
                </div>
                <audio controls src={audioUrl} className="h-7 w-48 max-w-full opacity-90 rounded-full" />
              </div>
            )}
          </section>
        </aside>

        {/* Right Pane — Interviewer Evaluation (62% width on desktop, independent scroll) */}
        <section className="w-full lg:w-[62%] flex-1 min-h-0 overflow-y-auto space-y-4 pr-0.5">
          {/* Sticky Top Header Banner: Unified Score + Audio Player + Verbal Summary */}
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

          {/* Structured Scorecard Grid: Remaining Sections */}
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
