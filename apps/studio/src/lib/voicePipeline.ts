import { startMicCapture, playAudioFromData, type MicHandle } from "./audio.js";
import { openLiveSocket, type LiveSocket } from "./liveSocket.js";
import { streamBranches } from "./branchSocket.js";
import { useRunStore, selectActiveIteration } from "../state/runStore.js";
import { getDataSource } from "../data/index.js";
import { joinLiveKitRoom } from "./livekit.js";

let turnId = 0;

async function finalizeUtterance(text: string): Promise<void> {
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
    const profile = await getDataSource(useRunStore.getState().displayMode).getProfile();
    useRunStore.getState().clearBranch();
    streamBranches(
      {
        englishTranscript: d.english,
        ctx: {
          shopperMode: profile?.shopper_mode ?? "Shopper",
          badges: profile?.badges ?? [],
          intent: "late_delivery",
          situationTags: ["urgent_event_deadline", "gift_order"],
        },
        gen: { model: "gemini-2.5-flash", maxCandidates: 3 },
      },
      {
        onCandidate: (c) => useRunStore.getState().addCandidate(c),
        onChampion: async (_strategy, agentResponse) => {
          useRunStore.getState().addTurn({
            turn_id: ++turnId,
            speaker: "agent",
            original: agentResponse,
            english: agentResponse,
            lang: "en-US",
          });
          const provider = selectActiveIteration(useRunStore.getState())?.tts ?? "google";
          const tts = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: agentResponse, provider }),
          });
          const audio = await tts.json();
          if (audio.audioBase64) await playAudioFromData(audio.mime, audio.audioBase64);
        },
        onError: (m) => console.warn("branch error", m),
        onDone: () => useRunStore.getState().commitBranchFrame(),
      },
    );
  } catch (e) {
    console.error("pipeline error", e);
  }
}

export async function startDemo2Pipeline(): Promise<() => void> {
  let mic: MicHandle | null = null;
  let buffer = "";
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    const text = buffer.trim();
    buffer = "";
    void finalizeUtterance(text);
  };

  const socket: LiveSocket = openLiveSocket({
    onSetup: async () => {
      mic = await startMicCapture((b64) => socket.sendAudioChunk(b64));
      useRunStore.getState().setCallStatus("live");
    },
    onInputText: (t) => {
      buffer += t;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(flush, 1200);
    },
    onClose: () => useRunStore.getState().setCallStatus("idle"),
  });

  return () => {
    mic?.stop();
    socket.close();
    if (idleTimer) clearTimeout(idleTimer);
  };
}

export async function startPipeline(): Promise<() => void> {
  const active = selectActiveIteration(useRunStore.getState());
  if (active?.voiceInput === "livekit") {
    useRunStore.getState().setCallStatus("live");
    let buffer = "";
    let idle: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      const text = buffer.trim();
      buffer = "";
      void finalizeUtterance(text);
    };
    const handle = await joinLiveKitRoom((text, final) => {
      buffer += text;
      if (final) { flush(); }
      else { if (idle) clearTimeout(idle); idle = setTimeout(flush, 1200); }
    });
    return () => {
      handle.leave();
      if (idle) clearTimeout(idle);
      useRunStore.getState().setCallStatus("idle");
    };
  }
  return startDemo2Pipeline();
}