# HinglishCS Coach — Design System & UI/UX Standards

**Version:** 2.0 (Modern Edtech Design Overhaul)  
**Aesthetic:** Floating Pill Architecture, Elevated Panels, Modern Edtech Workbench  
**Primary Accent:** Royal Blue `#2727E6`

---

## 1. Core Visual Tokens & Color Palette

- **Primary Brand Color:** Royal Blue `#2727E6`
  - Hover: `#1F1FB8`
  - Secondary / Accent Tint: `#6875F5`
  - Subtle Surface Tint: `rgba(39, 39, 230, 0.12)` (`bg-[#2727E6]/15`)
  - Border Tint: `rgba(39, 39, 230, 0.3)` (`border-[#2727E6]/30`)
- **Surfaces & Layers:**
  - Canvas Background: `bg-[#0D0E1A]` (deep indigo/midnight black)
  - Elevated Workbench Panels: `bg-[#131422]/90` or `bg-[#131422]/70` with `backdrop-blur-md`
  - Inset Containers & Textareas: `bg-black/40` or `bg-white/5`
  - Structural Borders: Hairline `border-white/10` (active/focus: `border-[#2727E6]`)
- **Geometry & Border Radii:**
  - `rounded-3xl`: Main split-pane workbench panels & floating top navbar
  - `rounded-2xl`: Interior section containers (Topic selector, PTT stage, Candidate transcript, Scorecard body)
  - `rounded-full`: All interactive buttons, action pills, service status badges, and score indicators

---

## 2. Typography Rules

- **Prose & Explanations:** Sans-serif (`Inter`, system-ui, -apple-system, sans-serif) for maximum legibility when reading Hinglish and English interview dialogues.
- **Metrics, Code & Timers:** Monospace (`JetBrains Mono`, `Fira Code`, monospace) strictly reserved for:
  - Big-O complexity (`O(log n)`, `O(1)`)
  - Algorithm/data structure tokens (`max-heap`, `min-heap`, `BST`, `DFS`)
  - Live recording countdown timer, keycap shortcuts (`[Space]`), and numeric scores

---

## 3. Inline Code Rendering Rule (CRITICAL)

In `react-markdown`, block-level code blocks must be separated from inline code phrases:

- **Inline Code (`!className`):**
  Must render with `inline px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[12.5px] border border-zinc-700/60 align-baseline mx-0.5`.
  Phrases like `max-heap`, `O(n)`, and `left pointer` MUST stay inline inside sentences and never break into separate full-width block elements.
- **Code Blocks (`className` contains `language-` or multi-line):**
  Render as `block w-full bg-[#0D0E1A] p-4 rounded-xl font-mono text-xs text-emerald-300 border border-white/10 overflow-x-auto my-3`.

---

## 4. UI Components & Layout Architecture

Desktop Viewport: `lg:h-screen lg:overflow-hidden flex flex-col`. The user never needs to scroll down the whole page to see interview feedback.

### Structure:
1. **Suspended Floating Pill Navigation Bar (`h-14` / `h-16`):**
   - Suspended inside a floating pill: `max-w-[128rem] mx-auto bg-[#131422]/90 backdrop-blur-md border border-white/10 rounded-3xl px-5 flex items-center justify-between shadow-lg shadow-black/20`.
   - Left: `rounded-full` History button with animated blue pulsing dot + `rounded-xl` app avatar badge (`w-7 h-7 bg-[#2727E6]`).
   - Right: Compact `rounded-full` pill badges for service statuses (`STT: Prisma`, `Brain: Gemini 3.8`, `Voice: Avinash`).

2. **Left Pane — Candidate Studio (38% width on desktop, fixed):**
   - Container: `rounded-3xl bg-[#131422]/70 backdrop-blur-md border border-white/10 p-6 flex flex-col gap-5`.
   - Top: `TopicSelector` in a `rounded-2xl bg-white/5 border border-white/10 p-4` container.
   - Middle: Interactive Push-to-Talk pill button (`rounded-full px-8 py-4 bg-[#2727E6] hover:bg-[#1F1FB8]` with right-arrow micro-interaction, live countdown timer, and `[Space]` shortcut keycap).
   - Bottom: Candidate Transcript inset card (`rounded-2xl bg-black/40 border border-white/10 p-4`) with internally scrollable transcript and integrated 16kHz WAV player in the footer.

3. **Right Pane — Interviewer Evaluation (62% width on desktop, independent scroll):**
   - Top Sticky Card: `rounded-3xl bg-[#131422]/90 backdrop-blur-md border border-white/10 p-6 flex flex-col gap-4`.
     - Coach Avinash profile avatar (`w-10 h-10 rounded-full bg-[#2727E6]`) and subtitle "FAANG DSA Interview Mentor".
     - Numeric Score badge (`rounded-full bg-[#2727E6]/15 border border-[#2727E6]/30 text-white font-bold text-sm px-4 py-1.5`).
     - Verbal Summary quote in a soft inset card (`rounded-2xl bg-white/5 border border-white/10 p-4 text-zinc-200 text-sm leading-relaxed`).
     - Spoken voice audio player with `#2727E6` progress bar and `rounded-full` play/pause button.
   - Structured Scorecard Grid: `rounded-3xl bg-[#131422]/70 backdrop-blur-md border border-white/10 p-6` containing `Logic Check`, `Edge Cases Missed`, `Time & Space Complexity`, and `Ideal Interview Explanation` in an inset markdown container.
