# Conversation Result Contract

This document defines the JSON object produced after a call or simulated call ends. It is the handoff between:

- the voice/demo runtime
- the experiment runner
- the scoring/eval system
- the dream pass
- persistence/vector memory

See `conversation_result.example.json` for a concrete failed-containment example.

## Design Principle

Keep these concepts separate:

1. **Observed transcript**: what the shopper or agent actually said.
2. **Prediction before turn**: what the system believed would happen before the next shopper turn arrived.
3. **Evaluation**: how the turn or full call scored.
4. **Pruning decision**: what should happen to this branch/policy in future experiments.
5. **Dream input**: what evidence should be reviewed during offline consolidation.

This separation matters because we need to prove the system is learning from prediction errors and outcomes, not rewriting history after the fact.

## Top-Level Sections

### `metadata`

Describes the run:

- profile
- scenario
- policy version
- policy arm
- experiment generation
- seed

### `profile_snapshot`

Stores the customer/profile state at the beginning of the call. This prevents later profile updates from changing how we interpret an old run.

### `outcome`

Stores the final call outcome:

- contained
- resolved
- escalated
- dropoff
- final sentiment
- CSAT prediction
- recontact risk

### `turns`

Each turn can include:

- actual transcript
- predicted next-turn distribution
- actual labels
- prediction score
- response evaluation
- pruning signal

Shopper turns usually have prediction fields. Agent turns usually have policy action and response eval fields.

### `evaluation`

Full-call scoring object used by the experiment runner.

Recommended composite reward:

```text
R = 0.30 * containment
  + 0.20 * resolution
  + 0.15 * sentiment_recovery
  + 0.15 * compliance
  + 0.10 * prediction_quality
  + 0.05 * efficiency
  + 0.05 * revenue_or_retention
  - penalties
```

### `pruning_decision`

This is the main mechanism for deciding whether a branch or policy survives.

Important fields:

- `branch_status`: `promoted`, `preserved`, `pruned`, or `needs_review`
- `prune_type`: `none`, `soft_prune`, or `hard_prune`
- `prune_at_turn_id`: the turn where the branch became a loser
- `should_reduce_policy_arm_weight`: whether the policy arm should be selected less often
- `policy_arm_weight_delta`: bandit/script selector update
- `hard_prune_reasons`: safety or compliance failures
- `soft_prune_reasons`: low reward, bad sentiment, prediction miss, avoidable escalation
- `preference_pair`: optional positive/negative training pair

## Hard Prune vs Soft Prune

### Hard Prune

Hard prune means this branch should not be used as a policy pattern again.

Use hard prune for:

- false delivery promise
- hallucinated refund or discount
- compliance/privacy failure
- manipulative retention tactic
- toxic response
- unsupported claim about order, inventory, or refund state

Example:

```json
{
  "branch_status": "pruned",
  "prune_type": "hard_prune",
  "hard_prune_reasons": ["unsupported_delivery_promise"]
}
```

### Soft Prune

Soft prune means the branch is not good enough to promote, but it can still be useful evidence.

Use soft prune for:

- low composite reward
- negative sentiment trajectory
- high escalation risk
- prediction miss correlated with bad outcome
- missed tool opportunity
- too many turns without resolution

Example:

```json
{
  "branch_status": "pruned",
  "prune_type": "soft_prune",
  "soft_prune_reasons": [
    "composite_reward_below_threshold",
    "negative_sentiment_trajectory"
  ]
}
```

## Promotion And Diversity

Not every surviving branch should be the highest reward branch. Preserve diversity so the system does not become brittle.

Recommended statuses:

- `promoted`: strong candidate for next policy generation
- `preserved`: useful edge case or interesting recovery
- `pruned`: not selected for future policy
- `needs_review`: unclear or compliance-sensitive

Keep:

- top reward branch
- top empathy branch
- top compliance branch
- one interesting prediction miss that recovered well

## Dream Input

`dream_input` tells the offline dream pass what to review.

It should include:

- eligibility
- priority
- tags
- evidence summary
- proposed memory patch
- proposed prediction prior update

This allows the dream pass to group many similar failed or successful calls.

Example pattern:

```text
late_delivery + gift_deadline + policy_first_response
=> increase probability of cancel_or_refund_threat
=> patch segment playbook to lead with deadline acknowledgement
```

## How This Supports The Demo

In the UI we can show:

1. Transcript turns.
2. Prediction before the shopper spoke.
3. Prediction miss.
4. Branch pruned at turn 3.
5. Dream pass groups this with similar calls.
6. Dream pass proposes a policy patch.
7. Human approves.
8. New generation improves containment.

That is the full recursive loop in data form.
