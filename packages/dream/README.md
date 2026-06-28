# Dream Pass

Owner: Person 3 - Gemini Dream Agent + Policy Improvement Loop.

Purpose:

- Read batches of `ConversationResult` objects.
- Find repeated prediction misses, policy failures, and winning response strategies.
- Propose evidence-backed memory and policy patches.
- Support human approval before promotion.

Preferred hackathon implementation:

- Gemini Managed Agent / Antigravity for the dream reviewer if available.
- Fallback: local LLM call or deterministic summarizer over completed results.

Dream pass should output:

- `DreamPatch`
- proposed policy diff
- evidence call IDs
- prevalence stats
- expected containment lift
- compliance risk

Boundaries:

- Do not change live policy without approval.
- Do not own raw storage; read/write through `apps/api` or Person 3's persistence adapter.
