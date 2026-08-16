/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        benin: {
          green: '#0a3764',
          yellow: '#d8e8f9',
          red: '#E11B22',
          earth: '#2c3e50',
          cream: '#f4f6f8',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
