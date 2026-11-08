const TOPIC_KEYTERMS = {
  'Arrays & Sliding Window': ['array', 'sliding window', 'subarray', 'pointer', 'O(n)'],
  'Linked Lists': ['linked list', 'node', 'pointer', 'head', 'tail', 'next'],
  'Stacks & Queues': ['stack', 'queue', 'push', 'pop', 'LIFO', 'FIFO', 'deque'],
  'Binary Trees': ['binary tree', 'root', 'leaf', 'inorder', 'preorder', 'postorder', 'BFS', 'DFS'],
  'Binary Search Trees (BST)': ['BST', 'binary search tree', 'inorder', 'left subtree', 'right subtree'],
  'Heaps & Priority Queues': ['heap', 'priority queue', 'min heap', 'max heap', 'heapify', 'O(log n)'],
  'Graphs — BFS & DFS': ['graph', 'BFS', 'DFS', 'adjacency list', 'visited', 'queue', 'stack'],
  'Dynamic Programming — Knapsack': ['dynamic programming', 'knapsack', 'memoization', 'tabulation', 'subproblem'],
  'Dynamic Programming — LCS': ['LCS', 'longest common subsequence', 'DP table', 'memoization'],
  'Tries': ['trie', 'prefix tree', 'insert', 'search', 'children', 'node'],
  'Hashing & Hash Maps': ['hash map', 'hash table', 'collision', 'bucket', 'O(1)', 'key value'],
  'Sorting Algorithms': ['merge sort', 'quick sort', 'bubble sort', 'O(n log n)', 'pivot', 'in-place'],
  'Binary Search': ['binary search', 'O(log n)', 'mid', 'sorted array', 'left right pointer'],
  'Recursion & Backtracking': ['recursion', 'base case', 'backtracking', 'call stack', 'DFS'],
  'Running Median (Two Heaps)': ['median', 'max heap', 'min heap', 'balance', 'O(log n)'],
}

/**
 * Transcribes a WAV audio blob using Gnani Prisma v3.0 STT.
 * Routes through the Vite dev proxy at /api/gnani-stt.
 *
 * @param {Blob} wavBlob - WAV audio blob (PCM 16-bit, 16kHz mono)
 * @param {string} topic - Selected DSA topic (used for keyterm biasing)
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(wavBlob, topic) {
  const formData = new FormData()
  formData.append('audio_file', wavBlob, 'recording.wav')
  formData.append('model', 'prisma-v3.0')
  formData.append('language_code', 'indic-auto')
  formData.append('format', 'codemix')

  const keyterms = TOPIC_KEYTERMS[topic]
  if (keyterms) {
    formData.append('keyterms', JSON.stringify(keyterms))
  }

  // DO NOT set Content-Type header — let the browser set it with the multipart boundary
  const response = await fetch('/api/gnani-stt', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error')
    throw new Error(`Gnani STT error ${response.status}: ${text}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || data.message || 'Transcription failed')
  }

  return data.transcript
}
