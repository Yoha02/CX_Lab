# CX_lab Integration Branch Analysis

Branch created from latest `main`: `integration`

This document maps Person 3's backend, memory, vector DB, and dream-pass work to the `prototype-four` UI scaffold. The goal is to turn the static platform demo into an integrated hackathon app without losing the current polished demo path.

## Current State

`main` now contains both major workstreams:

- `prototype-four/`: static platform UI scaffold for persona planning, interaction history, live call simulation, pruning, dream pass, and analytics.
- `apps/api/`, `packages/memory/`, `packages/dream/`, `packages/integrations/*`, `infra/digitalocean/`: Person 3's backend, persistence, pgvector, Gemini, and dream-cluster implementation.
- `apps/studio/`: Person 1's React/Vite voice studio with LiveKit, Gemini Live, Gemini translation, and TTS provider work. This was imported selectively from `origin/tts+sst+livetranslate` because that branch was based on an older repo shape.

The integration branch should keep the static UI behavior as a fallback while progressively replacing hardcoded data with API-backed state.

## Person 1 Branch Import Summary

Source branch:

```text
origin/tts+sst+livetranslate
```

Imported paths:

```text
apps/studio/
docs/person1_decisions.md
```

Template update:

```text
.env.example
```

Why the import was selective:

- A direct merge from `origin/tts+sst+livetranslate` would attempt to delete current `apps/api`, `packages/memory`, `packages/dream`, `packages/integrations`, `infra/digitalocean`, and `prototype-four` files.
- That deletion is not intentional product work. It is branch ancestry drift: Person 1's branch started before Person 3's backend and our final prototype-four UI landed on `main`.
- Selective import brings in Person 1's voice code without disturbing Person 3's infra or the current UI.

Merge conflict status:

- No file conflicts were produced by the selective import.
- A raw merge simulation reported textual conflicts in `.env.example` and `.gitignore`.
- A raw merge would also be semantically dangerous because the Person 1 branch does not contain newer Person 3/backend and prototype-four files. Accepting that tree wholesale would remove major current paths even when Git does not mark every removal as a conflict.

Do not resolve this by "taking theirs" across the whole branch. The safe integration method is:

```text
take Person 1 additive app/docs paths
keep Person 3 backend packages
keep prototype-four
write explicit adapters between the systems
```

## What Person 1 Built

Person 1 built a standalone voice studio app under `apps/studio/`.

### Runtime Shape

```text
Browser mic
  -> Gemini Live or LiveKit room
  -> transcript
  -> POST /api/translate
  -> WS /api/branch
  -> champion response
  -> POST /api/tts
  -> browser audio playback
```

### Person 1 API Surface

File: `apps/studio/server/index.ts`

```text
GET  /health
GET  /api/iterations
GET  /api/livekit/token?room=<room>&identity=<identity>
POST /api/translate
POST /api/tts
WS   /api/live
WS   /api/branch
```

Important details:

- `POST /api/translate` uses Gemini to return English translation, detected language, and sentiment/frustration.
- `POST /api/tts` supports `google` and `elevenlabs`.
- `GET /api/livekit/token` signs a LiveKit token server-side so browser code never sees the LiveKit secret.
- `WS /api/live` proxies audio chunks to Gemini Live.
- `WS /api/branch` generates candidate response strategies and a champion response.
- The frontend uses Web Audio API playback because browser autoplay rules block naive `new Audio().play()` after async work.

### Person 1 Frontend

Files:

```text
apps/studio/src/App.tsx
apps/studio/src/lib/voicePipeline.ts
apps/studio/src/lib/audio.ts
apps/studio/src/lib/livekit.ts
apps/studio/src/lib/liveSocket.ts
apps/studio/src/lib/branchSocket.ts
apps/studio/src/state/runStore.ts
apps/studio/src/data/ApiDataSource.ts
apps/studio/src/lib/contracts.ts
```

The important reusable pieces are:

