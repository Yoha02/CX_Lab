import type { Profile, Memory, PlaybookPatch, CallResultUpload } from "../lib/contracts.js";

// Mirrors Person 3's API surface: conversation-results, playbook-patches (+approve).
export interface DataSource {
  getProfile(): Promise<Profile | null>;
  getProfileMemory(): Promise<Memory[]>;
  getPlaybookPatches(status?: "ready_for_approval" | "approved"): Promise<PlaybookPatch[]>;
  approvePlaybookPatch(id: string): Promise<void>;
  saveConversationResult(result: CallResultUpload): Promise<void>;
}