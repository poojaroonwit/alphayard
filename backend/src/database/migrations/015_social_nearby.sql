-- Migration: 015_social_nearby.sql
-- Description: Add user profile columns and RPC for nearby social discovery
-- Requires: postgis extension (enabled in 002_complete_schema.sql)

-- Ensure profile columns exist for filters
ALTER TABLE users ADD COLUMN IF NOT EXISTS workplace TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hometown TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS university TEXT;

-- Optional indexes for faster filtering (lightweight)
CREATE INDEX IF NOT EXISTS idx_users_workplace ON users(workplace);
CREATE INDEX IF NOT EXISTS idx_users_hometown ON users(hometown);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);

-- RPC: Find nearby users by latest location and optional profile filters
-- Uses latest entry from user_locations per user (by timestamp), computes spherical distance
-- and filters within given radius in meters.

DROP FUNCTION IF EXISTS fn_social_nearby_users(NUMERIC, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION fn_social_nearby_users(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_m NUMERIC,
  p_limit INTEGER DEFAULT 50,
  p_workplace TEXT DEFAULT NULL,
  p_hometown TEXT DEFAULT NULL,
  p_school TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  distance_m NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  location_timestamp TIMESTAMPTZ,
  workplace TEXT,
  hometown TEXT,
  school TEXT,
  university TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (ul.user_id)
      ul.user_id,
      ul.latitude,
      ul.longitude,
      ul.timestamp
    FROM user_locations ul
    ORDER BY ul.user_id, ul.timestamp DESC
  ),
  origin AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  )
  SELECT 
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.avatar_url,
    ST_DistanceSphere(ST_MakePoint(latest.longitude, latest.latitude), ST_MakePoint(p_lng, p_lat))::NUMERIC AS distance_m,
    latest.latitude,
    latest.longitude,
    latest.timestamp,
    u.workplace,
    u.hometown,
    u.school,
    u.university
  FROM latest
  JOIN users u ON u.id = latest.user_id
  WHERE ST_DistanceSphere(ST_MakePoint(latest.longitude, latest.latitude), ST_MakePoint(p_lng, p_lat)) <= p_radius_m
    AND (p_workplace IS NULL OR (u.workplace IS NOT NULL AND u.workplace ILIKE '%' || p_workplace || '%'))
    AND (p_hometown IS NULL OR (u.hometown IS NOT NULL AND u.hometown ILIKE '%' || p_hometown || '%'))
    AND (p_school IS NULL OR (
      (u.school IS NOT NULL AND u.school ILIKE '%' || p_school || '%') OR
      (u.university IS NOT NULL AND u.university ILIKE '%' || p_school || '%')
    ))
  ORDER BY distance_m ASC
  LIMIT COALESCE(p_limit, 50);
END;
$$ LANGUAGE plpgsql STABLE;