- `voicePipeline.ts`: orchestrates mic input, translation, branch generation, champion response, and TTS playback.
- `runStore.ts`: Zustand store for call state, turns, candidates, language rescue, and active iteration.
- `ApiDataSource.ts`: intended bridge to Person 3's backend, but endpoint names are still older and need an adapter.
- `contracts.ts`: UI-local contract mirror; useful, but it is not the canonical shared contract.

### Person 1 Known Limitations

- LiveKit token generation is implemented, but full LiveKit STT/transcription flow still needs end-to-end validation.
- The DreamPanel is visual only and is not wired to Person 3's dream cluster endpoints.
- `ApiDataSource.ts` points to older route names:

```text
GET  /api/profile
GET  /api/memory
GET  /api/playbook-patches
POST /api/playbook-patches/:id/approve
POST /api/conversation-results
```

Current Person 3 route names are:

```text
GET  /api/profiles/:profile_id
GET  /api/profiles/:profile_id/memory
GET  /api/dream-clusters
POST /api/dream-clusters/approve
POST /api/runs
```

This mismatch should be solved with adapters, not by scattering route rewrites through UI components.

## Person 1 + Person 3 Integration Boundary

The clean integration shape is to keep three responsibilities separate:

```text
Person 1 voice layer
  captures speech, translation, sentiment, TTS, LiveKit/Gemini voice transport

Person 2 evaluation layer
  turns live conversation state into ConversationResult, scores prediction quality,
  computes sentiment/NPS/recontact metrics, decides keep/prune/promote

Person 3 memory/dream layer
  persists ConversationResult, embeds failed runs, clusters repeated failures,
  creates and approves dream patches/playbooks
```

The shared handoff should be `ConversationResult`, not raw transcript text.

### Adapter 1: Voice State To Evaluation Input

Source:

```text
apps/studio/src/state/runStore.ts
```

Target:

```text
packages/contracts/src/index.ts
```

Person 2 should own:

```text
packages/evaluation/
```

Recommended module:

```text
packages/evaluation/src/buildConversationResult.ts
```

Responsibilities:

- Convert `turns` from Person 1 into canonical `ConversationResult.turns`.
- Add profile snapshot and scenario metadata.
- Add next-intent predictions and prediction correctness.
- Compute sentiment movement, NPS proxy, escalation risk, and containment.
- Create `pruning_decision`.
- Create `dream_input` with the cluster key fields Person 3 needs.

### Adapter 2: Studio API Names To Backend API Names

Person 1's `ApiDataSource.ts` should be updated to call Person 3 routes:

```text
getProfile(profileId)
  -> GET /api/profiles/:profile_id

getProfileMemory(profileId)
  -> GET /api/profiles/:profile_id/memory

saveConversationResult(result)
  -> POST /api/runs

getPlaybookPatches(status)
  -> GET /api/dream-clusters?status=<status>

approvePlaybookPatch(key)
  -> POST /api/dream-clusters/approve with { key }
```

Short-term option:

- Add compatibility aliases in `apps/api/src/index.ts` so Person 1's current frontend works quickly.

Preferred option:

- Update `apps/studio/src/data/ApiDataSource.ts` to the canonical Person 3 endpoints.
- Keep compatibility routes only if the demo needs them.

### Adapter 3: One API Server Or Two

There are currently two Express servers that want port `8000`:

```text
apps/api/src/index.ts
apps/studio/server/index.ts
```

Do not run both on port `8000`.

Recommended hackathon integration:

1. Keep `apps/api` as the canonical backend server on `8000`.
2. Move Person 1 server routes into `apps/api`, or mount them from a `packages/voice` module.
3. Keep `apps/studio` as the React app on Vite `5173`, proxying `/api` to `8000`.

Least-risk path:

```text
packages/voice/
  src/translate.ts
  src/tts/
  src/livekit.ts
  src/branch/

apps/api/src/index.ts
  imports Person 3 memory/dream routes
  imports Person 1 voice routes
```

Faster path:

- Copy Person 1's route handlers into `apps/api/src/index.ts` and mark them with a `voice integration` section.
- Refactor to `packages/voice` after the demo if time allows.

## Space For Person 2 Work

