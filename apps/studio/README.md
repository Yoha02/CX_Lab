# Studio App

Owner: Person 1 - Voice + Final Demo Flow.

Purpose:

- Main judge-facing UI.
- Simulated or real voice call experience.
- Transcript timeline.
- Next-turn prediction panel.
- Branch tree and dream-pass visualization.

Recommended stack:

- TypeScript
- Vite
- React
- Tailwind CSS
- Framer Motion for animation
- Lightweight charting only if needed

Current prototype lives in `prototype/`. When the team is ready to build the real app, port the prototype into this folder.

Boundaries:

- Do not define new data shapes here. Import or copy from `packages/contracts`.
- Do not implement scoring logic here. Call into `packages/eval` or mock its output.
- Do not write directly to the database from the UI. Use `apps/api` or the persistence helpers from Person 3.
