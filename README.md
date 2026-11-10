# HinglishCS Coach 🎙️⚡

An AI-powered, voice-first Data Structures & Algorithms (DSA) interview coaching platform designed for bilingual engineering candidates explaining technical logic in Hinglish (Hindi + English) and English.

Built with a high-density modern edtech split-pane workbench, floating pill navigation, and strict design tokens.

---

## 🌟 Architecture & Pipeline

```
[Candidate Voice] ──> [Gnani Prisma v3 STT] ──> [Gemini 3.8 Flash Coaching Engine] ──> [Gnani Timbre v3 Voice]
  (16kHz mono WAV)       (Hinglish Code-Mix)         (Big-O, Edge Cases, Logic)            (Coach Avinash)
```

1. **Ears (Speech-to-Text):**
   - **Engine:** Gnani Prisma v3 ASR
   - **Capabilities:** High-accuracy Hinglish (`indic-auto`) code-mixing transcription (e.g., *"Main binary search use karunga taaki time complexity O(log n) ho jaaye"*).
   - **Input:** 16kHz mono WAV captured directly via Web Audio API with tactile Push-to-Talk and keyboard shortcuts.

2. **Brain (Technical Reasoning & Scorecard):**
   - **Engine:** Google Gemini 3.8 Flash (`gemini-3.8-flash`)
   - **Capabilities:** Rigorous FAANG interview evaluation analyzing concept logic, edge cases missed, Big-O time/space complexity, and an ideal interview solution.
   - **Streaming:** Server-Sent Events (SSE) streaming pipeline with `thinkingBudget: 0` for sub-second first-token latency.

3. **Mouth (Spoken Interviewer Feedback):**
   - **Engine:** Gnani Timbre v3 TTS
   - **Voice:** Avinash (`hi-IN-Avinash-Neural`)
   - **Latency Optimization:** Parallel synthesis triggers immediately upon early detection of the score header in the token stream, delivering spoken voice feedback simultaneously as the structured scorecard renders.

---

## 🎨 UI/UX Design System

- **Vibe & References:** Linear, Raycast, and modern edtech workspaces.
- **Color Palette:**
  - Canvas: Matte Midnight `#0D0E1A`
  - Elevated Panels: `#131422` with `backdrop-blur-md`
  - Primary Accent: Royal Blue `#2727E6` (hover `#1F1FB8`, subtle tint `rgba(39, 39, 230, 0.12)`)
- **Geometry:**
  - `rounded-3xl` for main workbench panels & floating top navbar
  - `rounded-2xl` for interior section containers
  - `rounded-full` for all action pills and status badges
- **Split-Pane 100vh Workbench:**
  - **Left Pane (Candidate Studio - 38%):** Target DSA topic selector, interactive PTT pill button with live countdown timer and `[Space]` shortcut, and candidate transcript inset card with integrated audio player.
  - **Right Pane (Interviewer Evaluation - 62%):** Sticky header banner combining the numeric score badge, Coach Avinash voice player, and verbal summary quote, with the structured evaluation grid below.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v9+)
- A [Gnani.ai](https://gnani.ai/) API Key
- A [Google AI Studio](https://aistudio.google.com/) Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Arnavisnotsane/hinglish-cs-coach.git
   cd hinglish-cs-coach
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your credentials:
   ```env
   GNANI_API_KEY=your_gnani_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   > 🔒 **Security Note:** All API keys are held strictly server-side in Vite's development middleware (`vite.config.js`). Keys are **never** injected into the client bundle or visible in browser network traffic.

4. **Start the Development Server:**
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production:**
   ```bash
   pnpm run build
   ```

---

## 🛡️ License

MIT License. See [LICENSE](LICENSE) for details.