Person 2 should not work inside the voice transport code or DB persistence code. The clean owned area is:

```text
packages/evaluation/
packages/contracts/
prototype-four/demoState.js
prototype-four/apiClient.js
apps/studio/src/lib/conversationResult.ts
```

Recommended Person 2 deliverables:

1. Canonical `ConversationResult` builder.
2. Prediction scoring functions:

```text
P_final = alpha * P_model + beta * P_profile + gamma * P_intent_transition
```

3. Sentiment and NPS proxy scoring.
4. Pruning decision engine:

```text
keep: evidence signals worth sending to dream state
prune: branch/response behavior that made containment worse
promote: branch/response behavior that improved containment
preserve: neutral fallback behavior that should remain available
```

5. Dream cluster key builder:

```text
intent:situation_tags:agent_strategy:failure_mode
```

6. UI adapter that makes prototype-four and apps/studio produce the same backend payload.

This keeps Person 2's contribution as the actual "self-improvement logic" instead of UI glue.

## Person 2 Final Build Plan

Person 2 owns the missing logic between the live voice experience and the recursive learning backend.

The output of Person 2 is one canonical object:

```text
ConversationResult
```

That object is the handoff from:

```text
Person 1 voice state -> Person 2 scoring/pruning -> Person 3 persistence/dream pass
```

### Person 2 Inputs

From Person 1:

```text
turns
branchCandidates
lastGoodCandidates
languageSwitch
detectedIntent
activeIteration
```

From Person 3:

```text
GET /api/profiles/:profile_id
GET /api/profiles/:profile_id/memory
GET /api/playbooks
GET /api/runs/similar-failures?text=<query>&limit=3
```

From UI/demo state:

```text
selected_profile_id
scenario
policy_version
policy_arm
experiment_generation
seed
```

### Person 2 Outputs

Person 2 must fill these `ConversationResult` sections:

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

### Scoring Model

The demo should explain prediction as a blend, not as magic:

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

Definitions:

- `P_model`: current LLM branch/intent probability from Person 1's branch generator.
- `P_profile`: persona prior from profile memory, learned preferences, and risk flags.
- `P_intent_transition`: historical next-intent likelihood for the active intent/strategy pair.

Demo example:

```text
late_delivery + policy_first_response -> cancel_or_refund_threat
late_delivery + inventory_lookup      -> accept_replacement
```

The UI should show this simply:

```text
Model signal + profile prior + transition memory = next-turn prediction
```

### Prediction Quality Metrics

Use these metrics for the hackathon because they are explainable:

```text
intent_hit
intent_rank
negative_log_likelihood
brier_score
semantic_similarity_best_candidate
calibration_error
```

Simplified score:

```text
prediction_quality_score =
  0.35 * intent_hit_score
+ 0.25 * (1 - normalized_brier_score)
+ 0.20 * semantic_similarity_best_candidate
+ 0.20 * (1 - calibration_error)
```

### Sentiment And Containment Metrics

Sentiment is not auxiliary; it is part of containment.

Person 2 should track:

```text
sentiment_start
sentiment_min
sentiment_final
sentiment_recovery_score
emotion_intensity
escalation_risk
recontact_risk
csat_prediction
nps_proxy
```

Recommended containment rule for demo:

```text
contained = resolved == true
         && escalated == false
         && dropoff == false
         && final_sentiment >= -0.15
         && recontact_risk <= 0.35
```

Recommended NPS proxy:

```text
nps_proxy = round(
  50
+ 25 * containment_binary
+ 15 * sentiment_recovery_score
+ 10 * resolution_score
- 20 * recontact_risk
- 15 * escalation_binary
)
```

### Pruning Logic

Person 2 should classify every meaningful branch into one of four states:

```text
promote
preserve
soft_prune
hard_prune
```

Use this decision table:

```text
promote:
  contained true
  sentiment recovered
  prediction quality high
  no compliance penalty

preserve:
  neutral outcome
  useful fallback
  no evidence that it worsened the call

soft_prune:
  low reward or sentiment drop
  prediction miss correlated with escalation
  branch may still be useful in another scenario

hard_prune:
  compliance risk
  hallucinated promise
  unsafe discount/refund behavior
  repeated avoidable escalation with high confidence
```

