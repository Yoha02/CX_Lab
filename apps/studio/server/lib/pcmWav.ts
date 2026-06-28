export function pcmToWav(b64: string, mime: string): { mime: string; base64: string } {
  const m = mime.match(/rate=(\d+)/);
  const sampleRate = m ? parseInt(m[1], 10) : 24000;
  const pcm = Buffer.from(b64, "base64");
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return { mime: "audio/wav", base64: Buffer.concat([header, pcm]).toString("base64") };
}
