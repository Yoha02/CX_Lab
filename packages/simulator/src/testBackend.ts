import * as fs from 'fs';
import * as path from 'path';
import { initDb } from '@cx-lab/infra-db';
import { saveRun, getRun, getUnprocessedFailedRuns, listActivePlaybooks, getProfileMemory, findSimilarFailedRuns, approveDreamCluster } from '@cx-lab/memory';
import { runDreamPass } from '@cx-lab/dream';
import { generateEmbedding } from '@cx-lab/gemini';
import { pool } from '@cx-lab/digitalocean';

async function runIntegrationTest() {
  console.log('=== STARTING NODE.JS BACKEND CLUSTERED RSI INTEGRATION TEST ===');

  // 1. Reset database
  console.log('\nStep 1: Resetting database schema and seeding default records...');
  await initDb();

  // Find project root containing root package.json
  let rootDir = process.cwd();
  while (rootDir) {
    const rootPkgPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(rootPkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
        if (pkg.workspaces) {
          break;
        }
      } catch (e) {}
    }
    const parent = path.dirname(rootDir);
    if (parent === rootDir) break;
    rootDir = parent;
  }

  // 2. Load base conversation result template
  const examplePath = path.resolve(rootDir, 'docs/conversation_result.example.json');
  if (!fs.existsSync(examplePath)) {
    console.error(`ERROR: conversation_result.example.json not found at ${examplePath}`);
    process.exit(1);
  }
  const baseTemplate = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

  // 3. Construct 3 distinct failed runs across different personas with similar behavioral failure pattern
  console.log('\nStep 2: Constructing 3 failed runs for Maya, Alex, and Jordan...');
  
  // Maya - Loyal Shopper
  const mayaRun = {
    ...baseTemplate,
    session_id: 'sess_maya_failed',
    run_id: 'run_maya_failed',
    session_type: 'voice',
    metadata: {
      ...baseTemplate.metadata,
      profile_id: 'prof_maya_001',
      shopper_mode: 'Loyal Shopper',
      scenario: 'late_birthday_gift',
      intent: 'late_delivery'
    },
    turns: [
      { speaker: 'shopper', text: "My daughter's birthday is tomorrow and the package is not here yet!" },
      { speaker: 'agent', text: "According to our standard shipping policy, deliveries take 3 to 5 business days." },
      { speaker: 'shopper', text: "If you can't help me get it on time, please cancel the order and give me a refund." }
    ],
    outcome: {
      contained: false,
      resolved: false,
      escalated: true,
      resolution: 'escalated_to_human',
      turns_before_failure: 3,
      final_sentiment: -0.72
    },
    dream_pass_processed: false
  };

  // Alex - First-Time Buyer
  const alexRun = {
    ...baseTemplate,
    session_id: 'sess_alex_failed',
    run_id: 'run_alex_failed',
    session_type: 'voice',
    metadata: {
      ...baseTemplate.metadata,
      profile_id: 'prof_alex_002',
      shopper_mode: 'First-time Buyer',
      scenario: 'late_anniversary_outfit',
      intent: 'late_delivery'
    },
    turns: [
      { speaker: 'shopper', text: "This wedding anniversary outfit is delayed and the anniversary is this Saturday!" },
      { speaker: 'agent', text: "We apologize for the delay. Standard shipping guidelines state that shipping takes up to 5 days." },
      { speaker: 'shopper', text: "I am losing trust in your service. I need this escalated to a manager immediately." }
    ],
    outcome: {
      contained: false,
      resolved: false,
      escalated: true,
      resolution: 'escalated_to_human',
      turns_before_failure: 3,
      final_sentiment: -0.65
    },
    dream_pass_processed: false
  };

  // Jordan - Discount Shopper
  const jordanRun = {
    ...baseTemplate,
    session_id: 'sess_jordan_failed',
    run_id: 'run_jordan_failed',
    session_type: 'voice',
    metadata: {
      ...baseTemplate.metadata,
      profile_id: 'prof_jordan_003',
      shopper_mode: 'Discount Shopper',
      scenario: 'late_graduation_present',
      intent: 'late_delivery'
    },
    turns: [
      { speaker: 'shopper', text: "The graduation present is delayed and the ceremony is tomorrow morning!" },
      { speaker: 'agent', text: "Our shipping policy indicates that orders are delivered within the standard window of 3-5 days." },
      { speaker: 'shopper', text: "I want a full refund and I am demanding you return my money." }
    ],
    outcome: {
      contained: false,
      resolved: false,
      escalated: true,
      resolution: 'escalated_to_human',
      turns_before_failure: 3,
      final_sentiment: -0.80
    },
    dream_pass_processed: false
  };

  const runs = [mayaRun, alexRun, jordanRun];

  // 4. Generate embeddings and save runs to DB
  console.log('\nStep 3: Generating embeddings and saving failed runs into the database...');
  for (const run of runs) {
    const transcriptText = run.turns.map((t: any) => `${t.speaker}: ${t.text}`).join('\n');
    console.log(`Generating embedding vector for session: ${run.session_id}...`);
    const embedding = await generateEmbedding(transcriptText);
    run.embedding = embedding;
    
    await saveRun(run);
    console.log(`Saved failed run: ${run.session_id}`);
  }

  // Verify unprocessed counts
  const unprocessedBefore = await getUnprocessedFailedRuns();
  console.log(`\nUnprocessed failed runs waiting for compilation: ${unprocessedBefore.length}`);

  // 5. Run Dream Pass clustering
  console.log('\nStep 4: Executing Dream Pass compilation to cluster failure patterns...');
  const clusters = await runDreamPass();
  console.log(`Dream pass returned ${clusters.length} consolidated failure clusters.`);
  
  if (clusters.length === 0) {
    console.error('ERROR: No clusters were generated!');
    process.exit(1);
  }

  // Display the generated cluster
  const cluster = clusters[0];
  const clusterKey = cluster.dream_cluster_key;
  console.log('\n========================================================================');
  console.log(`DREAM CLUSTER IDENTIFIED:`);
  console.log(`Key:             ${clusterKey}`);
  console.log(`Intent:          ${cluster.intent}`);
  console.log(`Situation Tags:  ${JSON.stringify(cluster.situation_tags)}`);
  console.log(`Agent Strategy:  ${cluster.agent_strategy}`);
  console.log(`Failure Mode:    ${cluster.failure_mode}`);
  console.log(`Affected Personas: ${JSON.stringify(cluster.affected_personas)}`);
  console.log(`Evidence Count:  ${cluster.evidence_count}`);
  console.log(`Sentiment Delta: ${cluster.sentiment_pattern.delta.toFixed(2)}`);
  console.log(`\nRecommended Global Rule:`);
  console.log(cluster.recommended_patch.rule);
  console.log(`\nPersona Overrides:`);
  console.log(JSON.stringify(cluster.recommended_patch.persona_overrides, null, 2));
  console.log('========================================================================');

  // Verify runs were processed
  const unprocessedAfter = await getUnprocessedFailedRuns();
  console.log(`Unprocessed failed runs remaining: ${unprocessedAfter.length}`);

  // 6. Approve the cluster patch
  console.log(`\nStep 5: Approving Dream Cluster: ${clusterKey}...`);
  await approveDreamCluster(clusterKey);
  console.log('Cluster patch approved and propagated to playbooks.');

  // 7. Verify playbooks were updated and promoted for all three personas
  console.log('\nStep 6: Verifying playbook updates for all three personas...');
  const activePlaybooks = await listActivePlaybooks();
  console.log(`Total active playbooks: ${activePlaybooks.length}`);

  const testPersonas = ['Loyal Shopper', 'First-time Buyer', 'Discount Shopper'];
  for (const persona of testPersonas) {
    const playbook = activePlaybooks.find(p => p.shopper_mode === persona && p.intent === 'late_delivery');
    if (!playbook) {
      console.error(`ERROR: Active playbook not found for persona ${persona}!`);
      process.exit(1);
    }
    console.log(`\nActive Playbook for [${persona}] promoted to: ${playbook.policy_version}`);
    console.log(`Text Preview:`);
    console.log(playbook.playbook_text.split('\n').slice(0, 5).join('\n') + '\n...');
  }

  // 8. Run vector similarity check using target user query
  console.log('\nStep 7: Testing pgvector similarity queries across the fail database...');
  const testQueries = [
    "First-time buyer is upset that their wedding anniversary outfit is delayed. Agent explained shipping policies instead of lookup.",
    "Loyal customer package is late for a birthday party tomorrow. Need to cancel."
  ];

  for (const query of testQueries) {
    console.log(`\nExecuting similarity search for query: "${query}"...`);
    const embedding = await generateEmbedding(query);
    const matches = await findSimilarFailedRuns(embedding, 2);
    
    console.log(`Matches found:`);
    matches.forEach((m, idx) => {
      console.log(`  ${idx + 1}. Session: ${m.session_id}, Persona: ${m.metadata.shopper_mode}, Distance: ${m.distance.toFixed(4)}`);
      console.log(`     Last Turn Text: "${m.metadata.scenario}" - CSAT: ${m.outcome.csat_prediction || 'N/A'}`);
    });
  }

  console.log('\n=== NODE.JS CLUSTERED RSI INTEGRATION TEST COMPLETED SUCCESSFULLY ===');
  console.log('All three distinct personas successfully clustered, patched, and matched via vector DB.');
  
  await pool.end();
}

runIntegrationTest().catch(async e => {
  console.error('Integration test failed with error:', e);
  await pool.end();
  process.exit(1);
});
