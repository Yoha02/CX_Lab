import { startMicCapture, playAudioFromData, unlockAudio, type MicHandle } from "./audio.js";
import { openLiveSocket, type LiveSocket } from "./liveSocket.js";
import { streamBranches } from "./branchSocket.js";
import { joinLiveKitRoom } from "./livekit.js";
import { useRunStore, selectActiveIteration } from "../state/runStore.js";
import { getDataSource } from "../data/index.js";

let turnId = 0;

export interface PipelineHandle {
  /** Unlock audio + start mic capture. Call from a click handler. */
  unmute(): Promise<void>;
  /** Stop mic capture and flush any buffered speech. */
  mute(): void;
  disconnect(): void;
}

// ── Shared utterance processor ─────────────────────────────────────────────────
async function finalizeUtterance(rawText: string, geminiTranslated?: string): Promise<void> {
  const text = rawText.trim();
  if (!text) return;

  const id = ++turnId;
  useRunStore.getState().addTurn({
    turn_id: id, speaker: "shopper",
    original: text, english: geminiTranslated ?? "", lang: "auto",
  });

  try {
    const r = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const d = await r.json();
    const english = geminiTranslated ?? d.english;

    useRunStore.setState(s => ({
      turns: s.turns.map(t => t.turn_id === id
        ? { ...t, english, lang: d.lang, sentiment: d.sentiment }
        : t),
    }));

    // Language rescue — fire only when genuinely non-English AND frustrated
    const isNonEnglish = d.lang && !d.lang.startsWith("en");
    const frustration = d.sentiment?.frustration ?? 0;
    if (isNonEnglish && frustration >= 0.45) {
      useRunStore.getState().setLanguageSwitch({
        lang: d.lang, original: text, english,
        frustration,
        tags: d.tags ?? [],
      });
    } else {
      useRunStore.getState().clearLanguageSwitch();
    }

    const profile = await getDataSource().getProfile();
    useRunStore.getState().clearBranch();

    streamBranches(
      {
        englishTranscript: english,
        ctx: {
          shopperMode: profile?.shopper_mode ?? "Shopper",
          badges: profile?.badges ?? [],
          // intent and situationTags intentionally omitted — inferred by the branch prompt from transcript
        },
        gen: { model: "gemini-2.5-flash", maxCandidates: 5 },
      },
      {
        onCandidate: c => useRunStore.getState().addCandidate(c),
        onChampion: async (strategy, agentResponse) => {
          if (strategy) useRunStore.getState().setDetectedIntent(strategy);
          if (!agentResponse) return;
          useRunStore.getState().addTurn({
            turn_id: ++turnId, speaker: "agent",
            original: agentResponse, english: agentResponse, lang: "en-US",
          });
          const active = selectActiveIteration(useRunStore.getState());
          const provider = active?.tts ?? "elevenlabs";
          const tts = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: agentResponse, provider }),
          });
          if (!tts.ok) { console.error("[pipeline] TTS failed:", tts.status); return; }
          const audio = await tts.json();
          if (audio.audioBase64) await playAudioFromData(audio.mime, audio.audioBase64);
        },
        onError: m => console.warn("[pipeline] branch error:", m),
        onDone: () => useRunStore.getState().commitBranchFrame(),
      }
    );
  } catch (e) {
    console.error("[pipeline] error:", e);
  }
}

// ── Gemini 3.5 Live Translate pipeline ────────────────────────────────────────
function buildGeminiHandle(): PipelineHandle {
  let mic: MicHandle | null = null;
  let inputBuf = "";
  let outputBuf = "";
  let safetyTimer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    const raw = inputBuf.trim();
    const translated = outputBuf.trim() || undefined;
    inputBuf = "";
    outputBuf = "";
    if (raw) void finalizeUtterance(raw, translated);
  };

  const socket: LiveSocket = openLiveSocket({
    onSetup: () => useRunStore.getState().setCallStatus("ready"),
    onInputText: t => {
      inputBuf += t;
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = setTimeout(flush, 2000);
    },
    onOutputText: t => { outputBuf += t; },
    onClose: () => useRunStore.getState().setCallStatus("idle"),
  });

  useRunStore.getState().setCallStatus("connecting");

  return {
    async unmute() {
      if (mic) return;
      unlockAudio();
      // Clear any leftover buffer from a previous turn
      inputBuf = "";
      outputBuf = "";
      mic = await startMicCapture(b64 => socket.sendAudioChunk(b64));
      useRunStore.getState().setCallStatus("speaking");
    },
    mute() {
      mic?.stop();
      mic = null;
      // Mute = user finished their turn → send the full utterance now
      flush();
      const s = useRunStore.getState().callStatus;
      if (s === "speaking") useRunStore.getState().setCallStatus("ready");
    },
    disconnect() {
      mic?.stop();
      socket.close();
      if (safetyTimer) clearTimeout(safetyTimer);
      useRunStore.getState().setCallStatus("idle");
    },
  };
}

// ── LiveKit pipeline ───────────────────────────────────────────────────────────
function buildLiveKitHandle(): PipelineHandle {
  let mic: MicHandle | null = null;
  let roomHandle: Awaited<ReturnType<typeof joinLiveKitRoom>> | null = null;
  let buffer = "";
  let idle: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    const text = buffer.trim();
    buffer = "";
    if (text) void finalizeUtterance(text);
  };

  useRunStore.getState().setCallStatus("connecting");

  joinLiveKitRoom((text, _final) => {
    // Accumulate all transcription — flush only happens on mute()
    buffer += (buffer ? " " : "") + text;
    if (idle) clearTimeout(idle);
    idle = setTimeout(flush, 2000);
  }).then(h => {
    roomHandle = h;
    useRunStore.getState().setCallStatus("ready");
  });

  return {
    async unmute() {
      if (mic) return;
      unlockAudio();
      // LiveKit captures via the room; just unlock audio for playback
      useRunStore.getState().setCallStatus("speaking");
      // Start a local mic capture feeding into finalizeUtterance as a sidecar
      mic = await startMicCapture(() => { /* LiveKit handles the audio room */ });
    },
    mute() {
      mic?.stop();
      mic = null;
      if (idle) clearTimeout(idle);
      flush();
      useRunStore.getState().setCallStatus("ready");
    },
    disconnect() {
      mic?.stop();
      roomHandle?.leave();
      if (idle) clearTimeout(idle);
      useRunStore.getState().setCallStatus("idle");
    },
  };
}

// ── Public: connect on page load ───────────────────────────────────────────────
export function connectPipeline(): PipelineHandle {
  const active = selectActiveIteration(useRunStore.getState());
  return active?.voiceInput === "livekit"
    ? buildLiveKitHandle()
    : buildGeminiHandle();
}
