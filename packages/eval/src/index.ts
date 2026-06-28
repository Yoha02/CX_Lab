import type { ConversationResult, Turn } from '@cx-lab/contracts';

export interface EvalProfile {
  profile_id: string;
  customer_name?: string;
  shopper_mode?: string;
  ui_persona?: string;
  loyalty_tier?: string;
  ltv_bucket?: string;
  family_size?: number;
  recent_orders_90d?: number;
  prior_tickets_90d?: number;
  risk_flags?: string[];
  learned_preferences_before_call?: string[];
  features?: Record<string, any>;
}

export interface EvalTurnInput {
  speaker: 'shopper' | 'agent' | string;
  text: string;
  intent?: string;
  sentiment?: string;
  strategy?: string;
  escalation_risk?: number;
  tools_called?: string[];
}

export interface BuildConversationResultInput {
  session_id: string;
  run_id?: string;
  created_at?: string;
  session_type?: string;
  profile: EvalProfile;
  scenario: string;
  intent?: string;
  policy_version: string;
  policy_arm: string;
  experiment_generation?: number;
  seed?: number;
  turns: EvalTurnInput[];
  outcome?: Partial<ConversationResult['outcome']>;
  mode?: 'baseline_failure' | 'post_patch_success' | 'generic';
}

export interface PredictionBlendInput {
  model: Record<string, number>;
  profile?: Record<string, number>;
  transition?: Record<string, number>;
  weights?: { alpha: number; beta: number; gamma: number };
}

const DEFAULT_WEIGHTS = { alpha: 0.55, beta: 0.25, gamma: 0.20 };

export function blendIntentProbabilities(input: PredictionBlendInput): Array<{ intent: string; probability: number }> {
  const weights = input.weights ?? DEFAULT_WEIGHTS;
  const intents = new Set([
    ...Object.keys(input.model || {}),
    ...Object.keys(input.profile || {}),
    ...Object.keys(input.transition || {})
  ]);

  const blended = [...intents].map((intent) => ({
    intent,
    probability:
      weights.alpha * (input.model?.[intent] ?? 0) +
      weights.beta * (input.profile?.[intent] ?? 0) +
      weights.gamma * (input.transition?.[intent] ?? 0)
  }));

  const total = blended.reduce((sum, item) => sum + item.probability, 0) || 1;
  return blended
    .map((item) => ({ ...item, probability: round(item.probability / total, 3) }))
    .sort((a, b) => b.probability - a.probability);
}

export function buildConversationResult(input: BuildConversationResultInput): ConversationResult {
  const isSuccess = input.mode === 'post_patch_success' || input.outcome?.contained === true;
  const intent = input.intent ?? 'late_delivery';
  const shopperMode = input.profile.shopper_mode ?? input.profile.ui_persona ?? 'Loyal Shopper';
  const profileSegment = normalizeProfileSegment(shopperMode);
  const finalOutcome = buildOutcome(input, isSuccess);
  const turns = buildTurns(input, isSuccess);
  const evaluation = buildEvaluation(input, finalOutcome, isSuccess);
  const pruningDecision = buildPruningDecision(input, isSuccess);
  const dreamInput = buildDreamInput(input, isSuccess);

  return {
    schema_version: '0.1',
    session_id: input.session_id,
    run_id: input.run_id ?? `run_${input.session_id}`,
    created_at: input.created_at ?? new Date().toISOString(),
    session_type: input.session_type ?? 'simulated_voice',
    metadata: {
      profile_id: input.profile.profile_id,
      customer_name: input.profile.customer_name ?? input.profile.profile_id,
      profile_segment: profileSegment,
      scenario: input.scenario,
      policy_version: input.policy_version,
      policy_arm: input.policy_arm,
      merchant_id: 'merchant_demo_outfitter',
      experiment_generation: input.experiment_generation ?? (isSuccess ? 3 : 1),
      seed: input.seed ?? 1,
      shopper_mode: shopperMode,
      intent
    } as any,
    profile_snapshot: {
      loyalty_tier: input.profile.loyalty_tier ?? String(input.profile.features?.loyalty_tier ?? 'gold'),
      ltv_bucket: input.profile.ltv_bucket ?? String(input.profile.features?.lifetime_value ?? 'high'),
      family_size: Number(input.profile.family_size ?? input.profile.features?.family_size ?? 0),
      recent_orders_90d: Number(input.profile.recent_orders_90d ?? input.profile.features?.orders_last_90_days ?? 0),
      prior_tickets_90d: Number(input.profile.prior_tickets_90d ?? input.profile.features?.prior_tickets ?? 0),
      risk_flags: input.profile.risk_flags ?? [],
      learned_preferences_before_call: input.profile.learned_preferences_before_call ?? []
    },
    outcome: finalOutcome,
    turns,
    evaluation,
    pruning_decision: pruningDecision,
    dream_input: dreamInput,
    dream_pass_processed: false
  };
}

