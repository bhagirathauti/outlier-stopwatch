/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    darkMode: 'class', // or 'media' if you want to use system preferences
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        },
        animation: {
          'pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          pulse: {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 },
          },
        },
        transitionProperty: {
          'colors': 'background-color, border-color, color, fill, stroke',
        },
        transitionDuration: {
          '300': '300ms',
        },
      },
    },
    plugins: [],
  }