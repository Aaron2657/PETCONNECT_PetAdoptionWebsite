/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#435d78',   
        secondary: '#e8b085', 
        tertiary: '#93bed3',  
      }
    },
  },
  plugins: [],
}