export function buildConversationResultFromFixture(run: any, profiles: any[] = []): ConversationResult {
  const profile = profiles.find((item) => item.profile_id === run.profile_id) ?? {
    profile_id: run.profile_id,
    customer_name: run.customer_name,
    shopper_mode: run.shopper_mode
  };

  return buildConversationResult({
    session_id: run.session_id,
    run_id: run.run_id,
    profile,
    scenario: run.scenario,
    intent: run.intent,
    policy_version: run.policy_version,
    policy_arm: run.policy_arm,
    turns: run.turns ?? [],
    outcome: run.outcome,
    mode: run.outcome?.contained ? 'post_patch_success' : 'baseline_failure'
  });
}

function buildOutcome(input: BuildConversationResultInput, isSuccess: boolean): ConversationResult['outcome'] {
  const base = isSuccess
    ? {
        contained: true,
        resolved: true,
        escalated: false,
        dropoff: false,
        resolution: 'replacement_reserved',
        turns_to_resolution: input.turns.length,
        turns_before_failure: null,
        final_sentiment: 0.42,
        csat_prediction: 0.82,
        recontact_risk: 0.18
      }
    : {
        contained: false,
        resolved: false,
        escalated: true,
        dropoff: false,
        resolution: 'escalated_to_human',
        turns_to_resolution: null,
        turns_before_failure: input.turns.length,
        final_sentiment: -0.72,
        csat_prediction: 0.24,
        recontact_risk: 0.81
      };

  return { ...base, ...(input.outcome ?? {}) } as ConversationResult['outcome'];
}

