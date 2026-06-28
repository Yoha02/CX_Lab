import { describe, it, expect } from "vitest";
import { coerceBranchResult } from "./generator.js";

describe("coerceBranchResult", () => {
  it("keeps exactly one champion and clamps scores", () => {
    const r = coerceBranchResult({
      candidates: [
        { strategy: "a", predicted_next_intent: "x", score: 1.4, status: "kept", reason: "r" },
        { strategy: "b", predicted_next_intent: "y", score: -1, status: "kept", reason: "r" },
      ],
      championStrategy: "a", agentResponse: "hello",
    });
    expect(r.candidates[0].score).toBe(1);
    expect(r.candidates[1].score).toBe(0);
    expect(r.candidates.filter((c) => c.status === "kept")).toHaveLength(1);
  });
});