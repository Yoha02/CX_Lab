# Technical Decisions & Implementation Guide: Person 1 (Voice Studio UI)

This document is the canonical reference for everything built, every architectural decision made, and every gotcha discovered while implementing the **CX_lab Dojo Studio** — the live voice RSI prototype UI at `apps/studio/`.

Read this before touching any of the following: `apps/studio/`, the voice pipeline, TTS/STT integration, branch tree, or the iteration system.

---

## 1. What Person 1 Built

Person 1 owns the real-time voice demo interface. It is a single-page React app with a backing Express server that proxies all third-party API calls (Gemini, ElevenLabs, LiveKit) so no secrets ever hit the browser.

**The runtime flow is:**
```
Browser mic → [Gemini 3.5 Live Translate / LiveKit] → transcript
→ POST /api/translate → English + sentiment + lang
→ WS /api/branch → 5 strategy candidates streamed live
→ champion selected → POST /api/tts → ElevenLabs audio
→ Web Audio API playback in browser
```

**What's fully working as of this commit:**

| Component | Status | Notes |
|---|---|---|
| Express backend server (`server/index.ts`) | ✅ Working | Port 8000, tsx watch for dev |
| `POST /api/translate` | ✅ Working | Gemini 2.5 Flash, returns `english`, `lang`, `sentiment` |
| `POST /api/tts` (ElevenLabs) | ✅ Working | Model `eleven_multilingual_v2`, voice `QTKSa2Iyv0yoxvXY2V8a` |
| `POST /api/tts` (Google) | ✅ Working | `gemini-2.5-flash-preview-tts`, returns base64 WAV |
| `WS /api/branch` | ✅ Working | Streams up to 5 candidates then champion + agentResponse |
| `WS /api/live` | ✅ Working | Proxies audio chunks to Gemini Live WebSocket |
| `GET /api/livekit/token` | ✅ Working | Signs JWT for LiveKit room join |
| `GET /api/iterations` | ✅ Working | Returns A/B test iteration config |
| Branch tree (4-level SVG) | ✅ Working | Animated Bezier paths, dynamic node count |
| Language rescue banner | ✅ Working | Fires at frustration ≥ 45%, non-English detection |
| Mic toggle UX (unmute/mute) | ✅ Working | Mute = flush utterance to pipeline |
| Web Audio playback | ✅ Working | `AudioContext` unlocked on mic button click gesture |
| TTS auto-play after agent response | ✅ Working | Fires after champion is selected |
| Auto-connect on page load | ✅ Working | Pipeline connects immediately, stays muted |
| Iteration switch (gear menu) | ✅ Working | Cmd+. or gear icon, switches LiveKit ↔ Gemini Live |
| Metrics row | ✅ Working | Derived from live branch candidates |
| Prediction panel | ✅ Working | Sorted score bars, live update |
| Dream pass UI | ✅ Working (UI only) | Animation works; not yet wired to Person 3's `/api/dream-pass` |
| Profile panel (SideRail) | ⚠️ Partial | UI wired to `GET /api/profile` — Person 3 must implement this route |
| Memory panel (SideRail) | ⚠️ Partial | UI wired to `GET /api/memory` — Person 3 must implement this route |
| Conversation result upload | ⚠️ Not wired | `saveConversationResult()` in `ApiDataSource.ts` posts to `/api/conversation-results` — Person 3's route |
| LiveKit full pipeline | ⚠️ Partial | Client join + JWT working; actual STT transcription from LiveKit room not tested end-to-end |

---

## 2. Architecture: Why These Technologies

### 2.1 Express + tsx (not Vite SSR, not Bun, not native Node ESM)

**Decision:** Run the backend as a plain Express server started with `tsx watch --env-file=../../.env server/index.ts`.

**Why:** `tsx` compiles TypeScript on the fly with no build step, supports `--env-file` for secret loading without a `.env` loader library, and `watch` mode hot-restarts on any file change. This is the fastest possible iteration loop for a hackathon. Native Node ESM with `.ts` extension resolution is still broken in most setups; `tsx` removes that entire class of problem.

