import ReactMarkdown from 'react-markdown'

/**
 * Strips Verbal Summary and Score sections from the streamed feedback,
 * returning the remaining structured scorecard sections:
 * - Logic Check
 * - Edge Cases Missed
 * - Time & Space Complexity
 * - Ideal Interview Explanation
 */
export function getRemainingSections(markdown) {
  if (!markdown) return ''

  // Look for Logic Check as the start of the structured scorecard
  const logicMatch = markdown.match(/###\s*(?:🔍\s*)?Logic Check/i)
  if (logicMatch && logicMatch.index !== undefined) {
    return markdown.slice(logicMatch.index)
  }

  // Fallback: check if other subsequent sections are present
  const otherMatch = markdown.match(
    /###\s*(?:⚠️|⏱️|💡)?\s*(?:Edge Cases|Time & Space|Ideal Interview)/i
  )
  if (otherMatch && otherMatch.index !== undefined) {
    return markdown.slice(otherMatch.index)
  }

  // If streaming and only Verbal Summary or Score has arrived, return empty
  if (
    markdown.includes('### Verbal Summary') ||
    markdown.includes('### 🎙️ Verbal Summary') ||
    markdown.includes('### Score') ||
    markdown.includes('### 📊 Score')
  ) {
    return ''
  }

  return markdown
}

/**
 * Structured Scorecard Grid for Interviewer Evaluation.
 * Styled with modern edtech visual patterns (rounded-3xl card, rounded-2xl inner containers,
 * royal blue accents, and strict inline code handling).
 */
export function CoachFeedback({
  feedbackText = '',
  isStreaming = false,
  error = null,
  onRetry = null,
}) {
  const scorecardContent = getRemainingSections(feedbackText)

  return (
    <div className="rounded-3xl bg-[#131422]/70 backdrop-blur-md border border-white/10 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-zinc-400">
            STRUCTURED SCORECARD
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#2727E6]/15 text-white border border-[#2727E6]/30 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-[#2727E6]" />
              Streaming analysis...
            </span>
          )}
          {!isStreaming && feedbackText && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              ✓ Ready
            </span>
          )}
        </div>

        {feedbackText && !isStreaming && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs px-3.5 py-1 text-white font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Re-run evaluation on the current transcript"
          >
            <span>↻</span> Re-evaluate
          </button>
        )}
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="text-rose-400 font-bold">✕</span>
            <span className="leading-relaxed">{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start sm:self-center px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded-full text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Markdown Content Inset Box */}
      <div className="min-h-40 rounded-2xl bg-black/40 border border-white/10 p-5 font-sans text-sm leading-relaxed overflow-x-auto">
        {scorecardContent ? (
          <div className="space-y-1">
            <ReactMarkdown
              components={{
                h3: ({ children }) => {
                  const rawText =
                    typeof children === 'string'
                      ? children
                      : Array.isArray(children)
                      ? children
                          .map((c) => (typeof c === 'string' ? c : ''))
                          .join('')
                      : String(children || '')

                  const cleanTitle = rawText.replace(/[🎙️📊🔍⚠️⏱️💡]/g, '').trim()

                  let icon = (
                    <svg
                      className="w-4 h-4 text-zinc-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h7"
                      />
                    </svg>
                  )

                  if (/logic check/i.test(cleanTitle)) {
                    icon = (
                      <svg
                        className="w-4 h-4 text-[#6875F5] shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )
                  } else if (/edge cases/i.test(cleanTitle)) {
                    icon = (
                      <svg
                        className="w-4 h-4 text-amber-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    )
                  } else if (/complexity/i.test(cleanTitle)) {
                    icon = (
                      <svg
                        className="w-4 h-4 text-sky-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )
                  } else if (/ideal/i.test(cleanTitle)) {
                    icon = (
                      <svg
                        className="w-4 h-4 text-[#2727E6] shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    )
                  }

                  return (
                    <h3 className="font-mono text-xs font-semibold text-zinc-200 uppercase tracking-wider mt-6 mb-3 pb-2 border-b border-white/10 first:mt-1 flex items-center gap-2.5">
                      {icon}
                      <span>{cleanTitle}</span>
                    </h3>
                  )
                },
                h4: ({ children }) => (
                  <h4 className="font-mono text-xs font-semibold text-zinc-300 mt-3 mb-1">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-zinc-200 leading-relaxed my-2.5">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-2 my-2.5 pl-4 list-disc text-sm text-zinc-300 marker:text-[#6875F5]">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-zinc-200 leading-relaxed">
                    {children}
                  </li>
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const isInline = !className && !String(children).includes('\n')
                  if (isInline) {
                    return (
                      <code
                        className="inline px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[12.5px] border border-zinc-700/60 align-baseline mx-0.5"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code
                      className="block w-full bg-[#0D0E1A] p-4 rounded-xl font-mono text-xs text-emerald-300 border border-white/10 overflow-x-auto my-3"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <div className="my-2">{children}</div>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#2727E6] pl-3.5 my-3 text-zinc-300 italic font-mono text-xs bg-white/5 py-1.5 rounded-r">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {scorecardContent}
            </ReactMarkdown>

            {/* Live Typing Cursor */}
            {isStreaming && (
              <span className="inline-block w-2 h-3.5 ml-1 bg-[#6875F5] animate-pulse align-middle" />
            )}
          </div>
        ) : isStreaming ? (
          <div className="h-36 flex flex-col items-center justify-center text-center gap-2.5 text-zinc-300 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="animate-spin text-sm text-[#6875F5]">⠋</span>
              <span>Gemini is evaluating your technical logic...</span>
            </div>
            <span className="text-zinc-500 text-[11px]">
              Checking algorithmic correctness, edge cases, and Big-O complexity
            </span>
          </div>
        ) : (
          <div className="h-36 flex flex-col items-center justify-center text-center gap-2 text-zinc-500 font-mono text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-zinc-600 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Scorecard sections will appear here after explanation analysis.</p>
            <p className="text-[11px] text-zinc-600">
              Logic Check • Edge Cases Missed • Time & Space Complexity • Ideal Answer
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
