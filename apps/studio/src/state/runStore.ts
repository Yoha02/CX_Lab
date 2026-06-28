import { create } from "zustand";
import type { Turn, Candidate } from "../lib/contracts.js";
import type { Iteration } from "./iterations.js";

type CallStatus = "idle" | "connecting" | "live" | "paused";

interface RunState {
  displayMode: boolean;
  callStatus: CallStatus;
  activeIterationIndex: number;
  iterations: Iteration[];
  turns: Turn[];
  branchCandidates: Candidate[];
  lastGoodCandidates: Candidate[];
  toggleDisplayMode(): void;
  setCallStatus(s: CallStatus): void;
  setActiveIteration(i: number): void;
  setIterations(i: Iteration[]): void;
  addTurn(t: Turn): void;
  addCandidate(c: Candidate): void;
  commitBranchFrame(): void;
  clearBranch(): void;
  reset(): void;
}

export const useRunStore = create<RunState>((set) => ({
  displayMode: true,             // ON during build; flip OFF for real DataSource
  callStatus: "idle",
  activeIterationIndex: 0,
  iterations: [],
  turns: [],
  branchCandidates: [],
  lastGoodCandidates: [],
  toggleDisplayMode: () => set((s) => ({ displayMode: !s.displayMode })),
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
  reset: () => set({ callStatus: "idle", turns: [], branchCandidates: [] }),
}));

export const selectActiveIteration = (s: { iterations: Iteration[]; activeIterationIndex: number }) =>
  s.iterations[s.activeIterationIndex];