For this hackathon demo, we mostly use `soft_prune`; it is more credible than pretending one failed call deletes an entire strategy globally.

### Dream Cluster Key

Person 2 builds the dream key that Person 3 clusters:

```text
intent:situation_tags:agent_strategy:failure_mode
```

Golden path failure key:

```text
late_delivery:gift_order,urgent_event_deadline:policy_first_shipping_explanation:escalation_or_refund_threat
```

Golden path promoted key:

```text
late_delivery:gift_order,urgent_event_deadline:deadline_inventory_first:contained_replacement_acceptance
```

### Person 2 Package Shape

Recommended implementation path:

```text
packages/eval/
  package.json
  tsconfig.json
  src/
    index.ts
    types.ts
    buildConversationResult.ts
    scorePrediction.ts
    scoreSentiment.ts
    decidePruning.ts
    buildDreamInput.ts
    fixtures.ts
```

The first production function should be:

```ts
buildConversationResult(input: EvaluationInput): ConversationResult
```

Where `EvaluationInput` includes:

```text
profile
profileMemory
playbook
turns
branchCandidates
selectedPolicyArm
scenario
experimentGeneration
seed
similarFailures
```

### UI Targets

`ui-final` and `prototype-four` should map Person 2 output like this:

```text
Home
  seed profiles and recent runs

Personas
  seeded persona library and planned experiment arms

History
  GET /api/profiles/:profile_id/runs
  selected ConversationResult turns/evaluation/pruning_decision

Live Call
  Person 1 STT/TTS state
  Person 2 next-intent prediction, sentiment, NPS, containment risk

Pruning
  ConversationResult.pruning_decision
  ConversationResult.dream_input

Dream Pass
  POST /api/dream-pass
  GET /api/dream-clusters?status=pending
  POST /api/dream-clusters/approve

Analytics
  aggregate local run outcomes for demo if no backend aggregate endpoint exists
```

### End-To-End Happy Path API Calls

The final local validation path should execute:

```text
1. npm run api:init-db
2. npm run api:dev
3. Open ui-final/index.html or apps/studio
4. GET /api/profiles/prof_maya_001
5. GET /api/profiles/prof_maya_001/memory
6. GET /api/playbooks
7. Run baseline Maya call
8. Person 2 builds ConversationResult
9. POST /api/runs
10. POST /api/dream-pass
11. GET /api/dream-clusters?status=pending
12. POST /api/dream-clusters/approve
13. GET /api/playbooks
14. Run second urgent-event call with updated playbook
15. Person 2 builds contained ConversationResult
16. POST /api/runs
17. UI shows containment lift and Gen 3 strategy
```

### Required Seed Data

Seed data must cover:

```text
profiles:
  prof_maya_001   -> Loyal Shopper / VIP parent
  prof_alex_002   -> First-time Buyer
  prof_jordan_003 -> Discount Shopper

policy_versions:
  policy_late_delivery_gen1 -> promoted baseline
  policy_late_delivery_gen2 -> unpromoted challenger
  policy_late_delivery_gen3 -> created by dream approval

playbooks:
  Loyal Shopper + late_delivery + Gen 1 policy-first
  First-time Buyer + late_delivery + Gen 1 policy-first
  Discount Shopper + late_delivery + Gen 1 policy-first

failed runs:
  Maya birthday gift failure
  Alex anniversary outfit failure
  Jordan graduation present failure

success run:
  Sam or Maya-like VIP parent urgent gift success after Gen 3

dream cluster:
  urgent event deadline + policy-first failure across multiple personas
```

The canonical fixture reference for the team is:

```text
data/fixtures/golden_demo_seed.json
```

### What To Avoid

