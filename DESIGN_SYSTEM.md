# HinglishCS Coach — Design System & UI/UX Standards

**Version:** 1.0  
**References & Aesthetic:** Linear, Raycast, LeetCode Modern Split-Pane Workspace  
**Theme:** High-density, tactile, dark-mode engineering console

---

## 1. Core Visual Tokens & Color Palette

- **Canvas Background:** Matte Zinc-950 (`#09090b`)
- **Panel & Card Surfaces:** Matte Zinc-900 (`#121215`) with subtle `bg-zinc-900/80`
- **Inner Containers & Textareas:** Zinc-950 (`#0c0c0e`)
- **Structural Borders:** Crisp 1px borders using `border-zinc-800/80` (active/focus: `border-emerald-500/60`, hover: `border-zinc-700`)
- **Text Hierarchy:**
  - Primary text: `text-zinc-100` (`#f4f4f5`)
  - Secondary text / feedback body: `text-zinc-300` (`#d4d4d8`)
  - Muted labels / subtext: `text-zinc-400` / `text-zinc-500`
  - Monospace accents: Emerald-400 (`#34d399`) for code/Big-O, Amber-400 for warnings, Red-400 for errors

---

## 2. Typography Rules

- **Prose & Explanations:** Sans-serif (`Inter`, system-ui, -apple-system, sans-serif) for high legibility when reading Hinglish and English conversational sentences.
- **Metrics, Code & Timers:** Monospace (`JetBrains Mono`, `Fira Code`, monospace) strictly reserved for:
  - Time & Space complexity metrics (`O(log n)`, `O(1)`)
  - Algorithm/data structure names (`max-heap`, `min-heap`, `BST`, `DFS`)
  - Timers, keycap badges (`[Space]`), section tracking labels, and status badges.

---

## 3. Inline Code Rendering Rule (CRITICAL)

In `react-markdown`, block-level code blocks must be separated from inline code phrases:

- **Inline Code (`!className`):**
  Must render with `inline px-1.5 py-0.5 rounded bg-zinc-800/90 text-emerald-300 font-mono text-[12.5px] border border-zinc-700/60 align-baseline mx-0.5`.
  Phrases like `max-heap`, `O(n)`, and `left pointer` MUST stay inline inside sentences and never break into separate full-width block elements.
- **Code Blocks (`className` contains `language-` or multi-line):**
  Render as `block w-full bg-zinc-950 p-3 rounded-lg font-mono text-xs text-emerald-300 border border-zinc-800/80 overflow-x-auto my-2`.

---

## 4. The Banned List (Zero Tolerances)

1. **NO Fake Protocol Headers:**
   - ❌ Banned: `stt://transcript-output`, `coach://gemini-evaluation`, `session://setup`, `audio://input-stream`.
   - ✅ Allowed: Clean 11px uppercase tracking-wider labels (`CANDIDATE TRANSCRIPT`, `INTERVIEWER EVALUATION`, `TOPIC SETUP`, `INPUT AUDIO`).
2. **NO Emojis in Markdown Headers:**
   - ❌ Banned: `🎙️ Verbal Summary`, `📊 Score`, `🔍 Logic Check`, `⚠️ Edge Cases`, `⏱️ Complexity`, `💡 Ideal`.
   - ✅ Allowed: Clean typography with dedicated SVG glyphs or semantic badges (`VERBAL SUMMARY`, `SCORE`, `LOGIC CHECK`, `EDGE CASES`, `COMPLEXITY`, `IDEAL EXPLANATION`).
3. **NO Giant Glowing Neon Blurs or Wasted Space:**
   - No huge neon radial gradients that distract from text density.
   - Every pixel must serve the candidate's interview preparation workflow.

---

## 5. Layout Architecture: 100vh Split-Pane Workbench

Desktop viewport: `lg:h-screen lg:overflow-hidden flex flex-col`. The user should never need to scroll down to see the coach's feedback.

### Structure:
1. **Top Header (48px / `h-12`):**
   - Left: `[☰ History]` trigger button with count pill.
   - Center-Left: App title (`HinglishCS Coach`) + topic indicator.
   - Right: Clean compact status pills (`Ears: Prisma`, `Brain: Gemini 3.8`, `Mouth: Avinash`).
2. **Left Pane — Candidate Studio (38% width on desktop, flex column):**
   - **Top:** Topic dropdown + custom input.
   - **Middle:** Compact, tactile Push-to-Talk button with live countdown timer and `[Space]` keycap badge.
   - **Bottom:** Candidate Transcript card (`flex-1 min-h-[140px] overflow-y-auto`), with recorded WAV player tucked neatly inside the footer.
3. **Right Pane — Interviewer Evaluation (62% width on desktop, independent scroll):**
   - **Sticky Top Card:** Unified Score Badge (`8 / 10`) + Coach Avinash `AudioPlayerWidget` + Verbal Summary quote.
   - **Structured Scorecard Grid:** Clean categorized cards for `Logic Check`, `Edge Cases Missed`, `Time & Space Complexity`, and `Ideal Interview Explanation`.
