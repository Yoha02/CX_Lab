import { executeQuery, executeInsert } from '@cx-lab/digitalocean';

export async function saveRun(runData: any): Promise<void> {
  const query = `
    INSERT INTO conversation_runs (
      session_id, run_id, profile_id, session_type, metadata, 
      profile_snapshot, outcome, turns, evaluation, pruning_decision, 
      dream_input, dream_pass_processed, embedding
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (session_id) DO UPDATE SET
      run_id = EXCLUDED.run_id,
      profile_id = EXCLUDED.profile_id,
      session_type = EXCLUDED.session_type,
      metadata = EXCLUDED.metadata,
      profile_snapshot = EXCLUDED.profile_snapshot,
      outcome = EXCLUDED.outcome,
      turns = EXCLUDED.turns,
      evaluation = EXCLUDED.evaluation,
      pruning_decision = EXCLUDED.pruning_decision,
      dream_input = EXCLUDED.dream_input,
      dream_pass_processed = EXCLUDED.dream_pass_processed,
      embedding = EXCLUDED.embedding
  `;
  
  let profile_id = runData.metadata?.profile_id;
  if (!profile_id) {
    profile_id = runData.profile_snapshot?.profile_id;
  }

  const embeddingStr = runData.embedding 
    ? '[' + runData.embedding.join(',') + ']' 
    : null;
  
  await executeInsert(query, [
    runData.session_id,
    runData.run_id,
    profile_id,
    runData.session_type,
    JSON.stringify(runData.metadata || {}),
    JSON.stringify(runData.profile_snapshot || {}),
    JSON.stringify(runData.outcome || {}),
    JSON.stringify(runData.turns || []),
    JSON.stringify(runData.evaluation || {}),
    JSON.stringify(runData.pruning_decision || {}),
    JSON.stringify(runData.dream_input || {}),
    runData.dream_pass_processed ?? false,
    embeddingStr
  ]);
}

function deserializeRun(r: any): any {
  const jsonFields = ['metadata', 'profile_snapshot', 'outcome', 'turns', 'evaluation', 'pruning_decision', 'dream_input'];
  for (const field of jsonFields) {
    if (typeof r[field] === 'string') {
      r[field] = JSON.parse(r[field]);
    }
  }
  return r;
}

export async function getRun(sessionId: string): Promise<any | null> {
  const query = 'SELECT * FROM conversation_runs WHERE session_id = $1';
  const results = await executeQuery(query, [sessionId]);
  if (results.length > 0) {
    return deserializeRun(results[0]);
  }
  return null;
}

export async function listRuns(profileId?: string): Promise<any[]> {
  let query = 'SELECT * FROM conversation_runs ORDER BY created_at DESC';
  let params: any[] = [];
  if (profileId) {
    query = 'SELECT * FROM conversation_runs WHERE profile_id = $1 ORDER BY created_at DESC';
    params = [profileId];
  }
  const results = await executeQuery(query, params);
  return results.map(r => deserializeRun(r));
}

export async function getDreamInput(profileId: string, scenario: string): Promise<any | null> {
  const query = `
    SELECT dream_input, session_id FROM conversation_runs 
    WHERE profile_id = $1 AND (metadata->>'scenario' = $2 OR metadata->>'scenario' IS NULL)
    ORDER BY created_at DESC LIMIT 1
  `;
  const results = await executeQuery(query, [profileId, scenario]);
  if (results.length > 0) {
    const res = results[0];
    const dream_in = typeof res.dream_input === 'string' ? JSON.parse(res.dream_input) : res.dream_input;
    dream_in.session_id = res.session_id;
    return dream_in;
  }
  return null;
}

export async function getUnprocessedFailedRuns(): Promise<any[]> {
  const query = `
    SELECT * FROM conversation_runs 
    WHERE dream_pass_processed = FALSE 
    AND (outcome->>'contained')::boolean = FALSE
    ORDER BY created_at ASC
  `;
  const results = await executeQuery(query);
  return results.map(r => deserializeRun(r));
}

export async function markRunsProcessed(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(',');
  const query = `UPDATE conversation_runs SET dream_pass_processed = TRUE WHERE session_id IN (${placeholders})`;
  await executeInsert(query, sessionIds);
}

export async function findSimilarFailedRuns(embedding: number[], limit: number = 3): Promise<any[]> {
  const embStr = '[' + embedding.join(',') + ']';
  const query = `
    SELECT session_id, run_id, outcome, metadata, evaluation,
           embedding <=> $1::vector AS distance
    FROM conversation_runs
    WHERE (outcome->>'contained')::boolean = FALSE
    ORDER BY distance ASC
    LIMIT $2
  `;
  const results = await executeQuery(query, [embStr, limit]);
  return results.map(r => {
    if (typeof r.outcome === 'string') r.outcome = JSON.parse(r.outcome);
    if (typeof r.metadata === 'string') r.metadata = JSON.parse(r.metadata);
    if (typeof r.evaluation === 'string') r.evaluation = JSON.parse(r.evaluation);
    return r;
  });
}
