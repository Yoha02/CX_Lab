import { env } from "../../lib/env.js";
import type { TtsProvider } from "./index.js";

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel (multilingual)
const MODEL = "eleven_multilingual_v2";

export const elevenLabsTts: TtsProvider = {
  async synthesize(text, opts) {
    if (!env.elevenKey) throw new Error("ELEVENLABS_API_KEY not set");
    const voice = opts?.voice || env.elevenVoiceId || DEFAULT_VOICE;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "xi-api-key": env.elevenKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { mime: "audio/mpeg", audioBase64: buf.toString("base64") };
  },
};
