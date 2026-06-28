import { googleTts } from "./google.js";
import { elevenLabsTts } from "./elevenlabs.js";

export interface TtsProvider {
  synthesize(text: string, opts?: { voice?: string }): Promise<{ mime: string; audioBase64: string }>;
}

export function selectTts(provider: "google" | "elevenlabs"): TtsProvider {
  return provider === "elevenlabs" ? elevenLabsTts : googleTts;
}
