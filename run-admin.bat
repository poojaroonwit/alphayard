@echo off
echo.
echo ========================================
echo   Starting Bondarys Admin Console
echo ========================================
echo.

cd admin

echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting admin console on http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
