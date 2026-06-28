import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2726",
        muted: "#68736e",
        surface: "#f4f2ec",
        "surface-soft": "#f8f6f0",
        panel: "#ffffff",
        line: "#dedbd0",
        accent: "#3f7cac",
        promoted: "#2f7d57",
        "promoted-soft": "#e0f0e5",
        preserved: "#b8842f",
        "preserved-soft": "#f2e6cf",
        pruned: "#b75d55",
        "pruned-soft": "#f4dfdc",
        "blue-soft": "#ddebf4",
        violet: "#6f65a8",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(31, 39, 38, 0.1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
