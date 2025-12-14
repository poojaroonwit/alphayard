@echo off
echo ========================================
echo Bondarys Mobile - Run on Android
echo ========================================
echo.

REM Check if emulator is connected
echo Checking for connected devices...
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" devices
echo.

REM Ask user to confirm
set /p confirm="Is a device connected? (y/n): "
if /i not "%confirm%"=="y" (
    echo.
    echo Please connect a device or start the emulator first.
    echo Run: adb-helper.bat
    pause
    exit /b 1
)

echo.
echo Starting Metro bundler and installing app...
echo.
npm run android

pause
