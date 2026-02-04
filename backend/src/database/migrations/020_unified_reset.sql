-- Consolidated Unified Hybrid Model Reset
-- This script sets up the baseline for the entire application data architecture

-- 1. Create PostGIS extension if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Drop legacy tables if they exist to start fresh
DROP TABLE IF EXISTS entity_relations CASCADE;
DROP TABLE IF EXISTS unified_entities CASCADE;
DROP TABLE IF EXISTS entity_attributes CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS entity_types CASCADE;
DROP TABLE IF EXISTS emotion_records CASCADE;
DROP TABLE IF EXISTS location_history CASCADE;
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS safety_incidents CASCADE;
DROP TABLE IF EXISTS safety_alerts CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS file_metadata CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS shopping_items CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS financial_accounts CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS health_metrics CASCADE;

-- 3. Create Unified Entities Table
CREATE TABLE IF NOT EXISTS unified_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    application_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Promoted columns for performance and PostGIS
    location GEOGRAPHY(POINT) GENERATED ALWAYS AS (
        CASE 
            WHEN (data->'longitude') IS NOT NULL AND (data->'latitude') IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint((data->>'longitude')::numeric, (data->>'latitude')::numeric), 4326)
            ELSE NULL 
        END
    ) STORED
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_unified_type ON unified_entities(type);
CREATE INDEX IF NOT EXISTS idx_unified_owner ON unified_entities(owner_id);
CREATE INDEX IF NOT EXISTS idx_unified_app ON unified_entities(application_id);
CREATE INDEX IF NOT EXISTS idx_unified_status ON unified_entities(status);
CREATE INDEX IF NOT EXISTS idx_unified_data ON unified_entities USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_unified_location ON unified_entities USING GIST(location);

-- 4. Create Unified Relations Table (Polymorphic)
CREATE TABLE IF NOT EXISTS entity_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES unified_entities(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES unified_entities(id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, target_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON entity_relations(source_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON entity_relations(target_id);
CREATE INDEX IF NOT EXISTS idx_rel_type ON entity_relations(relation_type);

-- 5. Chat Messages (Performance-critical dedicated table)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES unified_entities(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON chat_messages(created_at);

-- 6. Notifications (Performance-critical dedicated table)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (handles existing table from migration 003)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at);