**Gotcha:** The server runs on port `8000`. Vite's dev server runs on port `5173` (sometimes `5174` if already taken). The Vite proxy in `vite.config.ts` forwards all `/api/*` and `ws://*/api/*` to `localhost:8000`. If you see `Cannot GET /api/health`, the server is down — run `npm run dev:server` separately.

### 2.2 Gemini 2.5 Flash for Translation + Sentiment

**Decision:** All shopper speech goes through `POST /api/translate` which calls `gemini-2.5-flash` via REST.

**Why:** One API call returns English translation, detected language (BCP-47), and sentiment (label + frustration 0..1). Alternatives like Whisper require a separate sentiment step and no translation. DeepL has no sentiment. This single endpoint does three jobs.

**Prompt structure** (see `server/providers/translate.ts`): The prompt instructs Gemini to return structured JSON: `{ english, lang, sentiment: { label, frustration } }`. The server strips markdown fences and parses the JSON.

**Frustration threshold for language rescue:** Set to **0.45**. Below that, the language rescue banner does not fire even if non-English is detected. Reason: `gemini-3.5-live-translate-preview` sometimes transcribes English greetings ("Hello, check check") as phonetically similar Indonesian ("Halo, cek cek"). Without the frustration gate, a neutral English greeting triggers a false-positive rescue banner. At 0.45 threshold this is eliminated — Maya's real Spanish moment fires at 0.82.

### 2.3 ElevenLabs as Primary TTS

**Decision:** Agent responses are spoken via ElevenLabs `eleven_multilingual_v2`, voice ID `QTKSa2Iyv0yoxvXY2V8a`.

**Why:** Quality is dramatically better than Google TTS for conversational retail scenarios. The multilingual v2 model handles code-switching mid-sentence (Spanish → English) without artifacts. Google TTS is available as a fallback per-iteration via the iteration config.

**ELEVENLABS_VOICE_ID** in `.env`: If blank, the server uses the voice ID hardcoded in `server/providers/tts/elevenlabs.ts`. Set this to override.

**Response format:** ElevenLabs returns raw MP3 bytes. The server base64-encodes them and returns `{ audioBase64, mime: "audio/mpeg" }`. Google TTS returns WAV similarly.

### 2.4 Web Audio API Instead of `new Audio()`

**Decision:** All TTS playback goes through `AudioContext.decodeAudioData()` + `createBufferSource()`, never through `new Audio()`.

**Why (critical):** Browsers block `new Audio().play()` with a silent rejection when called from an async context that is more than one frame removed from a user gesture. The rejection is *silent* — no error thrown, no console message, audio just doesn't play. This was the root cause of "audio not working" — confirmed by:
1. `curl POST /api/tts` → valid base64 returned ✅
2. `afplay` on the decoded WAV → plays correctly ✅
3. `new Audio().play()` in browser → silent rejection ❌

**Fix:** `unlockAudio()` in `src/lib/audio.ts` must be called **inside** the mic button's click handler (a direct user gesture). This creates and resumes an `AudioContext` during the gesture frame. Subsequent calls to `playAudioFromData()` reuse the unlocked context and bypass the autoplay restriction.

**Do not revert this to `new Audio()`.**

### 2.5 Mic Toggle as Utterance Boundary

**Decision:** The mute button is the primary signal to flush accumulated speech to the pipeline. A 2000ms idle timer is a secondary backup.

**Why:** The original design used only a 1200ms idle timer. This caused mid-sentence flushes during natural speech pauses, splitting one thought into two API calls. The model then saw incomplete context and generated misaligned branches. Making **mute = end of turn** aligns with how push-to-talk works and gives the user explicit control. The 2000ms timer is a fallback for when the user forgets to mute.

**Flow:**
```
unmute() → clears buffer, starts mic capture → audio chunks → Gemini Live
                                                                  ↓
                                                   onInputText accumulates text
                                                                  ↓
                                                   mute() → flush() → finalizeUtterance()
                                                   OR 2000ms idle → flush()
```

### 2.6 Gemini 3.5 Live Translate vs Standard Gemini Live

**Decision:** The default pipeline uses `models/gemini-3.5-live-translate-preview` (set in `server/providers/voice/geminiLive.ts`).

