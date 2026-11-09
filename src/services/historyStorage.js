/**
 * LocalStorage manager for CS Coach past session history (Cap: 30 sessions).
 */

const STORAGE_KEY = 'hinglish_cs_coach_history'
const MAX_SESSIONS = 30

/**
 * Retrieves stored sessions from localStorage, sorted newest first.
 *
 * @returns {Array} List of session objects
 */
export function getStoredSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to read session history from localStorage:', err)
    return []
  }
}

/**
 * Saves a completed coaching session to localStorage (prepending and capping at MAX_SESSIONS).
 *
 * @param {Object} sessionData
 * @param {string} sessionData.topic
 * @param {string} sessionData.transcript
 * @param {string} sessionData.feedback
 * @param {number|null} [sessionData.score]
 * @param {string} [sessionData.verbalSummary]
 * @returns {Array} Updated sessions array
 */
export function saveSession({ topic, transcript, feedback, score = null, verbalSummary = '' }) {
  try {
    const current = getStoredSessions()
    const newSession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      topic,
      transcript,
      feedback,
      score,
      verbalSummary,
    }

    const updated = [newSession, ...current].slice(0, MAX_SESSIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save session to localStorage:', err)
    return getStoredSessions()
  }
}

/**
 * Deletes a session by id from localStorage.
 *
 * @param {string} sessionId
 * @returns {Array} Updated sessions array
 */
export function deleteSession(sessionId) {
  try {
    const current = getStoredSessions()
    const updated = current.filter((s) => s.id !== sessionId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to delete session from localStorage:', err)
    return getStoredSessions()
  }
}

/**
 * Clears all sessions from localStorage.
 *
 * @returns {Array} Empty array
 */
export function clearAllSessions() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return []
  } catch (err) {
    console.error('Failed to clear session history from localStorage:', err)
    return []
  }
}
