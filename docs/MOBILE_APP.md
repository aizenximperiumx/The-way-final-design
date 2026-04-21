# Mobile App (Later)

This repo is already prepared to become a real iOS/Android app using Capacitor (without rewriting the frontend).

## What exists in the repo
- `android/` (Android Studio project)
- `ios/` (Xcode project)
- `capacitor.config.ts`

## Workflow
- Build + sync web to native:
  - `npm run build:mobile`
- Open native projects:
  - `npm run cap:open:android`
  - `npm run cap:open:ios`

## Later upgrades (when you decide to ship)
- Push notifications
- Deep links (open a specific application/chat)
- Biometric unlock for staff
- Offline caching for key screens
- Store assets: icons, screenshots, privacy policy, App Store / Play Console setup