**Why:** This model is designed to receive non-English speech and output both the original transcription (`input_audio_transcription`) and an English translation (`output_audio_transcription`). The voice pipeline captures both and uses the translated English for branch generation while showing the original in the rescue banner.

**Known issue:** This model may return `404` or `501` depending on API key permissions. If you get 404 on `/api/live`, change the model in `server/providers/voice/geminiLive.ts` to `models/gemini-2.0-flash-live-001` which is the stable Gemini Live model (no translation).

**The model does not have explicit source/target language config in the current setup.** It infers the source language automatically. If you speak English, it transcribes English on both channels and the frustration gate prevents any false rescue banner.

### 2.7 Branch Generation: Intent Is Inferred, Not Hardcoded

**Decision:** `voicePipeline.ts` passes no `intent` or `situationTags` to `streamBranches()`. The branch prompt infers these from the English transcript.

**Why:** Hardcoding `intent: "late_delivery"` was a demo fixture from the Maya prototype. In a real call, the intent could be anything. The Gemini 2.5 Flash branch generator is instructed to infer intent from the transcript if not provided (see `server/providers/branch/prompt.ts`).

**What the branch prompt produces per candidate:**
```json
{
  "strategy": "Acknowledge deadline + check inventory",
  "predicted_next_intent": "accepts replacement offer",
  "score": 0.91,
  "status": "kept | preserved | pruned",
  "reason": "one clause"
}
```
Plus `championStrategy` and `agentResponse` at the top level.

**maxCandidates is 5.** The tree renders however many come back — it's fully dynamic via `xPositions(n)`.

### 2.8 Branch Timeout: 25 Seconds

**Decision:** The WebSocket branch generator times out after 25,000ms (up from the original 8,000ms).

**Why:** `gemini-2.5-flash` with a complex branch generation prompt takes 10–20 seconds on the first call. The original 8s timeout caused empty trees on every real call. 25s covers the 99th percentile while still failing fast for genuine hangs.

### 2.9 Iteration System (A/B Test Infrastructure)

**Decision:** `server/config/iterations.ts` defines two demo iterations. The active one is stored in the Zustand store and drives which voice pipeline and TTS provider is used.

**Why:** The team wanted to show two different pipeline configurations in the demo — LiveKit room transport vs. direct Gemini Live. Rather than hardcoding, iterations are a config-driven system.

**Current iterations:**
```ts
Demo 1: voiceInput: "livekit",    tts: "elevenlabs"
Demo 2: voiceInput: "geminiLive", tts: "google"
```

Switch via the gear icon in the top bar or `Cmd+.`.

**Effect on pipeline:** `connectPipeline()` in `voicePipeline.ts` reads the active iteration and calls either `buildLiveKitHandle()` or `buildGeminiHandle()`.

### 2.10 No Mock Data / Display Mode Removed

**Decision:** All fixture data (Maya profile, dream patch fixture, `MockDataSource`, `displayMode` flag) has been deleted.

**Why:** The display mode toggle was a crutch for early development. Every panel is now wired to the real `ApiDataSource` which calls real endpoints. If an endpoint doesn't exist yet (e.g., Person 3's `/api/profile`), the panel shows an empty state gracefully — it does not crash. Keeping mock data alongside real data creates confusion about what is and isn't working.

**If you need to test the UI without APIs:** Use the browser DevTools to intercept network requests, or temporarily add a mock response in `ApiDataSource.ts`. Do not re-add `MockDataSource` or the `displayMode` flag.

---

## 3. File Map: What Is Where and Why

