import { executeQuery, executeInsert } from '@cx-lab/digitalocean';

export async function getPlaybook(shopperMode: string, intent: string, policyVersion: string): Promise<any | null> {
  const query = `
    SELECT * FROM playbooks 
    WHERE shopper_mode = $1 AND intent = $2 AND policy_version = $3
  `;
  const results = await executeQuery(query, [shopperMode, intent, policyVersion]);
  if (results.length > 0) {
    return results[0];
  }
  return null;
}

export async function savePlaybook(
  shopperMode: string,
  intent: string,
  policyVersion: string,
  playbookText: string,
  isActive: boolean = true
): Promise<void> {
  // Ensure version exists
  const ensureVersionQuery = `
    INSERT INTO policy_versions (policy_version_id, name, is_promoted)
    VALUES ($1, $2, FALSE)
    ON CONFLICT (policy_version_id) DO NOTHING
  `;
  await executeInsert(ensureVersionQuery, [policyVersion, `Version ${policyVersion}`]);

  const query = `
    INSERT INTO playbooks (shopper_mode, intent, policy_version, playbook_text, is_active)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (shopper_mode, intent, policy_version) DO UPDATE SET
      playbook_text = EXCLUDED.playbook_text,
      is_active = EXCLUDED.is_active
  `;
  await executeInsert(query, [shopperMode, intent, policyVersion, playbookText, isActive]);
}

export async function promotePolicyVersion(policyVersionId: string): Promise<void> {
  await executeInsert('UPDATE policy_versions SET is_promoted = FALSE');
  await executeInsert('UPDATE policy_versions SET is_promoted = TRUE WHERE policy_version_id = $1', [policyVersionId]);
}

export async function listActivePlaybooks(): Promise<any[]> {
  const query = `
    SELECT p.* FROM playbooks p
    JOIN policy_versions pv ON p.policy_version = pv.policy_version_id
    WHERE p.is_active = TRUE AND pv.is_promoted = TRUE
  `;
  return executeQuery(query);
}

export async function saveDreamPatch(patchData: any): Promise<number> {
  const query = `
    INSERT INTO dream_patches (
      profile_id, scenario, proposed_policy_version, evidence_session_ids, 
      proposed_memory_patch, proposed_prediction_prior_update, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING patch_id
  `;
  const patchId = await executeInsert(query, [
    patchData.profile_id,
    patchData.scenario,
    patchData.proposed_policy_version,
    patchData.evidence_session_ids,
    JSON.stringify(patchData.proposed_memory_patch),
    JSON.stringify(patchData.proposed_prediction_prior_update),
    patchData.status || 'pending'
  ]);
  return patchId;
}

export async function getDreamPatch(patchId: number): Promise<any | null> {
  const query = 'SELECT * FROM dream_patches WHERE patch_id = $1';
  const results = await executeQuery(query, [patchId]);
  if (results.length > 0) {
    const res = results[0];
    for (const field of ['proposed_memory_patch', 'proposed_prediction_prior_update']) {
      if (typeof res[field] === 'string') {
        res[field] = JSON.parse(res[field]);
      }
    }
    return res;
  }
  return null;
}

export async function listDreamPatches(): Promise<any[]> {
  const query = 'SELECT * FROM dream_patches ORDER BY created_at DESC';
  const results = await executeQuery(query);
  for (const res of results) {
    for (const field of ['proposed_memory_patch', 'proposed_prediction_prior_update']) {
      if (typeof res[field] === 'string') {
        res[field] = JSON.parse(res[field]);
      }
    }
  }
  return results;
}