- Do not let Person 1's studio write partial transcript objects directly to the database.
- Do not let Person 3 infer all evaluation fields from raw transcript text when Person 2 can compute them deterministically.
- Do not let `prototype-four` and `apps/studio` produce different result schemas.
- Do not overemphasize security in the demo. Mention safe tool/policy constraints only as part of pruning and compliance scoring.
- Do not make fine-tuning the core demo. Fine-tuning can be positioned as the later-stage use of the golden dataset after enough approved dream clusters accumulate.

## Golden Hackathon Demo Path

The best 3-5 minute story is:

```text
1. Show the system planning 128 experiment arms for a VIP parent persona.
2. Start Maya's live call. The system identifies her as a high-value urgent-event shopper.
3. Baseline policy-first branch fails. Sentiment drops, cancel/refund threat appears, containment fails.
4. Process the call. Person 2 shows what was kept, soft-pruned, and promoted.
5. Run dream pass. Person 3 clusters Maya + Alex + Jordan into one behavioral failure pattern.
6. Approve the patch. The playbook changes from policy-first to deadline/inventory-first.
7. Run a second similar call. The agent preloads inventory, responds in time, sentiment recovers, containment succeeds.
8. Close with the RSI loop: every contained or failed call becomes structured evidence for the next generation.
```

The golden script is stored in:

```text
docs/GOLDEN_HACKATHON_SCRIPT.md
```

## What Person 3 Built

### API Boundary

File: `apps/api/src/index.ts`

Local server:

```text
http://127.0.0.1:8000
```

Available endpoints:

```text
POST /api/runs
GET  /api/profiles/:profile_id
GET  /api/profiles/:profile_id/memory
GET  /api/profiles/:profile_id/runs
GET  /api/profiles/:profile_id/scenarios/:scenario/dream-input
GET  /api/runs/similar-failures?text=<query>&limit=3
POST /api/dream-pass
GET  /api/dream-clusters?status=pending
POST /api/dream-clusters/approve
GET  /api/playbooks
```

Key behavior:

- `POST /api/runs` accepts a `ConversationResult`.
- If the run failed containment, the API generates a Gemini embedding and stores it.
- `GET /api/runs/similar-failures` uses pgvector similarity over failed runs.
- `POST /api/dream-pass` runs offline clustering.
- `POST /api/dream-clusters/approve` promotes a consolidated Gen 3 playbook across affected personas.

### Data Contract

File: `packages/contracts/src/index.ts`

The canonical object is `ConversationResult`.

Important top-level fields:

```text
session_id
run_id
metadata
profile_snapshot
outcome
turns
evaluation
pruning_decision
dream_input
dream_pass_processed
```

This matches the demo UI well. Prototype Four already visualizes most of these fields:

- transcript turns
- next-intent prediction
- sentiment and risk
- containment outcome
- pruning decision
- dream pass evidence
- policy/playbook patch

### Persistence And Vector Memory

Files:

```text
packages/memory/src/runStore.ts
packages/memory/src/profileMemory.ts
packages/memory/src/playbookStore.ts
packages/integrations/digitalocean/src/db.ts
infra/digitalocean/init_db.sql
```

Database tables:

```text
profiles
conversation_runs
policy_versions
playbooks
dream_patches
dream_clusters
```

Important implementation details:

- Postgres is expected to run on DigitalOcean.
- `pgvector` is enabled with `CREATE EXTENSION IF NOT EXISTS vector`.
- `conversation_runs.embedding` and `profiles.embedding` are `VECTOR(1536)`.
- Gemini embedding output is padded/duplicated to fit 1536 dimensions.
- Failed runs are searchable by semantic similarity.

### Dream Pass

File: `packages/dream/src/dreamPass.ts`

The dream pass:

1. Loads unprocessed failed runs.
2. Extracts behavioral features with Gemini, with a structured fallback.
3. Builds a dream cluster key:

```text
intent:situation_tags:agent_strategy:failure_mode
```

4. Merges evidence across personas.
5. Generates a recommended patch.
6. Saves a `dream_clusters` row as `pending`.
7. Marks evidence runs processed.

The approval flow:

```text
POST /api/dream-clusters/approve
  -> mark cluster approved
  -> generate policy_late_delivery_gen3
  -> save playbooks for every affected persona
  -> promote policy version
  -> update profile learned preferences
```

