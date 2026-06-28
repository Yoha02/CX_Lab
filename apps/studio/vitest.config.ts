import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  test: {
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "test-key",
    },
  },
});
