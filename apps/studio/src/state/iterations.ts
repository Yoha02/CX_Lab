export type Iteration = {
  id: string;
  voiceInput: "livekit" | "geminiLive";
  tts: "google" | "elevenlabs";
  branchModel: string;
  branchGen: { depth: number; beamWidth: number; maxCandidates: number };
  scenario: string;
};

export async function fetchIterations(): Promise<Iteration[]> {
  const r = await fetch("/api/iterations");
  return r.json();
}