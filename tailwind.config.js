/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        primary_accent: "var(--color-primary-accent)",
        background: "var(--color-background)",
        textcolor: "var(--color-textcolor)",
      },
    },
  },
  plugins: [],
};
