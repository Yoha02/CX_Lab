const INPUT_RATE = 16000;

function b64FromInt16(i16: Int16Array): string {
  const b = new Uint8Array(i16.buffer);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

export interface MicHandle { stop(): void; }

export async function startMicCapture(onChunk: (b64: string) => void): Promise<MicHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const ctx = new AudioContext();
  await ctx.resume();
  const rate = ctx.sampleRate;
  const src = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const sink = ctx.createGain();
  sink.gain.value = 0;
  src.connect(processor);
  processor.connect(sink);
  sink.connect(ctx.destination);
  const ratio = rate / INPUT_RATE;
  processor.onaudioprocess = (e) => {
    const inp = e.inputBuffer.getChannelData(0);
    const out = new Int16Array(Math.floor(inp.length / ratio));
    for (let i = 0; i < out.length; i++) {
      let sum = 0;
      const s = Math.floor(i * ratio);
      const en = Math.min(inp.length, Math.floor((i + 1) * ratio));
      for (let j = s; j < en; j++) sum += inp[j];
      const v = Math.max(-1, Math.min(1, sum / (en - s)));
      out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    onChunk(b64FromInt16(out));
  };
  return {
    stop() {
      processor.disconnect();
      ctx.close().catch(() => {});
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

export async function playAudioFromData(mime: string, base64: string): Promise<void> {
  const audio = new Audio(`data:${mime};base64,${base64}`);
  await audio.play().catch(() => {});
}