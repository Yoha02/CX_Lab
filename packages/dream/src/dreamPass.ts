import { getUnprocessedFailedRuns, saveDreamPatch, markRunsProcessed, getDreamCluster, saveDreamCluster } from '@cx-lab/memory';
import { generateContent } from '@cx-lab/gemini';

// Extracted features interface
interface RunFeatures {
  intent: string;
  situation_tags: string[];
  agent_strategy: string;
  failure_mode: string;
  persona: string;
  sentiment: {
    before_agent_response: number;
    after_agent_response: number;
    delta: number;
  };
}

function normalizeFeatures(features: RunFeatures, run: any, transcriptText: string): RunFeatures {
  const tags = new Set((features.situation_tags || []).map((tag) => String(tag).trim()).filter(Boolean));
  const scenario = String(run.metadata?.scenario || '').toLowerCase();
  const transcript = transcriptText.toLowerCase();
  const hasEventDeadline =
    tags.has('urgent_event_deadline') ||
    /birthday|anniversary|graduation|party|tomorrow|deadline/.test(`${scenario} ${transcript}`);

  if ((features.intent || run.metadata?.intent) === 'late_delivery' && hasEventDeadline) {
    tags.add('urgent_event_deadline');
    tags.add('gift_order');
  }

  return {
    ...features,
    intent: features.intent || run.metadata?.intent || 'late_delivery',
    situation_tags: [...tags],
    agent_strategy: features.agent_strategy || 'policy_first_shipping_explanation',
    failure_mode: features.failure_mode || 'escalation_or_refund_threat'
  };
}

