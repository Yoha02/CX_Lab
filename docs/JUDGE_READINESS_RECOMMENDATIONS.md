# Judge Readiness Recommendations

Date: 2026-06-28

## Bottom Line

The project is differentiated enough if we frame it correctly.

Do not pitch CX_lab Dojo as "a better voice bot" or "a CX dashboard." Google already has strong products in that space. Pitch it as an RSI-style self-improvement layer for customer experience agents:

```text
Every call becomes an experiment result.
Failed branches are pruned.
Winning branches are promoted.
Similar future callers get the improved playbook.
```

The strongest judge-facing sentence:

> CX_lab Dojo is the self-improvement layer for voice CX agents: it predicts the customer's next intent, preloads the right tools before the agent speaks, scores containment with customer happiness, and turns repeated failures into better playbooks for the next similar call.

## Actual Sound Bite

Use this when someone asks what the project is:

> Most CX platforms tell you what happened after the call. CX_lab Dojo tries to predict what will happen next. If the caller is likely to ask for a refund, escalate, or switch languages out of frustration, we preload the right data, reduce tool latency, and steer the agent before the customer-facing failure happens.

Shorter stage version:

> CX_lab Dojo is not just a voice bot and not just an analytics dashboard. It is a self-improvement loop for CX agents: predict the next customer turn, preload the rescue path, score the outcome, prune what failed, and promote what works for the next similar caller.

## What Google Already Has

Google's CX stack overlaps with parts of our project:

- Conversational Agents can use generative playbooks, generative data stores, and deterministic flows. Source: Google Conversational Agents console overview, https://docs.cloud.google.com/dialogflow/cx/docs/concept/console-conversational-agents
- Playbooks support examples that act like few-shot prompt examples for the LLM. Source: https://docs.cloud.google.com/dialogflow/cx/docs/concept/playbook/example
- Data store tools let agents retrieve knowledge from configured data stores. Source: https://docs.cloud.google.com/dialogflow/cx/docs/concept/data-store/handler
- Customer Experience Insights analyzes conversations for sentiment, call topics, entities, and conversations needing review. Source: https://docs.cloud.google.com/contact-center/ccai-platform/docs/conversational-insights
- Sentiment analysis scores end-user sentiment during conversations. Source: https://docs.cloud.google.com/contact-center/insights/docs/sentiment-analysis
- Voice virtual agent dashboards include metrics like sentiment ratings, resolution rates, CSAT, and performance. Source: https://docs.cloud.google.com/contact-center/ccai-platform/docs/voice-virtual-agent-dashboard
- CCAI Platform supports virtual-agent A/B testing. Source: https://docs.cloud.google.com/contact-center/ccai-platform/docs/virtual-agents-ab-testing

## Where We Are Different

| Capability | Google CX / CCAI likely has | CX_lab Dojo differentiator |
|---|---|---|
| Voice agent | Yes | We are not competing on raw voice agent quality. |
| Transcripts and sentiment | Yes | We use sentiment as a pruning signal, not just a dashboard metric. |
| Playbooks | Yes | We generate and promote playbook updates from failure clusters. |
| A/B testing | Yes | We show 100+ persona-specific experiment arms, then collapse them into a champion branch. |
| Conversation analytics | Yes | We close the loop into next-call behavior and use next-intent prediction to preload tools. |
| Data stores / retrieval | Yes | We use vector retrieval to find similar failed calls and feed the dream pass. |
| Self-improvement stack | Partial | Our core product is the self-improvement harness itself. |

The key gap we should exploit:

```text
Existing CX platforms tell you what happened.
CX_lab Dojo decides what to try next, prunes what failed, and updates the next generation.
```

## What Feels Most Interesting

1. Cross-persona failure clustering

Maya, Alex, and Jordan look different as shoppers, but the system discovers the same behavioral failure:

```text
late_delivery + urgent_event_deadline + policy_first_shipping_explanation
-> refund/escalation threat
```

That is more compelling than saying "Maya was angry."

2. Sentiment plus containment

Containment alone is a dangerous metric because a trapped or unhappy customer can look "contained." We should explicitly say:

```text
We optimize advanced containment: resolved, not escalated, sentiment recovered, NPS proxy acceptable, and low recontact risk.
```

3. Next-intent prediction as an operating system

This is one of the most judge-relevant differentiators. We are not predicting next intent just to draw a chart. We use it to:

- Preload likely tool calls such as order lookup, local inventory, courier quote, refund eligibility, or loyalty history.
- Reduce customer-facing latency because the data is ready before the agent needs it.
- Detect failure risk before the agent says the wrong thing.
- Triage the branch toward a safer response strategy when sentiment or refund risk spikes.

Sound bite:

```text
The system is not waiting for the customer to get angry. It predicts the next likely turn and gets the rescue path ready first.
```

4. Prune/promote logic

The visual of keeping urgent-event signal, pruning policy-first, and promoting inventory-first is the clearest RSI moment.

5. Gemini Translate moment

