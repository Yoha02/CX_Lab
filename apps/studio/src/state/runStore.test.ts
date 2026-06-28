import { describe, it, expect, beforeEach } from "vitest";
import { useRunStore } from "./runStore.js";

describe("runStore", () => {
  beforeEach(() => useRunStore.getState().reset());
  it("starts in display mode", () => { expect(useRunStore.getState().displayMode).toBe(true); });
  it("toggles display mode", () => {
    useRunStore.getState().toggleDisplayMode();
    expect(useRunStore.getState().displayMode).toBe(false);
  });
  it("adds turns and resets them", () => {
    useRunStore.getState().addTurn({ turn_id: 1, speaker: "shopper", original: "hi", english: "hi", lang: "en-US" });
    expect(useRunStore.getState().turns).toHaveLength(1);
    useRunStore.getState().reset();
    expect(useRunStore.getState().turns).toHaveLength(0);
  });
  it("reset keeps the active iteration", () => {
    useRunStore.getState().setActiveIteration(1);
    useRunStore.getState().reset();
    expect(useRunStore.getState().activeIterationIndex).toBe(1);
  });
});