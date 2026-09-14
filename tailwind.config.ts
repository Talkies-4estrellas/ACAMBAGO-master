import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e8f7f3",
          100: "#c2ecdf",
          200: "#86d9bf",
          300: "#49c59f",
          400: "#1da57f",
          500: "#068562",
          600: "#057856",
          700: "#046a4b",
          800: "#035c40",
          900: "#013F4A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "reel": "reel-scroll 40s linear infinite",
      },
      keyframes: {
        "reel-scroll": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