```
apps/studio/
├── server/                         ← Express backend (Node, not browser)
│   ├── index.ts                    ← Entry point: routes, WS upgrade, CORS
│   ├── config/
│   │   └── iterations.ts           ← A/B iteration definitions (2 demos)
│   ├── lib/
│   │   ├── env.ts                  ← Strict env var reader (throws on missing)
│   │   └── pcmWav.ts               ← Wraps raw PCM in RIFF/WAVE header for Google TTS
│   └── providers/
│       ├── translate.ts            ← Gemini 2.5 Flash: text → english + lang + sentiment
│       ├── branch/
│       │   ├── prompt.ts           ← Builds the branch generation prompt (intent optional)
│       │   └── generator.ts        ← Calls Gemini, coerces/validates result
│       ├── tts/
│       │   ├── elevenlabs.ts       ← ElevenLabs MP3 → base64
│       │   ├── google.ts           ← Gemini TTS WAV → base64
│       │   ├── index.ts            ← Route: POST /api/tts
│       │   └── select.ts           ← Picks provider from iteration config
│       └── voice/
│           ├── geminiLive.ts       ← Proxy: browser audio → Gemini Live WS
│           └── livekit.ts          ← LiveKit token signer
│
└── src/                            ← Vite React frontend
    ├── state/
    │   ├── runStore.ts             ← Zustand store (callStatus, turns, candidates, languageSwitch, detectedIntent)
    │   └── iterations.ts           ← Iteration type definition
    ├── lib/
    │   ├── audio.ts                ← Web Audio API: unlockAudio(), startMicCapture(), playAudioFromData()
    │   ├── voicePipeline.ts        ← Main pipeline: connectPipeline() → PipelineHandle
    │   ├── liveSocket.ts           ← Gemini Live WS client (sends audio, receives text)
    │   ├── livekit.ts              ← LiveKit room join client
    │   ├── branchSocket.ts         ← Branch WS client (streams candidates)
    │   └── contracts.ts            ← TypeScript types: Turn, Candidate, Profile, PlaybookPatch
    ├── data/
    │   ├── DataSource.ts           ← Interface: getProfile, getProfileMemory, getPlaybookPatches, etc.
    │   ├── ApiDataSource.ts        ← Real implementation (all calls to /api/*)
    │   └── index.ts                ← getDataSource() — always returns apiDataSource
    └── components/
        ├── TopBar/                 ← Status pill + iteration switch + reset
        ├── SideRail/               ← Brand, profile, memory (from real API)
        ├── CallStage/              ← Mic toggle, waveform, language rescue banner, transcript
        │   ├── Waveform.tsx        ← 28-bar dark oscilloscope, CSS animation
        │   └── TranscriptTurn.tsx  ← Turn bubbles with frustration bar + monospace turn ID
        ├── BranchTree/             ← 4-level SVG with Framer Motion bezier animation
        ├── MetricsRow/             ← 4 tiles derived from branch candidates
        ├── PredictionPanel/        ← Score bars for predicted next intents
        └── DreamPanel/             ← Dream pass UI (animation wired; API not yet connected)
```

---

## 4. Server API Reference (Port 8000)

All these are exposed by `server/index.ts`. The Vite dev proxy forwards `/api/*` from port 5173 to port 8000.

### `GET /health`
Returns `{ ok: true }`. Use this to confirm the server is up before debugging anything else.

### `GET /api/iterations`
Returns the iteration config array. Used by the frontend to populate the iteration switch.
```json
[
  { "id": "demo1", "label": "Demo 1 — LiveKit + ElevenLabs", "voiceInput": "livekit", "tts": "elevenlabs" },
  { "id": "demo2", "label": "Demo 2 — Gemini Live + Google TTS",  "voiceInput": "geminiLive", "tts": "google" }
]
```

### `GET /api/livekit/token?room=<roomName>&participant=<name>`
Returns a signed LiveKit JWT. Requires `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` in `.env`.

### `POST /api/translate`
```json
// Request
{ "text": "No puedo seguir explicando esto." }

// Response
{
  "english": "I can't keep explaining this.",
  "lang": "es-MX",
  "sentiment": { "label": "frustrated", "frustration": 0.82 }
}
```
Language code is BCP-47. Frustration is 0..1. If text is already English, `lang` is `"en"` and `english` equals `text`.

### `POST /api/tts`
```json
// Request
{ "text": "I hear you.", "provider": "elevenlabs" }  // or "google"

// Response
{ "audioBase64": "<base64>", "mime": "audio/mpeg" }  // ElevenLabs: MP3
{ "audioBase64": "<base64>", "mime": "audio/wav"  }  // Google: WAV
```
Play with `playAudioFromData(mime, audioBase64)` from `src/lib/audio.ts`. **Do not use `new Audio()`.**

