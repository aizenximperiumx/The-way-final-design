# 🚀 Publishing The Way app — complete checklist

Everything code-side is **done and committed**. What remains is accounts,
uploads and forms — this file walks through all of it. Listing text + images
are paste-ready in [`store/`](store/LISTING.md).

**The only real costs:** Google Play **$25 once** · Apple **$99/year**.

---

## 0. One-time: protect your signing key 🔑

The Android release is signed with `android/theway-upload.keystore`
(password in `KEYSTORE-BACKUP.txt` at the repo root — both files are
**gitignored, they exist only on this PC**).

> **Back up `android/theway-upload.keystore` + `KEYSTORE-BACKUP.txt` now**
> (private cloud drive / USB). With Play App Signing enabled (step 2) Google
> can rescue a lost upload key, but don't rely on it.

## 1. Build the signed release — two ways

**A. In the cloud (recommended — no Android Studio needed):**
1. GitHub repo → Settings → Secrets and variables → Actions → add 4 secrets:
   - `ANDROID_KEYSTORE_BASE64` → paste the contents of `android/keystore-base64.txt`
   - `ANDROID_KEYSTORE_PASSWORD` → the password from `KEYSTORE-BACKUP.txt`
   - `ANDROID_KEY_ALIAS` → `theway`
   - `ANDROID_KEY_PASSWORD` → same password
2. Repo → **Actions → "Android release build" → Run workflow**.
3. When it finishes (~5–8 min), open the run → **Artifacts →
   `theway-android-release`** → download. Inside: `theway.aab` (for Play) and
   `theway.apk` (for direct installs from theway.ge — free distribution).

**B. Locally:** install Android Studio (brings Java 21 + SDK), then
`npm run build:app && cd android && gradlew.bat bundleRelease` —
output at `android/app/build/outputs/bundle/release/app-release.aab`
(signing picks up `android/keystore.properties` automatically).

## 2. Google Play ($25 one-time)

1. **play.google.com/console** → sign up. Choose **Organization** account if
   possible (needs a free D-U-N-S number for The Way — dnb.com; personal
   accounts must run a 14-day / 12-tester closed test before going public).
2. Create app → *The Way — Study in Georgia* → App (not game) → Free.
3. Accept **Play App Signing** when uploading the first `.aab` (default — Google
   safeguards the final signing key).
4. **Store listing**: paste title/descriptions from `store/LISTING.md`; upload
   `store/play-icon-512.png`, `store/feature-graphic.png`, and the 8 images in
   `store/screens/` in order.
5. **Data safety** + **Content rating** questionnaires — answers are written
   out in `store/LISTING.md`.
6. Privacy policy URL: `https://theway.ge/privacy` (live).
7. Production → Create release → upload `theway.aab` → roll out.
8. First review: usually 1–7 days.

## 3. Apple App Store ($99/year + a Mac)

1. **developer.apple.com** → enroll (D-U-N-S again for organization).
2. On any Mac (borrowed / MacinCloud ~$1 h / Codemagic free CI):
   ```bash
   npm install && npm run build:app
   npx cap add ios && npx cap sync ios
   npx capacitor-assets generate --iconBackgroundColor "#0A1628" --splashBackgroundColor "#0A1628"
   npx cap open ios     # Xcode: set your Team, then Product → Archive → Distribute
   ```
3. App Store Connect → new app → bundle id `ge.theway.app` → paste the same
   listing copy; screenshots: reuse `store/screens/` (Apple accepts any
   aesthetic size ≥ required resolutions — or recapture at 1290×2796).
4. Fill **App Privacy** labels + add the **demo student account** to App Review
   notes (both prepared in `store/LISTING.md`).
5. Review: usually 1–3 days. The app is a real native bundle with exclusive
   features (not a website wrapper), which is what Apple's guideline 4.2 checks.

## 4. After approval

- **Push notifications**: 3-step Firebase setup in [MOBILE.md](MOBILE.md) —
  do it before or after launch; the app works fine without it.
- **Updates**: bump `versionCode`/`versionName` in `android/app/build.gradle`,
  re-run the workflow, upload the new `.aab`. Or wire **Capgo** (MOBILE.md) to
  ship UI changes instantly without store review.
- **Free Android distribution today**: put `theway.apk` on the website
  (e.g. `https://theway.ge/app-download`) — students can install it directly
  while Play review runs.
