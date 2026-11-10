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
        brand: {
          DEFAULT: '#2727E6',
          hover: '#1F1FB8',
          tint: 'rgba(39, 39, 230, 0.12)',
          border: 'rgba(39, 39, 230, 0.3)',
        },
        surface: {
          canvas: '#0D0E1A',
          panel: '#131422',
        },
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