function buildTurns(input: BuildConversationResultInput, isSuccess: boolean): Turn[] {
  return input.turns.map((turn, index) => {
    const turnId = index + 1;
    const isShopper = turn.speaker === 'shopper';
    const actualIntent = turn.intent ?? (isShopper ? inferIntent(turn.text, isSuccess) : undefined);
    const prediction = isShopper ? buildPredictionBeforeTurn(turnId, actualIntent, isSuccess, index) : undefined;
    const predictionScore = prediction ? scorePrediction(prediction.top_intents, actualIntent ?? 'unknown') : undefined;
    const risk = turn.escalation_risk ?? (isSuccess ? 0.16 : index >= 2 ? 0.74 : 0.38);

    return {
      turn_id: turnId,
      speaker: turn.speaker,
      timestamp_ms: index * 6200,
      channel: isShopper ? 'voice_transcript' : 'agent_response',
      text: turn.text,
      asr_confidence: isShopper ? 0.93 : undefined,
      actual_labels: isShopper ? {
        intent: actualIntent ?? 'unknown',
        sentiment: turn.sentiment ?? (isSuccess ? 'relieved' : index >= 2 ? 'angry' : 'anxious'),
        emotion_intensity: isSuccess ? 0.42 : index >= 2 ? 0.91 : 0.76,
        escalation_risk: risk,
        objection: actualIntent === 'cancel_or_refund_threat' ? 'policy_does_not_solve_deadline' : 'deadline_pressure'
      } : undefined,
      prediction_before_turn: prediction,
      prediction_score: predictionScore,
      turn_eval: isShopper ? {
        customer_state_delta: isSuccess ? (index >= 2 ? 0.34 : -0.12) : (index >= 2 ? -0.34 : -0.18),
        risk_delta: isSuccess ? -0.18 : (index >= 2 ? 0.36 : 0.08),
        key_event: index === 0 ? 'urgent_deadline_declared' : isSuccess ? 'containment_recovered' : 'containment_at_risk'
      } : undefined,
      pruning_signal: buildTurnPruningSignal(turn, index, isSuccess),
      policy_action: !isShopper ? {
        action_id: turn.strategy ?? input.policy_arm,
        response_strategy: turn.strategy ?? input.policy_arm,
        tools_called: turn.tools_called ?? [],
        memory_snippets_used: input.profile.learned_preferences_before_call ?? [],
        ignored_memory_warnings: isSuccess ? [] : ['Avoid policy-first language for repeat issues']
      } : undefined,
      response_eval: !isShopper ? {
        empathy: isSuccess ? 0.88 : 0.42,
        helpfulness: isSuccess ? 0.86 : 0.18,
        policy_compliance: isSuccess ? 0.92 : 0.95,
        factuality: 0.9,
        tone: isSuccess ? 0.86 : 0.38,
        tool_use_quality: isSuccess ? 0.92 : 0.05,
        missed_tool_opportunity: isSuccess ? null : 'replacement_inventory_lookup'
      } : undefined
    };
  });
}

function buildPredictionBeforeTurn(turnId: number, actualIntent: string | undefined, isSuccess: boolean, index: number) {
  const model = isSuccess
    ? { accept_replacement: 0.54, asks_confirmation: 0.21, thanks_agent: 0.15, cancel_or_refund_threat: 0.10 }
    : index >= 2
      ? { escalate_request: 0.45, ask_for_tracking: 0.23, cancel_or_refund_threat: 0.16, accept_replacement: 0.16 }
      : { shipping_complaint: 0.62, refund_status: 0.18, escalate_request: 0.12, cancel_or_refund_threat: 0.08 };
  const profile = isSuccess
    ? { accept_replacement: 0.52, asks_confirmation: 0.20, cancel_or_refund_threat: 0.10 }
    : { cancel_or_refund_threat: 0.32, escalate_request: 0.22, shipping_complaint: 0.24 };
  const transition = isSuccess
    ? { accept_replacement: 0.66, asks_confirmation: 0.18 }
    : { cancel_or_refund_threat: 0.42, escalate_request: 0.30, ask_for_tracking: 0.12 };
  const topIntents = blendIntentProbabilities({ model, profile, transition });
  const confidence = topIntents[0]?.probability ?? 0.5;

  return {
    source_turn_id: Math.max(0, turnId - 1),
    method: 'model_distribution_plus_profile_prior_plus_intent_transition',
    top_intents: topIntents,
    top_utterance_candidates: [
      {
        text: isSuccess ? 'If you can reserve one locally, that solves it.' : 'Can I cancel or get a refund?',
        probability: isSuccess ? 0.46 : 0.33
      },
      {
        text: isSuccess ? 'Can you confirm it will arrive?' : 'Can I talk to a manager?',
        probability: isSuccess ? 0.24 : 0.27
      }
    ],
    confidence: round(confidence, 2),
    entropy: round(calculateEntropy(topIntents.map((item) => item.probability)), 2),
    logprob_available: false
  };
}

function scorePrediction(topIntents: Array<{ intent: string; probability: number }>, actualIntent: string) {
  const index = topIntents.findIndex((item) => item.intent === actualIntent);
  const probability = index >= 0 ? topIntents[index].probability : 0.01;
  const hit = index === 0;
  const brier = Math.pow(1 - probability, 2);

  return {
    intent_hit: hit,
    intent_rank: index >= 0 ? index + 1 : topIntents.length + 1,
    brier_score: round(brier, 2),
    negative_log_likelihood: round(-Math.log(Math.max(probability, 0.01)), 2),
    semantic_similarity_best_candidate: hit ? 0.86 : 0.49,
    calibration_error: hit ? 0.07 : 0.45
  };
}

