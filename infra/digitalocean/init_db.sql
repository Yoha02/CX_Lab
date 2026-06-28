-- Enable pgvector extension if supported (DigitalOcean Postgres supports this)
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS dream_clusters;
DROP TABLE IF EXISTS dream_patches;
DROP TABLE IF EXISTS playbooks;
DROP TABLE IF EXISTS policy_versions;
DROP TABLE IF EXISTS conversation_runs;
DROP TABLE IF EXISTS profiles;

-- Create profiles table
CREATE TABLE profiles (
    profile_id VARCHAR(255) PRIMARY KEY,
    shopper_mode VARCHAR(100) NOT NULL,
    badges TEXT[] NOT NULL,
    features JSONB NOT NULL,
    loyalty_tier VARCHAR(100),
    ltv_bucket VARCHAR(100),
    family_size INT,
    recent_orders_90d INT,
    prior_tickets_90d INT,
    risk_flags TEXT[],
    learned_preferences_before_call TEXT[],
    embedding VECTOR(1536) -- For pgvector similarity search
);

-- Create conversation_runs table
CREATE TABLE conversation_runs (
    session_id VARCHAR(255) PRIMARY KEY,
    run_id VARCHAR(255) NOT NULL,
    profile_id VARCHAR(255) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_type VARCHAR(100) NOT NULL,
    metadata JSONB NOT NULL,
    profile_snapshot JSONB NOT NULL,
    outcome JSONB NOT NULL,
    turns JSONB NOT NULL,
    evaluation JSONB NOT NULL,
    pruning_decision JSONB NOT NULL,
    dream_input JSONB NOT NULL,
    dream_pass_processed BOOLEAN DEFAULT FALSE NOT NULL,
    embedding VECTOR(1536)
);

-- Create policy_versions table
CREATE TABLE policy_versions (
    policy_version_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_promoted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create playbooks table
CREATE TABLE playbooks (
    playbook_id SERIAL PRIMARY KEY,
    shopper_mode VARCHAR(100) NOT NULL,
    intent VARCHAR(100) NOT NULL,
    policy_version VARCHAR(255) REFERENCES policy_versions(policy_version_id) ON DELETE CASCADE,
    playbook_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_mode_intent_version UNIQUE (shopper_mode, intent, policy_version)
);

-- Create dream_patches table
CREATE TABLE dream_patches (
    patch_id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    profile_id VARCHAR(255) NOT NULL,
    scenario VARCHAR(255) NOT NULL,
    proposed_policy_version VARCHAR(255) NOT NULL,
    evidence_session_ids TEXT[] NOT NULL,
    proposed_memory_patch JSONB NOT NULL,
    proposed_prediction_prior_update JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Create dream_clusters table for behavioral pattern learning (RSI)
CREATE TABLE dream_clusters (
    dream_cluster_key VARCHAR(255) PRIMARY KEY,
    intent VARCHAR(100) NOT NULL,
    situation_tags VARCHAR(100)[] NOT NULL,
    agent_strategy VARCHAR(100) NOT NULL,
    failure_mode VARCHAR(100) NOT NULL,
    affected_personas VARCHAR(100)[] NOT NULL,
    evidence_count INT DEFAULT 1 NOT NULL,
    sentiment_pattern JSONB NOT NULL,
    recommended_patch JSONB NOT NULL,
    evidence_session_ids VARCHAR(255)[] NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'applied'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
