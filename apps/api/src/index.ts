import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import {
  saveRun,
  getRun,
  listRuns,
  getDreamInput,
  getProfile,
  getProfileMemory,
  saveDreamPatch,
  promotePolicyVersion,
  listActivePlaybooks,
  listDreamPatches,
  approveDreamPatch,
  findSimilarFailedRuns,
  listDreamClusters,
  approveDreamCluster
} from '@cx-lab/memory';
import { runDreamPass } from '@cx-lab/dream';
import { generateEmbedding } from '@cx-lab/gemini';
import { buildConversationResult, buildConversationResultFromFixture } from '@cx-lab/eval';
import {
  attachGeminiLive,
  createLiveKitToken,
  detectAndTranslate,
  generateBranches,
  generateAgentReply,
  synthesizeTts
} from './voice.js';

dotenv.config({ path: findRepoFile('.env') ?? path.resolve(process.cwd(), '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true, service: 'cx-lab-api' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'cx-lab-api' }));

// ---------------------------------------------------------------------------
// Voice / Person 1 APIs
// ---------------------------------------------------------------------------

app.get('/api/iterations', (_req, res) => {
  res.json([
    { id: 'demo1', label: 'Demo 1 - LiveKit + ElevenLabs', voiceInput: 'livekit', tts: 'elevenlabs' },
    { id: 'demo2', label: 'Demo 2 - Gemini Live Translate + Google TTS', voiceInput: 'geminiLive', tts: 'google' }
  ]);
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body as { text?: string };
    if (!text) return res.status(400).json({ error: 'text required' });
    res.json(await detectAndTranslate(text));
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, provider } = req.body as { text?: string; provider?: 'google' | 'elevenlabs' };
    if (!text) return res.status(400).json({ error: 'text required' });
    res.json(await synthesizeTts(text, provider));
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/agent-reply', async (req, res) => {
  try {
    const { transcript, persona, history } = req.body as {
      transcript?: string; persona?: string; history?: Array<{ speaker?: string; text?: string }>;
    };
    if (!transcript) return res.status(400).json({ error: 'transcript required' });
    res.json(await generateAgentReply({ transcript, persona, history }));
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.get('/api/livekit/token', async (req, res) => {
  try {
    const room = String(req.query.room ?? 'cx-demo');
    const identity = String(req.query.identity ?? req.query.participant ?? `studio-${Date.now()}`);
    res.json(await createLiveKitToken(room, identity));
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ---------------------------------------------------------------------------
// Person 2 evaluation and golden-demo helpers
// ---------------------------------------------------------------------------

app.get('/api/demo/golden-seed', (_req, res) => {
  try {
    res.json(loadGoldenSeed());
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/evaluate/conversation-result', (req, res) => {
  try {
    res.json(buildConversationResult(req.body));
  } catch (e: any) {
    res.status(400).json({ error: e.message || String(e) });
  }
});

app.post('/api/demo/build-result', (req, res) => {
  try {
    const seed = loadGoldenSeed();
    const { session_id, run_id, success } = req.body || {};
    const runs = [
      ...(seed.baseline_failed_runs || []),
      ...(seed.post_patch_success_run ? [seed.post_patch_success_run] : [])
    ];
    const run = runs.find((item: any) => item.session_id === session_id || item.run_id === run_id)
      ?? (success ? seed.post_patch_success_run : seed.baseline_failed_runs?.[0]);
    if (!run) return res.status(404).json({ error: 'golden run not found' });
    res.json(buildConversationResultFromFixture(run, seed.profiles));
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/demo/seed-golden-runs', async (req, res) => {
  try {
    const seed = loadGoldenSeed();
    const includeSuccess = Boolean(req.body?.includeSuccess);
    const runs = [...(seed.baseline_failed_runs || [])];
    if (includeSuccess && seed.post_patch_success_run) runs.push(seed.post_patch_success_run);
    const saved: string[] = [];

    for (const fixtureRun of runs) {
      const run = buildConversationResultFromFixture(fixtureRun, seed.profiles);
      if (!run.outcome.contained) {
        const transcript = run.turns.map((t) => `${t.speaker}: ${t.text}`).join('\n');
        (run as any).embedding = await generateEmbedding(transcript);
      }
      await saveRun(run);
      saved.push(run.session_id);
    }

    res.status(201).json({ status: 'success', saved_session_ids: saved });
  } catch (e: any) {
    console.error('Error seeding golden runs:', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ---------------------------------------------------------------------------
// Person 3 memory, persistence, and dream APIs
// ---------------------------------------------------------------------------

app.post('/api/runs', async (req: Request, res: Response) => {
  try {
    const run = req.body?.result ?? req.body;
    if (!run || !run.session_id) {
      res.status(400).json({ error: 'Missing run data or session_id' });
      return;
    }

    const isFailed = run.outcome?.contained === false || run.outcome?.resolved === false || run.outcome?.escalated === true;
    if (isFailed && !run.embedding) {
      const transcriptText = (run.turns || [])
        .map((t: any) => `${t.speaker}: ${t.text}`)
        .join('\n');
      if (transcriptText) {
        try {
          run.embedding = await generateEmbedding(transcriptText);
        } catch (embErr) {
          console.error('Error generating embedding for run:', embErr);
        }
      }
    }

    await saveRun(run);
    res.status(201).json({ status: 'success', session_id: run.session_id });
  } catch (e: any) {
    console.error('Error saving run:', e);
    res.status(500).json({ error: e.message || e });
  }
});

app.post('/api/conversation-results', async (req, res) => {
  req.url = '/api/runs';
  return app._router.handle(req, res);
});

app.get('/api/profiles/:profile_id', async (req: Request, res: Response) => {
  try {
    const profile = await getProfile(req.params.profile_id);
    if (!profile) return res.status(404).json({ error: `Profile ${req.params.profile_id} not found` });
    res.json(profile);
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const profileId = String(req.query.profile_id ?? 'prof_maya_001');
    const profile = await getProfile(profileId);
    if (!profile) return res.status(404).json({ error: `Profile ${profileId} not found` });
    res.json(profile);
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/profiles/:profile_id/memory', async (req: Request, res: Response) => {
  try {
    const memoryData = await getProfileMemory(req.params.profile_id);
    if (!memoryData) return res.status(404).json({ error: `Memory for profile ${req.params.profile_id} not found` });
    res.json(memoryData);
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/memory', async (req, res) => {
  try {
    const profileId = String(req.query.profile_id ?? 'prof_maya_001');
    const memoryData = await getProfileMemory(profileId);
    if (!memoryData) return res.status(404).json({ error: `Memory for profile ${profileId} not found` });
    res.json(memoryData);
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/profiles/:profile_id/runs', async (req: Request, res: Response) => {
  try {
    res.json(await listRuns(req.params.profile_id));
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/runs/similar-failures', async (req: Request, res: Response) => {
  try {
    const queryText = req.query.text as string;
    const limit = parseInt(req.query.limit as string || '3', 10);
    if (!queryText) return res.status(400).json({ error: 'Missing query parameter "text"' });
    const embedding = await generateEmbedding(queryText);
    res.json(await findSimilarFailedRuns(embedding, limit));
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/runs/:session_id', async (req, res) => {
  try {
    const run = await getRun(req.params.session_id);
    if (!run) return res.status(404).json({ error: `Run ${req.params.session_id} not found` });
    res.json(run);
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/profiles/:profile_id/scenarios/:scenario/dream-input', async (req: Request, res: Response) => {
  try {
    const { profile_id, scenario } = req.params;
    const dreamInput = await getDreamInput(profile_id, scenario);
    if (!dreamInput) return res.status(404).json({ error: `No dream input found for profile ${profile_id} and scenario ${scenario}` });
    res.json(dreamInput);
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.post('/api/dream-patches', async (req: Request, res: Response) => {
  try {
    const patchId = await saveDreamPatch(req.body);
    res.status(201).json({ status: 'success', patch_id: patchId });
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.post('/api/policy-versions/:policy_version_id/promote', async (req: Request, res: Response) => {
  try {
    await promotePolicyVersion(req.params.policy_version_id);
    res.json({ status: 'success', promoted_version_id: req.params.policy_version_id });
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.post('/api/dream-pass', async (_req: Request, res: Response) => {
  try {
    const clusters = await runDreamPass();
    res.json({ status: 'success', clusters });
  } catch (e: any) {
    console.error('Error running dream pass:', e);
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/dream-patches', async (_req: Request, res: Response) => {
  try {
    res.json(await listDreamPatches());
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.post('/api/dream-patches/:patch_id/approve', async (req: Request, res: Response) => {
  try {
    const patchId = parseInt(req.params.patch_id, 10);
    await approveDreamPatch(patchId);
    res.json({ status: 'success', approved_patch_id: patchId });
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/dream-clusters', async (req: Request, res: Response) => {
  try {
    res.json(await listDreamClusters(req.query.status as string));
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/playbook-patches', async (req, res) => {
  try {
    res.json(await listDreamClusters(req.query.status as string));
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.post('/api/dream-clusters/approve', async (req: Request, res: Response) => {
  try {
    const key = req.body?.key ?? req.body?.cluster_key;
    if (!key) return res.status(400).json({ error: 'Missing parameter "key" in request body' });
    await approveDreamCluster(key);
    res.json({ status: 'success', approved_cluster_key: key });
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.post('/api/playbook-patches/:key/approve', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    await approveDreamCluster(key);
    res.json({ status: 'success', approved_cluster_key: key });
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

app.get('/api/playbooks', async (_req: Request, res: Response) => {
  try {
    res.json(await listActivePlaybooks());
  } catch (e: any) {
    res.status(500).json({ error: e.message || e });
  }
});

// ---------------------------------------------------------------------------
// WebSocket routes
// ---------------------------------------------------------------------------

const server = createServer(app);
const liveWss = new WebSocketServer({ noServer: true });
const branchWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/api/live') {
    liveWss.handleUpgrade(req, socket, head, (ws) => liveWss.emit('connection', ws, req));
    return;
  }
  if (req.url === '/api/branch') {
    branchWss.handleUpgrade(req, socket, head, (ws) => branchWss.emit('connection', ws, req));
    return;
  }
  socket.destroy();
});

liveWss.on('connection', (clientWs) => attachGeminiLive(clientWs));

branchWss.on('connection', (client) => {
  client.on('message', async (data) => {
    let req: any;
    try { req = JSON.parse(data.toString()); } catch { return; }
    try {
      const result = await generateBranches(req.englishTranscript ?? '', req.ctx ?? {}, req.gen ?? {});
      let i = 0;
      for (const candidate of result.candidates) {
        if (client.readyState !== client.OPEN) return;
        client.send(JSON.stringify({ type: 'candidate', candidate, id: `c${i++}` }));
        await sleep(250);
      }
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({
          type: 'champion',
          championStrategy: result.championStrategy,
          agentResponse: result.agentResponse
        }));
      }
    } catch (e: any) {
      if (client.readyState === client.OPEN) client.send(JSON.stringify({ type: 'error', message: e.message || String(e) }));
    } finally {
      if (client.readyState === client.OPEN) client.send(JSON.stringify({ type: 'done' }));
    }
  });
});

const PORT = parseInt(process.env.PORT || '8000', 10);
server.listen(PORT, '127.0.0.1', () => {
  console.log(`CX_lab Dojo API server is running on http://127.0.0.1:${PORT}`);
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadGoldenSeed(): any {
  const file = findRepoFile(path.join('data', 'fixtures', 'golden_demo_seed.json'));
  if (!file) throw new Error('data/fixtures/golden_demo_seed.json not found');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function findRepoFile(relativePath: string): string | null {
  let currentDir = process.cwd();
  while (currentDir) {
    const candidate = path.join(currentDir, relativePath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
  return null;
}
