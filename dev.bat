@echo off
title UniApps Dev Console

echo --- Starting UniApps Development Environment ---


:: Start Backend Mobile in a new window
echo [1/3] Starting Backend Mobile...
start "Backend-Mobile" cmd /c "cd backend-mobile && npm run dev"

:: Start Admin in a new window
echo [2/3] Starting AppKit...
start "AppKit" cmd /c "cd appkit && npm run dev"

:: Start Boundary App in a new window
echo [3/3] Starting Boundary App...
start "Boundary-App" cmd /c "cd boundary-app && npm run web"

echo --- All services are starting in separate windows ---
echo AppKit (Unified):      http://localhost:3002/api

echo Backend Mobile: http://localhost:4000
echo AppKit Console:      http://localhost:3002
echo Boundary App:   http://localhost:19006
pause
