# ADB Helper Script for Bondarys Mobile Development

$ADB = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$EMULATOR = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Bondarys Mobile - ADB Helper" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. List connected devices"
    Write-Host "2. Start emulator (Medium_Phone_API_36.1)"
    Write-Host "3. Install APK on device"
    Write-Host "4. View device logs"
    Write-Host "5. Restart ADB server"
    Write-Host "6. Connect to device via WiFi"
    Write-Host "7. Run React Native app on Android"
    Write-Host "8. Exit"
    Write-Host ""
}

function List-Devices {
    Write-Host "`nConnected devices:" -ForegroundColor Yellow
    & $ADB devices -l
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Start-Emulator {
    Write-Host "`nStarting emulator..." -ForegroundColor Yellow
    Start-Process $EMULATOR -ArgumentList "-avd", "Medium_Phone_API_36.1"
    Write-Host "Emulator is starting in a new window..." -ForegroundColor Green
    Write-Host "Wait 30-60 seconds for it to fully boot" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Install-APK {
    $apkPath = Read-Host "`nEnter APK path"
    if (Test-Path $apkPath) {
        & $ADB install $apkPath
    } else {
        Write-Host "APK file not found!" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function View-Logs {
    Write-Host "`nViewing device logs (Press Ctrl+C to stop)..." -ForegroundColor Yellow
    & $ADB logcat
}

function Restart-ADB {
    Write-Host "`nRestarting ADB server..." -ForegroundColor Yellow
    & $ADB kill-server
    & $ADB start-server
    Write-Host "ADB server restarted" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Connect-WiFi {
    Write-Host "`nMake sure your device is connected via USB first!" -ForegroundColor Yellow
    Write-Host ""
    $deviceIP = Read-Host "Enter device IP address (e.g., 192.168.1.100)"
    $devicePort = Read-Host "Enter port (default 5555, press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($devicePort)) {
        $devicePort = "5555"
    }
    
    & $ADB tcpip $devicePort
    Start-Sleep -Seconds 2
    & $ADB connect "${deviceIP}:${devicePort}"
    Write-Host "`nConnected! You can now disconnect USB cable." -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Run-ReactNative {
    Write-Host "`nRunning React Native app on Android..." -ForegroundColor Yellow
    Set-Location $PSScriptRoot
    npm run android
    Read-Host "Press Enter to continue"
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-8)"
    
    switch ($choice) {
        "1" { List-Devices }
        "2" { Start-Emulator }
        "3" { Install-APK }
        "4" { View-Logs }
        "5" { Restart-ADB }
        "6" { Connect-WiFi }
        "7" { Run-ReactNative }
        "8" { 
            Write-Host "`nGoodbye!" -ForegroundColor Cyan
            exit 
        }
        default { 
            Write-Host "`nInvalid choice. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($true)
