#!/bin/bash

# UniApps Development Environment Starter
# Runs Backend-Admin, Backend-Mobile, Admin, and Boundary App concurrently

# Cleanup function to kill all spawned processes on exit
cleanup() {
    echo -e "\n\033[1;31mShutting down all services...\033[0m"
    # Port-based cleanup as a safety net
    fuser -k 3002/tcp 4000/tcp 19006/tcp 2>/dev/null
    # Kill background jobs
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo -e "\033[1;34m--- UniApps Full Stack Developer Console ---\033[0m"


# 2. Start Bondary Backend
echo -e "\033[1;32m[1/3] Launching Bondary Backend Server (Port 4000)...\033[0m"
(cd bondary-backend && npm run dev) &

# 3. Start AppKit Dashboard
echo -e "\033[1;32m[2/3] Launching AppKit Dashboard...\033[0m"
(cd appkit && npm run dev) &

# 4. Start Boundary App
echo -e "\033[1;32m[3/3] Launching Boundary App (Expo)...\033[0m"
(cd boundary-app && npm run web) &

echo -e "\033[1;36m--- Services are initializing ---\033[0m"
echo -e "AppKit (Unified):      http://localhost:3002/api"
echo -e "Backend Mobile: http://localhost:4000"
echo -e "AppKit Console:      http://localhost:3002"
echo -e "Boundary App:   http://localhost:19006"
echo -e "\n\033[1;33mPress Ctrl+C to stop all services.\033[0m\n"

# Keep script alive
wait
