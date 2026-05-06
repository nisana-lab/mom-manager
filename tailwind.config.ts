import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          50: "#fdfbf7",
          100: "#faf6ee",
          200: "#f3eadc",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e4ebe4",
          200: "#c9d8c9",
          300: "#a8c0a8",
          400: "#7d9a7d",
          500: "#5c7d5c",
          600: "#486448",
          700: "#3a513a",
          800: "#304230",
          900: "#283628",
        },
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        display: ["var(--font-assistant)", "var(--font-heebo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
