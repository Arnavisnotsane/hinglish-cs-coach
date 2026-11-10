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
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between text-xs font-medium tracking-wide text-zinc-300">
        <span className="uppercase text-[11px] font-mono tracking-wider font-semibold text-zinc-400">
          TARGET DSA TOPIC
        </span>
        {value ? (
          <span className="rounded-full px-2.5 py-0.5 bg-[#2727E6]/15 border border-[#2727E6]/30 text-white text-[11px] font-mono truncate max-w-[200px]">
            ● {value}
          </span>
        ) : (
          <span className="text-zinc-500 text-[11px] font-mono">Select to start</span>
        )}
      </div>

      <select
        value={selectedOption}
        onChange={handleSelectChange}
        className="w-full bg-[#0D0E1A] text-white font-sans text-sm border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#2727E6] focus:ring-1 focus:ring-[#2727E6] transition-colors"
      >
        <option value="" disabled className="text-zinc-500 bg-[#0D0E1A]">
          -- Select DSA topic to explain --
        </option>
        {TOPICS.map((t) => (
          <option key={t} value={t} className="bg-[#131422] text-white">
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
          className="w-full bg-[#0D0E1A] text-white font-sans text-sm border border-[#2727E6]/40 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#2727E6] focus:ring-1 focus:ring-[#2727E6] transition-colors placeholder:text-zinc-500 mt-1"
        />
      )}
    </div>
  )
}
