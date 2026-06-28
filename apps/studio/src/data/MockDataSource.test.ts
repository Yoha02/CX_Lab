import { describe, it, expect } from "vitest";
import { mockDataSource } from "./MockDataSource.js";

describe("mockDataSource", () => {
  it("returns the Maya profile", async () => {
    const p = await mockDataSource.getProfile();
    expect(p?.customer_name).toBe("Maya");
    expect(p?.badges).toContain("Urgent");
  });
  it("returns loaded memory", async () => {
    const m = await mockDataSource.getProfileMemory();
    expect(m.length).toBeGreaterThan(0);
  });
  it("returns a ready_for_approval patch and approves it", async () => {
    const before = await mockDataSource.getPlaybookPatches("ready_for_approval");
    expect(before.length).toBe(1);
    expect(before[0].evidence.affected_personas).toContain("discount_shopper");
    await mockDataSource.approvePlaybookPatch(before[0].id);
    const after = await mockDataSource.getPlaybookPatches("ready_for_approval");
    expect(after.length).toBe(0);
  });
});