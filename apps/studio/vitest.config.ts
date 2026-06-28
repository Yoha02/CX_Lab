import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  plugins: [react()],
  test: {
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "test-key",
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});