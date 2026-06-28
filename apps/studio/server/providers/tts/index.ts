import { googleTts } from "./google.js";

export interface TtsProvider {
  synthesize(text: string, opts?: { voice?: string }): Promise<{ mime: string; audioBase64: string }>;
}

export function selectTts(provider: "google" | "elevenlabs"): TtsProvider {
  // elevenlabs added in Task 4
  return googleTts;
}
