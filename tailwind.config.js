/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0A', ivory: '#ECE6DA', mut: '#A39D92', dim: '#8C877E', gold: '#C8B38A', walnut: '#3A2416'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Garamond', '"Times New Roman"', 'serif'],
        sans: ['"Instrument Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        sig: ['"Mrs Saint Delafield"', '"Brush Script MT"', 'cursive']
      }
    }
  },
  plugins: []
};
