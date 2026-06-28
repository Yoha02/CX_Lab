import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Import packages from workspace
import { saveRun, getRun, listRuns, getDreamInput, getProfile, getProfileMemory, saveDreamPatch, promotePolicyVersion, listActivePlaybooks, listDreamPatches, approveDreamPatch, findSimilarFailedRuns, saveDreamCluster, getDreamCluster, listDreamClusters, approveDreamCluster } from '@cx-lab/memory';
import { runDreamPass } from '@cx-lab/dream';
import { generateEmbedding } from '@cx-lab/gemini';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Save ConversationResult
app.post('/api/runs', async (req: Request, res: Response) => {
  try {
    const run = req.body;
    if (!run || !run.session_id) {
      res.status(400).json({ error: 'Missing run data or session_id' });
      return;
    }
    
    // Automatically vectorize run if it is failed (escalated or not contained)
    const isFailed = run.outcome?.contained === false || run.outcome?.resolved === false || run.outcome?.escalated === true;
    if (isFailed && !run.embedding) {
      const transcriptText = (run.turns || [])
        .map((t: any) => `${t.speaker}: ${t.text}`)
        .join('\n');
        
      if (transcriptText) {
        try {
          console.log(`Automatically generating embedding vector for failed run: ${run.session_id}...`);
          const embedding = await generateEmbedding(transcriptText);
          run.embedding = embedding;
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

// Get Profile
app.get('/api/profiles/:profile_id', async (req: Request, res: Response) => {
  try {
    const profileId = req.params.profile_id;
    const profile = await getProfile(profileId);
    if (!profile) {
      res.status(404).json({ error: `Profile ${profileId} not found` });
      return;
    }
    res.json(profile);
  } catch (e: any) {
    console.error('Error fetching profile:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Get Profile Memory
app.get('/api/profiles/:profile_id/memory', async (req: Request, res: Response) => {
  try {
    const profileId = req.params.profile_id;
    const memoryData = await getProfileMemory(profileId);
    if (!memoryData) {
      res.status(404).json({ error: `Memory for profile ${profileId} not found` });
      return;
    }
    res.json(memoryData);
  } catch (e: any) {
    console.error('Error fetching profile memory:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// List Runs
app.get('/api/profiles/:profile_id/runs', async (req: Request, res: Response) => {
  try {
    const profileId = req.params.profile_id;
    const runs = await listRuns(profileId);
    res.json(runs);
  } catch (e: any) {
    console.error('Error listing runs:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Get Dream Input
app.get('/api/profiles/:profile_id/scenarios/:scenario/dream-input', async (req: Request, res: Response) => {
  try {
    const { profile_id, scenario } = req.params;
    const dreamInput = await getDreamInput(profile_id, scenario);
    if (!dreamInput) {
      res.status(404).json({ error: `No dream input found for profile ${profile_id} and scenario ${scenario}` });
      return;
    }
    res.json(dreamInput);
  } catch (e: any) {
    console.error('Error fetching dream input:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Save Dream Patch
app.post('/api/dream-patches', async (req: Request, res: Response) => {
  try {
    const patch = req.body;
    const patchId = await saveDreamPatch(patch);
    res.status(201).json({ status: 'success', patch_id: patchId });
  } catch (e: any) {
    console.error('Error saving dream patch:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Promote Policy Version
app.post('/api/policy-versions/:policy_version_id/promote', async (req: Request, res: Response) => {
  try {
    const policyVersionId = req.params.policy_version_id;
    await promotePolicyVersion(policyVersionId);
    res.json({ status: 'success', promoted_version_id: policyVersionId });
  } catch (e: any) {
    console.error('Error promoting policy version:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Trigger Dream Pass (Clustered RSI learning)
app.post('/api/dream-pass', async (req: Request, res: Response) => {
  try {
    const clusters = await runDreamPass();
    res.json({ status: 'success', clusters });
  } catch (e: any) {
    console.error('Error running dream pass:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Get Dream Patches (Legacy)
app.get('/api/dream-patches', async (req: Request, res: Response) => {
  try {
    const patches = await listDreamPatches();
    res.json(patches);
  } catch (e: any) {
    console.error('Error fetching dream patches:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Approve Dream Patch (Legacy)
app.post('/api/dream-patches/:patch_id/approve', async (req: Request, res: Response) => {
  try {
    const patchId = parseInt(req.params.patch_id, 10);
    await approveDreamPatch(patchId);
    res.json({ status: 'success', approved_patch_id: patchId });
  } catch (e: any) {
    console.error('Error approving dream patch:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Get Dream Clusters (Behavioral learning)
app.get('/api/dream-clusters', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const clusters = await listDreamClusters(status);
    res.json(clusters);
  } catch (e: any) {
    console.error('Error listing dream clusters:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Approve Dream Cluster (Behavioral learning)
app.post('/api/dream-clusters/approve', async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    if (!key) {
      res.status(400).json({ error: 'Missing parameter "key" in request body' });
      return;
    }
    await approveDreamCluster(key);
    res.json({ status: 'success', approved_cluster_key: key });
  } catch (e: any) {
    console.error('Error approving dream cluster:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Get Active Playbooks
app.get('/api/playbooks', async (req: Request, res: Response) => {
  try {
    const playbooks = await listActivePlaybooks();
    res.json(playbooks);
  } catch (e: any) {
    console.error('Error fetching playbooks:', e);
    res.status(500).json({ error: e.message || e });
  }
});

// Search similar past failures (Recursive Self Intelligence - RSI)
app.get('/api/runs/similar-failures', async (req: Request, res: Response) => {
  try {
    const queryText = req.query.text as string;
    const limit = parseInt(req.query.limit as string || '3', 10);
    
    if (!queryText) {
      res.status(400).json({ error: 'Missing query parameter "text"' });
      return;
    }
    
    console.log(`Generating embedding for similarity query: "${queryText.substring(0, 50)}..."`);
    const embedding = await generateEmbedding(queryText);
    
    console.log('Searching vector DB for similar past containment failures...');
    const similarFailures = await findSimilarFailedRuns(embedding, limit);
    res.json(similarFailures);
  } catch (e: any) {
    console.error('Error searching similar failures:', e);
    res.status(500).json({ error: e.message || e });
  }
});

const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, '127.0.0.1', () => {
  console.log(`CX_lab Dojo API server is running on http://127.0.0.1:${PORT}`);
});
