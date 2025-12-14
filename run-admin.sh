#!/bin/bash

echo ""
echo "========================================"
echo "  Starting Bondarys Admin Console"
echo "========================================"
echo ""

cd admin

echo "Checking if dependencies are installed..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting admin console on http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
