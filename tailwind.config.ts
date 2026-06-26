import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          50: "#fbf7f2",
          100: "#f1e6d8",
          200: "#dec7ab",
          300: "#c29d76",
          400: "#9f754b",
          500: "#7e5534",
          600: "#5f3d28",
          700: "#3f271f",
          800: "#2c1a17",
          900: "#1d1110"
        },
        sage: {
          50: "#eef8f2",
          100: "#d9efdf",
          500: "#2f8f66",
          600: "#237551",
          700: "#1d5f43"
        },
        ambergap: {
          50: "#fff8e8",
          100: "#ffe9b8",
          500: "#d58a05",
          600: "#b36c03"
        },
        clay: {
          50: "#fff1ee",
          100: "#ffdcd4",
          600: "#b84b3f",
          700: "#8f372f"
        }
      },
      boxShadow: {
        soft: "0 18px 55px rgba(45, 30, 23, 0.08)",
        card: "0 10px 28px rgba(45, 30, 23, 0.07)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
