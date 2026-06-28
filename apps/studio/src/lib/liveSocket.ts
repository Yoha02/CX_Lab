// NOTE: model id is `gemini-2.5-flash-native-audio-preview-09-2025` per empirical
// testing; the plan's `gemini-3.5-live-translate-preview` returns 404/1008 from
// the Live API. The server proxy in apps/studio/server/providers/voice/geminiLive.ts
// already targets the correct v1alpha endpoint; we just send the model id here.

export interface LiveSocket {
  sendAudioChunk(b64: string): void;
  close(): void;
}

export function openLiveSocket(handlers: {
  onSetup(): void;
  onInputText(t: string): void;
  onClose(): void;
}): LiveSocket {
  const ws = new WebSocket(`ws://${location.host}/api/live`);
  ws.binaryType = "arraybuffer";

  ws.onopen = () =>
    ws.send(
      JSON.stringify({
        setup: {
          model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
          generation_config: { response_modalities: ["AUDIO"] },
          input_audio_transcription: {},
        },
      })
    );

  ws.onmessage = async (ev) => {
    const raw = ev.data instanceof ArrayBuffer ? new TextDecoder().decode(ev.data) : ev.data;
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.setupComplete) handlers.onSetup();
    const t = msg.serverContent?.inputTranscription?.text;
    if (t) handlers.onInputText(t);
  };
  ws.onclose = () => handlers.onClose();

  return {
    sendAudioChunk: (b64) => {
      if (ws.readyState === WebSocket.OPEN)
        ws.send(
          JSON.stringify({
            realtime_input: { media_chunks: [{ mime_type: "audio/pcm", data: b64 }] },
          })
        );
    },
    close: () => ws.close(),
  };
}