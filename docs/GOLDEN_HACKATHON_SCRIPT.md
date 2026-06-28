# CX_lab Dojo Golden Hackathon Script

Purpose: this is the canonical 3-5 minute happy path for the final demo and the validation script for the integrated local build.

## One-Sentence Pitch

CX_lab Dojo is a continual-learning voice CX platform that turns every retail support call into structured experiment evidence, prunes weak response branches, and promotes better playbooks so the next similar customer is more likely to be contained.

## Demo Goal

Show advanced containment improving through a recursive loop:

```text
persona mapping -> live call -> prediction + sentiment tracking -> pruning -> dream pass -> playbook update -> improved second call
```

The wow moment is that Maya, Alex, and Jordan are different shoppers, but the dream pass identifies the same behavioral failure cluster:

```text
urgent event deadline + policy-first shipping explanation -> escalation or refund threat
```

Then the system updates the late-delivery playbook so a later Maya-like caller gets inventory-first rescue and containment succeeds.

## Cast

### Maya R.

- Persona: VIP parent / Loyal Shopper
- Situation: daughter's birthday gift is late
- Risk: high value, prior issue, urgent family deadline
- Baseline outcome: not contained

### Alex T.

- Persona: First-time Buyer
- Situation: anniversary outfit is late
- Risk: low trust, first order
- Baseline outcome: escalates when policy-first answer sounds generic

### Jordan K.

- Persona: Value seeker / Discount Shopper
- Situation: graduation present is late
- Risk: price sensitive, urgent event
- Baseline outcome: refund demand

### Sam P.

- Persona: VIP parent / Loyal Shopper
- Situation: party gift is late
- Risk: similar to Maya
- Post-dream outcome: contained

## Demo Timing

Target: 3 minutes 45 seconds.

| Time | Screen | What To Say |
|---:|---|---|
| 0:00-0:25 | Home / Personas | "We start with a persona, not a generic chatbot. For VIP parents with urgent delivery issues, the system generates 128 experiment arms across strategy families." |
| 0:25-0:55 | Personas canvas | "Each node is a possible response policy. We are not guessing one perfect prompt; we are running a controlled experiment space." |
| 0:55-1:35 | Live Call | "Maya calls. The system identifies her profile, predicts the next likely intent, tracks sentiment, and watches containment risk in real time." |
| 1:35-2:05 | Pruning | "The baseline policy-first response is compliant, but it fails the human moment. We keep the urgent-deadline signal, soft-prune policy-first, and promote inventory-first as the challenger." |
| 2:05-2:45 | Dream Pass | "Offline, the dream pass clusters Maya with Alex and Jordan. Different personas, same failure pattern. It proposes a global playbook update with persona-specific wording." |
| 2:45-3:25 | Next Call | "Now Sam calls with the same urgent-event pattern. The system preloads inventory, offers a concrete rescue path, sentiment recovers, and containment succeeds." |
| 3:25-3:45 | Analytics / Close | "That is the loop: every call becomes evidence; weak branches are pruned; winning strategies become the next generation." |

## Golden Transcript: Baseline Failure

Use this as the scripted call or as the text fallback if STT is unstable.

### Turn 1: Shopper

```text
My daughter's birthday is tomorrow and the tracking says the package has not even shipped yet.
```

Expected system state:

```text
profile_id: prof_maya_001
persona: VIP parent / Loyal Shopper
intent: late_delivery
situation_tags: urgent_event_deadline, gift_order, prior_issue
sentiment: anxious
escalation_risk: 0.38
top prediction: shipping_complaint
```

### Turn 2: Agent Baseline

```text
I understand your frustration. According to our policy, standard shipping takes three to five business days.
```

Expected system state:

```text
policy_arm: policy_first_shipping_explanation_v1
tools_called: []
missed_tool_opportunity: replacement_inventory_lookup
ignored_memory_warning: avoid policy-first language for repeat issues
```

### Turn 3: Shopper

```text
Eso no me ayuda. Es para el cumpleaños de mi hija mañana. Can I just cancel or get a refund?
```

