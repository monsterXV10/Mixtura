import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A0E1A',
          800: '#0F1629',
          700: '#1A2340',
          600: '#1E2B4D',
          500: '#243358',
        },
        gold: {
          DEFAULT: '#C8A96E',
          dim: '#9B7E4F',
        },
        cream: {
          DEFAULT: '#F2EDE4',
          dim: '#C4BDB2',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '14px',
        lg: '20px',
      },
    },
  },
  plugins: [],
}

export default config