export async function approveDreamPatch(patchId: number): Promise<void> {
  const patch = await getDreamPatch(patchId);
  if (!patch) {
    throw new Error(`Dream patch ${patchId} not found`);
  }

  const queryStatus = `
    UPDATE dream_patches 
    SET status = 'approved', approved_at = $1 
    WHERE patch_id = $2
  `;
  await executeInsert(queryStatus, [new Date(), patchId]);

  const proposedVersion = patch.proposed_policy_version;
  const memPatch = patch.proposed_memory_patch;
  const target = memPatch.target || '';
  const candidateText = memPatch.candidate_text || '';

  let shopperMode = 'Loyal Shopper';
  let intent = 'late_delivery';

  if (target.toLowerCase().includes('loyal_shopper') || target.toLowerCase().includes('vip_busy_parent')) {
    shopperMode = 'Loyal Shopper';
  }
  if (target.toLowerCase().includes('late_delivery')) {
    intent = 'late_delivery';
  } else if (target.toLowerCase().includes('refund_status')) {
    intent = 'refund_status';
  }

  // Ensure proposed version exists
  const ensureVersionQuery = `
    INSERT INTO policy_versions (policy_version_id, name, is_promoted)
    VALUES ($1, $2, FALSE)
    ON CONFLICT (policy_version_id) DO NOTHING
  `;
  await executeInsert(ensureVersionQuery, [proposedVersion, `Dream Promoted ${proposedVersion}`]);

  // Save playbook with updated text
  await savePlaybook(shopperMode, intent, proposedVersion, candidateText, true);

  // Promote
  await promotePolicyVersion(proposedVersion);

  // Append new preference to profile memory
  const profileId = patch.profile_id;
  const queryPref = 'SELECT learned_preferences_before_call FROM profiles WHERE profile_id = $1';
  const resPref = await executeQuery(queryPref, [profileId]);
  if (resPref.length > 0) {
    const currentPrefs = resPref[0].learned_preferences_before_call || [];
    const newPref = `Playbook updated to: ${memPatch.candidate_text.substring(0, 100)}...`;
    if (!currentPrefs.includes(newPref)) {
      currentPrefs.push(newPref);
      const queryUpdatePref = 'UPDATE profiles SET learned_preferences_before_call = $1 WHERE profile_id = $2';
      await executeInsert(queryUpdatePref, [currentPrefs, profileId]);
    }
  }
}

// === Recursive Self-Improvement (RSI) Dream Clusters ===

export async function saveDreamCluster(cluster: any): Promise<void> {
  const query = `
    INSERT INTO dream_clusters (
      dream_cluster_key, intent, situation_tags, agent_strategy, 
      failure_mode, affected_personas, evidence_count, sentiment_pattern, 
      recommended_patch, evidence_session_ids, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (dream_cluster_key) DO UPDATE SET
      intent = EXCLUDED.intent,
      situation_tags = EXCLUDED.situation_tags,
      agent_strategy = EXCLUDED.agent_strategy,
      failure_mode = EXCLUDED.failure_mode,
      affected_personas = EXCLUDED.affected_personas,
      evidence_count = EXCLUDED.evidence_count,
      sentiment_pattern = EXCLUDED.sentiment_pattern,
      recommended_patch = EXCLUDED.recommended_patch,
      evidence_session_ids = EXCLUDED.evidence_session_ids,
      status = EXCLUDED.status
  `;
  
  await executeInsert(query, [
    cluster.dream_cluster_key,
    cluster.intent,
    cluster.situation_tags,
    cluster.agent_strategy,
    cluster.failure_mode,
    cluster.affected_personas,
    cluster.evidence_count || 1,
    JSON.stringify(cluster.sentiment_pattern || {}),
    JSON.stringify(cluster.recommended_patch || {}),
    cluster.evidence_session_ids || [],
    cluster.status || 'pending'
  ]);
}

export async function getDreamCluster(key: string): Promise<any | null> {
  const query = 'SELECT * FROM dream_clusters WHERE dream_cluster_key = $1';
  const results = await executeQuery(query, [key]);
  if (results.length > 0) {
    const res = results[0];
    for (const field of ['sentiment_pattern', 'recommended_patch']) {
      if (typeof res[field] === 'string') {
        res[field] = JSON.parse(res[field]);
      }
    }
    return res;
  }
  return null;
}

