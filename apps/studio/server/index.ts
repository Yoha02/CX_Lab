import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/api/live") {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws) => {
  ws.on("message", (data, isBinary) => {
    ws.send(isBinary ? data : data.toString());
  });
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
  console.log(`ws ws://localhost:${PORT}/api/live`);
});
