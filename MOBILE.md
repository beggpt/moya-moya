# MoyaMoya Mobile — iOS & Android

This document explains how to build and run MoyaMoya Companion as a native iOS and Android app using **Capacitor**. The web build is already mobile-first (PWA), so the native app is effectively a web view wrapper with access to native device APIs.

## Architecture

```
Next.js (web)          ───┐
  + PWA manifest          ├──▶ Same web build, three delivery channels:
  + responsive UI      ───┘      1. Web (Railway)
                                 2. iOS (App Store, via Capacitor)
                                 3. Android (Play Store, via Capacitor)
```

All three share the same API at `https://moya-moya-production.up.railway.app`.

## 1. Install as a PWA (fastest — no store needed)

Users can install directly from the web:

- **iOS**: Open `https://moya-moya.up.railway.app` in Safari → Share icon → "Add to Home Screen"
- **Android**: Open in Chrome → menu → "Install app" or "Add to Home Screen"

The app will launch in standalone mode (no browser chrome), use the custom app icon, and behave like a native app.

## 2. Build native iOS/Android apps (Capacitor)

### Prerequisites

- **iOS**: macOS with Xcode 15+, Apple Developer account for distribution
- **Android**: Android Studio with Android SDK

### Setup

```bash
cd frontend

# Install Capacitor
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/ios @capacitor/android

# Initialize (already done — capacitor.config.ts exists)
# The config points at the Railway deployment, so no separate build is needed initially.

# Add platforms
npx cap add ios
npx cap add android

# Sync — copies web assets and plugins into the native projects
npx cap sync
```

### iOS

```bash
npx cap open ios
# Opens Xcode. Build & run on a simulator or device.
```

Required in Xcode:
- Set your development team
- Bundle identifier: `com.moyamoya.companion` (change if publishing)
- Add capabilities: Push Notifications, Background Modes (if needed)

### Android

```bash
npx cap open android
# Opens Android Studio. Build & run on emulator or device.
```

Required in Android Studio:
- Set `applicationId` in `build.gradle` to `com.moyamoya.companion`
- Configure signing for release builds (`keystore.properties`)

## 3. Bundled (offline-capable) builds

To ship the web app *inside* the native package instead of loading it from Railway:

1. Remove `server.url` from `capacitor.config.ts`
2. Configure Next.js static export in `next.config.mjs`:
   ```js
   export default {
     output: 'export',
     images: { unoptimized: true },
   };
   ```
3. Run `npm run build` → produces `out/` directory
4. `npx cap sync` → copies `out/` into native projects

API calls still hit Railway, but the app shell loads instantly from disk.

## 4. Native features to add over time

Capacitor plugins make these easy:

- **Push notifications** — `@capacitor/push-notifications` (replaces/augments current web polling)
- **Geolocation** — already works via browser API, plugin gives background access for SOS
- **Camera** — for profile pictures and symptom photos
- **Biometric auth** — Face ID / fingerprint login
- **Health data integration** — HealthKit (iOS) / Google Fit (Android) for BP & HR sync
- **Local notifications** — medication reminders that fire even offline

## 5. Publishing

- **iOS App Store**: Archive in Xcode → App Store Connect → submit for review
- **Google Play**: Generate signed AAB → Play Console → release

Both stores require:
- Privacy policy URL
- App screenshots
- Medical app disclaimer (since we collect health data)
- App icon + feature graphic (1024×500 for Android)
