export type Iteration = {
  id: string;
  voiceInput: "livekit" | "geminiLive";
  tts: "google" | "elevenlabs"; // output is ALWAYS English; this only picks the voice engine
  branchModel: string;
  branchGen: { depth: number; beamWidth: number; maxCandidates: number };
  scenario: string;
};

export const ITERATIONS: Iteration[] = [
  { id: "livekit_elevenlabs", voiceInput: "livekit", tts: "elevenlabs",
    branchModel: "gemini-2.5-flash", branchGen: { depth: 3, beamWidth: 1, maxCandidates: 3 }, scenario: "maya_late_gift" },
  { id: "gemini_google", voiceInput: "geminiLive", tts: "google",
    branchModel: "gemini-2.5-flash", branchGen: { depth: 3, beamWidth: 1, maxCandidates: 3 }, scenario: "maya_late_gift" },
];
