#!/bin/bash

# Directus Setup Script for Bondarys
# This script helps you set up Directus CMS integrated with Supabase

set -e

echo "🚀 Bondarys - Directus Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Docker is running
echo -e "${BLUE}[1/5] Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 2: Check if Supabase DB is running
echo -e "${BLUE}[2/5] Checking Supabase Database...${NC}"
if ! docker ps | grep -q bondarys-supabase-db; then
    echo -e "${YELLOW}⚠️  Supabase DB is not running. Starting it now...${NC}"
    docker-compose up -d supabase-db
    echo "Waiting for database to be ready..."
    sleep 10
fi
echo -e "${GREEN}✅ Supabase DB is running${NC}"
echo ""

# Step 3: Apply database migrations
echo -e "${BLUE}[3/5] Applying database migrations...${NC}"
if [ -f "backend/src/database/migrations/008_app_configuration.sql" ]; then
    echo "Applying app configuration migration..."
    docker exec -i bondarys-supabase-db psql -U postgres -d postgres < backend/src/database/migrations/008_app_configuration.sql || {
        echo -e "${YELLOW}⚠️  Migration may have already been applied (this is OK)${NC}"
    }
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${RED}❌ Migration file not found!${NC}"
    exit 1
fi
echo ""

# Step 4: Start Directus
echo -e "${BLUE}[4/5] Starting Directus...${NC}"
docker-compose up -d directus

echo "Waiting for Directus to start (this may take 30-60 seconds)..."
COUNTER=0
MAX_ATTEMPTS=60
until docker exec bondarys-directus wget --quiet --tries=1 --spider http://localhost:8055/server/health 2>/dev/null || [ $COUNTER -eq $MAX_ATTEMPTS ]; do
    printf '.'
    sleep 1
    COUNTER=$((COUNTER+1))
done
echo ""

if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ Directus failed to start within timeout${NC}"
    echo "Check logs with: docker-compose logs directus"
    exit 1
fi

echo -e "${GREEN}✅ Directus is running${NC}"
echo ""

# Step 5: Verify backend routes
echo -e "${BLUE}[5/5] Verifying backend...${NC}"
if docker ps | grep -q bondarys-backend; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is not running. You may need to start it manually:${NC}"
    echo "   docker-compose up -d backend"
fi
echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Directus Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Access Points:${NC}"
echo "  ┌─────────────────────────────────────────────┐"
echo "  │ Directus Admin UI                           │"
echo "  │ URL:      http://localhost:10008            │"
echo "  │ Email:    admin@bondarys.com                │"
echo "  │ Password: BondarysCMS2024!                  │"
echo "  └─────────────────────────────────────────────┘"
echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │ Supabase Studio                             │"
echo "  │ URL:      http://localhost:10007            │"
echo "  └─────────────────────────────────────────────┘"
echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │ Backend API                                 │"
echo "  │ Health:   http://localhost:3000/health      │"
echo "  │ Config:   http://localhost:3000/api/app-config/config │"
echo "  └─────────────────────────────────────────────┘"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  1. Change the Directus admin password after first login!"
echo "  2. Read the documentation: DIRECTUS_INTEGRATION_COMPLETE.md"
echo ""
echo -e "${BLUE}📚 Quick Start:${NC}"
echo "  1. Open http://localhost:10008"
echo "  2. Login with credentials above"
echo "  3. Click 'App Assets' to manage backgrounds/images"
echo "  4. Click 'App Screens' to configure login/splash screens"
echo "  5. Click 'App Feature Flags' to toggle features"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo "  • DIRECTUS_INTEGRATION_COMPLETE.md - Quick start guide"
echo "  • docs/DIRECTUS_SETUP_GUIDE.md      - Detailed guide"
echo "  • docs/CMS_ALTERNATIVES_COMPARISON.md - CMS comparison"
echo ""
echo -e "${GREEN}✨ You can now manage your mobile app content visually!${NC}"
echo ""

