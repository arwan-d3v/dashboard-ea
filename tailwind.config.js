/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Ini adalah kunci utama untuk toggle Light/Dark mode manual
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};