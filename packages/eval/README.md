# Evaluation And Pruning

Owner: Person 2 - Experiment Engine + Scoring.

Purpose:

- Score each conversation.
- Decide branch promotion, preservation, or pruning.
- Produce `evaluation`, `pruning_decision`, and `dream_input` sections for `ConversationResult`.

Core outputs:

- composite reward
- containment result
- sentiment recovery
- prediction quality
- hard prune reasons
- soft prune reasons
- policy arm weight delta
- preference pair for future training or prompt optimization

Boundaries:

- Do not store data here. Return objects for `apps/api` or Person 3 to persist.
- Do not own UI rendering.