export async function runDreamPass(): Promise<any[]> {
  const failedRuns = await getUnprocessedFailedRuns();
  if (failedRuns.length === 0) {
    console.log('No unprocessed failed runs found for dreaming.');
    return [];
  }

  console.log(`Dreaming and clustering over ${failedRuns.length} failed runs...`);

  // Map to hold unique clusters in their final state at the end of the run
  const finalClustersMap = new Map<string, any>();

  // Group failed runs in-memory by extracting their behavioral patterns
  for (const run of failedRuns) {
    const transcriptText = (run.turns || [])
      .map((t: any) => `${t.speaker || 'unknown'}: ${t.text || ''}`)
      .join('\n');

    console.log(`Extracting behavioral patterns for session ${run.session_id}...`);
    
    // Prompt Gemini to extract behavioral features
    const extractPrompt = `
      You are an expert retail conversational analyst. Analyze this failed customer support call and extract its behavioral classification features.
      
      Transcript:
      ${transcriptText}
      
      Provide your output as a single JSON object matching this schema:
      {
        "intent": "late_delivery" | "refund_status" | "other",
        "situation_tags": ["urgent_event_deadline", "gift_order", "prior_unresolved_ticket"],
        "agent_strategy": "policy_first_shipping_explanation" | "avoiding_refund_policy" | "unknown",
        "failure_mode": "escalation_or_refund_threat" | "shopper_dropoff",
        "persona": "loyal_shopper" | "first_time_buyer" | "discount_shopper",
        "sentiment": {
          "before_agent_response": number,
          "after_agent_response": number,
          "delta": number
        }
      }
    `;

    let features: RunFeatures;
    try {
      const resp = await generateContent(extractPrompt, { jsonMode: true });
      features = JSON.parse(resp);
      
      // Validate features structure
      if (!features.situation_tags || !Array.isArray(features.situation_tags) || !features.intent) {
        throw new Error('Invalid feature extraction output format');
      }
    } catch (e) {
      console.warn('Failed to extract features via Gemini API or parse error, using structured fallback.');
      // Extract persona from run metadata
      let persona = 'loyal_shopper';
      const shopperMode = run.metadata?.shopper_mode || run.profile_snapshot?.shopper_mode || '';
      if (shopperMode.toLowerCase().includes('first')) {
        persona = 'first_time_buyer';
      } else if (shopperMode.toLowerCase().includes('discount')) {
        persona = 'discount_shopper';
      }

      features = {
        intent: run.metadata?.intent || 'late_delivery',
        situation_tags: ['urgent_event_deadline', 'gift_order'],
        agent_strategy: 'policy_first_shipping_explanation',
        failure_mode: 'escalation_or_refund_threat',
        persona,
        sentiment: {
          before_agent_response: -0.15,
          after_agent_response: -0.72,
          delta: -0.57
        }
      };
    }

    features = normalizeFeatures(features, run, transcriptText);

    // Build dream cluster key
    const sortedTags = [...features.situation_tags].sort().join(',');
    const dreamClusterKey = `${features.intent}:${sortedTags}:${features.agent_strategy}:${features.failure_mode}`;
    console.log(`Generated dream cluster key: ${dreamClusterKey}`);

    // Check map first to see if it was modified in this pass, otherwise query DB
    let cluster = finalClustersMap.get(dreamClusterKey);
    if (!cluster) {
      cluster = await getDreamCluster(dreamClusterKey);
    }

    if (cluster) {
      console.log(`Cluster ${dreamClusterKey} already exists. Merging evidence...`);
      // Update cluster parameters
      const evidenceSessionIds = [...new Set([...cluster.evidence_session_ids, run.session_id])];
      const affectedPersonas = [...new Set([...cluster.affected_personas, features.persona])];
      const evidenceCount = evidenceSessionIds.length;

      // Recalculate average sentiments
      const prevCount = cluster.evidence_count;
      const avgBefore = (cluster.sentiment_pattern.before_agent_response * prevCount + features.sentiment.before_agent_response) / (prevCount + 1);
      const avgAfter = (cluster.sentiment_pattern.after_agent_response * prevCount + features.sentiment.after_agent_response) / (prevCount + 1);
      const avgDelta = avgAfter - avgBefore;

      cluster.evidence_session_ids = evidenceSessionIds;
      cluster.affected_personas = affectedPersonas;
      cluster.evidence_count = evidenceCount;
      cluster.sentiment_pattern = {
        before_agent_response: avgBefore,
        after_agent_response: avgAfter,
        delta: avgDelta
      };

      await saveDreamCluster(cluster);
      finalClustersMap.set(dreamClusterKey, cluster);
    } else {
      console.log(`Creating new cluster ${dreamClusterKey}...`);
      // Generate a fresh patch for this new failure pattern
      const patchPrompt = `
        You are compiling a Playbook Patch for a recursive self-improvement agent loop.
        We have a new conversational failure cluster with the following properties:
        Cluster Key: ${dreamClusterKey}
        Intent: ${features.intent}
        Situation Tags: ${features.situation_tags.join(', ')}
        Agent Strategy: ${features.agent_strategy}
        Failure Mode: ${features.failure_mode}
        
        Session Transcript:
        ${transcriptText}

        Propose a single consolidated playbook patch to prevent this failure pattern across different personas.
        Provide your output as a single JSON object matching this schema:
        {
          "scope": "intent_playbook_patch",
          "rule": "Markdown string explaining the core guidelines to follow (e.g. check inventory before reading shipping policy).",
          "tool_priority": ["order_lookup", "local_inventory", "replacement_shipping_options"],
          "avoid": ["standard_shipping_policy_first"],
          "persona_overrides": {
            "loyal_shopper": "Persona-specific overrides for Loyal Shoppers (e.g. emphasize relationship recovery and refund fallback).",
            "first_time_buyer": "Persona-specific overrides for First-time Buyers (e.g. build trust and give clear confirmation).",
            "discount_shopper": "Persona-specific overrides for Discount Shoppers (e.g. emphasize replacement value or price protection)."
          }
        }
      `;

      let recommendedPatch: any;
      try {
        const patchResp = await generateContent(patchPrompt, { jsonMode: true });
        recommendedPatch = JSON.parse(patchResp);
        if (!recommendedPatch.rule || !recommendedPatch.persona_overrides) {
          throw new Error('Invalid patch format');
        }
      } catch (e) {
        console.warn('Failed to compile cluster patch via Gemini or parse error, using structured fallback.');
        recommendedPatch = {
          scope: 'intent_playbook_patch',
          rule: 'For late delivery with urgent event deadline, check inventory before explaining shipping policy.',
          tool_priority: ['order_lookup', 'local_inventory', 'replacement_shipping_options'],
          avoid: ['standard_shipping_policy_first'],
          persona_overrides: {
            loyal_shopper: 'Mention relationship recovery and refund fallback.',
            first_time_buyer: 'Build trust with clear status and confirmation.',
            discount_shopper: 'Preserve value with replacement or store-credit fallback.'
          }
        };
      }

      const newCluster = {
        dream_cluster_key: dreamClusterKey,
        intent: features.intent,
        situation_tags: features.situation_tags,
        agent_strategy: features.agent_strategy,
        failure_mode: features.failure_mode,
        affected_personas: [features.persona],
        evidence_count: 1,
        sentiment_pattern: features.sentiment,
        recommended_patch: recommendedPatch,
        evidence_session_ids: [run.session_id],
        status: 'pending'
      };

      await saveDreamCluster(newCluster);
      finalClustersMap.set(dreamClusterKey, newCluster);
    }
  }

  // Mark all unprocessed runs as processed
  const sessionIds = failedRuns.map(r => r.session_id);
  await markRunsProcessed(sessionIds);

  console.log(`Dream pass processed successfully. Grouped failed runs into ${finalClustersMap.size} clusters.`);
  return Array.from(finalClustersMap.values());
}
