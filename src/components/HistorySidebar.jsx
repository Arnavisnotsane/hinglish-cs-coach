/**
 * History Sidebar Drawer for inspecting and managing past coaching sessions.
 */
export function HistorySidebar({
  isOpen,
  onClose,
  sessions = [],
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) {
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all past coaching sessions?')) {
      onClearAll?.()
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const d = new Date(timestamp)
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-84 sm:w-96 bg-gray-900 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full'
        }`}
        aria-label="Past Sessions History"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-sm font-semibold tracking-wide">
              [History]
            </span>
            <span className="text-xs text-gray-500 font-mono">
              ({sessions.length}/30)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sessions.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-mono text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-950/40 border border-red-900/40 transition-colors"
                title="Clear all stored sessions"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-100 p-1.5 rounded-md hover:bg-gray-800 transition-colors font-mono text-base"
              aria-label="Close history sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {sessions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-800 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-600 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-sm font-mono text-gray-400 font-medium">
                No past sessions yet
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Explain a topic to see your evaluations and transcripts saved here.
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession?.(session)
                  onClose?.()
                }}
                className="group relative p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/60 hover:border-green-500/60 transition-all cursor-pointer shadow-sm"
              >
                {/* Topic & Score Bar */}
                <div className="flex items-start justify-between gap-2 pr-6">
                  <span className="font-mono text-xs font-semibold text-green-400 group-hover:text-green-300 line-clamp-1">
                    {session.topic}
                  </span>
                  {session.score !== null && session.score !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                        session.score >= 7
                          ? 'bg-green-950 text-green-400 border border-green-800/80'
                          : session.score >= 4
                          ? 'bg-yellow-950 text-yellow-400 border border-yellow-800/80'
                          : 'bg-red-950 text-red-400 border border-red-800/80'
                      }`}
                    >
                      {session.score}/10
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                  {formatDate(session.timestamp)}
                </div>

                {/* Transcript snippet */}
                {session.transcript && (
                  <p className="text-xs text-gray-300 mt-2 line-clamp-2 font-mono leading-relaxed">
                    &ldquo;{session.transcript}&rdquo;
                  </p>
                )}

                {/* Verbal Summary quote if available */}
                {session.verbalSummary && (
                  <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-1 italic border-l border-green-500/50 pl-1.5">
                    {session.verbalSummary}
                  </p>
                )}

                {/* Delete button (trash icon) */}
                {onDeleteSession && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="absolute top-2.5 right-2.5 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-750 transition-colors opacity-70 group-hover:opacity-100"
                    title="Delete session"
                    aria-label="Delete session"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 text-[11px] font-mono text-gray-500 text-center flex items-center justify-between px-4">
          <span>HinglishCS Coach</span>
          <span className="text-green-500">v0.3 • Phase 3</span>
        </div>
      </aside>
    </>
  )
}
