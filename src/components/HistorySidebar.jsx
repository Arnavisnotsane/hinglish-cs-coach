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
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-84 sm:w-96 bg-zinc-950 border-r border-zinc-800/90 z-50 transform transition-transform duration-200 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-black/90' : '-translate-x-full'
        }`}
        aria-label="Past Sessions History"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <span className="text-zinc-200 font-mono text-xs font-semibold uppercase tracking-wider">
              HISTORY
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              ({sessions.length}/30)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sessions.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
                title="Clear all stored sessions"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-zinc-800 transition-colors font-mono text-sm"
              aria-label="Close history sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800/80 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-zinc-700 mb-2.5"
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
              <p className="text-xs font-mono text-zinc-400 font-medium">
                No past sessions yet
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Explain a DSA topic to see evaluations and scores saved here.
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
                className="group relative p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer shadow-xs"
              >
                {/* Topic & Score Bar */}
                <div className="flex items-start justify-between gap-2 pr-6">
                  <span className="font-mono text-xs font-semibold text-zinc-200 group-hover:text-emerald-300 line-clamp-1">
                    {session.topic}
                  </span>
                  {session.score !== null && session.score !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                        session.score >= 7
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                          : session.score >= 4
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                      }`}
                    >
                      {session.score}/10
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {formatDate(session.timestamp)}
                </div>

                {/* Transcript snippet */}
                {session.transcript && (
                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 font-mono leading-relaxed">
                    &ldquo;{session.transcript}&rdquo;
                  </p>
                )}

                {/* Verbal Summary quote if available */}
                {session.verbalSummary && (
                  <p className="text-[11px] text-zinc-300 mt-1 line-clamp-1 italic border-l border-emerald-500/60 pl-1.5">
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
                    className="absolute top-2.5 right-2.5 p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors opacity-70 group-hover:opacity-100"
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
        <div className="p-3 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex items-center justify-between px-4 bg-zinc-900/40">
          <span>HinglishCS Coach</span>
          <span className="text-emerald-500">v0.4 Workbench</span>
        </div>
      </aside>
    </>
  )
}