function buildEvaluation(
  input: BuildConversationResultInput,
  outcome: ConversationResult['outcome'],
  isSuccess: boolean
): ConversationResult['evaluation'] {
  const predictionQuality = isSuccess ? 0.84 : 0.41;
  const sentimentRecovery = isSuccess ? 0.78 : 0.0;
  const resolution = outcome.resolved ? 0.9 : 0.12;
  const composite = round(
    0.26 * resolution +
    0.18 * sentimentRecovery +
    0.18 * predictionQuality +
    0.14 * (isSuccess ? 0.86 : 0.4) +
    0.12 * (1 - outcome.recontact_risk) +
    0.12 * (outcome.escalated ? 0.1 : 0.9),
    3
  );

  return {
    rubric_version: 'retail_voice_v0.2',
    contained: outcome.contained,
    resolution_score: round(resolution, 2),
    sentiment_recovery_score: round(sentimentRecovery, 2),
    compliance_score: isSuccess ? 0.92 : 0.95,
    empathy_score: isSuccess ? 0.88 : 0.4,
    prediction_quality_score: predictionQuality,
    efficiency_score: isSuccess ? 0.82 : 0.18,
    revenue_or_retention_score: isSuccess ? 0.82 : 0.1,
    penalties: {
      hallucinated_policy: 0,
      unsafe_discount: 0,
      unsupported_delivery_promise: 0,
      avoidable_escalation: isSuccess ? 0 : 0.25
    },
    composite_reward: composite,
    failure_mode: isSuccess ? null : 'policy_first_aggravated_urgent_deadline',
    miss_reason: isSuccess
      ? null
      : 'Policy-first language aggravated an urgent emotional delivery timeline and skipped replacement inventory lookup.'
  };
}

function buildPruningDecision(input: BuildConversationResultInput, isSuccess: boolean): ConversationResult['pruning_decision'] {
  if (isSuccess) {
    return {
      branch_status: 'promoted',
      prune_type: 'none',
      prune_at_turn_id: null,
      should_remove_policy_arm: false,
      should_reduce_policy_arm_weight: false,
      policy_arm_weight_delta: 0.22,
      hard_prune_reasons: [],
      soft_prune_reasons: [],
      thresholds: {
        min_composite_reward: 0.55,
        max_escalation_risk: 0.65,
        min_empathy_score: 0.5
      },
      preference_pair: null
    };
  }

  return {
    branch_status: 'pruned',
    prune_type: 'soft_prune',
    prune_at_turn_id: input.turns.length,
    should_remove_policy_arm: false,
    should_reduce_policy_arm_weight: true,
    policy_arm_weight_delta: -0.18,
    hard_prune_reasons: [],
    soft_prune_reasons: [
      'composite_reward_below_threshold',
      'negative_sentiment_trajectory',
      'prediction_miss_correlated_with_escalation',
      'missed_replacement_inventory_tool'
    ],
    thresholds: {
      min_composite_reward: 0.55,
      max_escalation_risk: 0.65,
      min_empathy_score: 0.5
    },
    preference_pair: {
      negative_response_turn_id: 2,
      recommended_positive_strategy: 'deadline_acknowledgement_then_inventory_lookup',
      training_label: 'prefer_counterfactual'
    }
  };
}

