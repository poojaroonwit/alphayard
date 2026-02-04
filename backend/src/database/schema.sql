-- schema.sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
-- This remains relational as it is the core entity for authentication and identity.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  phone_number VARCHAR(20),
  date_of_birth DATE,
  push_token TEXT,
  notification_settings JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  is_onboarding_complete BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: circles and circle_members have been migrated to the Unified Hybrid Model 
-- (unified_entities and entity_relations) in 020_unified_reset.sql.
