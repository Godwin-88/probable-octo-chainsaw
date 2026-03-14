/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean dark theme
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        gold: '#fbbf24',
        primary: {
          100: '#e0f2ff',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Web3 neon accents (2025–2026)
        neon: {
          cyan: '#00fff5',
          purple: '#9945ff',
          pink: '#ff2d6a',
          green: '#00ff88',
        },
        // Chain-colored highlights (Solana purple, Ethereum blue, etc.)
        chain: {
          eth: '#627eea',
          sol: '#9945ff',
          ton: '#0098ea',
          tron: '#ff0013',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 255, 245, 0.35)',
        'glow-purple': '0 0 20px rgba(153, 69, 255, 0.35)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
