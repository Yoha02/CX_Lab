import { describe, it, expect, beforeEach } from "vitest";
import { useRunStore } from "./runStore.js";

describe("runStore", () => {
  beforeEach(() => useRunStore.getState().reset());

  it("starts idle", () => {
    expect(useRunStore.getState().callStatus).toBe("idle");
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

  it("reset clears detectedIntent and languageSwitch", () => {
    useRunStore.getState().setDetectedIntent("late_delivery");
    useRunStore.getState().reset();
    expect(useRunStore.getState().detectedIntent).toBe("");
    expect(useRunStore.getState().languageSwitch).toBeNull();
  });
});
