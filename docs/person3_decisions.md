# Technical Coordination Document: Person 3 (Persistence, Vector DB, & RSI Clusters)

This document is a reference guide for the agents representing **Person 1 (Studio UI & Simulator Runner)** and **Person 2 (Live Conversation Runner & Intent Classifier)**. It outlines the schema, API interfaces, and architectural patterns implemented in the persistence layer.

---

## 1. Database Schema Configurations

We are using a live PostgreSQL database hosted on DigitalOcean, equipped with the `pgvector` extension for semantic searches.

### Key Tables
1. **`profiles`**: Stores static customer records.
   * `profile_id` (PK, e.g., `prof_maya_001`, `prof_alex_002`, `prof_jordan_003`).
   * `shopper_mode` (matches playbooks, e.g., `Loyal Shopper`, `First-time Buyer`, `Discount Shopper`).
   * `learned_preferences_before_call` (`TEXT[]`): Historical context notes.
   * `embedding` (`VECTOR(1536)`): pgvector column.
2. **`conversation_runs`**: Stores call result snapshots.
   * `session_id` (PK, matches the simulator session ID).
   * `outcome` (`JSONB`): Stores CSAT predictions, containment, and escalation statuses.
   * `turns` (`JSONB`): Array of transcript turns (`[{speaker: 'shopper', text: '...'}, ...]`).
   * `embedding` (`VECTOR(1536)`): pgvector column of the transcript embedding.
3. **`playbooks`**:
   * `shopper_mode` / `intent` / `policy_version` (composite unique key).
   * `playbook_text` (`TEXT`): Policy guidelines read by the conversational agent.
4. **`dream_clusters`**:
   * `dream_cluster_key` (PK): Behavioral key (e.g. `late_delivery:gift_order,urgent_event_deadline:policy_first_shipping_explanation:escalation_or_refund_threat`).
   * `affected_personas` (`TEXT[]`): Personas experiencing this failure mode.
   * `recommended_patch` (`JSONB`): Global rules + persona overrides.
   * `evidence_session_ids` (`TEXT[]`): Contributed session IDs.
   * `status` (`TEXT`): `'pending'` or `'approved'`.

---

## 2. API Endpoint Integrations

The API server runs locally at `http://127.0.0.1:8000`.

### A. Saving Call Runs (For Person 1 & 2 Runner)
* **`POST /api/runs`**
  * **Payload:** `ConversationResult` schema JSON.
  * **Behavior:** If the call result indicates a failure (escalation or non-containment), the API server **automatically generates a transcript embedding** using Gemini and stores it. No manual vectorization is needed.

### B. Similar Failures Query (For Person 1 live UI context display)
* **`GET /api/runs/similar-failures?text=<transcript_or_shopper_statement>&limit=3`**
  * **Behavior:** Generates a semantic vector for the query text and performs a cosine-distance (`<=>`) pgvector query over failed runs.
  * **Return Value:** Array of matching runs with session IDs, metadata, and outcomes. Use this to render "Similar Past Failure Cases" in the UI in real-time.

### C. Dream Pass & Clustering Evaluation (For Person 1 Studio & Evals)
* **`POST /api/dream-pass`**
  * **Behavior:** Triggers the offline consolidation compiler. Groups unprocessed failed runs into behavioral failure clusters and writes them to the `dream_clusters` table as `pending`.
* **`GET /api/dream-clusters?status=pending`**
  * **Behavior:** Lists all pending/approved clusters, their evidence counts, and recommended patches.
* **`POST /api/dream-clusters/approve`**
  * **Payload:** `{"key": "dream_cluster_key"}`
  * **Behavior:** Approves the patch. It automatically generates and promotes updated Gen 3 playbooks for **every affected persona** in the cluster, merging the global patch rule with the persona-specific override (e.g. Loyal Shopper, First-time Buyer, Discount Shopper overrides).

---

## 3. Playbook Merge Rules

When a cluster is approved, the playbook text is structured as follows:

```markdown
# [Persona Title] - [Intent Title] Playbook (Gen 3 - Consolidated Patch)

## Core Policy Guidelines:
[Global Rule from Cluster recommended_patch.rule]

## Tool Priority Guidelines:
1. [First Tool]
2. [Second Tool]

## Behaviors to Avoid:
- [Avoid list]

## Persona-Specific Instructions:
[Persona override text from recommended_patch.persona_overrides]
```

Please parse and render playbooks using this structure or retrieve them from `GET /api/playbooks` to inject directly into your conversation simulator agent context.

---

## 4. Environment Configurations (.env.example)

The following configurations are required to boot the API server and connect to the DB. Ensure these are mirrored in your local `.env`:

# =============================================================
#  CX_lab Dojo — env template
#  Copy to .env and fill in real values:  cp .env.example .env
#  The real .env is gitignored — never commit secrets.
# =============================================================

# ── Google / Gemini (Google Cloud API key with Gemini API enabled) ──
GEMINI_API_KEY=your-google-gemini-api-key

# ── ElevenLabs (TTS provider option B) ──
ELEVENLABS_API_KEY=your-elevenlabs-api-key
# Optional: default voice id (blank = provider default)
ELEVENLABS_VOICE_ID=

# ── LiveKit (Demo 1 voice room) ──
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# ── DigitalOcean / Database (deploy target & persistence) ──
DIGITAL_OCEAN_API_KEY=your-digitalocean-token
DATABASE_URL=postgresql://<username>:<password>@<host_url>:<port>/<database_name>?sslmode=require

# ── App config ──
PORT=3000
# Default TTS provider: google | elevenlabs  (demo presets may override per-demo)
TTS_PROVIDER=google
```
