import { describe, it, expect } from "vitest";
import { ITERATIONS } from "./iterations.js";

describe("ITERATIONS", () => {
  it("has exactly two demos", () => { expect(ITERATIONS).toHaveLength(2); });
  it("demo 1 is livekit + elevenlabs", () => {
    const d = ITERATIONS[0];
    expect(d.voiceInput).toBe("livekit");
    expect(d.tts).toBe("elevenlabs");
  });
  it("demo 2 is geminiLive + google", () => {
    const d = ITERATIONS[1];
    expect(d.voiceInput).toBe("geminiLive");
    expect(d.tts).toBe("google");
  });
});
