/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        error: '#EF4444',
        text: '#1F2937',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter'],
      },
    },
  },
  plugins: [],
} 