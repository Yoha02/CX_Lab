import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933", muted: "#6b7785", surface: "#f0f2f5", panel: "#ffffff",
        accent: "#3f7cac", promoted: "#2f7d57", preserved: "#3f7cac", pruned: "#c0533f",
      },
      borderRadius: { xl: "12px" },
    },
  },
  plugins: [],
} satisfies Config;