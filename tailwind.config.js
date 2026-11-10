/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        zinc: {
          950: '#09090b',
          900: '#121215',
          850: '#18181c',
          800: '#27272a',
          750: '#323238',
          700: '#3f3f46',
        },
      },
    },
  },
  plugins: [],
}
