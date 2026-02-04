-- Migration: 002_add_location_tables.sql
-- Description: Add location tracking and geofencing tables
-- Created: 2024-01-02
-- Author: Bondarys Team

-- User locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(5, 2),
  address TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location history table
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(5, 2),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location shares table
CREATE TABLE IF NOT EXISTS location_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location requests table
CREATE TABLE IF NOT EXISTS location_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for location tables
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_user_id ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_created_at ON location_history(created_at);
CREATE INDEX IF NOT EXISTS idx_geofences_circle_id ON geofences(circle_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_geofences_updated_at 
  BEFORE UPDATE ON geofences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for location data
CREATE POLICY "Users can view own location" ON user_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own location" ON user_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own location" ON user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own location history" ON location_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own location history" ON location_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hourse members can view hourse geofences" ON geofences FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM circle_members 
    WHERE circle_members.circle_id = geofences.circle_id 
    AND circle_members.user_id = auth.uid()
  )
);
