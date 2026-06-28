# CX_Lab

Design and prototype workspace for CX_lab Dojo, a self-improving retail/ecommerce voice agent lab.

## Start Here

- Team build guide: `docs/TEAM_BUILD_GUIDE.md`
- Conversation contract: `docs/conversation_result_contract.md`
- Full example JSON: `docs/conversation_result.example.json`
- Static prototype: `prototype/index.html`

## Repo Ownership

```text
apps/studio                         Person 1 - UI, voice flow, final demo
packages/integrations/livekit        Person 1 - LiveKit integration

packages/contracts                   Person 2 - schema/data contract
packages/eval                        Person 2 - scoring and pruning
packages/simulator                   Person 2 - synthetic experiments
data                                 Person 2 - fixtures and sample runs

apps/api                             Person 3 - API boundary
packages/memory                      Person 3 - persistence/vector memory
packages/dream                       Person 3 - dream pass
packages/integrations/gemini         Person 3 - Gemini Managed Agent
packages/integrations/digitalocean   Person 3 - DigitalOcean services
infra/digitalocean                   Person 3 - deployment/infra notes
```

## Prototype

Open the static prototype:

```text
prototype/index.html
```

It simulates:

- a retail voice support transcript
- next-turn intent prediction
- containment and prediction metrics
- conversation branch promotion/pruning
- an offline dream pass that proposes a policy patch

## Final-Pass Direction

Useful ideas from the parallel design review:

- Keep the three-loop framing: live prediction, offline self-play, cross-call dreaming.
- Use logprobs when available, but do not make the demo depend on exact token logprobs.
- Blend model predictions with empirical profile priors.
- Use a bandit-style selector for response scripts after enough experiments.
- Make policy updates eval-gated: commit only if held-out simulations improve containment and pass safety checks.

Defer for hackathon scope:

- weights-level fine-tuning
- production telephony
- real Shopify integration
- multiple persistent memory systems
- fully automated memory commits without human review
