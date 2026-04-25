/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4fe',
          100: '#dde6fc',
          200: '#c2d3fa',
          300: '#98b5f6',
          400: '#678df0',
          500: '#4366e8',
          600: '#2d49dd',
          700: '#2538cb',
          800: '#242fa4',
          900: '#232d82',
          950: '#181e50',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c0a',
        },
        surface: '#f8fafc',
        card:    '#ffffff',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
}
