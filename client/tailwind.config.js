/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {

    // Extend the default theme
    extend: {

      // Custom font family
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        'normal': '400',
      },

      // Custom colors
      colors: {
        'primary': '#373737',
      }
    },
  },
  plugins: [],
}
