# Testing Mobile App on PC

## Quick Start Options

### Option 1: Android Emulator (Best for Windows)

#### Prerequisites:
1. **Install Android Studio**
   - Download: https://developer.android.com/studio
   - Install with default settings
   - Requires ~10GB disk space

2. **Setup Android Emulator**
   ```
   1. Open Android Studio
   2. Click "More Actions" → "Virtual Device Manager"
   3. Click "Create Device"
   4. Select "Phone" → "Pixel 5" → Next
   5. Download system image (e.g., "Tiramisu" - Android 13)
   6. Click "Finish"
   ```

3. **Set Environment Variables** (if needed)
   - Add to PATH: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`
   - Add to PATH: `C:\Users\YourName\AppData\Local\Android\Sdk\emulator`

#### Run the App:
```bash
# Start the emulator first (or it will auto-start)
cd mobile
npm start

# In the Expo terminal, press 'a' for Android
# Or press 'shift + a' to select specific emulator
```

---

### Option 2: Web Browser (Quickest, Limited Features)

#### Check if web is configured:
```bash
cd mobile
npm start

# Press 'w' to open in web browser
```

**Note**: Not all React Native features work on web (camera, native modules, etc.)

---

### Option 3: Use Your Phone (Easiest)

#### Setup:
1. **Install Expo Go** on your phone
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Connect to same WiFi** as your PC

3. **Run the app:**
   ```bash
   cd mobile
   npm start
   ```

4. **Scan QR code** with:
   - Android: Expo Go app
   - iOS: Camera app (opens in Expo Go)

---

## Troubleshooting

### Android Emulator Issues:

**Emulator won't start:**
```bash
# Check if emulator is available
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_33
```

**Can't connect to Metro:**
```bash
# Restart Metro bundler
cd mobile
npm start -- --reset-cache
```

**ADB not found:**
```bash
# Add to PATH or use full path
C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
```

### Expo Issues:

**QR code not working:**
- Make sure phone and PC are on same WiFi
- Try tunnel mode: `npm start -- --tunnel`

**Metro bundler errors:**
```bash
# Clear cache
cd mobile
npm start -- --clear

# Or reset everything
rm -rf node_modules
npm install
npm start
```

---

## Performance Tips

### Android Emulator:
- Enable hardware acceleration (HAXM on Intel, WHPX on AMD)
- Allocate more RAM in AVD settings (4GB recommended)
- Use x86_64 system images (faster than ARM)

### Development:
- Use Fast Refresh (enabled by default)
- Keep Metro bundler running
- Use `console.log()` for debugging (shows in terminal)

---

## Current Project Ports

- **Mobile Metro Bundler**: http://localhost:8081
- **Admin Panel**: http://localhost:3001
- **Backend API**: http://localhost:3000 or 3001
- **Marketing Website**: http://localhost:5173

---

## Testing Checklist

- [ ] Android Emulator installed and working
- [ ] Metro bundler starts without errors
- [ ] App loads on emulator/device
- [ ] Can navigate between screens
- [ ] Login functionality works
- [ ] API calls connect to backend

---

## Useful Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Start in tunnel mode (for phone testing)
npm start -- --tunnel

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios

# Run tests
npm test

# Check for issues
npx expo-doctor
```

---

## Next Steps

1. Choose your testing method (Android Emulator recommended)
2. Follow setup instructions above
3. Start the app with `npm start`
4. Test login with credentials from backend
5. Report any issues you find

---

## Need Help?

- Expo Documentation: https://docs.expo.dev
- React Native Docs: https://reactnative.dev
- Android Studio Guide: https://developer.android.com/studio/run/emulator
