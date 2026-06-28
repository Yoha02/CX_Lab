# CX_lab Dojo Team Build Guide

This document is for the three human builders and their coding agents. It explains what we are building, how the repo is split, where each teammate should work, and how the pieces hand off to each other.

## Product In One Sentence

CX_lab Dojo is a retail/ecommerce voice agent lab that classifies a shopper into a simple shopper mode, predicts their next intent during a call, scores the result after the transcript lands, prunes weak response strategies, and runs an offline dream pass to improve intent-specific playbooks for the next generation.

## Hackathon Positioning

Primary theme:

- **Continual Learning**: the system improves from usage through memory, prediction errors, prompt/playbook optimization, and feedback.

Secondary theme:

- **Self-Improvement Stack**: the system includes event capture, evaluation, pruning, offline dream passes, policy versioning, and promotion/rollback.

Prize targets:

- **LiveKit**: voice/transcript runtime.
- **DigitalOcean**: app/backend, persistence/vector memory, batch experiments or deployment.
- **Gemini 3.5**: Managed Agent / Antigravity dream pass if available; optional Live Translate if fast.

## Current Architecture

```text
LiveKit or simulated voice UI
  -> transcript turns
  -> shopper mode + badges
  -> intent detector
  -> next-turn predictor
  -> intent-specific playbook
  -> agent response
  -> evaluator
  -> pruning decision
  -> dream input
  -> offline dream pass
  -> policy/memory patch
  -> human approval
  -> next policy generation
```

## Repo Structure

```text
CX_Lab/
  apps/
    studio/                         # Person 1: real frontend app
    api/                            # Person 3: backend/API boundary
  packages/
    contracts/                      # Person 2: shared JSON contracts
    eval/                           # Person 2: scoring and pruning
    simulator/                      # Person 2: synthetic calls
    dream/                          # Person 3: dream pass and patch generation
    memory/                         # Person 3: persistence/vector retrieval
    integrations/
      livekit/                      # Person 1: LiveKit voice integration
      gemini/                       # Person 3: Gemini Managed Agent integration
      digitalocean/                 # Person 3: DO services, deploy, DB
  infra/
    digitalocean/                   # Person 3: infra notes/config/scripts
  data/
    fixtures/                       # Person 2: static demo inputs
    runs/                           # Person 2/3: completed ConversationResult JSON
  docs/
    TEAM_BUILD_GUIDE.md             # this file
    conversation_result_contract.md # detailed result contract
    conversation_result.example.json
  prototype/                        # existing static UI prototype
```

## Recommended Tech Choices

Frontend:

- TypeScript
- Vite
- React
- Tailwind CSS
- Framer Motion

Why:

- Fast to scaffold.
- Easy component ownership.
- Strong animation support.
- Easy to keep demo UI polished.

Backend/API:

- Start simple with local JSON or SQLite.
- Move to DigitalOcean Postgres + pgvector if Person 3 can set it up quickly.

Why:

- JSON/SQLite unblocks the team immediately.
- DO Postgres + pgvector strengthens the DigitalOcean prize story.

Voice:

- LiveKit if working quickly.
- Simulated transcript fallback must remain polished.

Dream:

- Gemini Managed Agent / Antigravity if available.
- Fallback to a local dream-pass prompt/function over saved `ConversationResult` files.

## Team Ownership

### Person 1: Voice + Final Demo Flow

Primary folders:

```text
apps/studio/
packages/integrations/livekit/
prototype/            # reference only; port ideas into apps/studio
```

Responsibilities:

- Build the judge-facing UI.
- Show shopper profile, badges, transcript, predictions, metrics, branch tree, dream pass, and policy diff.
- Implement LiveKit voice or a polished simulated transcript fallback.
- Own the final story and demo timing.

Must consume:

- `ConversationResult` from `packages/contracts`.
- sample data from `data/fixtures` and `data/runs`.
- API/persistence helpers from Person 3.

Should not own:

- scoring math
- database schema
- dream patch logic

Coding agent instruction:

> Work only in `apps/studio`, `packages/integrations/livekit`, and small UI docs. Use the contract in `packages/contracts`. Do not invent new field names unless Person 2 updates the contract.

### Person 2: Data Model + Experiments + Scoring

Primary folders:

```text
packages/contracts/
packages/eval/
packages/simulator/
data/fixtures/
data/runs/
docs/conversation_result_contract.md
docs/conversation_result.example.json
```

Responsibilities:

- Define the shared data contract.
- Create shopper modes, badges, scenarios, policy arms, and fixtures.
- Build simulator that emits `ConversationResult`.
- Build scoring and pruning logic.
- Produce preloaded demo runs with Gen 1/2/3 containment lift.

Must provide:

- stable JSON shapes
- sample completed calls
- expected evaluator outputs
- pruning decisions
- dream inputs

Should not own:

- DigitalOcean infra
- frontend components
- Gemini Managed Agent implementation

Coding agent instruction:

