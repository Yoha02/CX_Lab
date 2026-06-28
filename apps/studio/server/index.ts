import "dotenv/config";
import express, { Request, Response } from "express";
import multer from "multer";
import { createServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { writeFileSync } from "fs";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("GEMINI_API_KEY missing in .env");
  process.exit(1);
}

const MODEL_AUDIO_IN = "gemini-2.5-flash";
const MODEL_TTS = "gemini-2.5-flash-preview-tts";
const MODEL_LIVE = "gemini-2.5-flash-native-audio-preview-09-2025";
const BASE = `https://generativelanguage.googleapis.com/v1beta`;

function geminiUrl(model: string) {
  return `${BASE}/models/${model}:generateContent?key=${KEY}`;
}

type Part = { text?: string; inline_data?: { mime_type: string; data: string }; inlineData?: { mimeType: string; data: string } };

async function callGemini(
  parts: Part[],
  responseModalities: ("TEXT" | "AUDIO")[] = ["TEXT"],
  speechConfig?: object,
  model: string = MODEL_AUDIO_IN,
) {
  const body: any = { contents: [{ role: "user", parts }] };
  if (responseModalities.length) {
    body.generationConfig = {
      response_modalities: responseModalities,
      ...(speechConfig ? { speech_config: speechConfig } : {}),
    };
  }
  const res = await fetch(geminiUrl(model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  return (await res.json()) as any;
}

function pcmToWav(b64: string, mime: string): { mime: string; base64: string } {
  const m = mime.match(/rate=(\d+)/);
  const sampleRate = m ? parseInt(m[1], 10) : 24000;
  const pcm = Buffer.from(b64, "base64");
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return { mime: "audio/wav", base64: Buffer.concat([header, pcm]).toString("base64") };
}

// --- REST endpoints (batch) ---

app.post("/api/process", upload.single("audio"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio file required" });
    const mime = req.file.mimetype || "audio/webm";
    const data = req.file.buffer.toString("base64");
    const prompt = `You are a live translator. Listen to the audio and:
1. Detect the spoken language (BCP-47 code, e.g. es-ES, fr-FR).
2. Transcribe exactly what was said in the original language.
3. Translate the transcript to natural English.

Return ONLY a compact JSON object with exactly these keys:
{"lang": "<bcp47>", "original": "<transcript>", "english": "<translation>"}
No markdown, no commentary.`;
    const out = await callGemini(
      [{ text: prompt }, { inline_data: { mime_type: mime, data } }],
      ["TEXT"], undefined, MODEL_AUDIO_IN,
    );
    const text = out.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(m ? m[0] : text));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: "text required" });
    const out = await callGemini(
      [{ text: `Read this aloud in a natural, clear voice:\n\n${text}` }],
      ["AUDIO"], { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }, MODEL_TTS,
    );
    const audioPart = out.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!audioPart) return res.status(502).json({ error: "no audio returned" });
    const wav = pcmToWav(audioPart.inlineData.data, audioPart.inlineData.mimeType);
    res.json({ mime: wav.mime, audioBase64: wav.base64 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/process-full", upload.single("audio"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio file required" });
    const mime = req.file.mimetype || "audio/webm";
    const data = req.file.buffer.toString("base64");
    const prompt = `You are a live translator. Listen to the audio and:
1. Detect the spoken language (BCP-47 code).
2. Transcribe exactly what was said in the original language.
3. Translate the transcript to natural English.
Return ONLY compact JSON: {"lang":"<bcp47>","original":"<transcript>","english":"<translation>"}. No markdown.`;
    const txtOut = await callGemini(
      [{ text: prompt }, { inline_data: { mime_type: mime, data } }],
      ["TEXT"], undefined, MODEL_AUDIO_IN,
    );
    const text = txtOut.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text);
    if (!parsed.english) return res.json({ ...parsed, audio: null });
    const audioOut = await callGemini(
      [{ text: `Read this aloud:\n\n${parsed.english}` }],
      ["AUDIO"], { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }, MODEL_TTS,
    );
    const audioPart = audioOut.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    res.json({
      lang: parsed.lang, original: parsed.original, english: parsed.english,
      audio: audioPart ? pcmToWav(audioPart.inlineData.data, audioPart.inlineData.mimeType) : null,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/reverse", async (req, res) => {
  try {
    const { text, targetLang } = req.body as { text: string; targetLang: string };
    if (!text || !targetLang) return res.status(400).json({ error: "text and targetLang required" });
    const translateOut = await callGemini(
      [{ text: `Translate the following English text into ${targetLang}. Return ONLY the translation, no explanation.\n\n${text}` }],
      ["TEXT"], undefined, MODEL_AUDIO_IN,
    );
    const translated = translateOut.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text?.trim() ?? "";
    const audioOut = await callGemini(
      [{ text: `Read this aloud in ${targetLang} with a natural voice:\n\n${translated}` }],
      ["AUDIO"], { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }, MODEL_TTS,
    );
    const audioPart = audioOut.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    res.json({
      english: text,
      translated,
      targetLang,
      audio: audioPart ? pcmToWav(audioPart.inlineData.data, audioPart.inlineData.mimeType) : null,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- Live API WebSocket proxy: browser <-> our server <-> Gemini Live ---
const GEMINI_LIVE_URL =
  `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${KEY}`;

// Debug: capture incoming audio per session
const DEBUG_CAPTURE = process.env.CAPTURE === "1";
const captureState = new Map<string, { chunks: Buffer[]; sampleRate: number }>();

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/api/live") {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } else {
    socket.destroy();
  }
});

wss.on("connection", (clientWs: WebSocket) => {
  console.log("[live] client connected");
  const geminiWs = new WebSocket(GEMINI_LIVE_URL);
  const queue: { payload: any; binary: boolean }[] = [];

  const closeBoth = (code = 1000, reason = "") => {
    try { geminiWs.close(code, reason); } catch {}
    try { clientWs.close(code, reason); } catch {}
  };

  geminiWs.on("open", () => {
    console.log("[live] gemini connected, flushing", queue.length, "queued");
    for (const q of queue) geminiWs.send(q.payload, { binary: q.binary });
    queue.length = 0;
  });

  geminiWs.on("message", (data, isBinary) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(isBinary ? data : data.toString());
    }
  });
  geminiWs.on("error", (err) => {
    console.error("[live] gemini error", err.message);
    try { clientWs.send(JSON.stringify({ error: err.message })); } catch {}
  });
  geminiWs.on("close", (code, reason) => {
    console.log("[live] gemini closed", code, reason.toString());
    closeBoth(code, reason.toString());
  });

  clientWs.on("message", (data, isBinary) => {
    const payload = isBinary ? data : data.toString();
    if (geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.send(payload, { binary: isBinary });
      const summary = payload.includes("media_chunks")
        ? `audio chunk (${payload.length}b)`
        : payload.includes("activity_start") ? "activity_start"
        : payload.includes("activity_end") ? "activity_end"
        : payload.slice(0, 80);
      console.log("[→]", summary);
      // capture audio for debugging
      if (DEBUG_CAPTURE && payload.includes("media_chunks")) {
        try {
          const m = payload.match(/"data":"([A-Za-z0-9+/=]+)"/);
          if (m) {
            const buf = Buffer.from(m[1], "base64");
            if (!captureState.has(clientWs.url)) captureState.set(clientWs.url, { chunks: [], sampleRate: 16000 });
            captureState.get(clientWs.url)!.chunks.push(buf);
          }
        } catch {}
      }
    } else if (geminiWs.readyState === WebSocket.CONNECTING) {
      queue.push({ payload, binary: isBinary });
    } else {
      console.warn("[live] drop message, gemini not open");
    }
  });

  clientWs.on("close", () => {
    if (DEBUG_CAPTURE) {
      const state = captureState.get(clientWs.url);
      if (state && state.chunks.length) {
        const pcm = Buffer.concat(state.chunks);
        const wav = pcmToWav(pcm.toString("base64"), `audio/L16;rate=${state.sampleRate}`);
        const filename = `/tmp/live-capture-${Date.now()}.wav`;
        writeFileSync(filename, Buffer.from(wav.base64, "base64"));
        console.log(`[capture] saved ${filename} (${(pcm.length/2/16000).toFixed(2)}s of 16kHz PCM, ${pcm.length} bytes)`);
        captureState.delete(clientWs.url);
      }
    }
    console.log("[live] client disconnected");
    try { geminiWs.close(); } catch {}
  });
  clientWs.on("close", () => {
    console.log("[live] client disconnected");
    try { geminiWs.close(); } catch {}
  });
  clientWs.on("error", (err) => console.error("[live] client error", err.message));
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
console.log(`ws   ws://localhost:${PORT}/api/live`);