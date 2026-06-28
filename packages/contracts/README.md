# Contracts

Owner: Person 2 - Schema/Data Mapping.

Purpose:

- Shared source of truth for JSON shapes.
- Person 1 uses these shapes in the UI.
- Person 2 uses these shapes in the simulator/evaluator.
- Person 3 implements storage and APIs against these shapes.

Canonical objects:

- `Profile`
- `ConversationResult`
- `TurnEvent`
- `PredictionSnapshot`
- `Evaluation`
- `PruningDecision`
- `DreamInput`
- `DreamPatch`
- `PolicyVersion`
- `IntentTransitionRule`

Rule:

If a field name changes here, all teammates should know. Keep schema changes small and explicit.
