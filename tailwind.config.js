/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfb',
          100: '#ccfaf6',
          200: '#99f4ed',
          300: '#5fe8de',
          400: '#2dd3c6',
          500: '#4ECDC4',
          600: '#2BA09A',
          700: '#1e7a75',
          800: '#165f5a',
          900: '#0f4743',
        },
        pepos: {
          turquoise: '#4ECDC4',
          dark: '#2BA09A',
          cream: '#FFE66D',
          coral: '#FF6B6B',
          navy: '#2C3E50',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#eab308',
          600: '#ca8a04',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
