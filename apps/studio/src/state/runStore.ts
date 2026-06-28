import { create } from "zustand";
import type { Turn } from "../lib/contracts.js";

type CallStatus = "idle" | "connecting" | "live" | "paused";

interface RunState {
  displayMode: boolean;
  callStatus: CallStatus;
  activeIterationIndex: number;
  turns: Turn[];
  toggleDisplayMode(): void;
  setCallStatus(s: CallStatus): void;
  setActiveIteration(i: number): void;
  addTurn(t: Turn): void;
  reset(): void;
}

export const useRunStore = create<RunState>((set) => ({
  displayMode: true,             // ON during build; flip OFF for real DataSource
  callStatus: "idle",
  activeIterationIndex: 0,
  turns: [],
  toggleDisplayMode: () => set((s) => ({ displayMode: !s.displayMode })),
  setCallStatus: (callStatus) => set({ callStatus }),
  setActiveIteration: (activeIterationIndex) => set({ activeIterationIndex }),
  addTurn: (t) => set((s) => ({ turns: [...s.turns, t] })),
  reset: () => set({ callStatus: "idle", turns: [] }),
}));