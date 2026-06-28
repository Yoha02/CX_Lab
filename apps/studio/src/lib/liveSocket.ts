export interface LiveSocket {
  sendAudioChunk(b64: string): void;
  close(): void;
}

export function openLiveSocket(handlers: {
  onSetup(): void;
  onInputText(t: string): void;
  onOutputText?(t: string): void;
  onClose(): void;
}): LiveSocket {
  const ws = new WebSocket(`ws://${location.host}/api/live`);
  ws.binaryType = "arraybuffer";

  ws.onopen = () =>
    ws.send(
      JSON.stringify({
        setup: {
          model: "models/gemini-3.5-live-translate-preview",
          generation_config: {
            response_modalities: ["TEXT"],
          },
          // Request auto language detection + English output
          input_audio_transcription: {},
          output_audio_transcription: {},
        },
      })
    );

  ws.onmessage = (ev) => {
    const raw = ev.data instanceof ArrayBuffer ? new TextDecoder().decode(ev.data) : ev.data;
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.setupComplete) {
      handlers.onSetup();
      return;
    }

    // Input transcription (original language — what customer said)
    const inputText = msg.serverContent?.inputTranscription?.text;
    if (inputText) handlers.onInputText(inputText);

    // Output transcription (English translation from Gemini)
    const outputText = msg.serverContent?.outputTranscription?.text
      ?? msg.serverContent?.parts?.[0]?.text;
    if (outputText && handlers.onOutputText) handlers.onOutputText(outputText);
  };

  ws.onclose = () => handlers.onClose();
  ws.onerror = (e) => console.error("[liveSocket] error", e);

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
