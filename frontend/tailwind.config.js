/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        navy: { DEFAULT: '#0F172A', mid: '#1E293B', light: '#334155' },
        brand: { DEFAULT: '#3B82F6', dark: '#2563EB', light: '#60A5FA' },
        gold: { DEFAULT: '#F59E0B', light: '#FCD34D' },
      },
    },
  },
  plugins: [],
}
