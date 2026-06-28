import { WebSocket } from "ws";
import { env } from "../../lib/env.js";

const GEMINI_LIVE_URL =
  `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${env.geminiKey}`;

export function attachGeminiLive(clientWs: WebSocket): void {
  const geminiWs = new WebSocket(GEMINI_LIVE_URL);
  const queue: { payload: any; binary: boolean }[] = [];

  geminiWs.on("open", () => { for (const q of queue) geminiWs.send(q.payload, { binary: q.binary }); queue.length = 0; });
  geminiWs.on("message", (data, isBinary) => { if (clientWs.readyState === WebSocket.OPEN) clientWs.send(isBinary ? data : data.toString()); });
  geminiWs.on("error", (err) => { try { clientWs.send(JSON.stringify({ error: err.message })); } catch {} });
  geminiWs.on("close", (code, reason) => { try { clientWs.close(code, reason.toString()); } catch {} });

  clientWs.on("message", (data, isBinary) => {
    const payload = isBinary ? data : data.toString();
    if (geminiWs.readyState === WebSocket.OPEN) geminiWs.send(payload, { binary: isBinary });
    else if (geminiWs.readyState === WebSocket.CONNECTING) queue.push({ payload, binary: isBinary });
  });
  clientWs.on("close", () => { try { geminiWs.close(); } catch {} });
  clientWs.on("error", () => { try { geminiWs.close(); } catch {} });
}
