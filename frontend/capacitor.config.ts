import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config — wraps the Next.js web app into native iOS and Android shells.
 *
 * To initialize:
 *   npm install -D @capacitor/cli
 *   npm install @capacitor/core @capacitor/ios @capacitor/android
 *   npx cap init "MoyaMoya" "com.moyamoya.companion" --web-dir=out
 *   npm run build    (will create `out/` via Next.js static export when configured)
 *   npx cap add ios
 *   npx cap add android
 *   npx cap sync
 *   npx cap open ios      (Xcode)
 *   npx cap open android  (Android Studio)
 *
 * For dev builds that hit the production backend, use `server.url` below.
 * For offline/local testing, remove the server.url and use the bundled web assets.
 */
const config: CapacitorConfig = {
  appId: 'com.moyamoya.companion',
  appName: 'MoyaMoya',
  webDir: 'out',
  server: {
    // Point the native shell at the deployed web app. Remove this block for offline/bundled builds.
    url: 'https://moya-moya.up.railway.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FAFAF9',
  },
  android: {
    backgroundColor: '#FAFAF9',
    allowMixedContent: false,
  },
};

export default config;