This is the strongest match to the demo story.

### Simulator / Integration Test

File: `packages/simulator/src/testBackend.ts`

This is effectively a backend proof script. It:

1. Resets and seeds the database.
2. Creates failed Maya, Alex, and Jordan calls.
3. Saves those failed runs with embeddings.
4. Runs the dream pass.
5. Approves the generated cluster.
6. Verifies active playbooks.
7. Tests pgvector similar-failure search.

This script is the best reference for the first real integration demo flow.

## How This Hooks Into Prototype Four

### 1. Home

Current UI:

- Static welcome page.
- Recent persona rows for Maya, Alex, Jordan.

Backend hook:

- There is no `GET /api/profiles` list endpoint yet.
- For now, keep Maya/Alex/Jordan as local known demo profiles.
- Add a small `apiClient` that can hydrate each known profile via:

```text
GET /api/profiles/prof_maya_001
GET /api/profiles/prof_alex_002
GET /api/profiles/prof_jordan_003
```

Recommended integration:

- Keep static rows if API is unavailable.
- If API is available, replace row metadata with profile memory.

### 2. Personas

Current UI:

- Persona library: VIP parent, First-time buyer, Value seeker.
- Experiment canvas: 128 draft arms, 10 strategy families, no outcomes.

Backend hook:

- This is mostly planning-state UI, not persisted yet.
- `GET /api/playbooks` can supply active playbooks after policy promotion.
- We do not yet have an endpoint for generated experiment arms.

Recommended integration:

- Keep experiment arms client-side for the hackathon.
- Use `GET /api/playbooks` to show whether a persona/intent already has a promoted playbook.
- Later add `/api/experiments` only if needed.

### 3. History

Current UI:

- Recent user runs.
- Active experiment tree with Maya's failed branch highlighted.
- Details tab with transcript and outcome.

Backend hook:

```text
GET /api/profiles/:profile_id/runs
GET /api/runs/similar-failures?text=<query>&limit=3
```

Recommended integration:

- On History load, fetch runs for known profile IDs.
- Select Maya's latest run by default.
- Use `ConversationResult.turns`, `outcome`, `evaluation`, and `pruning_decision` to populate the details tab.
- Use similar-failure search to populate cross-persona evidence for Alex/Jordan.

### 4. Live Call

Current UI:

- Simulated transcript.
- Caller identification.
- Next-intent prediction panel.
- Sentiment, NPS proxy, containment, and recontact risk.
- `Process call` moves to Pruning.

Backend hook:

```text
GET /api/profiles/:profile_id
GET /api/profiles/:profile_id/memory
GET /api/playbooks
POST /api/runs
```

Recommended integration:

- Keep simulated transcript for demo reliability.
- When the caller is identified as Maya, hydrate profile memory from `/api/profiles/prof_maya_001/memory`.
- Read active playbook from `/api/playbooks`.
- At call end, assemble a `ConversationResult` using `docs/conversation_result.example.json` as the template.
- Submit it with `POST /api/runs`.
- If API fails, keep the static pruning flow so the demo does not break.

### 5. Pruning

Current UI:

- Shows keep/prune/promote cards.
- Shows prediction quality, sentiment delta, NPS proxy, pruning decision.
- Shows prune/promote flow.
- `Run dream pass` goes to Dream Pass and starts animation.

Backend hook:

```text
POST /api/runs
GET  /api/profiles/:profile_id/scenarios/:scenario/dream-input
```

Recommended integration:

- Drive this page from the saved `ConversationResult.pruning_decision`.
- Show `dream_input.evidence_summary`.
- Keep local fallback object if the run has not been saved.
- The in-panel `Run dream pass` should call `POST /api/dream-pass`, then switch to Dream Pass.

### 6. Dream Pass

Current UI:

- Five-stage visual pipeline.
- Sankey outcome shift.
- Static dream-cluster narrative.

Backend hook:

```text
POST /api/dream-pass
GET  /api/dream-clusters?status=pending
POST /api/dream-clusters/approve
GET  /api/playbooks
```

