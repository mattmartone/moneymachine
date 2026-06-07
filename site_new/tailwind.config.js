
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        web: {
          gray: '#C0C0C0',
          darkgray: '#808080',
          blue: '#0000EE',
          purple: '#551A8B',
          red: '#FF0000',
          paper: '#F5F5DC', // Pale yellow/beige for racing form
          green: '#008000',
        }
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        serif: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      boxShadow: {
        'outset': 'inset 1px 1px 0px 0px #ffffff, inset -1px -1px 0px 0px #000000, inset 2px 2px 0px 0px #dfdfdf, inset -2px -2px 0px 0px #808080',
        'inset': 'inset 1px 1px 0px 0px #000000, inset -1px -1px 0px 0px #ffffff, inset 2px 2px 0px 0px #808080, inset -2px -2px 0px 0px #dfdfdf',
      }
    },
  },
  plugins: [],
}
