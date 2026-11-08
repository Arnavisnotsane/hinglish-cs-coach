import { useState } from 'react'

export const TOPICS = [
  'Arrays & Sliding Window',
  'Linked Lists',
  'Stacks & Queues',
  'Binary Trees',
  'Binary Search Trees (BST)',
  'Heaps & Priority Queues',
  'Graphs — BFS & DFS',
  'Dynamic Programming — Knapsack',
  'Dynamic Programming — LCS',
  'Tries',
  'Hashing & Hash Maps',
  'Sorting Algorithms',
  'Binary Search',
  'Recursion & Backtracking',
  'Running Median (Two Heaps)',
  'Other (type your own)',
]

export function TopicSelector({ value, onChange }) {
  const [selectedOption, setSelectedOption] = useState(() => {
    if (!value) return ''
    return TOPICS.includes(value) ? value : 'Other (type your own)'
  })
  const [customTopic, setCustomTopic] = useState(() => {
    if (!value) return ''
    return TOPICS.includes(value) ? '' : value
  })

  const isOther = selectedOption === 'Other (type your own)'

  const handleSelectChange = (e) => {
    const val = e.target.value
    setSelectedOption(val)
    if (val === 'Other (type your own)') {
      onChange(customTopic)
    } else {
      onChange(val)
    }
  }

  const handleCustomChange = (e) => {
    const customVal = e.target.value
    setCustomTopic(customVal)
    onChange(customVal)
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs text-gray-400 font-mono uppercase tracking-widest flex items-center justify-between">
        <span>Target DSA Topic</span>
        {value && <span className="text-green-500 lowercase text-[11px]">selected: {value}</span>}
      </label>
      <select
        value={selectedOption}
        onChange={handleSelectChange}
        className="bg-gray-800 text-green-400 font-mono text-sm border border-gray-700 hover:border-gray-600 rounded-md px-3 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-full transition-colors"
      >
        <option value="" disabled>
          -- Select a DSA topic to explain --
        </option>
        {TOPICS.map((t) => (
          <option key={t} value={t} className="bg-gray-900 text-gray-200">
            {t}
          </option>
        ))}
      </select>
      {isOther && (
        <input
          type="text"
          placeholder="e.g. Segment Trees, AVL Trees, Disjoint Set Union..."
          value={customTopic}
          onChange={handleCustomChange}
          autoFocus
          className="bg-gray-800 text-green-400 font-mono text-sm border border-green-600/50 rounded-md px-3 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-full transition-colors placeholder:text-gray-500"
        />
      )}
    </div>
  )
}
