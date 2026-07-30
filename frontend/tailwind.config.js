/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'linear-bg': '#0a0a0b',
        'linear-surface': '#141415',
        'linear-border': '#1e1e1f',
        'linear-hover': '#1a1a1b',
        'linear-text': '#e1e1e3',
        'linear-muted': '#7e7e80',
        'linear-accent': '#5e6ad2',
        'linear-green': '#22c55e',
        'linear-yellow': '#eab308',
        'linear-red': '#ef4444',
        'linear-blue': '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: [],
}
