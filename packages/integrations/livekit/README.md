# LiveKit Integration

Owner: Person 1 - Voice + Final Demo Flow.

Purpose:

- Voice room setup.
- Transcript streaming.
- Turn events.
- Optional realtime voice agent.

Fallback:

If LiveKit setup blocks the team, keep the frontend transcript simulation polished and preserve the same event shape.

Boundary:

Normalize all transcript events into `TurnEvent` shape from `packages/contracts`.