> Work in `packages/contracts`, `packages/eval`, `packages/simulator`, and `data`. Keep functions pure where possible. Return JSON objects; do not persist directly unless Person 3 exposes a helper.

### Person 3: Infra + Persistence + Vector DB + Dream Agent

Primary folders:

```text
apps/api/
packages/memory/
packages/dream/
packages/integrations/gemini/
packages/integrations/digitalocean/
infra/digitalocean/
```

Responsibilities:

- Own DigitalOcean setup and deployment path.
- Implement persistence for contracts Person 2 defines.
- Implement vector/profile memory if time allows.
- Implement Gemini Managed Agent dream pass if available.
- Save and retrieve policy versions, dream patches, profile memory, and run data.

Must provide:

- `saveConversationResult(result)`
- `getProfile(profileId)`
- `getProfileMemory(profileId)`
- `listRuns(profileId)`
- `getDreamInput(profileId, scenario)`
- `saveDreamPatch(patch)`
- `promotePolicyVersion(policyVersionId)`

Should not own:

- data schema design
- score formula weights
- final UI flow

Coding agent instruction:

> Work in `apps/api`, `packages/memory`, `packages/dream`, `packages/integrations/gemini`, `packages/integrations/digitalocean`, and `infra`. Implement storage/API against the contract. Do not change schema fields without Person 2.

## Shopper Mode Model

For the demo, keep profile classification simple.

Shopper modes:

```text
New Shopper
Regular Shopper
Loyal Shopper
At-Risk Shopper
```

Badges:

```text
Urgent
Gift Order
Discount Sensitive
Return-Prone
Prior Issue
Subscription
High Value
Low Trust
```

Example:

```json
{
  "profile_id": "prof_maya_001",
  "shopper_mode": "Loyal Shopper",
  "badges": ["Urgent", "Gift Order", "Prior Issue", "High Value"],
  "features": {
    "age_range": "35-44",
    "region": "CA",
    "orders_last_90_days": 3,
    "lifetime_value": "high",
    "prior_tickets": 2,
    "current_issue": "late_delivery"
  }
}
```

Important:

- Use demographics carefully.
- Prefer behavior and context over identity.
- Gender should not drive treatment quality in the demo.
- Region/state is useful for shipping, timezone, language, and local disruptions.

## Intent-Specific Playbooks

We are not improving one giant prompt.

We are improving small playbooks by shopper mode and intent.

```text
Shopper Mode + Badges + Current Intent
  -> select playbook
  -> predict next turn
  -> respond
  -> score outcome
  -> dream pass patches that playbook
```

Example grid:

```text
Loyal Shopper + Late Delivery
At-Risk Shopper + Late Delivery
New Shopper + Refund Status
Regular Shopper + Wrong Size Exchange
```

Maya example:

```text
Mode: Loyal Shopper
Badges: Urgent, Gift Order, Prior Issue
Intent: Late Delivery
Playbook: loyal_shopper/late_delivery
```

## Next-Turn Prediction

Final prediction combines three sources:

```text
P_final(next_intent)
  = alpha * P_model(next_intent)
  + beta  * P_profile(next_intent)
  + gamma * P_intent_transition(next_intent)

alpha + beta + gamma = 1
```

Where:

- `P_model`: model prediction from live transcript.
- `P_profile`: prior from similar shopper mode/badges.
- `P_intent_transition`: learned rule from past calls and simulations.

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

This shows the system trusting learned experience more after it has evidence.

## Intent Transition Rules

Core learning object:

```text
shopper mode + badges + current intent + agent strategy
  -> likely next intent + likely outcome
```

Example:

```text
Loyal Shopper + Urgent + Late Delivery + policy_first_response
  -> cancel/refund threat
```

Better branch:

```text
Loyal Shopper + Urgent + Late Delivery + inventory_lookup_first
  -> accepts replacement
```