export async function listDreamClusters(status?: string): Promise<any[]> {
  let query = 'SELECT * FROM dream_clusters ORDER BY created_at DESC';
  let params: any[] = [];
  if (status) {
    query = 'SELECT * FROM dream_clusters WHERE status = $1 ORDER BY created_at DESC';
    params = [status];
  }
  const results = await executeQuery(query, params);
  for (const res of results) {
    for (const field of ['sentiment_pattern', 'recommended_patch']) {
      if (typeof res[field] === 'string') {
        res[field] = JSON.parse(res[field]);
      }
    }
  }
  return results;
}

function formatPersonaTitle(persona: string): string {
  const mapping: { [key: string]: string } = {
    'loyal_shopper': 'Loyal Shopper',
    'first_time_buyer': 'First-time Buyer',
    'discount_shopper': 'Discount Shopper'
  };
  return mapping[persona] || persona.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function approveDreamCluster(key: string): Promise<void> {
  const cluster = await getDreamCluster(key);
  if (!cluster) {
    throw new Error(`Dream cluster ${key} not found`);
  }

  // Update status to approved
  const queryStatus = `
    UPDATE dream_clusters 
    SET status = 'approved' 
    WHERE dream_cluster_key = $1
  `;
  await executeInsert(queryStatus, [key]);

  const proposedVersion = `policy_${cluster.intent}_gen3`;
  const patch = cluster.recommended_patch;

  // Propagate to all affected personas
  for (const persona of cluster.affected_personas) {
    const personaTitleCase = formatPersonaTitle(persona);
    const personaOverride = patch.persona_overrides?.[persona] || '';

    const playbookText = `# ${personaTitleCase} - Late Delivery Playbook (Gen 3 - Consolidated Patch)

## Core Policy Guidelines:
${patch.rule}

## Tool Priority Guidelines:
We recommend using tools in the following order:
${(patch.tool_priority || []).map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

## Behaviors to Avoid:
- ${(patch.avoid || []).join('\n- ')}

## Persona-Specific Instructions:
${personaOverride}`;

    await savePlaybook(personaTitleCase, cluster.intent, proposedVersion, playbookText, true);
  }

  // Promote version
  await promotePolicyVersion(proposedVersion);

  // Mark all contributing evidence runs as processed
  if (cluster.evidence_session_ids && cluster.evidence_session_ids.length > 0) {
    const placeholders = cluster.evidence_session_ids.map((_: any, i: number) => `$${i + 1}`).join(',');
    const queryUpdateRuns = `UPDATE conversation_runs SET dream_pass_processed = TRUE WHERE session_id IN (${placeholders})`;
    await executeInsert(queryUpdateRuns, cluster.evidence_session_ids);

    // Update profile learned preferences for profiles in those runs
    for (const sessionId of cluster.evidence_session_ids) {
      const runQuery = 'SELECT profile_id FROM conversation_runs WHERE session_id = $1';
      const runRes = await executeQuery(runQuery, [sessionId]);
      if (runRes.length > 0) {
        const profileId = runRes[0].profile_id;
        const queryPref = 'SELECT learned_preferences_before_call FROM profiles WHERE profile_id = $1';
        const resPref = await executeQuery(queryPref, [profileId]);
        if (resPref.length > 0) {
          const currentPrefs = resPref[0].learned_preferences_before_call || [];
          const newPref = `Applied Consolidated Policy Patch (${proposedVersion}) for: ${patch.rule.substring(0, 100)}...`;
          if (!currentPrefs.includes(newPref)) {
            currentPrefs.push(newPref);
            const queryUpdatePref = 'UPDATE profiles SET learned_preferences_before_call = $1 WHERE profile_id = $2';
            await executeInsert(queryUpdatePref, [currentPrefs, profileId]);
          }
        }
      }
    }
  }
}
