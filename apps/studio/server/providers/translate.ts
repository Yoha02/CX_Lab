import { env } from "../lib/env.js";

const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface TranslateResult {
  lang: string;
  original: string;
  english: string;
  sentiment: { label: string; frustration: number };
}

export async function detectAndTranslate(text: string): Promise<TranslateResult> {
  const prompt = `You are a retail support assistant pre-processor. For the customer message below:
1. Detect the language (BCP-47, e.g. es-ES, en-US). IMPORTANT: if the text is a phonetic/transliterated rendering of English words in a non-English script (e.g. English words spelled out in Kannada, Hindi, Arabic, or any other script — common when a speech model hallucinates the script from prior context), treat it as English and return lang "en-US" with the intended English sentence as both original and english.
2. Keep the original text (or the English reconstruction if phonetic English was detected).
3. Translate to natural English.
4. Read sentiment: a short label (e.g. "frustrated", "anxious", "neutral", "calm") and a frustration score 0..1.
Return ONLY compact JSON: {"lang":"<bcp47>","original":"<text>","english":"<english>","sentiment":{"label":"<label>","frustration":<0..1>}}.
No markdown.

Customer message: ${text}`;
  const url = `${BASE}/models/${MODEL}:generateContent?key=${env.geminiKey}`;
  const res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Translate ${res.status}: ${await res.text()}`);
  const out: any = await res.json();
  const raw = out.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text ?? "";
  const m = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : raw);
}
