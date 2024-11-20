/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'double-click': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
        }
      },
      animation: {
        'double-click': 'double-click 0.5s ease-in-out infinite',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