The Spanish frustration line is useful because it demonstrates emotional realism:

```text
When customers get stressed, they may switch languages. The system does not miss the signal.
```

Keep this brief; it is a wow beat, not the whole product.

6. Vector retrieval proof

We validated pgvector-style retrieval through the memory package. Querying "urgent birthday gift late delivery policy refund" returned:

```json
[
  {"session_id":"sess_maya_failed_policy_first","scenario":"late_birthday_gift","contained":false},
  {"session_id":"sess_jordan_failed_policy_first","scenario":"late_graduation_present","contained":false},
  {"session_id":"sess_alex_failed_policy_first","scenario":"late_anniversary_outfit","contained":false}
]
```

This is a strong backstage proof point: the dream pass is not just using hand-picked transcripts; the system can retrieve similar failed calls.

## Current Backend Wiring Assessment

Working:

- API server
- Gemini text generation
- Gemini translation-style analysis
- Gemini embeddings with `gemini-embedding-001`
- ElevenLabs TTS
- LiveKit token generation
- DigitalOcean Postgres persistence
- Vector similarity function in `@cx-lab/memory`
- Dream pass clustering
- Playbook approval
- Branch WebSocket
- UI final golden path

Known issue:

- Fixed: `/api/runs/similar-failures` was moved above `/api/runs/:session_id`, so vector recall can now be shown through the public API.

Recommended quick demo proof:

- Open a terminal beside the UI and run a one-line retrieval check before the demo or during Q&A.
- Show that the returned failures are Maya, Jordan, and Alex.
- Then say: "This is the data the dream pass consolidates into one playbook patch."

## Recommended Tweaks Before Demo

Priority 1: Show vector retrieval live.

Why: The route-order fix is done, so we can prove that the dream pass is grounded in real stored failures.

Suggested endpoint to demo:

```text
GET /api/runs/similar-failures?text=urgent%20birthday%20gift%20late%20delivery%20policy%20refund&limit=3
```

Priority 2: Add one small UI badge on Dream Pass:

```text
Vector recall: 3 similar failed calls found
```

Why: Judges will immediately understand that the dream pass is evidence-backed, not hand-authored.

Priority 3: Add a small "preloaded tools" cue on the Live Call page.

Suggested copy:

```text
Preloaded: order lookup, local inventory, courier quote
```

Why: It makes next-intent prediction operational. The judge sees how prediction reduces latency and prevents the bad branch.

Priority 4: On the pruning page, rename "NPS proxy" to "NPS proxy / customer happiness."

Why: It makes the anti-vanity-metric point clearer.

Priority 5: In the one-minute video, do not spend time on the 100+ node canvas.

Show it for two seconds only. The deeper point is:

```text
We start broad, but the loop narrows toward better behavior.
```

Priority 6: In Q&A, be honest about weights.

Say:

```text
This demo updates playbooks, priors, and experiment weights. A production extension could fine-tune smaller models or generate training sets, but this weekend we focused on the self-improvement stack that can safely run in production.
```

## Is The Script Compelling Enough?

Yes, with one adjustment: start with the pain point before showing the product.

Current demo sequence is good:

```text
Home -> Persona experiments -> Baseline call -> Pruning -> Dream pass -> Improved call -> Analytics
```

But the spoken framing should be:

```text
Most CX systems report containment. We ask whether containment was actually good for the customer, then make the next agent better.
```

The wow moment should be placed at Dream Pass:

```text
Three different shoppers, one hidden failure pattern, one playbook update.
```

The live demo should include the actual conversation contrast, not only screen narration:

```text
Loop 1:
Maya has an urgent birthday gift. The system predicts refund/escalation risk, but the baseline branch starts with policy. Maya gets more frustrated and asks to cancel.

Loop 2:
Sam has a similar urgent delivery problem. The updated branch predicts the same risk, preloads inventory and courier data, acknowledges the deadline, and offers a rescue path before policy. The call contains successfully.
```

That contrast makes the self-improvement claim visible. Judges should hear the system learn from one failure pattern and improve the next similar interaction.

## Judge Rubric Read

Continual Learning: Strong.

The system learns from real interactions with low user intervention. It updates memory/playbooks and narrows experiment arms over time.

Self-Improvement Stack: Very strong.

This is the clearest category. We built evaluation, monitoring, pruning, routing, persistence, vector recall, and promotion.

Recursive Intelligence: Medium.

We are not updating raw weights. Position this as recursive improvement of agent behavior and experiment policy, with future extension to fine-tuning datasets.

Special Prize Alignment:

- DigitalOcean: strong if we show Postgres/pgvector persistence and retrieval.
- LiveKit: moderate to strong if the live room/mic path works in the final team demo.
- Gemini: strong if we emphasize Gemini translation, embeddings, branch generation, and dream analysis.

## Recommended Demo Sound Bite

> A normal CX dashboard tells you containment went up or down. CX_lab Dojo predicts the next customer turn, preloads the rescue path, watches sentiment move, and then promotes the branch that actually improves the next call.
