import { create } from "zustand";
import type { Turn, Candidate } from "../lib/contracts.js";
import type { Iteration } from "./iterations.js";

export type CallStatus = "idle" | "connecting" | "ready" | "speaking";

export interface LanguageSwitch {
  lang: string;
  original: string;
  english: string;
  frustration: number;
  tags: string[];
}

interface RunState {
  callStatus: CallStatus;
  activeIterationIndex: number;
  iterations: Iteration[];
  turns: Turn[];
  branchCandidates: Candidate[];
  lastGoodCandidates: Candidate[];
  detectedIntent: string;
  languageSwitch: LanguageSwitch | null;

  setCallStatus(s: CallStatus): void;
  setActiveIteration(i: number): void;
  setIterations(i: Iteration[]): void;
  addTurn(t: Turn): void;
  addCandidate(c: Candidate): void;
  commitBranchFrame(): void;
  clearBranch(): void;
  setDetectedIntent(intent: string): void;
  setLanguageSwitch(ls: LanguageSwitch): void;
  clearLanguageSwitch(): void;
  reset(): void;
}

export const useRunStore = create<RunState>((set) => ({
  callStatus: "idle",
  activeIterationIndex: 0,
  iterations: [],
  turns: [],
  branchCandidates: [],
  lastGoodCandidates: [],
  detectedIntent: "",
  languageSwitch: null,

  setCallStatus: (callStatus) => set({ callStatus }),
  setActiveIteration: (activeIterationIndex) => set({ activeIterationIndex }),
  setIterations: (iterations) => set({ iterations }),
  addTurn: (t) => set((s) => ({ turns: [...s.turns, t] })),
  addCandidate: (c) => set((s) => ({ branchCandidates: [...s.branchCandidates, c] })),
  commitBranchFrame: () =>
    set((s) => ({
      lastGoodCandidates: s.branchCandidates.length ? s.branchCandidates : s.lastGoodCandidates,
    })),
  clearBranch: () => set({ branchCandidates: [] }),
  setDetectedIntent: (detectedIntent) => set({ detectedIntent }),
  setLanguageSwitch: (languageSwitch) => set({ languageSwitch }),
  clearLanguageSwitch: () => set({ languageSwitch: null }),
  reset: () => set({
    callStatus: "idle",
    turns: [],
    branchCandidates: [],
    lastGoodCandidates: [],
    detectedIntent: "",
    languageSwitch: null,
  }),
}));

export const selectActiveIteration = (s: { iterations: Iteration[]; activeIterationIndex: number }) =>
  s.iterations[s.activeIterationIndex];
