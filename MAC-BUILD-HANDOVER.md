# TUN BrewLab — Mac Handover Doc

## What you're building
Expo SDK 54 React Native app. iOS App Store build via EAS.

---

## 1. Pull the code

```bash
# Frontend
git clone https://github.com/lektrix313/brewlab.git
cd brewlab

# Backend (already deployed, but good to have locally)
git clone https://github.com/lektrix313/brewlab-api.git
```

---

## 2. Environment setup

### Required
- **Node 22+** (LTS)
- **Xcode 16+** (from Mac App Store)
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **CocoaPods**: `sudo gem install cocoapods`

### Login
```bash
eas login   # Use sodacreative Expo account
```

---

## 3. Install dependencies

```bash
cd brewlab
npm install
```

**Note**: If you see peer dependency warnings about React 19.1.0 vs 19.1.4/19.2.3, ignore them. The app builds and runs fine. Do NOT use `--legacy-peer-deps` unless the install actually fails.

---

## 4. Known issues / gotchas

### TypeScript stack overflow
`npx tsc --noEmit` crashes with "Maximum call stack size exceeded". This is a known issue with `@clerk/clerk-expo` type definitions conflicting with React 19 types.
- **Impact**: Type-checking is broken. Metro bundler works fine.
- **Workaround**: Skip type-checking. Rely on Metro + runtime testing.
- **Fix**: Not yet available. Clerk needs to update their types.

### iOS build prerequisites
You'll need an Apple Developer account ($99/year) to build for App Store / TestFlight.

---

## 5. Build commands

### Preview build (internal testing, no App Store needed)
```bash
cd brewlab
eas build --platform ios --profile preview
```
This builds an IPA for internal distribution. It does NOT require Apple Developer provisioning.

### TestFlight build (requires Apple Developer)
```bash
cd brewlab
eas build --platform ios --profile production
```
This will prompt you to set up:
- Apple Developer credentials
- App Store Connect API key
- Provisioning profiles

Follow the EAS interactive prompts. It handles most of the setup automatically.

### Android (if you want it too)
```bash
eas build --platform android --profile preview
```

---

## 6. App configuration

### Bundle ID
- **iOS**: `com.sodacreative.brewlab`
- **Android**: `com.sodacreative.brewlab`

### App icons
Already generated in `assets/`:
- `icon.png` — iOS App Store + Android launcher
- `splash-icon.png` — Splash screen
- `adaptive-icon.png` — Android adaptive foreground
- `favicon.png` — Web

### Splash background
`#F5F0E6` (cream). Defined in `app.json`.

---

## 7. Backend (already live)

| Endpoint | URL |
|----------|-----|
| API | `https://brewlab-api.beatjaxx.workers.dev` |
| D1 DB | `brewlab-db` |
| R2 Bucket | `brewlab-photos` |

### CORS origins allowed
- `http://localhost:8081`
- `http://localhost:19006`
- `https://tun.brewlab.app`
- `https://tun-app.pages.dev`

### Last deployed
Version `5d5154a7` — includes inventory, shopping list, batch costs, recipe fork, public feed.

### If you need to redeploy the backend
```bash
cd brewlab-api
npm install
npx wrangler deploy
```

---

## 8. Clerk auth

- **App**: `enhanced-toucan-28`
- **Publishable key**: `pk_test_ZW5oYW5jZWQtdG91Y2FuLTI4LmNsZXJrLmFjY291bnRzLmRldiQ`
- **Secret key**: Set as Wrangler secret (`CLERK_SECRET_KEY`)
- **JWKS URL**: Set as Wrangler secret (`CLERK_JWKS_URL`)

The publishable key is in:
- `brewlab/.env.local`
- `brewlab-api/wrangler.toml`

---

## 9. EAS project

- **Project ID**: `602c531c-7ed8-4057-8c45-986e7b0be083`
- **Owner**: `sodacreative`
- **Slugs**: `brewlab` (frontend)

---

## 10. Features in this build

| Feature | Status |
|--------|--------|
| Recipe builder + templates | Live |
| Batch tracking + gravity logging | Live |
| Brew day timers (mash, boil, cool, pitch) | Live |
| Fermentation curve + refit | Live |
| Push notifications | Live |
| Haptics | Live |
| BeerXML export | Live |
| Amazon affiliate links | Live |
| Inventory / Pantry | Live |
| Shopping list | Live |
| Cost tracking | Live |
| Recipe forking | Live |
| Public recipe feed | Live |
| Batch A/B comparison | Live |
| Onboarding voice (ElevenLabs) | Live |
| App icons | Done |

---

## 11. Quick test before build

```bash
cd brewlab
npx expo start
```
Run in iOS simulator to verify everything works. Check:
- Onboarding plays voice
- Auth flow works
- Recipe detail shows cost estimate
- Inventory tab works
- Batch comparison screen loads

---

## 12. Files you should NOT commit

Already in `.gitignore`, but double-check:
- `node_modules/`
- `.env.local`
- `android/keystore.jks` (if generated)
- `.wrangler/`

---

## Questions?

If something breaks during the Mac build, the most common fixes are:
1. `cd ios && pod install` — if native modules are missing
2. `npx expo prebuild --clean` — if iOS project is out of sync
3. `eas credentials` — if signing/provisioning fails
