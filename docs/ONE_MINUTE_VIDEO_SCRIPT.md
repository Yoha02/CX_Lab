# Demo Video Script

Target length: 75-90 seconds. It is okay if the first recording runs a little long. The goal is clarity first, then we can tighten.

## Core Sound Bite

> Most CX tools tell you what happened after the call. CX_lab Dojo predicts what is likely to happen next, preloads the right rescue tools, and uses every call to make the next agent better.

## One-Take Narration

Use this as the main voiceover if we need one clean pass.

**0:00-0:10 - Problem**

Most voice AI teams optimize for containment, but containment alone can be misleading. A customer can stay inside automation and still leave angry, churn, or call back. CX_lab Dojo asks a better question: did the agent contain the issue and improve the customer experience?

**0:10-0:20 - What the system is**

CX_lab Dojo is a continual-learning platform for retail and ecommerce voice agents. It maps shoppers into personas, generates many possible experiment arms, predicts the customer's next likely intent, and preloads the tools the agent will probably need before the customer asks.

**0:20-0:30 - Differentiation**

That is the key difference. We are not just reporting on the call after it fails. We are using next-intent prediction to reduce tool latency, detect risky moments early, and steer the agent toward a better branch before the customer-facing failure happens.

**0:30-0:45 - First loop**

Here is Maya, a VIP parent with a late birthday gift. The baseline branch is policy-first. It is compliant, but it misses the emotional urgency. Sentiment drops, refund risk rises, and the customer threatens cancellation.

**0:45-1:00 - Pruning and dream pass**

After the call, CX_lab Dojo scores the branch. It keeps the urgent-event signal and the language frustration signal, prunes the policy-first opening, and promotes inventory-first recovery. Then the dream pass finds the same hidden failure across Maya, Alex, and Jordan: urgent event deadline plus policy-first shipping explanation leads to escalation.

**1:00-1:15 - Second loop**

Now a similar caller comes in after the playbook update. The system predicts the likely refund or escalation path, preloads inventory and courier options, and the agent leads with a concrete rescue path. Containment improves, sentiment recovers, and recontact risk drops.

**1:15-1:20 - Close**

Every call becomes evidence. Weak branches are pruned. Winning behaviors become the next agent.

## Screen-By-Screen Script

### 1. Home

Show:

- Clean home page
- Recent persona runs
- `API live` badge
- Collapsible nav

What to say:

> CX_lab Dojo is a training and experimentation platform for voice agents. The pain point is that most CX dashboards only tell you what happened after the customer already had a bad experience. We are trying to move the learning loop earlier. For every persona, the system creates experiment arms, watches real calls, predicts the next likely customer intent, and uses that prediction to preload data and avoid slow or risky tool calls.

### 2. Personas

Show:

- VIP parent persona selected
- 128 planned arms
- Strategy family nodes
- Child experiment arms

What to say:

> We start before the call. For this VIP parent persona, the system has 128 planned experiment arms across strategy families like deadline-first, inventory-first, refund safety, empathy opener, and tool preload. These are not results yet. They are candidate ways the agent might handle the same customer problem.

> The point is exploration. Instead of one static prompt, the system creates a large search space of possible behaviors, then narrows that space using evidence from calls.

### 3. Live Call: Baseline Loop

Show:

- Live Call tab
- Maya profile identifies after call starts
- Next-intent prediction panel
- Preloaded tool context
- Sentiment and containment metrics
- Gemini Translate moment

What to say before the transcript starts:

> Now we run the first call. Maya is a loyal shopper. Her daughter's birthday is tomorrow, and the package has not shipped. The system predicts that the next likely intents are refund demand, escalation, or asking for a guarantee. In the baseline branch, the agent does not use that prediction well enough. It starts with policy before checking the rescue path.

Baseline conversation script:

```text
Agent:
Hi Maya, thanks for calling. I see your order here. How can I help today?

Maya:
My daughter's birthday is tomorrow and the tracking says the package has not even shipped yet.

System signal:
Detected intent: late delivery with urgent event deadline.
Next likely intent: cancel or refund threat.
Preloaded context: order status available, inventory lookup available, courier quote not used yet.

Agent, baseline policy-first branch:
I understand the timing is frustrating. Our standard shipping policy is three to five business days, and once an item is in processing we usually have to wait for the carrier update before making changes.

Maya:
That does not help me. Es para el cumpleanos de mi hija. I cannot wait another week.

System signal:
Gemini translation: It is for my daughter's birthday.
Sentiment: frustration spike.
Risk: refund or escalation likely.

Agent:
I can offer 10 percent off a future order, but I cannot guarantee delivery tomorrow under the standard policy.

Maya:
No. Just cancel it. I want a refund or a person who can actually fix this.
```

What to say after the baseline call:

> This is the failure mode we care about. The agent stayed inside automation for a few turns, but it did not create good containment. The customer is still angry, refund risk is high, and the call is heading toward escalation. That is why we score containment with sentiment, NPS proxy, and recontact risk, not just whether the bot kept talking.

### 4. Pruning

Show:

