# Evaluation And Pruning

Owner: Person 2 - Experiment Engine + Scoring.

Purpose:

- Score each conversation.
- Decide branch promotion, preservation, or pruning.
- Produce `evaluation`, `pruning_decision`, and `dream_input` sections for `ConversationResult`.

Core outputs:

- composite reward
- containment result
- sentiment recovery
- prediction quality
- hard prune reasons
- soft prune reasons
- policy arm weight delta
- preference pair for future training or prompt optimization

Boundaries:

- Do not store data here. Return objects for `apps/api` or Person 3 to persist.
- Do not own UI rendering.

## Final Build Responsibility

This package is the bridge between:

```text
Person 1 voice/STT/TTS state -> Person 2 evaluation -> Person 3 persistence/dream pass
```

The primary function should be:

```ts
buildConversationResult(input: EvaluationInput): ConversationResult
```

It should return the canonical contract from `packages/contracts`.

## Inputs

```text
profile
profileMemory
activePlaybook
turns from Person 1
branchCandidates from Person 1
languageSwitch from Person 1
similarFailures from Person 3 pgvector search
scenario metadata from UI
```

## Core Logic

Prediction blend:

```text
P_final(intent) = alpha * P_model(intent)
                + beta  * P_profile(intent)
                + gamma * P_intent_transition(intent)
```

Recommended demo weights:

```text
alpha = 0.55
beta  = 0.25
gamma = 0.20
```

Pruning states:

```text
promote
preserve
soft_prune
hard_prune
```

Dream cluster key:

```text
intent:situation_tags:agent_strategy:failure_mode
```

Golden failure key:

```text
late_delivery:gift_order,urgent_event_deadline:policy_first_shipping_explanation:escalation_or_refund_threat
```

## Output Mapping

Fill these `ConversationResult` sections:

```text
metadata
profile_snapshot
outcome
turns[].prediction_before_turn
turns[].prediction_score
turns[].turn_eval
turns[].pruning_signal
turns[].policy_action
turns[].response_eval
evaluation
pruning_decision
dream_input
```

## Demo Fixture

Use this file as the deterministic local reference:

```text
data/fixtures/golden_demo_seed.json
```

Use this script as the validation path:

```text
docs/GOLDEN_HACKATHON_SCRIPT.md
```
