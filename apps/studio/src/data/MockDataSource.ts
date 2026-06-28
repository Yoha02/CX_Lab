// === DISPLAY MODE DATA SOURCE — REMOVABLE ===
import type { DataSource } from "./DataSource.js";
import { mayaProfile, mayaMemory, dreamPatchFixture } from "./fixtures/maya.js";

let patches = [dreamPatchFixture];

export const mockDataSource: DataSource = {
  async getProfile() { return mayaProfile; },
  async getProfileMemory() { return mayaMemory; },
  async getPlaybookPatches(status = "ready_for_approval") { return patches.filter((p) => p.status === status); },
  async approvePlaybookPatch(id) { patches = patches.map((p) => (p.id === id ? { ...p, status: "approved" as const } : p)); },
  async saveConversationResult() { /* no-op in display mode */ },
};