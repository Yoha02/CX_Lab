import { startMicCapture, playAudioFromData, type MicHandle } from "./audio.js";
import { openLiveSocket, type LiveSocket } from "./liveSocket.js";
import { useRunStore } from "../state/runStore.js";

export async function startDemo2Pipeline(): Promise<() => void> {
  let mic: MicHandle | null = null;
  let buffer = "";
  let turnId = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const finalizeUtterance = async () => {
    const text = buffer.trim();
    buffer = "";
    if (!text) return;
    const id = ++turnId;
    useRunStore.getState().addTurn({
      turn_id: id,
      speaker: "shopper",
      original: text,
      english: "",
      lang: "auto",
    });
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await r.json();
      const turns = useRunStore
        .getState()
        .turns.map((t) =>
          t.turn_id === id
            ? { ...t, english: d.english, lang: d.lang, sentiment: d.sentiment }
            : t
        );
      useRunStore.setState({ turns });
      const reply =
        "Thanks — I hear you. Let me check what I can do about that right now.";
      const agentId = ++turnId;
      useRunStore.getState().addTurn({
        turn_id: agentId,
        speaker: "agent",
        original: reply,
        english: reply,
        lang: "en-US",
      });
      const tts = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, provider: "google" }),
      });
      const audio = await tts.json();
      if (audio.audioBase64) await playAudioFromData(audio.mime, audio.audioBase64);
    } catch (e) {
      console.error("pipeline error", e);
    }
  };

  const socket: LiveSocket = openLiveSocket({
    onSetup: async () => {
      mic = await startMicCapture((b64) => socket.sendAudioChunk(b64));
      useRunStore.getState().setCallStatus("live");
    },
    onInputText: (t) => {
      buffer += t;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(finalizeUtterance, 1200);
    },
    onClose: () => useRunStore.getState().setCallStatus("idle"),
  });

  return () => {
    mic?.stop();
    socket.close();
    if (idleTimer) clearTimeout(idleTimer);
  };
}