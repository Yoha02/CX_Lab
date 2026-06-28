# Memory

Owner: Person 3 - Infrastructure + Persistence + Vector DB.

Purpose:

- Store and retrieve profile memory, segment playbooks, intent transition rules, and policy versions.
- Implement vector retrieval if time allows.

Recommended hackathon path:

1. Start with local JSON fixtures.
2. Add SQLite or Postgres adapter if needed.
3. Use DigitalOcean Postgres + pgvector if setup is fast and the team wants the DigitalOcean prize story.

Core retrieval:

- profile by ID
- segment playbook by shopper mode + badges + intent
- similar profiles/branches by vector search
- intent transition rules by shopper mode + current intent + agent strategy

Boundaries:

- Contracts come from `packages/contracts`.
- Persistence details should not leak into UI components.