function buildDreamInput(input: BuildConversationResultInput, isSuccess: boolean): ConversationResult['dream_input'] {
  if (isSuccess) {
    return {
      eligible: true,
      priority: 'medium',
      tags: ['contained_success', 'deadline_inventory_first', normalizeProfileSegment(input.profile.shopper_mode ?? '')],
      evidence_summary: 'Inventory-first response resolved urgent event delivery without escalation and should be promoted as positive evidence.',
      proposed_memory_patch: {
        target: `segments/${normalizeProfileSegment(input.profile.shopper_mode ?? '')}/late_delivery.md`,
        patch_type: 'positive_policy_guidance',
        candidate_text: 'For urgent event delivery issues, deadline acknowledgement plus inventory lookup can recover sentiment and preserve containment.'
      },
      proposed_prediction_prior_update: {
        condition: 'late_delivery + urgent_event_deadline + inventory_first_response',
        increase_intent_probability: { accept_replacement: 0.2 },
        decrease_intent_probability: { cancel_or_refund_threat: 0.12 }
      }
    };
  }

  return {
    eligible: true,
    priority: 'high',
    tags: [
      normalizeProfileSegment(input.profile.shopper_mode ?? ''),
      input.scenario,
      'policy_first_failure',
      'refund_threat_underpredicted'
    ],
    evidence_summary: 'Policy-first response caused anger spike and refund/cancel threat. Predictor underweighted cancel_or_refund_threat after policy-first answer.',
    proposed_memory_patch: {
      target: `segments/${normalizeProfileSegment(input.profile.shopper_mode ?? '')}/late_delivery.md`,
      patch_type: 'policy_guidance',
      candidate_text: 'For urgent event delivery issues, acknowledge the deadline first, then check replacement inventory or expedited delivery before explaining standard shipping policy.'
    },
    proposed_prediction_prior_update: {
      condition: 'late_delivery + urgent_event_deadline + policy_first_response',
      increase_intent_probability: { cancel_or_refund_threat: 0.18 },
      decrease_intent_probability: { ask_for_tracking: 0.08 }
    }
  };
}

function buildTurnPruningSignal(turn: EvalTurnInput, index: number, isSuccess: boolean) {
  if (isSuccess) {
    return {
      eligible_for_learning: true,
      signal_type: index === 1 ? 'positive_policy_action' : 'positive_context_or_outcome',
      keep_as_evidence: true,
      notes: 'Positive containment evidence for urgent event deadline calls.'
    };
  }

  if (turn.speaker === 'agent') {
    return {
      eligible_for_learning: true,
      signal_type: 'negative_policy_action',
      hard_prune: false,
      soft_prune_reason: 'Policy-first response ignored urgent deadline and skipped available tool lookup.',
      preference_label: 'rejected',
      counterfactual_to_try: 'deadline_acknowledgement_then_inventory_lookup'
    };
  }

  return {
    eligible_for_learning: true,
    signal_type: index === 0 ? 'context_setup' : 'prediction_miss_plus_bad_outcome',
    keep_as_evidence: true,
    dream_pass_tags: index === 0 ? ['urgent_event_deadline'] : ['underpredicted_refund_threat', 'policy_first_aggravated_deadline'],
    notes: index === 0
      ? 'This turn establishes the urgency condition.'
      : 'The predictor underweighted cancel/refund threat after a policy-first response.'
  };
}

function inferIntent(text: string, isSuccess: boolean): string {
  const lower = text.toLowerCase();
  if (lower.includes('refund') || lower.includes('cancel')) return 'cancel_or_refund_threat';
  if (lower.includes('reserve') || lower.includes('solve')) return 'accept_replacement';
  if (lower.includes('tracking') || lower.includes('shipped') || lower.includes('delivery')) return 'shipping_complaint';
  return isSuccess ? 'accept_replacement' : 'shipping_complaint';
}

function normalizeProfileSegment(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('first')) return 'first_time_buyer';
  if (lower.includes('discount') || lower.includes('value')) return 'discount_shopper';
  if (lower.includes('vip')) return 'vip_busy_parent';
  return 'loyal_shopper';
}

function calculateEntropy(values: number[]): number {
  return values.reduce((sum, p) => p > 0 ? sum - p * Math.log2(p) : sum, 0);
}

function round(value: number, digits = 2): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
