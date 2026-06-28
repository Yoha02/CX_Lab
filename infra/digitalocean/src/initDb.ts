import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { executeQuery, pool } from '@cx-lab/digitalocean';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function initDb() {
  console.log('Loading database environment configurations...');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  // Find project root containing root package.json
  let rootDir = process.cwd();
  while (rootDir) {
    const rootPkgPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(rootPkgPath)) {
      // Check if it's the root package.json (private: true)
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

  console.log('Reading init_db.sql schema...');
  const schemaPath = path.resolve(rootDir, 'infra/digitalocean/init_db.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`ERROR: init_db.sql not found at ${schemaPath}`);
    process.exit(1);
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Connecting to DigitalOcean Postgres and executing SQL schema...');
  const client = await pool.connect();
  try {
    await client.query(schemaSql);
    console.log('Database schema created successfully.');
  } catch (e) {
    console.error('ERROR executing schema migrations:', e);
    client.release();
    process.exit(1);
  }

  console.log('Inserting seed records...');
  try {
    // 1. Insert Maya profile (Loyal Shopper)
    await client.query(`
      INSERT INTO profiles (
        profile_id, shopper_mode, badges, features, loyalty_tier, 
        ltv_bucket, family_size, recent_orders_90d, prior_tickets_90d, 
        risk_flags, learned_preferences_before_call
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (profile_id) DO UPDATE SET
        shopper_mode = EXCLUDED.shopper_mode,
        badges = EXCLUDED.badges,
        features = EXCLUDED.features,
        loyalty_tier = EXCLUDED.loyalty_tier,
        ltv_bucket = EXCLUDED.ltv_bucket,
        family_size = EXCLUDED.family_size,
        recent_orders_90d = EXCLUDED.recent_orders_90d,
        prior_tickets_90d = EXCLUDED.prior_tickets_90d,
        risk_flags = EXCLUDED.risk_flags,
        learned_preferences_before_call = EXCLUDED.learned_preferences_before_call
    `, [
      'prof_maya_001',
      'Loyal Shopper',
      ['Urgent', 'Gift Order', 'Prior Issue', 'High Value'],
      JSON.stringify({
        age_range: '35-44',
        region: 'CA',
        orders_last_90_days: 3,
        lifetime_value: 'high',
        prior_tickets: 2,
        current_issue: 'late_delivery'
      }),
      'gold',
      'high',
      4,
      3,
      2,
      ['late_delivery_sensitive', 'repeat_issue', 'gift_deadline'],
      ['values delivery certainty over discounts', 'gets frustrated by policy-first language']
    ]);
    console.log('Seeded profile: prof_maya_001 (Maya - Loyal Shopper)');

    // 2. Insert Alex profile (First-time Buyer)
    await client.query(`
      INSERT INTO profiles (
        profile_id, shopper_mode, badges, features, loyalty_tier, 
        ltv_bucket, family_size, recent_orders_90d, prior_tickets_90d, 
        risk_flags, learned_preferences_before_call
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (profile_id) DO UPDATE SET
        shopper_mode = EXCLUDED.shopper_mode,
        badges = EXCLUDED.badges,
        features = EXCLUDED.features,
        loyalty_tier = EXCLUDED.loyalty_tier,
        ltv_bucket = EXCLUDED.ltv_bucket,
        family_size = EXCLUDED.family_size,
        recent_orders_90d = EXCLUDED.recent_orders_90d,
        prior_tickets_90d = EXCLUDED.prior_tickets_90d,
        risk_flags = EXCLUDED.risk_flags,
        learned_preferences_before_call = EXCLUDED.learned_preferences_before_call
    `, [
      'prof_alex_002',
      'First-time Buyer',
      ['New Customer', 'High Risk'],
      JSON.stringify({
        age_range: '25-34',
        region: 'NY',
        orders_last_90_days: 1,
        lifetime_value: 'low',
        prior_tickets: 0,
        current_issue: 'late_delivery'
      }),
      'none',
      'low',
      1,
      1,
      0,
      ['late_delivery_sensitive'],
      []
    ]);
    console.log('Seeded profile: prof_alex_002 (Alex - First-time Buyer)');

    // 3. Insert Jordan profile (Discount Shopper)
    await client.query(`
      INSERT INTO profiles (
        profile_id, shopper_mode, badges, features, loyalty_tier, 
        ltv_bucket, family_size, recent_orders_90d, prior_tickets_90d, 
        risk_flags, learned_preferences_before_call
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (profile_id) DO UPDATE SET
        shopper_mode = EXCLUDED.shopper_mode,
        badges = EXCLUDED.badges,
        features = EXCLUDED.features,
        loyalty_tier = EXCLUDED.loyalty_tier,
        ltv_bucket = EXCLUDED.ltv_bucket,
        family_size = EXCLUDED.family_size,
        recent_orders_90d = EXCLUDED.recent_orders_90d,
        prior_tickets_90d = EXCLUDED.prior_tickets_90d,
        risk_flags = EXCLUDED.risk_flags,
        learned_preferences_before_call = EXCLUDED.learned_preferences_before_call
    `, [
      'prof_jordan_003',
      'Discount Shopper',
      ['Promo Hunter', 'Value Sensitive'],
      JSON.stringify({
        age_range: '18-24',
        region: 'TX',
        orders_last_90_days: 2,
        lifetime_value: 'medium',
        prior_tickets: 1,
        current_issue: 'late_delivery'
      }),
      'silver',
      'medium',
      2,
      2,
      1,
      ['price_sensitive', 'late_delivery_sensitive'],
      []
    ]);
    console.log('Seeded profile: prof_jordan_003 (Jordan - Discount Shopper)');

    // 4. Insert Sam profile (Maya-like Loyal Shopper for post-patch success call)
    await client.query(`
      INSERT INTO profiles (
        profile_id, shopper_mode, badges, features, loyalty_tier,
        ltv_bucket, family_size, recent_orders_90d, prior_tickets_90d,
        risk_flags, learned_preferences_before_call
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (profile_id) DO UPDATE SET
        shopper_mode = EXCLUDED.shopper_mode,
        badges = EXCLUDED.badges,
        features = EXCLUDED.features,
        loyalty_tier = EXCLUDED.loyalty_tier,
        ltv_bucket = EXCLUDED.ltv_bucket,
        family_size = EXCLUDED.family_size,
        recent_orders_90d = EXCLUDED.recent_orders_90d,
        prior_tickets_90d = EXCLUDED.prior_tickets_90d,
        risk_flags = EXCLUDED.risk_flags,
        learned_preferences_before_call = EXCLUDED.learned_preferences_before_call
    `, [
      'prof_sam_004',
      'Loyal Shopper',
      ['Urgent', 'Gift Order', 'High Value'],
      JSON.stringify({
        age_range: '35-44',
        region: 'CA',
        orders_last_90_days: 4,
        lifetime_value: 'high',
        prior_tickets: 1,
        current_issue: 'late_delivery'
      }),
      'gold',
      'high',
      3,
      4,
      1,
      ['late_delivery_sensitive', 'gift_deadline'],
      ['Gen 3 demo target: acknowledge deadline, check replacement inventory, preserve refund safety after rescue options']
    ]);
    console.log('Seeded profile: prof_sam_004 (Sam - Loyal Shopper, post-patch validation)');

    // 5. Insert Policy Versions
    await client.query(`
      INSERT INTO policy_versions (policy_version_id, name, is_promoted)
      VALUES ($1, $2, $3)
      ON CONFLICT (policy_version_id) DO UPDATE SET
        name = EXCLUDED.name,
        is_promoted = EXCLUDED.is_promoted
    `, ['policy_late_delivery_gen1', 'Generation 1 Baseline Policy', true]);

    await client.query(`
      INSERT INTO policy_versions (policy_version_id, name, is_promoted)
      VALUES ($1, $2, $3)
      ON CONFLICT (policy_version_id) DO UPDATE SET
        name = EXCLUDED.name,
        is_promoted = EXCLUDED.is_promoted
    `, ['policy_late_delivery_gen2', 'Generation 2 Proposed Policy', false]);

    await client.query(`
      INSERT INTO policy_versions (policy_version_id, name, is_promoted)
      VALUES ($1, $2, $3)
      ON CONFLICT (policy_version_id) DO UPDATE SET
        name = EXCLUDED.name,
        is_promoted = EXCLUDED.is_promoted
    `, ['policy_late_delivery_gen3', 'Generation 3 Dream-Promoted Deadline Inventory Policy', false]);
    console.log('Seeded policy versions: policy_late_delivery_gen1, policy_late_delivery_gen2, policy_late_delivery_gen3');

    // 6. Seed Playbook
    await client.query(`
      INSERT INTO playbooks (shopper_mode, intent, policy_version, playbook_text, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (shopper_mode, intent, policy_version) DO UPDATE SET
        playbook_text = EXCLUDED.playbook_text,
        is_active = EXCLUDED.is_active
    `, [
      'Loyal Shopper',
      'late_delivery',
      'policy_late_delivery_gen1',
      `# Loyal Shopper - Late Delivery Playbook (Gen 1 Baseline)

## Core Policy Guidelines:
1. Explain standard shipping policy (3-5 business days) first before looking up inventory or checking other shipping options.
2. If customer requests refund or cancel, explain standard cancellation windows.
3. Avoid checking local warehouses or checking replacement inventory until policy is fully explained.`,
      true
    ]);
    
    // Seed First-time Buyer Playbook
    await client.query(`
      INSERT INTO playbooks (shopper_mode, intent, policy_version, playbook_text, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (shopper_mode, intent, policy_version) DO UPDATE SET
        playbook_text = EXCLUDED.playbook_text,
        is_active = EXCLUDED.is_active
    `, [
      'First-time Buyer',
      'late_delivery',
      'policy_late_delivery_gen1',
      `# First-time Buyer - Late Delivery Playbook (Gen 1 Baseline)

## Core Policy Guidelines:
1. State the carrier transit timelines and normal operations.
2. Do not offer reshipments immediately.`,
      true
    ]);

    // Seed Discount Shopper Playbook
    await client.query(`
      INSERT INTO playbooks (shopper_mode, intent, policy_version, playbook_text, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (shopper_mode, intent, policy_version) DO UPDATE SET
        playbook_text = EXCLUDED.playbook_text,
        is_active = EXCLUDED.is_active
    `, [
      'Discount Shopper',
      'late_delivery',
      'policy_late_delivery_gen1',
      `# Discount Shopper - Late Delivery Playbook (Gen 1 Baseline)

## Core Policy Guidelines:
1. Present delivery status checks. Offer standard discount codes if delayed beyond 7 days.`,
      true
    ]);

    console.log('Seeded playbooks for all three shopper modes.');
    console.log('Database seeding completed successfully.');
  } catch (e) {
    console.error('ERROR seeding database:', e);
  } finally {
    client.release();
  }
}

if (process.argv[1] && (process.argv[1].endsWith('initDb.ts') || process.argv[1].endsWith('initDb.js'))) {
  initDb().then(async () => {
    await pool.end();
    process.exit(0);
  }).catch(async (e) => {
    console.error(e);
    await pool.end();
    process.exit(1);
  });
}
