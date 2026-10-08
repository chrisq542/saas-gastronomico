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
        // Semantic design tokens for Studio Light & Obsidian Dark
        surface: {
          light: "#FFFFFF",
          "light-card": "#FFFFFF",
          "light-muted": "#F4F4F5",
          dark: "#09090B",
          "dark-card": "#121215",
          "dark-muted": "#18181B",
        },
        border: {
          light: "rgba(228, 228, 231, 0.8)", // border-zinc-200/80
          dark: "rgba(39, 39, 42, 0.6)",      // border-zinc-800/60
        },
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SFMono-Regular"',
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