### `WS /api/live`
Binary WebSocket. Accepts audio chunks (base64-encoded PCM int16, 16kHz mono) and forwards to Gemini Live. Emits JSON frames:
```json
{ "type": "setup_complete" }
{ "type": "transcript", "text": "...", "channel": "input" | "output" }
```

### `WS /api/branch`
Text WebSocket. Client sends one JSON payload on open:
```json
{
  "englishTranscript": "...",
  "ctx": { "shopperMode": "Loyal Shopper", "badges": ["Urgent"] },
  "gen": { "model": "gemini-2.5-flash", "maxCandidates": 5 }
}
```
Server streams:
```json
{ "type": "candidate", "id": "c0", "candidate": { "strategy": "...", "score": 0.91, "status": "kept", ... } }
{ "type": "champion", "championStrategy": "...", "agentResponse": "..." }
{ "type": "done" }
```
On timeout (25s) or error: `{ "type": "error", "message": "..." }`.

---

## 5. Integration Points for Next Person

### 5.1 What Person 1 Needs From Person 3

The `ApiDataSource.ts` in `src/data/` already has the API calls stubbed. Person 3 just needs to implement the routes.

**Route Person 1 is calling → Expected response:**

```
GET /api/profile
→ Profile { profile_id, customer_name, shopper_mode, badges, features }
  (Person 3 should derive this from the active call session or a query param)

GET /api/memory
→ Memory[] [{ id, text }]
  (Context notes loaded before the call — from the profiles.learned_preferences_before_call column)

GET /api/playbook-patches?status=ready_for_approval
→ PlaybookPatch[] (see contracts.ts for the shape — matches Person 3's dream_clusters table)

POST /api/playbook-patches/:id/approve
→ 200 OK
  (Maps to Person 3's POST /api/dream-clusters/approve)

POST /api/conversation-results
→ 200 OK
  (Person 1 will POST here at end of call with ConversationResult — see docs/conversation_result_contract.md)
```

**The full type definitions** are in `src/lib/contracts.ts`. These are the single source of truth for what Person 1 sends and expects.

### 5.2 What Person 1 Sends to Person 3 After Each Call

At the end of a call session (when the user resets), Person 1 should call `saveConversationResult()` in `ApiDataSource.ts`. **This is not yet wired to a trigger** — someone needs to call it from the reset handler in `App.tsx`. The shape to send is defined in `contracts.ts` as `CallResultUpload`:

```ts
{
  intent: string;            // e.g. "late_delivery" (from detectedIntent in store)
  situation_tags: string[];  // from language rescue or branch context
  agent_strategy: string;    // the champion strategy
  failure_mode: string;      // "escalation" | "refund_demand" | "contained"
  dream_cluster_key: string; // compound key for Person 3 clustering
  english_transcript: string; // full joined transcript in English
}
```

### 5.3 Similar Failures Panel (Not Yet Built)

Person 3 exposes `GET /api/runs/similar-failures?text=<transcript>&limit=3`. This should power a "Similar past failures" card in the SideRail. It uses pgvector cosine distance over stored failed call embeddings. **Build this when Person 3 confirms the route is live.**

---

## 6. Zustand Store: All Shared State

Location: `src/state/runStore.ts`

```ts
callStatus: "idle" | "connecting" | "ready" | "speaking"
turns: Turn[]
branchCandidates: Candidate[]        // live streaming
lastGoodCandidates: Candidate[]      // persists after clear
detectedIntent: string               // set from branch champion strategy
languageSwitch: LanguageSwitch | null // non-null when rescue banner is active
activeIterationIndex: number
iterations: Iteration[]
```

**`callStatus` lifecycle:**
```
idle → connecting (connectPipeline called)
     → ready (Gemini Live setup_complete received)
     → speaking (unmute() called)
     → ready (mute() called)
     → idle (disconnect() called)
```

**Language rescue fires when:**
- Translate API returns `lang` that does not start with `"en"`
- AND `sentiment.frustration >= 0.45`
- Clears automatically on the next English turn

