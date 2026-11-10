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
    <div className="flex flex-col gap-1.5 w-full bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-3">
      <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-zinc-400">
        <span className="uppercase font-semibold">TARGET DSA TOPIC</span>
        {value ? (
          <span className="text-emerald-400 text-[10px] font-mono truncate max-w-[160px]">
            ● {value}
          </span>
        ) : (
          <span className="text-zinc-500 text-[10px]">Select to start</span>
        )}
      </div>

      <select
        value={selectedOption}
        onChange={handleSelectChange}
        className="w-full bg-zinc-950 text-zinc-200 font-mono text-xs border border-zinc-800 hover:border-zinc-700 rounded px-2.5 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
      >
        <option value="" disabled className="text-zinc-500">
          -- Select DSA topic to explain --
        </option>
        {TOPICS.map((t) => (
          <option key={t} value={t} className="bg-zinc-900 text-zinc-200">
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
          className="w-full bg-zinc-950 text-emerald-300 font-mono text-xs border border-zinc-700/80 rounded px-2.5 py-2 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-colors placeholder:text-zinc-600 mt-1"
        />
      )}
    </div>
  )
}
