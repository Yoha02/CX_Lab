import type { DataSource } from "./DataSource.js";

// Real source — wired to Person 3's API. Graceful empty/no-op until those routes exist.
export const apiDataSource: DataSource = {
  async getProfile() { return null; },
  async getProfileMemory() { return []; },
  async getPlaybookPatches(status = "ready_for_approval") {
    try { const r = await fetch(`/api/playbook-patches?status=${status}`); return r.ok ? await r.json() : []; } catch { return []; }
  },
  async approvePlaybookPatch(id) {
    try { await fetch(`/api/playbook-patches/${id}/approve`, { method: "POST" }); } catch {}
  },
  async saveConversationResult(result) {
    try { await fetch(`/api/conversation-results`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) }); } catch {}
  },
};