/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aqua-blue': '#5a6b81',   // textos principales, encabezados
        'aqua-dark': '#3a4b5c',   // header / footer oscuro
        'aqua-orange': '#f26522', // acento: botones principales, insignias
        'aqua-light': '#fbf9f6',  // fondo principal
      },
    },
  },
  plugins: [],
}
