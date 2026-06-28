export interface Metadata {
  profile_id: string;
  customer_name: string;
  profile_segment: string;
  scenario: string;
  policy_version: string;
  policy_arm: string;
  merchant_id: string;
  experiment_generation: number;
  seed: number;
}

export interface ProfileSnapshot {
  loyalty_tier: string;
  ltv_bucket: string;
  family_size: number;
  recent_orders_90d: number;
  prior_tickets_90d: number;
  risk_flags?: string[];
  learned_preferences_before_call?: string[];
}

export interface Outcome {
  contained: boolean;
  resolved: boolean;
  escalated: boolean;
  dropoff: boolean;
  resolution: string;
  turns_to_resolution?: number | null;
  turns_before_failure?: number | null;
  final_sentiment: number;
  csat_prediction: number;
  recontact_risk: number;
}

export interface PredictionBeforeTurn {
  source_turn_id: number;
  method: string;
  top_intents: Array<{ intent: string; probability: number }>;
  top_utterance_candidates?: Array<{ text: string; probability: number }>;
  confidence: number;
  entropy: number;
  logprob_available?: boolean;
}

export interface PredictionScore {
  intent_hit: boolean;
  intent_rank: number;
  brier_score: number;
  negative_log_likelihood: number;
  semantic_similarity_best_candidate?: number;
  calibration_error?: number;
}

export interface TurnEval {
  customer_state_delta: number;
  risk_delta: number;
  key_event?: string | null;
}

export interface PruningSignal {
  eligible_for_learning: boolean;
  signal_type: string;
  keep_as_evidence?: boolean;
  notes?: string | null;
  hard_prune?: boolean;
  soft_prune_reason?: string | null;
  preference_label?: string;
  counterfactual_to_try?: string;
  dream_pass_tags?: string[];
}

export interface PolicyAction {
  action_id: string;
  response_strategy: string;
  tools_called?: string[];
  memory_snippets_used?: string[];
  ignored_memory_warnings?: string[];
}

export interface ResponseEval {
  empathy: number;
  helpfulness: number;
  policy_compliance: number;
  factuality: number;
  tone: number;
  tool_use_quality: number;
  missed_tool_opportunity?: string | null;
}

export interface Turn {
  turn_id: number;
  speaker: 'shopper' | 'agent' | string;
  timestamp_ms: number;
  channel: string;
  text: string;
  asr_confidence?: number;
  actual_labels?: {
    intent: string;
    sentiment: string;
    emotion_intensity?: number;
    escalation_risk?: number;
    objection?: string;
  };
  prediction_before_turn?: PredictionBeforeTurn;
  prediction_score?: PredictionScore;
  turn_eval?: TurnEval;
  pruning_signal?: PruningSignal;
  policy_action?: PolicyAction;
  response_eval?: ResponseEval;
}

export interface Evaluation {
  rubric_version: string;
  contained: boolean;
  resolution_score: number;
  sentiment_recovery_score: number;
  compliance_score: number;
  empathy_score: number;
  prediction_quality_score: number;
  efficiency_score: number;
  revenue_or_retention_score: number;
  penalties?: Record<string, number>;
  composite_reward: number;
  failure_mode?: string | null;
  miss_reason?: string | null;
}

export interface PruningDecision {
  branch_status: string;
  prune_type: string;
  prune_at_turn_id?: number | null;
  should_remove_policy_arm?: boolean;
  should_reduce_policy_arm_weight?: boolean;
  policy_arm_weight_delta?: number;
  hard_prune_reasons?: string[];
  soft_prune_reasons?: string[];
  thresholds?: Record<string, number>;
  preference_pair?: {
    negative_response_turn_id: number;
    recommended_positive_strategy: string;
    training_label: string;
  } | null;
}

export interface ProposedMemoryPatch {
  target: string;
  patch_type: string;
  candidate_text: string;
}

export interface ProposedPredictionPriorUpdate {
  condition: string;
  increase_intent_probability?: Record<string, number>;
  decrease_intent_probability?: Record<string, number>;
}

export interface DreamInput {
  eligible: boolean;
  priority: string;
  tags?: string[];
  evidence_summary: string;
  proposed_memory_patch?: ProposedMemoryPatch;
  proposed_prediction_prior_update?: ProposedPredictionPriorUpdate;
}

export interface ConversationResult {
  schema_version: string;
  session_id: string;
  run_id: string;
  created_at: string;
  session_type: string;
  metadata: Metadata;
  profile_snapshot: ProfileSnapshot;
  outcome: Outcome;
  turns: Turn[];
  evaluation: Evaluation;
  pruning_decision: PruningDecision;
  dream_input: DreamInput;
  dream_pass_processed?: boolean;
}
