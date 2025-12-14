# ADB Connection Guide for Bondarys Mobile

## Current Status
✅ ADB is installed at: `C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe`
✅ ADB Version: 36.0.0
✅ Emulators available: Medium_Phone, Medium_Phone_API_36.1
🔄 Emulator is currently starting (takes 30-60 seconds)

## Quick Commands

### Check Connected Devices
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

### Start Emulator
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_36.1
```

### Restart ADB Server
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" start-server
```

## Helper Scripts

I've created two helper scripts for you:

### 1. PowerShell Script (Recommended)
```powershell
cd mobile
.\adb-helper.ps1
```

### 2. Batch Script
```cmd
cd mobile
adb-helper.bat
```

Both scripts provide an interactive menu with options to:
- List connected devices
- Start emulator
- Install APK
- View device logs
- Restart ADB server
- Connect via WiFi
- Run React Native app

## Connection Methods

### Method 1: Android Emulator (Easiest)
1. Start the emulator using the helper script or command above
2. Wait 30-60 seconds for it to fully boot
3. Check connection: `adb devices`
4. You should see something like: `emulator-5554    device`

### Method 2: Physical Device via USB
1. **Enable Developer Options** on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging**:
   - Go to Settings > Developer Options
   - Enable "USB Debugging"

3. **Connect via USB**:
   - Plug in your device
   - Accept the "Allow USB debugging" prompt on your device
   - Run: `adb devices`
   - You should see your device listed

### Method 3: Wireless ADB (WiFi)
1. First connect via USB (Method 2)
2. Make sure device and PC are on the same WiFi network
3. Get your device's IP address:
   - Settings > About Phone > Status > IP Address
   - Or run: `adb shell ip addr show wlan0`
4. Enable TCP/IP mode:
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" tcpip 5555
   ```
5. Connect wirelessly:
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" connect YOUR_DEVICE_IP:5555
   ```
6. Disconnect USB cable
7. Verify: `adb devices`

## Running the Mobile App

Once a device is connected, you can run the React Native app:

```bash
cd mobile
npm run android
```

Or use Expo:
```bash
cd mobile
npm start
# Then press 'a' for Android
```

## Troubleshooting

### No Devices Showing
```powershell
# Restart ADB server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" start-server

# Check again
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

### Emulator Won't Start
- Make sure you have enough RAM (4GB+ recommended)
- Close other heavy applications
- Try the other emulator: `Medium_Phone`
- Check if virtualization is enabled in BIOS

### Device Unauthorized
- Revoke USB debugging authorizations on your device
- Settings > Developer Options > Revoke USB debugging authorizations
- Reconnect and accept the prompt again

### Offline Device
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reconnect
```

## Useful ADB Commands

### View Logs
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" logcat
```

### Filter Logs (React Native)
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" logcat *:S ReactNative:V ReactNativeJS:V
```

### Install APK
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install path\to\app.apk
```

### Uninstall App
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" uninstall com.bondarys.mobile
```

### Clear App Data
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell pm clear com.bondarys.mobile
```

### Take Screenshot
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell screencap -p /sdcard/screenshot.png
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" pull /sdcard/screenshot.png
```

### Record Screen
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell screenrecord /sdcard/demo.mp4
# Press Ctrl+C to stop
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" pull /sdcard/demo.mp4
```

## Next Steps

1. Wait for the emulator to finish booting (check with `adb devices`)
2. Once connected, run the mobile app: `cd mobile && npm run android`
3. Test the login fix we just implemented
4. Check the console logs for the navigation flow

## Testing the Login Fix

After the app is running on your device/emulator:
1. Navigate to the Login screen
2. Enter valid credentials
3. Tap "Sign in"
4. **Expected**: You should stay in the main app (not redirect to Marketing)
5. Check the Metro bundler logs for navigation state changes

See `TEST_LOGIN_FIX.md` for detailed testing instructions.
