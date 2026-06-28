import { env } from "../../lib/env.js";
import { pcmToWav } from "../../lib/pcmWav.js";
import type { TtsProvider } from "./index.js";

const MODEL_TTS = "gemini-2.5-flash-preview-tts";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

export const googleTts: TtsProvider = {
  async synthesize(text, opts) {
    const url = `${BASE}/models/${MODEL_TTS}:generateContent?key=${env.geminiKey}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: `Read this aloud in a natural, clear voice:\n\n${text}` }] }],
      generationConfig: {
        response_modalities: ["AUDIO"],
        speech_config: { voiceConfig: { prebuiltVoiceConfig: { voiceName: opts?.voice ?? "Kore" } } },
      },
    };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Google TTS ${res.status}: ${await res.text()}`);
    const out: any = await res.json();
    const part = out.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!part) throw new Error("Google TTS: no audio returned");
    const wav = pcmToWav(part.inlineData.data, part.inlineData.mimeType);
    return { mime: wav.mime, audioBase64: wav.base64 };
  },
};
