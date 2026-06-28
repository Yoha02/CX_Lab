import { describe, it, expect } from "vitest";
import { pcmToWav } from "./pcmWav.js";

describe("pcmToWav", () => {
  it("wraps PCM in a RIFF/WAVE header", () => {
    const pcm = Buffer.from([0, 0, 1, 0, 2, 0]).toString("base64");
    const out = pcmToWav(pcm, "audio/L16;rate=24000");
    expect(out.mime).toBe("audio/wav");
    const wav = Buffer.from(out.base64, "base64");
    expect(wav.subarray(0, 4).toString()).toBe("RIFF");
    expect(wav.subarray(8, 12).toString()).toBe("WAVE");
  });
});
