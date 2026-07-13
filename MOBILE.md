# 📱 The Way — Mobile App (iOS & Android)

The mobile apps are built with **Capacitor** in **bundled standalone mode**: the
student app UI ships **inside the binary** (no website wrapper), talks to the
live backend at `https://theway.ge`, and has its own dark, premium native design
plus **app-exclusive features** the website doesn't have.

> The app is **student-only** — staff/admin use the website. A non-student who logs
> in sees a "this app is for students" screen.

> **Publishing to Google Play / the App Store?** Follow
> [STORE-SUBMISSION.md](STORE-SUBMISSION.md) — signing, cloud builds, listing
> copy and marketing assets are all prepared (`store/`).

---

## What makes the app different from the website

| Feature | Where |
|---|---|
| 3-slide welcome **onboarding** (first launch only) | `src/mobile/MobileOnboarding.tsx` |
| **Life in Georgia** hub — live GEL currency converter + survival guide (SIM, banks, transport, halal food, emergency numbers) | `src/mobile/MobileGeorgia.tsx` → `/app/georgia` |
| **News from The Way** — CEO announcements feed (published from Admin → Analytics) | `MobileHome.tsx`, store `announcements` |
| **App Lock** — optional 4-digit PIN (SHA-256, stored on-device) | `src/mobile/AppLock.tsx`, enabled in Profile |
| **Arabic** — one-tap English ⇄ العربية toggle in Profile | `src/lib/i18n` + `t()` calls |
| Native feel — page transitions, pull-to-refresh, offline banner, haptic taps | `src/mobile/MobileLayout.tsx`, `src/lib/native.ts` |
| Student ID + **QR member card** for partner discounts | `/app/card` |
| **Push notifications** (plumbed end-to-end, needs Firebase key — see below) | `api/_push.ts`, `api/register-push.ts` |

---

## Architecture: bundled standalone

- `capacitor.config.ts` has **no `server.url`** — the web build is copied into the
  binary by `npx cap sync`.
- `.env.app` holds the **public** Supabase URL + publishable key, baked in by
  `vite build --mode app`. (Local dev builds keep using your `.env.local` mock.)
- `src/lib/native.ts` patches `window.fetch` **on native only** so relative
  `/api/*` calls go to `https://theway.ge` — no call-site changes anywhere.
- Consequence: **web deploys no longer auto-update the app.** Rebuild + resubmit
  for app changes, or add OTA updates (see Capgo below).

### Build the app bundle

```bash
npm run build:app   # = build API + tsc + vite build --mode app + npx cap sync
```

Always use `build:app` (not plain `build`) before building the native binary —
plain `build` bakes your local `.env.local` (mock) config.

---

## 🤖 Android — build & run

**Requirements:** Java **17+**, Android Studio (includes the SDK).

```bash
npm run build:app          # web bundle with production config + sync

npx cap open android       # open in Android Studio, press ▶
# …or CLI:
cd android
./gradlew assembleDebug    # Windows: gradlew.bat assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Release: `./gradlew bundleRelease` → sign with your keystore → upload the `.aab`
to Google Play.

## 🍎 iOS — build & run (requires a Mac)

```bash
# On a Mac with Xcode + CocoaPods:
npm install
npm run build:app
npx cap add ios        # one-time: creates the ios/ project
npx cap open ios       # select device → ▶
```

All plugins/config/`native.ts` are already iOS-ready (platform checked at
runtime). App Store: Product → Archive → upload via Organizer.

---

## 🔔 Push notifications — 3 steps to turn on

Everything is already plumbed: the server sends FCM pushes for new in-app
notifications (`api/state-save.ts` → `api/_push.ts`), devices register via
`POST /api/register-push`, and the client auto-registers when the plugin is
present. To activate:

1. **Firebase project** (console.firebase.google.com) → add Android app with
   package `ge.theway.app` → download `google-services.json` into `android/app/`.
2. `npm i @capacitor/push-notifications && npx cap sync` — the client detects the
   plugin at runtime, no code changes needed.
3. In **Render env vars**, add `FIREBASE_SERVICE_ACCOUNT` = the full JSON of a
   Firebase *service account key* (Project settings → Service accounts →
   Generate new private key). Without it the server silently skips push (same
   pattern as `RESEND_API_KEY`).

iOS additionally needs an APNs key uploaded to Firebase Cloud Messaging.
Device tokens are stored server-side in `app_state.pushTokens` and never sent
to clients; dead tokens are pruned automatically.

---

## 🔄 OTA updates without app-store resubmission (optional)

Since the UI is bundled, JS/UI changes normally require a store update. If you
want web-style instant updates back, add **Capgo** (capgo.app) — a Capacitor
live-update service: `npm i @capgo/capacitor-updater`, follow their setup, and
each `npm run build:app` can be pushed to installed apps over the air. Native
plugin/permission changes still need a store release.

---

## Native features included

- **Branded splash + icon** — gold graduate mark on navy (sources in `assets/`;
  regenerate: `npx capacitor-assets generate --iconBackgroundColor "#0A1628" --splashBackgroundColor "#0A1628"`).
- **Status bar / back button / offline detection** — handled in `native.ts`.
- **Local notifications** — 9 AM follow-up reminders for reps (no server needed).
- **Haptics** — tab taps and PIN pad feedback via `@capacitor/haptics`.
- **Permissions** (AndroidManifest.xml): internet, camera + media (document
  uploads), notifications.

---

## CEO announcements (app news feed)

Admin dashboard → **Analytics** tab → *Student App Announcements* card:
publish title + body; students see it in **News from The Way** on the app Home.
Hide (soft-delete) any announcement with the eye-off button — hiding survives
state merges by design.
