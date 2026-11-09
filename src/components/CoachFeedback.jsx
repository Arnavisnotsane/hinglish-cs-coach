import ReactMarkdown from 'react-markdown'

/**
 * Renders the streamed coach feedback using react-markdown styled for a dark code terminal.
 */
export function CoachFeedback({
  feedbackText = '',
  isStreaming = false,
  error = null,
  onRetry,
}) {
  return (
    <section className="bg-gray-900/90 rounded-xl border border-gray-800 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">coach://gemini-evaluation</span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-yellow-950/80 text-yellow-400 border border-yellow-800/60 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              Streaming feedback...
            </span>
          )}
          {!isStreaming && feedbackText && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-green-950/80 text-green-400 border border-green-800/60">
              ✓ Evaluation Complete
            </span>
          )}
        </div>

        {feedbackText && !isStreaming && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-mono text-gray-400 hover:text-green-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-gray-800"
            title="Re-run evaluation on the current transcript"
          >
            <span>↻</span> Re-evaluate
          </button>
        )}
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/70 border border-red-800 text-red-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="text-red-400 font-bold text-sm">✕</span>
            <span className="leading-relaxed">{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start sm:self-center px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 rounded text-xs font-mono font-medium transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Markdown Content or Placeholder */}
      <div className="min-h-48 rounded-lg bg-gray-950/90 border border-gray-800/90 p-4 sm:p-5 font-sans text-sm leading-relaxed overflow-x-auto">
        {feedbackText ? (
          <div className="space-y-1">
            <ReactMarkdown
              components={{
                h3: ({ children }) => (
                  <h3 className="font-mono text-sm font-bold text-green-400 mt-5 mb-2.5 pb-1 border-b border-gray-800/80 first:mt-0 flex items-center gap-1.5 tracking-wide">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="font-mono text-xs font-bold text-gray-300 mt-3 mb-1">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-gray-200 leading-relaxed my-2">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1.5 my-2.5 text-sm text-gray-300">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-gray-300 leading-relaxed">
                    {children}
                  </li>
                ),
                code: ({ inline, children }) => (
                  <code
                    className={
                      inline
                        ? 'bg-gray-800 text-green-300 px-1.5 py-0.5 rounded font-mono text-xs border border-gray-700/60'
                        : 'block bg-gray-900 text-green-300 p-3 rounded-md font-mono text-xs border border-gray-800 my-2 overflow-x-auto'
                    }
                  >
                    {children}
                  </code>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-100">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-green-500/60 pl-3 my-2 text-gray-400 italic font-mono text-xs">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {feedbackText}
            </ReactMarkdown>

            {/* Live Typing Cursor */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-green-400 animate-pulse align-middle" />
            )}
          </div>
        ) : isStreaming ? (
          <div className="h-44 flex flex-col items-center justify-center text-center gap-2 text-yellow-400/90 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="animate-spin text-base">⠋</span>
              <span>Gemini is analyzing your technical logic...</span>
            </div>
            <span className="text-gray-500 text-[11px]">
              Checking approach, edge cases, and Big-O complexity
            </span>
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center gap-2 text-gray-500 font-mono text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-700 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693l-1.57-.393m15.6 0l1.4 1.4a2.25 2.25 0 01.659 1.591v2.466a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25v-2.466a2.25 2.25 0 01.659-1.591l1.4-1.4"
              />
            </svg>
            <p>Speak in Hinglish or English to get an instant technical scorecard.</p>
            <p className="text-[11px] text-gray-600">
              Evaluates: Concept Logic • Edge Cases • Big-O • FAANG Interview Standard
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
