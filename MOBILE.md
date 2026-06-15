# 📱 The Way — Mobile App (iOS & Android)

The mobile apps are built with **Capacitor**. They wrap the same React app and run
the **live site (`https://theway.ge`)** inside a native shell, plus real native
features: branded splash + status bar, offline detection, the Android back button,
and **local notifications for lead follow-up reminders**.

> Because the shell loads the live site, **any web change you deploy to Render shows
> up in the app automatically** — no app-store resubmission needed for UI/logic
> changes. You only rebuild/resubmit the native app when you change native plugins,
> icons, or permissions.

---

## What's in the repo

| Folder | What it is |
|---|---|
| `android/` | The **Android Studio project** (committed — this is your Android app). |
| `ios/` | The iOS Xcode project — **generated on a Mac** (see below). |
| `src/lib/native.ts` | All native integration (status bar, splash, back button, network, follow-up reminders). No-ops on the web. |
| `capacitor.config.ts` | App id (`ge.theway.app`), name, `server.url`, splash/status-bar/notification config. |

---

## 🤖 Android — build & run

**Requirements:** Java **17+** (the repo's Java 8 is too old to build), Android Studio
(includes the Android SDK).

```bash
# 1. Refresh the web build + copy it into the native project
npm run build
npx cap sync android

# 2a. Open in Android Studio (easiest — press ▶ to run on a device/emulator)
npx cap open android

# 2b. …or build an APK from the command line
cd android
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
# → APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

For a release build: `./gradlew assembleRelease` (sign it with your keystore), then
upload the `.aab` to Google Play (`./gradlew bundleRelease`).

---

## 🍎 iOS — build & run (requires a Mac)

iOS native projects can only be generated and built on macOS.

```bash
# On a Mac with Xcode + CocoaPods installed:
npm install
npm run build
npx cap add ios        # one-time: creates the ios/ project
npx cap sync ios
npx cap open ios       # opens Xcode → select a device → press ▶
```

Everything else (plugins, config, `native.ts`) is already iOS-ready — the code
checks the platform at runtime, so no iOS-specific code changes are needed.
For the App Store, archive in Xcode (Product → Archive) and upload via the Organizer.

---

## Updating the app after web changes

```bash
npm run build
npx cap sync            # syncs both android and ios
```

Since the shell loads `theway.ge`, most UI/logic updates need **only a Render
deploy** — rebuild the native app only for native/plugin/permission changes.

---

## Native features included

- **Splash screen** — navy brand background, hides once the app is ready.
- **Status bar** — white background, dark icons (matches the dashboards).
- **Android back button** — navigates back, exits at the root.
- **Offline detection** — toast when the connection drops/returns.
- **Local notifications** — schedules a 9 AM reminder on each open lead's
  follow-up date for the logged-in rep (asks permission on first run).

### Want push notifications too?
Add `@capacitor/push-notifications` and a Firebase project (`google-services.json`
for Android, APNs key for iOS). Local notifications already cover follow-up
reminders without any server setup.

---

## Branding the icon & splash (optional, recommended)

Use the official asset generator with a 1024×1024 icon and a splash logo:

```bash
npm i -D @capacitor/assets
# place assets/icon.png (1024×1024) and assets/splash.png (2732×2732)
npx capacitor-assets generate
```

This produces all the required icon/splash sizes for both platforms.

---

## Architecture note

The app is **online-only** (it relies on Supabase + the Render backend), so loading
the live site is the right model. To ship a **fully self-contained** build instead,
remove `server.url` from `capacitor.config.ts` and change the app's `/api/*` fetch
calls to absolute `https://theway.ge/api/*` URLs.
