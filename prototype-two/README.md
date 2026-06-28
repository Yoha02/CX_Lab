# CX-Lab Dojo — Illustrative Prototype

A single, self-contained HTML prototype to align the team on the product UX **before** we build. It is purely illustrative: there is no real voice or model — the transcript is scripted and animated to show what the experience would feel like.

It shows two things:

1. **Day — the live call + prediction loop:** a simulated voice conversation (Maya, a VIP parent with a late birthday gift) streaming in, with the next-turn predictor updating *before* the shopper speaks, predictions being graded against what they actually say, tool calls, and a scoreboard. The current "Policy-first" policy fails to contain the call.
2. **Night — offline pruning & refinement ("dream pass"):** experiment branches animate through hard-prune (unsafe), soft-prune (low confidence), and promotion to a champion; reviewers flag the failure pattern; a policy diff is proposed and eval-gated; the containment-lift chart animates Gen 1 → 2 → 3; and a Gen-3 replay shows the improved, contained call.

## Run it

No install needed — it is one self-contained file with no external dependencies.

- **Easiest:** double-click `prototype/index.html` (opens in your browser).
- **Or serve it** (nicer for sharing a URL on the same network):

```bash
# from the repo root
cd prototype
python -m http.server 5500
# then open http://localhost:5500
```

## Controls

- **Pause / Resume**, **Restart**, and a **Speed** selector.
- **🌙 Dream on these calls** — pulses once the Day call finishes; click it to run the Night refinement animation. (Restart to replay the whole thing.)

## Notes for the team

- This is a throwaway alignment artifact, not the real build. Numbers (containment %, prediction scores) are illustrative.
- Feedback we want: is the Day/Dream story clear? Is the prediction panel compelling or does it read as mind-reading? Is the pruning/refinement legible? What's the hero metric?
