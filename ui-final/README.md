# UI Final

Final-build UI folder for CX_lab Dojo.

Open `index.html` directly in a browser. No build step is required.

This folder was copied from `prototype-four` as the stable base for final integration work. Keep `prototype-four` available as the visual reference; wire real API/demo behavior here.

## What This UI Shows

- Left navigation for personas, history, live calls, pruning, dream pass, and analytics.
- Clean landing canvas with recent persona experiment rows.
- Expanded navigation rail that collapses into the compact workflow rail.
- Persona experiment canvas with expandable strategy families and child experiment nodes.
- Maya history drilldown with transcript, policy node, containment scores, and prune/promote map.
- Simulated live call that identifies Maya, updates profile context, tracks next-intent prediction, sentiment, NPS proxy, and recontact risk.
- Post-call pruning review showing what is kept, pruned, and promoted.
- Visual dream pass pipeline and Sankey-style outcome shift.
- Analytics dashboard for advanced containment.

## Integration Targets

- Person 1 voice/STT/TTS state from `apps/studio`.
- Person 2 evaluation and pruning output from `packages/eval`.
- Person 3 persistence and dream pass APIs from `apps/api`.
- Golden fixture data from `data/fixtures/golden_demo_seed.json`.
- Demo script from `docs/GOLDEN_HACKATHON_SCRIPT.md`.