- Keep urgent event signal
- Keep translation signal
- Prune policy-first opening
- Promote inventory-first recovery
- Prune/promote flow visual

What to say:

> After the call, the run is evaluated. We keep the useful signals: urgent event deadline, language frustration, and refund-risk prediction. We soft-prune the policy-first opening because it repeatedly increases cancellation threats before rescue options are checked. We promote the inventory-first branch because the system should look for a real recovery path before explaining policy.

> This is the RSI loop in simple terms: observe, score, prune, promote, and feed the next generation.

### 5. Dream Pass

Show:

- Dream pass visual pipeline
- Cluster, Compare, Patch, Approval, Update cards
- Sankey/outcome shift
- Vector recall proof if possible

What to say:

> The dream pass runs offline. It pulls similar failed calls from memory using vector retrieval. Maya is a loyal shopper, Alex is a first-time buyer, and Jordan is a discount shopper. They look different as personas, but the system finds the same behavioral failure cluster: urgent event deadline plus policy-first shipping explanation creates refund or escalation threats.

> The dream pass proposes a playbook patch: for urgent event late-delivery calls, acknowledge the deadline first, run local inventory and courier lookup before policy language, then offer the rescue path. Manual approval can stay in the loop, but the system has already found the pattern and proposed the next branch to test.

Optional proof line if showing terminal:

```text
GET /api/runs/similar-failures?text=urgent birthday gift late delivery policy refund&limit=3
```

What to say if showing the terminal:

> This is the backend proof point. The retrieval call returns the Maya, Jordan, and Alex failures that feed the dream pass. So the patch is grounded in stored call data, not just a hand-authored demo script.

### 6. Live Call: Improved Loop

Show:

- Improved caller after playbook update
- Gen 2 or Gen 3 playbook
- Inventory-first response
- Higher containment
- Better sentiment / NPS proxy
- Lower recontact risk

What to say before the transcript starts:

> Now we run a second similar call after the dream pass update. This is not Maya, but the caller maps into the same urgent-event late-delivery pattern. Because the system predicts the next likely intent earlier, it preloads inventory, courier, refund eligibility, and order context before the agent responds.

Improved conversation script:

```text
Agent:
Hi Sam, I found your order from the number you called from. Is this about the outfit scheduled for tomorrow's anniversary dinner?

Sam:
Yes. It still says delayed, and I need it tomorrow. If you cannot fix it, I need to cancel.

System signal:
Detected intent: late delivery with urgent event deadline.
Next likely intent: cancel or refund threat.
Preloaded context: local inventory found, courier quote ready, refund eligibility available.

Agent, updated inventory-first branch:
I hear the deadline. Before we talk policy, I checked local inventory and there is one replacement available nearby. I can reserve it now and upgrade it to same-day courier. If it still misses tomorrow, the refund path stays open.

Sam:
Can you actually confirm that, or am I going to be stuck calling again?

System signal:
Next likely intent: confirmation request.
Risk: recontact concern.

Agent:
Yes. I can text the reservation and courier confirmation to you now. You will see the replacement order number, the delivery window, and the backup refund option in the same message.

Sam:
Okay, do that. That solves it.
```

What to say after the improved call:

> This is the win. The system did not just learn that Maya was angry. It learned the general pattern and changed the next similar interaction. The agent answered faster because the likely tools were already loaded, and it avoided the policy-first branch that caused the earlier escalation.

### 7. Analytics / Close

Show:

- Improved containment
- Prediction quality
- Sentiment recovery
- Recontact risk decrease

What to say:

> The final result is advanced containment: resolved, not escalated, sentiment recovered, NPS proxy improved, and recontact risk lower. That is the difference between a voice bot that reports metrics and a self-improving CX system that gets better every time it is used.

## Short Version For A 60-Second Cut

If the recording must be closer to one minute, use this shorter track:

> Most CX tools tell you what happened after the call. CX_lab Dojo predicts what is likely to happen next, preloads the right rescue tools, and uses every call to make the next agent better.
>
> We start with a VIP parent persona and generate 128 experiment arms: different openings, tool timings, and recovery strategies. In the first call, Maya has a late birthday gift. The system predicts refund and escalation risk, but the baseline branch starts with shipping policy. Sentiment drops, Maya switches languages in frustration, and the call fails containment.
>
> After the call, we score the run. We keep the urgent-event and translation signals, prune policy-first language, and promote inventory-first recovery. Then the dream pass finds the same failure across Maya, Alex, and Jordan: different shoppers, same hidden pattern.
>
> On the next similar call, the updated agent predicts the risk earlier, preloads inventory and courier options, acknowledges the deadline, and offers a real rescue path before policy. Containment improves, sentiment recovers, and recontact risk drops.
>
> Every call becomes evidence. Weak branches are pruned. Winning behaviors become the next agent.

## Optional Q&A Proof

If asked whether this is real backend data, show:

```text
GET /api/health
POST /api/demo/build-result
POST /api/dream-pass
GET /api/runs/similar-failures
```

The vector retrieval route is available for the live proof point:

```text
GET /api/runs/similar-failures?text=urgent%20birthday%20gift%20late%20delivery%20policy%20refund&limit=3
```
