/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          800: '#12233D',
          700: '#1B3358',
          600: '#25436F',
        },
        teal: {
          DEFAULT: '#0F9D9A',
          50: '#E6F7F6',
          100: '#C8EEEC',
          600: '#0D8A87',
          700: '#0B7370',
        },
        canvas: '#EEF2F7',
        ink: '#0F172A',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(10, 22, 40, 0.06)',
        lift: '0 12px 32px rgba(10, 22, 40, 0.12)',
      },
    },
  },
  plugins: [],
}