JSON extract:

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
  "observed_outcomes": {
    "sessions": 20,
    "contained": 6,
    "escalated": 11,
    "dropoff": 3,
    "avg_sentiment_delta": -0.31
  },
  "recommendation": {
    "status": "prune",
    "reason": "Policy-first response increases cancellation/refund threats for urgent loyal shoppers."
  }
}
```

## Conversation Result Contract

Every completed real or simulated call should produce a `ConversationResult`.

Full example:

```text
docs/conversation_result.example.json
```

Required sections:

```json
{
  "schema_version": "0.1",
  "session_id": "sess_20260627_maya_01",
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

Each shopper turn should include:

```json
{
  "turn_id": 3,
  "speaker": "shopper",
  "text": "That doesn't help me! I need it tomorrow. Can I just cancel or get a refund?",
  "actual_labels": {
    "intent": "cancel_or_refund_threat",
    "sentiment": "angry",
    "escalation_risk": 0.74
  },
  "prediction_before_turn": {
    "top_intents": [
      {"intent": "escalate_request", "probability": 0.45},
      {"intent": "ask_for_tracking", "probability": 0.23},
      {"intent": "cancel_or_refund_threat", "probability": 0.16}
    ],
    "confidence": 0.45
  },
  "prediction_score": {
    "intent_hit": false,
    "intent_rank": 3,
    "brier_score": 0.91,
    "negative_log_likelihood": 1.83
  }
}
```

## Scoring

Conversation reward:

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

Prediction quality:

```text
NLL_t = -log P_t(y_actual)

Brier_t = sum_k (P_t(k) - 1[k = y_actual])^2

semantic_hit_t = max_i cosine(embedding(candidate_i), embedding(actual_transcript))
```

## Pruning Logic

Pruning is a first-class output.

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

Hard prune:

- false delivery promise
- hallucinated refund or discount
- compliance/privacy failure
- toxic response
- unsupported order/inventory/refund claim

Soft prune:

- low composite reward
- negative sentiment trajectory
- high escalation risk
- prediction miss correlated with bad outcome
- missed tool opportunity
- too many turns without resolution

Possible statuses:

```text
promoted
preserved
pruned
needs_review
```

## Dream Input

Dream input is the handoff to Person 3's dream pass.

```json
{
  "eligible": true,
  "priority": "high",
  "tags": [
    "vip_busy_parent",
    "late_birthday_gift",
    "policy_first_failure",
    "refund_threat_underpredicted"
  ],
  "evidence_summary": "Policy-first response caused anger spike and refund/cancel threat.",
  "proposed_memory_patch": {
    "target": "segments/loyal_shopper/late_delivery.md",
    "patch_type": "policy_guidance",
    "candidate_text": "For loyal shoppers facing gift-deadline delivery issues, acknowledge the deadline first, then check replacement inventory before explaining standard shipping policy."
  }
}
```

## Human Approval And Policy Diff

The dream pass should not silently update the live agent.

It proposes a patch:

```text
Remove:
Explain standard shipping policy before checking options.

Add:
Acknowledge deadline, check replacement inventory, offer expedited replacement, keep refund fallback open.
```

Human approves:

```text
policy_late_delivery_gen1 -> policy_late_delivery_gen2
```

This makes the system safer and easier to explain.

## Handoffs

### Person 2 -> Person 1

Provides:

- sample profiles
- sample scenarios
- sample `ConversationResult`
- Gen 1/2/3 metrics
- prediction distributions
- branch statuses

Person 1 uses these to build UI states.

### Person 2 -> Person 3

Provides:

- contracts
- example JSON
- scoring output shapes
- pruning decision rules
- dream input shape

Person 3 implements persistence and dream reading/writing.

### Person 3 -> Person 1

Provides:

- API/helper to list runs
- API/helper to get profile memory
- API/helper to run or mock dream pass
- policy patch result
- approved policy version

Person 1 wires these into UI.

### Person 3 -> Person 2

Provides:

- storage adapter
- where completed runs are saved
- how simulator can write results
- how eval runs are retrieved

Person 2 uses this for batch experiments.

## Merge Strategy

To reduce merge pain:

- Person 1 owns `apps/studio` and `packages/integrations/livekit`.
- Person 2 owns `packages/contracts`, `packages/eval`, `packages/simulator`, `data`.
- Person 3 owns `apps/api`, `packages/memory`, `packages/dream`, `packages/integrations/gemini`, `packages/integrations/digitalocean`, `infra`.
- Shared docs can be edited, but avoid large rewrites during implementation.
- If the schema changes, Person 2 updates `packages/contracts` first.
- UI should consume fixtures until APIs are ready.
- APIs should accept fixture JSON until database is ready.

## MVP Checklist

Must have:

- one shopper profile: Maya
- shopper mode and badges
- one scenario: late birthday gift
- transcript simulation or LiveKit voice
- next-turn prediction
- `ConversationResult` output
- scoring and pruning decision
- dream pass proposal
- policy diff
- Gen 1 -> Gen 3 containment lift

Nice to have:

- LiveKit real voice
- DigitalOcean deployment
- Gemini Managed Agent dream pass
- Postgres + pgvector memory
- multilingual Live Translate moment

Cut if blocked:

- fine-tuning
- true telephony
- real Shopify
- complex auth
- exact token logprobs as a hard dependency

## Final Demo Story

1. Maya is classified as a Loyal Shopper.
2. Badges: Urgent, Gift Order, Prior Issue, High Value.
3. Current intent: Late Delivery.
4. The system chooses the Loyal Shopper / Late Delivery playbook.
5. Before Maya speaks again, it predicts likely next intent.
6. The transcript arrives and the system scores the prediction.
7. Policy-first branch fails and is soft-pruned.
8. Dream pass groups similar failures.
9. It proposes a policy patch.
10. Human approves.
11. The next generation contains Maya-like shoppers better.

Pitch line:

> CX_lab Dojo does not optimize one generic chatbot prompt. It learns intent-specific playbooks for shopper modes. The agent captures evidence during calls, dreams over repeated misses offline, and promotes safer policies that improve containment over time.
