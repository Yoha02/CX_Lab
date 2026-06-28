import "dotenv/config";

function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const env = {
  geminiKey: need("GEMINI_API_KEY"),
  elevenKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
  livekitUrl: process.env.LIVEKIT_URL ?? "",
  livekitApiKey: process.env.LIVEKIT_API_KEY ?? "",
  livekitApiSecret: process.env.LIVEKIT_API_SECRET ?? "",
  port: Number(process.env.PORT ?? 3000),
  ttsProvider: (process.env.TTS_PROVIDER ?? "google") as "google" | "elevenlabs",
};
