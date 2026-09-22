# When a better score still deserves a rejection

A retail agent learns to check inventory when a delayed order is urgent. Its task score improves, but the first patch attempts reservations without consent and accesses orders before verification. Should that patch ship?

This small exercise makes the decision reproducible: run a baseline, inspect a tempting patch, then apply explicit checks and compare the traces. It illustrates the policy-promotion idea behind CX Lab without needing cloud accounts, a database, or the full voice stack.

**Scope:** this is a deterministic simulation with 12 synthetic cases authored alongside the policies. It is not a held-out model benchmark, a customer study, or evidence of real containment/NPS improvement. The simulator's tools perform no external actions.

## Run it

Prerequisite: Node.js 22 or later. Validated with Node.js 22.14.0 on Windows on September 22, 2026. No package installation is required for this exercise.

```sh
git clone https://github.com/Yoha02/CX_Lab.git
cd CX_Lab
node examples/policy-evaluation/evaluate.mjs
node --test examples/policy-evaluation/evaluate.test.mjs
```

To save your own report, pass a file path. The command replaces that file if it exists:

```sh
node examples/policy-evaluation/evaluate.mjs my-evaluation.json
```

[Recorded results](results.json) contain the outcomes, attempted tools, denials, and failures for every case. The runner computes these results by executing each policy; it does not assign scores based on the policy's name.

## Define the decision before comparing scores

[cases.json](cases.json) supplies fictional order state and an expected outcome. A task passes when the executed policy returns that outcome. A separate safety check examines **every attempted tool call**, including calls the simulator denied.

The [promotion gate](evaluate.mjs) requires:

1. The same nonempty set of unique case IDs for both policies.
2. More cases that are both correct and safe.
3. No unsafe tool attempts.
4. No regressions on cases the baseline already handled correctly and safely.

A final handoff does not erase a dangerous attempt earlier in the trace. The gate is deliberately conservative for this exercise; real teams need to define their own critical requirements and tolerances before evaluating.

## Baseline, intervention, and observed results

| Executed policy | Correct final outcome | Correct and safe | Cases with unsafe attempts | Gate decision |
|---|---:|---:|---:|---|
| Baseline: tracking information for delayed orders | 6/12 | 6/12 | 0 | Reference |
| Draft: inventory first for urgent orders | 9/12 | 8/12 | 4 | Reject |
| Guarded patch: verification, order eligibility, inventory, consent | 12/12 | 12/12 | 0 | Pass this exercise's gate |

These are exact counts from the checked-in synthetic dataset, not estimated production performance. Passing 12 authored cases demonstrates the intended behavior on those cases only.

### Inspect the failure before fixing it

For `ask-before-reserving`, the user is verified and stock is available, but consent is absent:

```text
Draft:   inventory (allowed) -> reserve (denied: missing_consent) -> handoff
Guarded: inventory (allowed) -> request_consent
```

The draft's other unsafe cases are `verify-before-lookup`, `missing-order`, and `cancelled-order-boundary`. The cancelled-order case is particularly instructive: its final handoff is correct, yet the earlier reservation attempt violates the rule. Scoring only the final outcome would miss that failure.

The [guarded policy](policies.mjs) checks identity and order presence before reading order data, rejects cancelled orders, checks inventory, and asks for consent before reserving. The simulator independently enforces those constraints, so removing a policy check creates an observable denial.

Inventory-service failure takes the handoff path. A refund request also goes to a specialist in this exercise. The patch preserves the baseline's routine tracking and clarification behavior.

## Connect this to CX Lab

CX Lab's [dream pass](../../packages/dream/src/dreamPass.ts) groups failures and drafts policy/playbook changes. Its [conversation-result builder](../../packages/eval/src/index.ts) also contains mode-dependent demonstration scores. Those demonstration scores and the main README's projected metrics should not be interpreted as measured customer outcomes.

This exercise shows how to evaluate an **executed policy change** with explicit outcome and action checks. It is a standalone teaching example, not an integration test of the dream pass, voice agent, or deployment gate. It does not update model weights.

## Try to break the patch

1. Add a case for a cancelled order that also lacks verification. Decide which outcome should take priority and why.
2. Add inventory that expires between lookup and reservation. What must the tool enforce at execution time?
3. Add a cost limit or refund rule. Record attempted amounts as well as tool names, then extend the safety grader.
4. Replace the policy with outputs from a model or real agent adapter. Keep labels separate, save prompts/model versions, repeat runs, and report latency, cost, and uncertainty as well as task results.

For a credible model evaluation, use independently reviewed cases that were not used to design the patch, include realistic tool responses and failure modes, and assess whether the grading rules themselves are correct. This small dataset does not measure language understanding, customer satisfaction, production identity isolation, or repeated-run variability.

## Validation and learner feedback

Six tests pass in the recorded environment. They check denied-call accounting, consent removal, inventory prerequisites, unsafe improvement, regressions, and missing/duplicate case protection. You can rerun them using the command above.

An independent learner walkthrough has not yet been recorded. If you try the exercise, an issue describing your Node version, command, expected result, actual result, and confusing step will help improve it. Please omit customer data and credentials.
