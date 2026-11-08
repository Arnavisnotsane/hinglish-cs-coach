export function HistorySidebar({ isOpen, onClose, sessions = [] }) {
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
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full'
        }`}
        aria-label="Past Sessions History"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-sm font-semibold tracking-wide">
              [History]
            </span>
            <span className="text-xs text-gray-500 font-mono">
              ({sessions.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 p-1.5 rounded-md hover:bg-gray-800 transition-colors font-mono text-lg"
            aria-label="Close history sidebar"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                Complete your explanation to see transcribed sessions logged here.
              </p>
              <span className="mt-4 text-[10px] uppercase font-mono tracking-wider px-2 py-1 rounded bg-gray-800 text-gray-500">
                Phase 3 feature
              </span>
            </div>
          ) : (
            sessions.map((session, idx) => (
              <div
                key={session.id || idx}
                className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60 hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono text-green-400">
                  <span className="font-semibold truncate">{session.topic}</span>
                  <span className="text-[10px] text-gray-500">
                    {session.timestamp
                      ? new Date(session.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                {session.transcript && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2 font-mono">
                    {session.transcript}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 text-[11px] font-mono text-gray-500 text-center">
          HinglishCS Coach v0.1 • Phase 1
        </div>
      </aside>
    </>
  )
}
