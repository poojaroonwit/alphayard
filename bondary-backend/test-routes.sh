#!/bin/bash

echo "🔍 Testing Admin Config API Endpoints"
echo "=================================="

# Test health endpoint (no auth required)
echo "📊 Testing Health Endpoint..."
curl -s http://localhost:3000/api/v1/admin/health | head -c 200
echo ""
echo ""

# Test branding endpoint (will fail without auth, but should return 401 not 404)
echo "🎨 Testing Branding Endpoint (should return 401, not 404)..."
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:3000/api/v1/admin/config/branding | tail -1
echo ""

# Test applications endpoint (will fail without auth, but should return 401 not 404)
echo "📱 Testing Applications Endpoint (should return 401, not 404)..."
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:3000/api/v1/admin/applications | tail -1
echo ""

# Test legacy endpoints
echo "🔄 Testing Legacy Applications Endpoint..."
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:3000/api/admin/applications | tail -1
echo ""

echo "✅ Route testing complete!"
echo ""
echo "Expected results:"
echo "- Health: 200 (success)"
echo "- Branding: 401 (unauthorized, not 404)"
echo "- Applications: 401 (unauthorized, not 404)"
echo "- Legacy Applications: 401 (unauthorized, not 404)"
