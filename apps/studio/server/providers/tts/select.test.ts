import { describe, it, expect } from "vitest";
import { selectTts } from "./index.js";
import { googleTts } from "./google.js";
import { elevenLabsTts } from "./elevenlabs.js";

describe("selectTts", () => {
  it("returns google by default", () => { expect(selectTts("google")).toBe(googleTts); });
  it("returns elevenlabs when asked", () => { expect(selectTts("elevenlabs")).toBe(elevenLabsTts); });
});
