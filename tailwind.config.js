/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { display: ["Outfit", "system-ui", "sans-serif"], body: ["Outfit", "system-ui", "sans-serif"] },
      colors: { ink: "#101014", paper: "#FAFAF7", accent: "#16A34A" }
    }
  },
  plugins: []
};
