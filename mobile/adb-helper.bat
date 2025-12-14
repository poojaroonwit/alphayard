@echo off
REM ADB Helper Script for Bondarys Mobile Development

set ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
set EMULATOR=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe

echo ========================================
echo Bondarys Mobile - ADB Helper
echo ========================================
echo.

:menu
echo 1. List connected devices
echo 2. Start emulator (Medium_Phone_API_36.1)
echo 3. Install APK on device
echo 4. View device logs
echo 5. Restart ADB server
echo 6. Connect to device via WiFi
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto list_devices
if "%choice%"=="2" goto start_emulator
if "%choice%"=="3" goto install_apk
if "%choice%"=="4" goto view_logs
if "%choice%"=="5" goto restart_adb
if "%choice%"=="6" goto wifi_connect
if "%choice%"=="7" goto end
goto menu

:list_devices
echo.
echo Connected devices:
"%ADB%" devices -l
echo.
pause
goto menu

:start_emulator
echo.
echo Starting emulator...
start "" "%EMULATOR%" -avd Medium_Phone_API_36.1
echo Emulator is starting in a new window...
echo Wait 30-60 seconds for it to fully boot
echo.
pause
goto menu

:install_apk
echo.
set /p apk_path="Enter APK path: "
"%ADB%" install "%apk_path%"
echo.
pause
goto menu

:view_logs
echo.
echo Viewing device logs (Press Ctrl+C to stop)...
"%ADB%" logcat
goto menu

:restart_adb
echo.
echo Restarting ADB server...
"%ADB%" kill-server
"%ADB%" start-server
echo ADB server restarted
echo.
pause
goto menu

:wifi_connect
echo.
echo Make sure your device is connected via USB first!
echo.
set /p device_ip="Enter device IP address (e.g., 192.168.1.100): "
set /p device_port="Enter port (default 5555): "
if "%device_port%"=="" set device_port=5555
"%ADB%" tcpip %device_port%
timeout /t 2 /nobreak >nul
"%ADB%" connect %device_ip%:%device_port%
echo.
echo Connected! You can now disconnect USB cable.
echo.
pause
goto menu

:end
echo.
echo Goodbye!
exit /b 0
