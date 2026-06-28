import { executeQuery, executeInsert } from '@cx-lab/digitalocean';

export async function getProfile(profileId: string): Promise<any | null> {
  const query = 'SELECT * FROM profiles WHERE profile_id = $1';
  const results = await executeQuery(query, [profileId]);
  if (results.length > 0) {
    const profile = results[0];
    if (typeof profile.features === 'string') {
      profile.features = JSON.parse(profile.features);
    }
    return profile;
  }
  return null;
}

export async function getProfileMemory(profileId: string): Promise<any | null> {
  const profile = await getProfile(profileId);
  if (profile) {
    return {
      profile_id: profile.profile_id,
      shopper_mode: profile.shopper_mode,
      badges: profile.badges,
      risk_flags: profile.risk_flags || [],
      learned_preferences: profile.learned_preferences_before_call || [],
      features: profile.features
    };
  }
  return null;
}

export async function saveProfile(profile: any): Promise<void> {
  const query = `
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
  `;
  
  const featuresJson = typeof profile.features === 'string' 
    ? profile.features 
    : JSON.stringify(profile.features || {});
    
  await executeInsert(query, [
    profile.profile_id,
    profile.shopper_mode,
    profile.badges || [],
    featuresJson,
    profile.loyalty_tier,
    profile.ltv_bucket,
    profile.family_size,
    profile.recent_orders_90d,
    profile.prior_tickets_90d,
    profile.risk_flags || [],
    profile.learned_preferences || profile.learned_preferences_before_call || []
  ]);
}

export async function findSimilarProfiles(embedding: number[], limit: number = 5): Promise<any[]> {
  const embStr = '[' + embedding.join(',') + ']';
  const query = `
    SELECT profile_id, shopper_mode, badges, features, 
           embedding <=> $1::vector AS distance
    FROM profiles
    ORDER BY distance ASC
    LIMIT $2
  `;
  const results = await executeQuery(query, [embStr, limit]);
  for (const r of results) {
    if (typeof r.features === 'string') {
      r.features = JSON.parse(r.features);
    }
  }
  return results;
}