Recommended integration:

- When Dream Pass starts, call `POST /api/dream-pass`.
- Then call `GET /api/dream-clusters?status=pending`.
- Map returned clusters into the five cards:
  - Cluster: `evidence_count`, `affected_personas`
  - Diagnose: `agent_strategy`, `failure_mode`, `sentiment_pattern.delta`
  - Patch: `recommended_patch.rule`
  - Validate: static/simulated lift for now
  - Commit: call approve endpoint
- Add an `Approve patch` or `Commit Gen 3` button when a pending cluster exists.
- After approval, call `GET /api/playbooks` to prove Gen 3 playbooks exist.

### 7. Analytics

Current UI:

- Static quality dashboard.

Backend hook:

- No aggregate analytics endpoint exists yet.

Recommended integration:

- Keep static for demo.
- Optionally compute aggregates client-side from `GET /api/profiles/:profile_id/runs` for the three demo profiles.

## Suggested Integration Architecture

Keep the static prototype as a no-build app for now.

Add:

```text
prototype-four/apiClient.js
prototype-four/demoState.js
```

`apiClient.js` responsibilities:

```js
const API_BASE = "http://127.0.0.1:8000";

async function getProfile(profileId) {}
async function getProfileMemory(profileId) {}
async function listRuns(profileId) {}
async function saveRun(conversationResult) {}
async function runDreamPass() {}
async function listDreamClusters(status = "pending") {}
async function approveDreamCluster(key) {}
async function listPlaybooks() {}
async function similarFailures(text, limit = 3) {}
```

`demoState.js` responsibilities:

- Hold fallback Maya/Alex/Jordan fixtures.
- Build `ConversationResult` from the simulated transcript.
- Normalize API responses into UI-friendly view models.

Why this path:

- Fastest integration.
- Low risk to the current polished UI.
- No React/Vite migration needed before the hackathon.
- Leaves room for a future `apps/studio` port.

## Data Flow For The Integrated Demo

```text
1. Open Home
   -> static recent profiles or profile API hydration

2. Open Live Call
   -> identify Maya
   -> GET /api/profiles/prof_maya_001/memory
   -> GET /api/playbooks
   -> show active playbook context

3. Run simulated call
   -> update transcript, predictions, sentiment

4. Process call
   -> build ConversationResult
   -> POST /api/runs
   -> move to Pruning

5. Run dream pass
   -> POST /api/dream-pass
   -> GET /api/dream-clusters?status=pending
   -> animate dream pipeline from returned cluster

6. Approve patch
   -> POST /api/dream-clusters/approve
   -> GET /api/playbooks
   -> show Gen 3 active playbook

7. Run next call
   -> use promoted playbook context
   -> show improved containment
```

## Main Gaps / Concerns

### 1. Build Environment Is Not Ready Locally

Command attempted:

```text
npm run --workspaces --if-present build
```

Result:

```text
'tsc' is not recognized as an internal or external command
```

Likely cause:

- dependencies are not installed locally yet, or workspace bins are unavailable.

Recommended next step:

```text
npm install
npm run --workspaces --if-present build
```

Do this before changing backend behavior.

After importing Person 1's studio app, this remains true. The attempted command:

```text
npm run typecheck --workspace=apps/studio --if-present
```

failed because `tsc` was not available locally. Install dependencies before treating this as a TypeScript error.

An additional workspace query:

```text
npm query .workspace --workspace=apps/studio
```

returned an npm internal error. The app is still inside the root `apps/*` workspace pattern, so the next practical check should be a normal dependency install rather than debugging `npm query` first.

### 2. API Imports Gemini Directly But Does Not Declare It

`apps/api/src/index.ts` imports:

```ts
import { generateEmbedding } from '@cx-lab/gemini';
```

But `apps/api/package.json` does not list `@cx-lab/gemini`.

Recommended fix:

- Add `@cx-lab/gemini` as an API dependency.

### 3. Simulator Imports DigitalOcean Directly But Does Not Declare It