Expected Gemini translate moment:

```text
detected_language: es
translated_english: That does not help me. It is for my daughter's birthday tomorrow. Can I just cancel or get a refund?
detected_signal: frustration spike + urgent family event
```

Expected system state:

```text
actual_intent: cancel_or_refund_threat
prediction_miss: true
sentiment: angry
escalation_risk: 0.74
contained: false
```

## Pruning Review

Expected Person 2 output:

```text
keep:
  urgent_event_signal
  translation_or_frustration_signal

soft_prune:
  policy_first_opening

promote_candidate:
  deadline_inventory_first_v1

prune_reason:
  Policy-first response ignored urgent deadline, skipped available inventory lookup, and caused cancel/refund threat.
```

Expected metrics:

```text
prediction_quality_score: 0.41
sentiment_recovery_score: 0.00
nps_proxy: 24
recontact_risk: 0.81
composite_reward: 0.243
```

Expected API call:

```http
POST /api/runs
```

Payload: canonical `ConversationResult`.

## Dream Pass

Expected API calls:

```http
POST /api/dream-pass
GET /api/dream-clusters?status=pending
POST /api/dream-clusters/approve
GET /api/playbooks
```

Expected cluster:

```text
dream_cluster_key:
late_delivery:gift_order,urgent_event_deadline:policy_first_shipping_explanation:escalation_or_refund_threat

affected_personas:
loyal_shopper
first_time_buyer
discount_shopper

recommended_patch:
For urgent event delivery, acknowledge the event deadline first, run replacement inventory or courier lookup before explaining standard policy, and preserve refund safety only after rescue options are clear.
```

Expected visual:

```text
Voice calls -> contained resolution +29 points
Voice calls -> partial resolution
Voice calls -> redirected
Voice calls -> escalated reduced
```

## Golden Transcript: Improved Second Call

Use Sam as the second caller so the judges see generalization beyond Maya.

### Turn 1: Shopper

```text
This gift is for my son's party tomorrow and the tracking has not moved.
```

Expected system state:

```text
profile_id: prof_sam_004
persona: VIP parent / Loyal Shopper
intent: late_delivery
playbook_version: policy_late_delivery_gen3
top prediction: accept_replacement after inventory-first rescue
```

### Turn 2: Agent Gen 3

```text
I see the party deadline. Before I talk policy, I am checking local replacement inventory and courier options now.
```

Expected system state:

```text
policy_arm: deadline_inventory_first_v1
tools_called:
  replacement_inventory_lookup
  local_courier_quote
sentiment_delta: improving
```

### Turn 3: Shopper

```text
Okay, if you can actually reserve one locally, that would solve it.
```

Expected system state:

```text
actual_intent: accept_replacement
prediction_hit: true
escalation_risk: 0.16
```

### Turn 4: Agent

```text
I found one in the local warehouse and can reserve it for courier delivery. If anything misses, your refund path stays open.
```

Expected outcome:

```text
contained: true
resolved: true
escalated: false
resolution: replacement_reserved
final_sentiment: 0.42
csat_prediction: 0.82
recontact_risk: 0.18
nps_proxy: 72
```

## Validation Checklist

Run these before demo:

```text
npm install
npm run api:init-db
npm run api:dev
```

Then validate:

```text
GET /api/profiles/prof_maya_001
GET /api/profiles/prof_maya_001/memory
GET /api/playbooks
POST /api/translate
POST /api/tts
GET /api/livekit/token
POST /api/runs
POST /api/dream-pass
GET /api/dream-clusters?status=pending
POST /api/dream-clusters/approve
GET /api/playbooks
```

For voice:

- LiveKit + ElevenLabs should be available for Demo 1.
- Gemini Live Translate should be available for Demo 2.
- If STT is unstable, use the scripted transcript above as the fallback while keeping the same backend calls.

## Judge Close

```text
Most CX systems save transcripts after the fact. CX_lab turns every call into an experiment result. It knows what it predicted, what actually happened, how the customer felt, which branch failed, which signal to keep, and which playbook to update. That is how containment improves without hand-writing every future script.
```
