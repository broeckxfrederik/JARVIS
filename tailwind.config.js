/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'jarvis-blue': '#0a84ff',
        'jarvis-cyan': '#00d4ff',
      }
    }
  },
  plugins: []
}
