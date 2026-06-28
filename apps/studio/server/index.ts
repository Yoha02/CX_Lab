import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { selectTts } from "./providers/tts/index.js";
import { detectAndTranslate } from "./providers/translate.js";
import { attachGeminiLive } from "./providers/voice/geminiLive.js";
import { env } from "./lib/env.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/tts", async (req, res) => {
  try {
    const { text, provider } = req.body as { text: string; provider?: "google" | "elevenlabs" };
    if (!text) return res.status(400).json({ error: "text required" });
    const tts = selectTts(provider ?? env.ttsProvider);
    const out = await tts.synthesize(text);
    res.json(out);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/translate", async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: "text required" });
    res.json(await detectAndTranslate(text));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/api/live") {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } else {
    socket.destroy();
  }
});

wss.on("connection", (clientWs) => attachGeminiLive(clientWs));

server.listen(env.port, () => {
  console.log(`http://localhost:${env.port}`);
  console.log(`ws ws://localhost:${env.port}/api/live`);
});
