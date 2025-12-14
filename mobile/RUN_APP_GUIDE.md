# How to Run Bondarys Mobile App

## Current Status ✅

- ✅ Metro bundler is running on http://localhost:8081
- ✅ Android native folder has been prebuilt
- ✅ Login fix has been applied
- 🔄 Android emulator is starting

## Option 1: Test on Web (Fastest) 🌐

The web version is already running! Just open your browser:

**URL**: http://localhost:8081

This is the fastest way to test the login navigation fix since it doesn't require an emulator or device.

### Test the Login Fix on Web:
1. Open http://localhost:8081 in your browser
2. You'll see the Marketing screen
3. Click "Login"
4. Enter credentials
5. Click "Sign in"
6. **Expected**: You should stay in the main app (not redirect to Marketing)

## Option 2: Test on Android Emulator 📱

### Step 1: Wait for Emulator to Boot
The emulator is currently starting. Check if it's ready:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

You should see:
```
List of devices attached
emulator-5554    device
```

### Step 2: Install and Run the App
Once the emulator shows as "device", the Metro bundler will automatically detect it.

In the Metro bundler terminal, press **`a`** to open on Android.

Or run this command in a new terminal:
```bash
cd mobile
npm run android
```

### Step 3: Test the Login Fix
Same as web version - test that login doesn't redirect to Marketing screen.

## Option 3: Test on Physical Device 📲

### Via USB:
1. Enable USB Debugging on your Android phone
2. Connect via USB
3. Accept the debugging prompt
4. Press **`a`** in Metro bundler terminal

### Via WiFi:
1. First connect via USB
2. Run: 
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" tcpip 5555
   ```
3. Get device IP from Settings > About Phone > Status
4. Connect:
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" connect YOUR_IP:5555
   ```
5. Disconnect USB
6. Press **`a`** in Metro bundler terminal

## Option 4: Use Expo Go (Limited) 📱

**Note**: Some native modules (Google Sign-In, Maps) won't work in Expo Go.

1. Install Expo Go from Play Store
2. In Metro bundler terminal, press **`s`** to switch to Expo Go
3. Scan the QR code with Expo Go app

## Troubleshooting

### Metro Bundler Not Running
```bash
cd mobile
npm start
```

### Emulator Not Showing Up
```powershell
# Restart ADB
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" start-server

# Check devices
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

### App Won't Install
```powershell
# Clear app data
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell pm clear com.poojaroonwiit.bondarys

# Reinstall
cd mobile
npm run android
```

### Build Errors
```bash
cd mobile
npm start -- --clear
```

### Emulator Too Slow
- Allocate more RAM in AVD Manager
- Enable hardware acceleration
- Use a physical device instead

## Quick Commands Reference

### Check Emulator Status
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

### Start Emulator
```powershell
Start-Process "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -ArgumentList "-avd", "Medium_Phone_API_36.1"
```

### Start Metro Bundler
```bash
cd mobile
npm start
```

### Run on Android
```bash
cd mobile
npm run android
```

### View Logs
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" logcat
```

### Clear Metro Cache
```bash
cd mobile
npm start -- --clear
```

## What to Test

### Login Flow:
1. ✅ Navigate to Login screen
2. ✅ Enter valid credentials
3. ✅ Submit login form
4. ✅ **VERIFY**: Stay in main app (Home screen)
5. ✅ **VERIFY**: Do NOT redirect to Marketing screen

### Console Logs to Watch:
```
[AUTH] ✅ Login successful - setting user state
[AUTH] ✅✅✅ All states set - isAuthenticated should now be: true
[RootNavigator] shouldShowAuthenticated: true
[RootNavigator] Authenticated NavigationContainer ready
```

## Current Metro Bundler Commands

In the Metro bundler terminal, you can press:
- **`a`** - Open on Android (once emulator is ready)
- **`w`** - Open on web
- **`s`** - Switch to Expo Go
- **`r`** - Reload app
- **`j`** - Open debugger
- **`m`** - Toggle menu

## Recommended Testing Order

1. **Start with Web** (http://localhost:8081) - Fastest, test the fix immediately
2. **Then Android Emulator** - More realistic mobile experience
3. **Finally Physical Device** - Real-world testing

## Success Criteria ✅

The fix is successful if:
- ✅ User can log in with valid credentials
- ✅ After login, user stays in main app
- ✅ No redirect to Marketing screen
- ✅ Navigation is smooth and immediate
- ✅ Console logs show proper auth flow

---

**Next Step**: Open http://localhost:8081 in your browser to test the login fix on web!
