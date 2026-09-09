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
        ink: "#111827",
        muted: "#6B7280",
        line: "#E5E7EB",
        surface: "#F8FAFC",
        brand: "#4F46E5"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.05)"
      }
    }
  },
  plugins: []
};

export default config;