---

## 7. Environment Variables

All required. Server throws on startup if any are missing (see `server/lib/env.ts`).

| Variable | Used By | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | translate, branch, TTS (Google), Gemini Live | Main Google API key |
| `GEMINI_MODEL` | Person 3 Gemini client | Override model (default: `gemini-2.5-flash`) |
| `ELEVENLABS_API_KEY` | TTS provider | ElevenLabs audio generation |
| `ELEVENLABS_VOICE_ID` | TTS provider | Voice character (default: `QTKSa2Iyv0yoxvXY2V8a`) |
| `LIVEKIT_URL` | LiveKit token, client join | WSS room URL |
| `LIVEKIT_API_KEY` | LiveKit token | JWT signing key |
| `LIVEKIT_API_SECRET` | LiveKit token | JWT signing secret |
| `DIGITAL_OCEAN_API_KEY` | Person 3 infra | DigitalOcean management |
| `DATABASE_URL` | Person 3 DB | PostgreSQL connection string |
| `PORT` | Server | Defaults to 8000 |
| `TTS_PROVIDER` | TTS select | `google` or `elevenlabs` |

`.env` lives at the repo root (`CX_Lab/.env`). The server loads it via `--env-file=../../.env` in the npm script. **Never commit `.env`.** It contains live DigitalOcean PostgreSQL admin credentials.

---

## 8. How to Run

```bash
# From apps/studio/
npm run dev:server   # starts Express on :8000 with hot reload
npm run dev          # starts Vite on :5173 (proxy → :8000)
npm run test         # vitest (16 tests, all passing)
npm run typecheck    # tsc --noEmit
```

Open `http://localhost:5173`. The pipeline auto-connects on load. Click the mic button to unmute and speak.

---

## 9. Known Issues and Non-Obvious Behaviour

1. **Gemini 3.5 Live Translate may 404**: The model `gemini-3.5-live-translate-preview` is in preview and access is key-dependent. If `/api/live` WebSocket closes immediately, change the model in `server/providers/voice/geminiLive.ts` to `models/gemini-2.0-flash-live-001`.

2. **Audio never plays if `unlockAudio()` is not called on a click**: The Web Audio `AudioContext` must be created or resumed during a user gesture. `unlockAudio()` is called inside the mic button's `onClick`. If you add other TTS triggers (e.g., auto-read on page load), they will be silently blocked. Always gate TTS behind a user gesture or use the already-unlocked context.

3. **Vite may start on :5174 if :5173 is taken**: If a previous session's Vite is still running, a new `npm run dev` picks :5174. The backend proxy in `vite.config.ts` is not port-dependent — it always hits `:8000`. But make sure you open the right Vite URL.

4. **Branch generation is slow on first call (10–20s)**: Gemini 2.5 Flash with a complex structured prompt takes time. The WebSocket timeout is 25s. This is not a bug. Subsequent calls in the same session are faster.

5. **LiveKit STT not fully tested end-to-end**: The client join and JWT work. The actual transcription flow from LiveKit room audio back into the pipeline (`buildLiveKitHandle()` in `voicePipeline.ts`) has not been tested with a real LiveKit room session. The `joinLiveKitRoom()` stub in `src/lib/livekit.ts` needs to be wired to the LiveKit SDK's transcription events.

6. **`detectedIntent` shows champion strategy, not classified intent**: The L1 node in BranchTree shows `detectedIntent` from the store, which is set to the champion strategy string (e.g., "Acknowledge deadline + check inventory"). It is NOT a formal intent classification. If you want a cleaner intent label, add intent classification to the translate route or as a separate step.

7. **`wrapAt()` in BranchTree truncates long strings**: Strategy labels are truncated at 26 chars for display in the SVG nodes. The full strategy is in the store and visible in the legend. This is intentional — SVG text does not wrap.

8. **Dream pass animation is scripted, not live**: The four steps play through on a fixed 900ms timer. They are not reflecting real processing. The actual dream pass integration requires Person 3's `POST /api/dream-pass` route to be live, then wired into `DreamPanel.tsx`.
