// === DISPLAY MODE FIXTURE — REMOVABLE ===
// Removal recipe: delete this file + MockDataSource.ts, drop the displayMode flag.
import type { Profile, Memory, PlaybookPatch } from "../../lib/contracts.js";

export const mayaProfile: Profile = {
  profile_id: "prof_maya_001",
  customer_name: "Maya",
  shopper_mode: "Loyal Shopper",
  badges: ["Urgent", "Gift Order", "Prior Issue", "High Value"],
  features: { age_range: "35-44", region: "CA", orders_last_90_days: 3, lifetime_value: "high", prior_tickets: 2, current_issue: "late_delivery" },
};

export const mayaMemory: Memory[] = [
  { id: "m1", text: "Values delivery certainty over discounts." },
  { id: "m2", text: "Gets frustrated by policy-first language." },
  { id: "m3", text: "Prior unresolved late-delivery ticket." },
];

// Cluster siblings — same failure cluster as Maya, different personas.
export const alexProfile: Profile = {
  profile_id: "prof_alex_002",
  customer_name: "Alex",
  shopper_mode: "First-Time Buyer",
  badges: ["Urgent", "Gift Order", "Low Trust"],
  features: { region: "NY", orders_last_90_days: 0, lifetime_value: "new", current_issue: "late_delivery" },
};

export const jordanProfile: Profile = {
  profile_id: "prof_jordan_003",
  customer_name: "Jordan",
  shopper_mode: "Discount Shopper",
  badges: ["Urgent", "Gift Order", "Discount Sensitive", "Return-Prone"],
  features: { region: "TX", orders_last_90_days: 5, lifetime_value: "medium", current_issue: "late_delivery" },
};

// Dream-pass payoff fixture (shape mirrors Person 3's playbook-patch output).
export const dreamPatchFixture: PlaybookPatch = {
  id: "patch_late_delivery_gen2",
  dream_cluster_key: "late_delivery:urgent_event_deadline:policy_first_shipping_explanation:escalation_or_refund_threat",
  intent: "late_delivery",
  situation_tags: ["urgent_event_deadline", "gift_order"],
  cluster_summary: "Shoppers with strict event deadlines escalate when the agent explains shipping policy before checking replacement inventory.",
  evidence: {
    conversation_count: 36, failure_count: 14,
    affected_personas: ["loyal_shopper", "first_time_buyer", "discount_shopper"],
    avg_sentiment_delta: -0.57, avg_escalation_risk: 0.68,
  },
  add: [
    "Acknowledge the event deadline in the first sentence.",
    "Run local inventory lookup before explaining policy.",
    "Offer replacement/reship before any refund discussion.",
  ],
  remove: [
    "Lead with standard shipping policy.",
    "Mention delivery windows before checking rescue options.",
  ],
  persona_overrides: {
    loyal_shopper: "Mention loyalty history and preserve the relationship.",
    first_time_buyer: "Emphasize trust and concrete confirmation.",
    discount_shopper: "Preserve value and mention price protection when available.",
  },
  status: "ready_for_approval",
};