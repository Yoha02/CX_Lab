# ConversationResult v0.1

Canonical full example:

- `docs/conversation_result.example.json`

Implementation guide:

- `docs/conversation_result_contract.md`

## Required Top-Level Shape

```json
{
  "schema_version": "0.1",
  "session_id": "sess_20260627_maya_01",
  "run_id": "run_late_birthday_gift_gen1_seed03",
  "created_at": "2026-06-27T17:18:00Z",
  "session_type": "simulated_voice",
  "metadata": {},
  "profile_snapshot": {},
  "outcome": {},
  "turns": [],
  "evaluation": {},
  "pruning_decision": {},
  "dream_input": {},
  "dream_pass_processed": false
}
```

## Core Principle

The schema separates:

1. what happened
2. what we predicted before it happened
3. how the call scored
4. how the branch should be pruned or promoted
5. what the dream pass should learn

## Prediction Formula

```text
P_final(next_intent)
  = alpha * P_model(next_intent)
  + beta  * P_profile(next_intent)
  + gamma * P_intent_transition(next_intent)

alpha + beta + gamma = 1
```

MVP weights:

```text
alpha = 0.60
beta = 0.25
gamma = 0.15
```

After dream pass:

```text
alpha = 0.45
beta = 0.25
gamma = 0.30
```

## Intent Transition Rule

```json
{
  "shopper_mode": "Loyal Shopper",
  "badges": ["Urgent", "Prior Issue"],
  "current_intent": "late_delivery",
  "agent_strategy": "policy_first_response",
  "next_intent_distribution": {
    "cancel_or_refund_threat": 0.54,
    "ask_for_human": 0.22,
    "deadline_pressure": 0.18,
    "accept_replacement": 0.06
  },
  "recommendation": {
    "status": "prune",
    "reason": "Policy-first response increases cancellation/refund threats for urgent loyal shoppers."
  }
}
```

## Pruning Decision Extract

```json
{
  "branch_status": "pruned",
  "prune_type": "soft_prune",
  "prune_at_turn_id": 3,
  "should_reduce_policy_arm_weight": true,
  "policy_arm_weight_delta": -0.18,
  "soft_prune_reasons": [
    "composite_reward_below_threshold",
    "negative_sentiment_trajectory",
    "prediction_miss_correlated_with_escalation",
    "missed_replacement_inventory_tool"
  ]
}
```