`packages/simulator/src/testBackend.ts` imports:

```ts
import { pool } from '@cx-lab/digitalocean';
```

But `packages/simulator/package.json` does not list `@cx-lab/digitalocean`.

Recommended fix:

- Add `@cx-lab/digitalocean` as a simulator dependency.

### 4. Schema And Contract Naming Are Slightly Divergent

Examples:

- Contract metadata has `profile_segment`.
- Dream pass checks `run.metadata?.shopper_mode`.
- Init DB uses `shopper_mode` in `profiles`.
- UI uses labels like `VIP parent`, `Value seeker`.

Recommended fix:

- Add a small normalization layer rather than changing all schemas immediately.
- Treat backend `shopper_mode` values as canonical:

```text
Loyal Shopper
First-time Buyer
Discount Shopper
```

- Map UI persona labels:

```text
VIP parent -> Loyal Shopper
Value seeker -> Discount Shopper
```

### 5. No List Profiles Endpoint Yet

The UI has a persona/history landing page, but API only supports:

```text
GET /api/profiles/:profile_id
```

Recommended short-term path:

- Hardcode known demo IDs in frontend.

Recommended later endpoint:

```text
GET /api/profiles
```

### 6. Init DB Is Destructive

`infra/digitalocean/init_db.sql` drops and recreates tables.

That is acceptable for hackathon demo reset, but do not run it against any database with data we need to preserve.

### 7. API Has Limited Contract Validation

`POST /api/runs` only checks `session_id`.

Recommended short-term path:

- Validate on the client by building from `docs/conversation_result.example.json`.

Recommended later:

- Add schema validation at API boundary.

## Recommended Work Plan

### Pass 1: Safe API Client

Create a browser-safe client in `prototype-four/apiClient.js`.

- Add `safeFetchJson`.
- Add API health behavior through a lightweight call such as `GET /api/playbooks`.
- Return `null` or fallback values when API is offline.

### Pass 2: Hydrate Profile And Playbook

On Live Call:

- Fetch Maya profile memory.
- Fetch active playbook.
- Display whether the UI is using live backend data or fallback data.

### Pass 3: Save A ConversationResult

At `Process call`:

- Build a full `ConversationResult`.
- Save it to `POST /api/runs`.
- Store returned `session_id` in local UI state.

### Pass 4: Backend Dream Pass

At pruning `Run dream pass`:

- Call `POST /api/dream-pass`.
- Fetch pending dream clusters.
- Render the returned cluster in Dream Pass.

### Pass 5: Approve And Show Gen 3

On Dream Pass:

- Add `Approve patch`.
- Call `POST /api/dream-clusters/approve`.
- Fetch active playbooks.
- Show the promoted Gen 3 playbook in the UI.

### Pass 6: Improved Second Call

Use the promoted playbook to drive the second simulated call:

- first call: policy-first failure
- dream pass: cluster + patch
- second call: inventory-first success

This completes the hackathon demo loop.

## Best First Integration Slice

The fastest useful slice is:

```text
Live Call -> build ConversationResult -> POST /api/runs -> Pruning -> POST /api/dream-pass -> Dream Pass visual updates from GET /api/dream-clusters
```

This gives us a real backend story without needing to fully replace every static UI screen.

## Files To Touch Next

Recommended:

```text
prototype-four/index.html
prototype-four/script.js
prototype-four/styles.css
prototype-four/apiClient.js
prototype-four/demoState.js
apps/api/package.json
packages/simulator/package.json
```

Avoid for now:

```text
infra/digitalocean/init_db.sql
packages/contracts/src/index.ts
```

Unless the team agrees to schema changes.

## Demo Readiness Checklist

- API can start with `npm run api:dev`.
- Database can be initialized with `npm run api:init-db`.
- Profile memory loads for Maya.
- Active playbook loads for Gen 1.
- Simulated failed call saves to `/api/runs`.
- Dream pass returns at least one pending cluster.
- Dream Pass UI uses cluster data.
- Approving the cluster creates/promotes Gen 3 playbooks.
- Second call can visually show improved containment.
