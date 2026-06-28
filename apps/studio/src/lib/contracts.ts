// Read-only mirror of packages/contracts ConversationResult (UI subset).
// Do NOT edit packages/contracts here; re-mirror if Person 2 changes it.

export interface Profile {
  profile_id: string;
  customer_name: string;
  shopper_mode: string;          // e.g. "Loyal Shopper"
  badges: string[];              // e.g. ["Urgent","Gift Order"]
  features: Record<string, string | number>;
}

export interface Memory { id: string; text: string; }

export interface Turn {
  turn_id: number;
  speaker: "shopper" | "agent";
  original: string;              // original-language text (shopper) / English (agent)
  english: string;               // English translation (shopper) / same as original (agent)
  lang: string;                  // BCP-47
  sentiment?: { label: string; frustration: number };
}

export interface Candidate {
  strategy: string;              // e.g. "acknowledge + check stock"
  predicted_next_intent: string; // e.g. "accepts replacement"
  score: number;                 // 0..1
  status: "kept" | "preserved" | "pruned";
  reason?: string;
  parentId?: string;
  id: string;
}

export interface Metrics { containment: number; prediction: number; sentiment: number; risk: number; }

// --- Dream system (Person 3 boundary) — read-only mirror, field names owned by Person 3 ---
export interface PlaybookPatch {
  id: string;
  dream_cluster_key: string;            // e.g. late_delivery:urgent_event_deadline:policy_first_shipping_explanation:escalation_or_refund_threat
  intent: string;
  situation_tags: string[];
  cluster_summary: string;
  evidence: {
    conversation_count: number;
    failure_count: number;
    affected_personas: string[];        // ["loyal_shopper","first_time_buyer","discount_shopper"]
    avg_sentiment_delta: number;
    avg_escalation_risk: number;
  };
  add: string[];                        // playbook lines to add
  remove: string[];                     // playbook lines to remove
  persona_overrides: Record<string, string>;
  status: "ready_for_approval" | "approved";
}

// What Person 1 POSTs after a call (mocked until Person 3's API is live).
export interface CallResultUpload {
  intent: string;
  situation_tags: string[];
  agent_strategy: string;
  failure_mode: string;
  dream_cluster_key: string;
  english_transcript: string;
}