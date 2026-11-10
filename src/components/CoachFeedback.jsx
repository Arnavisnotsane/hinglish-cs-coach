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
 * Renders remaining sections with custom SVG indicators and strict inline-code handling.
 */
export function CoachFeedback({
  feedbackText = '',
  isStreaming = false,
  error = null,
  onRetry = null,
}) {
  const scorecardContent = getRemainingSections(feedbackText)

  return (
    <div className="bg-zinc-900/70 rounded-xl border border-zinc-800/80 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-zinc-400">
            STRUCTURED SCORECARD
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Streaming analysis...
            </span>
          )}
          {!isStreaming && feedbackText && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              ✓ Ready
            </span>
          )}
        </div>

        {feedbackText && !isStreaming && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[11px] font-mono text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800 border border-zinc-800"
            title="Re-run evaluation on the current transcript"
          >
            <span>↻</span> Re-evaluate
          </button>
        )}
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2">
            <span className="text-rose-400 font-bold">✕</span>
            <span className="leading-relaxed">{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start sm:self-center px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded text-xs font-mono font-medium transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Markdown Content */}
      <div className="min-h-40 rounded-lg bg-zinc-950/90 border border-zinc-800/80 p-4 font-sans text-sm leading-relaxed overflow-x-auto">
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
                      className="w-3.5 h-3.5 text-zinc-400 shrink-0"
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
                        className="w-3.5 h-3.5 text-emerald-400 shrink-0"
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
                        className="w-3.5 h-3.5 text-amber-400 shrink-0"
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
                        className="w-3.5 h-3.5 text-sky-400 shrink-0"
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
                        className="w-3.5 h-3.5 text-purple-400 shrink-0"
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
                    <h3 className="font-mono text-xs font-semibold text-zinc-300 uppercase tracking-wider mt-5 mb-2.5 pb-1.5 border-b border-zinc-800/80 first:mt-1 flex items-center gap-2">
                      {icon}
                      <span>{cleanTitle}</span>
                    </h3>
                  )
                },
                h4: ({ children }) => (
                  <h4 className="font-mono text-xs font-semibold text-zinc-400 mt-3 mb-1">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-zinc-300 leading-relaxed my-2">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1.5 my-2 pl-4 list-disc text-sm text-zinc-300 marker:text-zinc-600">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-zinc-300 leading-relaxed">
                    {children}
                  </li>
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const isInline = !className && !String(children).includes('\n')
                  if (isInline) {
                    return (
                      <code
                        className="inline px-1.5 py-0.5 rounded bg-zinc-800/90 text-emerald-300 font-mono text-[12.5px] border border-zinc-700/60 align-baseline mx-0.5"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code
                      className="block w-full bg-zinc-950 p-3.5 rounded-lg font-mono text-xs text-emerald-300 border border-zinc-800/80 overflow-x-auto my-2.5"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <div className="my-2">{children}</div>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-100">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-emerald-500/60 pl-3 my-2 text-zinc-400 italic font-mono text-xs">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {scorecardContent}
            </ReactMarkdown>

            {/* Live Typing Cursor */}
            {isStreaming && (
              <span className="inline-block w-2 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />
            )}
          </div>
        ) : isStreaming ? (
          <div className="h-36 flex flex-col items-center justify-center text-center gap-2 text-amber-400/90 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="animate-spin text-sm">⠋</span>
              <span>Gemini is evaluating your technical logic...</span>
            </div>
            <span className="text-zinc-500 text-[11px]">
              Checking algorithmic correctness, edge cases, and Big-O complexity
            </span>
          </div>
        ) : (
          <div className="h-36 flex flex-col items-center justify-center text-center gap-1.5 text-zinc-500 font-mono text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-zinc-700 mb-1"
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
