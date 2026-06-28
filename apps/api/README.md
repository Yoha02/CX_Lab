# API App

Owner: Person 3 - Infrastructure + Persistence + Dream Agent.

Purpose:

- Thin backend boundary for the UI and experiment runner.
- Save and read call sessions, turns, predictions, scores, policy versions, and dream patches.
- Hide storage details from the UI.

Expected endpoints or helper functions:

- `saveConversationResult(result)`
- `getProfile(profileId)`
- `getProfileMemory(profileId)`
- `listRuns(profileId)`
- `getDreamInput(profileId, scenario)`
- `saveDreamPatch(patch)`
- `promotePolicyVersion(policyVersionId)`

Boundaries:

- Data contracts come from `packages/contracts`.
- Scoring and pruning logic come from `packages/eval`.
- DigitalOcean and vector DB adapters live in `packages/integrations/digitalocean` and `packages/memory`.
