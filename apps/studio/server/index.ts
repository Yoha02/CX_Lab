import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { selectTts } from "./providers/tts/index.js";
import { detectAndTranslate } from "./providers/translate.js";
import { attachGeminiLive } from "./providers/voice/geminiLive.js";
import { createLiveKitToken } from "./providers/voice/livekit.js";
import { generateBranches } from "./providers/branch/generator.js";
import { ITERATIONS } from "./config/iterations.js";
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

app.get("/api/livekit/token", async (req, res) => {
  try {
    const room = String(req.query.room ?? "cx-demo");
    const identity = String(req.query.identity ?? `agent-${Date.now()}`);
    const token = await createLiveKitToken(room, identity);
    res.json({ url: env.livekitUrl, token });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/iterations", (_req, res) => res.json(ITERATIONS));

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });
const branchWss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/api/live") {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } else if (req.url === "/api/branch") {
    branchWss.handleUpgrade(req, socket, head, (ws) => branchWss.emit("connection", ws, req));
  } else {
    socket.destroy();
  }
});

wss.on("connection", (clientWs) => attachGeminiLive(clientWs));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

branchWss.on("connection", (client) => {
  client.on("message", async (data) => {
    let req: any;
    try { req = JSON.parse(data.toString()); } catch { return; }
    try {
      const result = await Promise.race([
        generateBranches(req.englishTranscript, req.ctx, req.gen),
        new Promise((_, rej) => setTimeout(() => rej(new Error("branch timeout")), 8000)),
      ]) as Awaited<ReturnType<typeof generateBranches>>;
      let i = 0;
      for (const candidate of result.candidates) {
        if (client.readyState !== client.OPEN) return;
        client.send(JSON.stringify({ type: "candidate", candidate, id: `c${i++}` }));
        await sleep(400);
      }
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({
          type: "champion",
          championStrategy: result.championStrategy,
          agentResponse: result.agentResponse,
        }));
      }
    } catch (e: any) {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ type: "error", message: e.message }));
      }
    } finally {
      if (client.readyState === client.OPEN) client.send(JSON.stringify({ type: "done" }));
    }
  });
});

server.listen(env.port, () => {
  console.log(`http://localhost:${env.port}`);
  console.log(`ws ws://localhost:${env.port}/api/live`);
  console.log(`ws ws://localhost:${env.port}/api/branch`);
});
