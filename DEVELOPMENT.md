# Donato: Developer Guide

Everything you need to run, test, and work on Donato. For what the app does, see [README.md](README.md).

## Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Setting Up Expo Go](#setting-up-expo-go)
- [Setting Up Google Vision](#setting-up-google-vision)
- [Testing With Your Team](#testing-with-your-team)
- [Project Structure](#project-structure)
- [How It Works Under the Hood](#how-it-works-under-the-hood)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Git Workflow](#git-workflow)
- [Building for the App Stores](#building-for-the-app-stores)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React Native with [Expo](https://expo.dev) **SDK 57** |
| Language | TypeScript |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routes in `src/app/`) |
| Camera and photo upload | `expo-image-picker` |
| Item recognition | Google Cloud Vision API (label and object detection) |
| Location | `expo-location` |
| Maps | `react-native-maps` (Apple Maps on iOS, Google Maps on Android) |
| Donation center data | Bundled JSON (`src/data/centers.json`) |
| Backend | None. Everything runs on the phone. |

> **Why SDK 57?** The App Store and Google Play versions of Expo Go support SDK 57. SDK 58 is still in beta, so don't upgrade until Expo Go supports it. Then run `npx expo install expo@^58.0.0 --fix`.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+ and npm (on macOS: `brew install node`)
- The **Expo Go** app on your phone, **or** a simulator/emulator:
  - iOS Simulator (macOS with Xcode)
  - Android Emulator (Android Studio)
- An [Expo account](https://expo.dev/signup). Expo Go requires you to sign in.

### Setup

1. **Clone the repo and install dependencies**
   ```bash
   git clone https://github.com/nina-uchtmann/Donato.git
   cd Donato
   npm install
   ```

2. **Add your API key (optional).**
   ```bash
   cp .env.example .env
   ```
   Then put your key in `.env` (see [Setting Up Google Vision](#setting-up-google-vision)). Without a key, the app still runs. You just pick the item's category by hand.

3. **Run the app on your phone.** Follow [Setting Up Expo Go](#setting-up-expo-go) below.

### Scripts

| Command | What it does |
| --- | --- |
| `npx expo start` | Start the dev server |
| `npx expo start --clear` | Start with a cleared cache. Use this after editing `.env`. |
| `npm run typecheck` | Check TypeScript types |
| `npm run test:vision [photo.jpg]` | Check your Google Vision key from the terminal |
| `npx expo-doctor` | Diagnose dependency and config problems |
| `npx expo install <package>` | Add a package at an SDK-compatible version. Use this instead of `npm install`. |

## Setting Up Expo Go

Expo Go is a free app that runs Donato on your phone straight from your laptop, with no App Store build needed. When you save a file, the app updates on your phone within seconds.

### 1. Create an Expo account (one time)

1. Go to [expo.dev/signup](https://expo.dev/signup) and create a free account.
2. Verify your email address.

Each teammate needs their own account. Expo Go requires everyone to sign in.

### 2. Install Expo Go on your phone (one time)

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) (iPhone) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android).
2. If it's already installed, **update it**. An old Expo Go is the most common cause of "incompatible version" errors.
3. Open Expo Go and **sign in** with your Expo account.

### 3. Sign in on your laptop (one time)

In the `Donato` folder, run:
```bash
npx expo login
```
Enter the same username or email and password you used in the app. To check that it worked:
```bash
npx expo whoami
```
It should print your Expo username.

### 4. Start the dev server

```bash
npx expo start
```
After a few seconds, the terminal shows a **QR code** and a line like `› Metro waiting on exp://192.168.x.x:8081`. Keep this terminal open. Closing it stops the app.

**On campus, hackathon, or other restricted Wi-Fi**, or if your phone isn't on the same network as your laptop, use tunnel mode:
```bash
npx expo start --tunnel
```
The first time, Expo may ask to install `@expo/ngrok`. Type `y` and press Enter. Tunnel mode is a bit slower, but it works on any network.

### 5. Open the app on your phone

- **iPhone:** open the regular **Camera** app (not Expo Go), point it at the QR code, and tap the **Open in Expo Go** banner.
- **Android:** open **Expo Go**, tap **Scan QR code**, and point it at the QR code.

You may also see the project listed under **Development servers** on Expo Go's home screen. Tap it to open it without scanning.

### 6. Allow permissions

- **iPhone, first launch only:** tap **Allow** when Expo Go asks to find devices on your **local network**. If you tap Don't Allow, the app can't reach your laptop. To fix that, go to **Settings → Expo Go → Local Network** and turn it on.
- **Camera, photos, and location:** allow them when Donato asks. The prompts say "Expo Go" instead of "Donato". That's normal while you're developing.
- To change a permission later, go to **Settings → Expo Go** (iPhone) or **Settings → Apps → Expo Go → Permissions** (Android).

### 7. Develop

The first load takes about 30 seconds while the JavaScript is bundled. After that:

| Action | How |
| --- | --- |
| See code changes | Save the file. The app refreshes automatically. |
| Reload the app | Press `r` in the terminal |
| Open the dev menu | Shake your phone, or press `m` in the terminal |
| See `console.log` output | It appears in the terminal running `npx expo start` |
| Pick up `.env` changes | Press `Ctrl+C`, then run `npx expo start --clear` |
| Stop the server | Press `Ctrl+C` in the terminal |

### Using a simulator instead (optional)

- **iOS Simulator (macOS only):** install Xcode from the Mac App Store, open it once to accept the license, then press `i` in the Expo terminal.
- **Android Emulator:** install [Android Studio](https://developer.android.com/studio), create a virtual device in **Device Manager**, start it, then press `a` in the Expo terminal.

Simulators don't have a real camera, so use **Upload** with a saved photo to test detection.

### If the app won't connect

| Problem | Fix |
| --- | --- |
| "Project is incompatible with this version of Expo Go" | Update Expo Go. The project uses SDK 57 (see [Tech Stack](#tech-stack)). |
| Spinner forever, or "Could not connect to development server" | Use `npx expo start --tunnel`. Also check that the laptop and phone are on the same Wi-Fi and any VPN is off. |
| iPhone can't connect even on the same Wi-Fi | Turn on **Settings → Expo Go → Local Network**. |
| macOS shows "Do you want node to accept incoming connections?" | Click **Allow**. If you clicked Deny, allow `node` in **System Settings → Network → Firewall → Options**. |
| Asked to sign in, or the project doesn't appear | Make sure `npx expo whoami` shows you're signed in, and sign in to the same account in Expo Go. |
| Red error screen | Read the message. It usually points to the file and line. Fix the code and save, or press `r` to reload. |

## Setting Up Google Vision

Donato uses the [Cloud Vision API](https://cloud.google.com/vision) to identify items. The team shares one Google Cloud project, which already has billing and the Vision API turned on. **Don't create your own project.**

1. **Ask Nina to add you to the Donato project.** Send Nina the Google account email you want to use, and Nina will give you access to create API keys.
2. **Open the project.** Go to the [Google Cloud console](https://console.cloud.google.com/), sign in with that Google account, and pick **Donato** from the project picker at the top. If you don't see it, check that you're signed in to the right account, or ask Nina to confirm you were added.
3. **Create your own API key.** Go to **APIs & Services → Credentials → Create credentials → API key**. Under **API restrictions**, choose **Restrict key** and select only **Cloud Vision API**. Name the key after yourself (e.g., `donato-priyanka`) so the team can tell keys apart.
4. **Add the key to `.env`** (never `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and paste your key after the `=`:
   ```
   EXPO_PUBLIC_GOOGLE_VISION_API_KEY=AIza...
   ```
5. **Test the key from the terminal.**
   ```bash
   npm run test:vision                        # uses the app icon
   npm run test:vision ~/Desktop/shirt.jpg    # or any photo
   ```
   You should see `✓ Your key works!` and a list of labels.
6. **Restart Expo** so it picks up the key: `npx expo start --clear`.

| Error | Fix |
| --- | --- |
| `API key not valid` | Check for typos in `.env`, then restart with `--clear` |
| `Requests to this API … are blocked` | Add Cloud Vision API to the key's API restrictions (step 3) |
| `billing to be enabled` or `has not been used in project … or it is disabled` | Your key may be from a different project. Make sure **Donato** is selected in step 2. If it is, tell Nina. |

> Don't use **Application restrictions** (iOS apps / Android apps) during development. Expo Go runs your code inside Expo's own app, so Google would reject the requests.

### 🔐 Keeping the key safe

- **Never commit a real key.** `.env` is gitignored. `.env.example` is committed, so its value must stay blank.
- **Never paste a key in group chats or issues.** If you have to share one, send it privately (a direct message or a password manager).
- **`EXPO_PUBLIC_` variables are bundled into the app**, so anyone with the app can extract them. That's acceptable for a hackathon demo. Before a public release, move Vision calls behind a small backend (such as a Cloud Function).
- **If your key is exposed**, delete it in **Credentials**, create a new one, and let Nina know.

## Testing With Your Team

**Option 1: scan the host's QR code (no setup)**
Expo builds the key into the app on the host's laptop and sends it to each phone, so testers don't need a key or a clone of the repo.
1. One person runs `npx expo start --tunnel`.
2. Everyone else scans the QR code in Expo Go.
3. If Expo Go won't load the project, add teammates to the Expo account under **expo.dev → Organizations → Members**.

This only works while the host's laptop is running the dev server.

**Option 2: everyone runs it locally (for developers)**
Each teammate follows [Setting Up Google Vision](#setting-up-google-vision): ask Nina for access, create your **own** key in the Donato project, put it in your own `.env`, and run `npm run test:vision`.

Separate keys let you turn off one person's key without breaking everyone else's.

## Project Structure

```
Donato/
├── src/
│   ├── app/                   # Screens and routes (Expo Router). Every file is a screen.
│   │   ├── _layout.tsx        # Navigation stack and header styling
│   │   ├── index.tsx          # Capture screen: photo, detection, category
│   │   └── results.tsx        # Nearby donation centers (map + list)
│   ├── lib/
│   │   ├── vision.ts          # Google Cloud Vision API client
│   │   ├── classify.ts        # Maps Vision labels to donation categories
│   │   └── location.ts        # Device location + distance helpers
│   ├── data/
│   │   └── centers.json       # Donation centers and what they accept (sample data)
│   └── constants/
│       └── categories.ts      # Categories and colors
├── scripts/
│   └── test-vision.mjs        # Checks your Vision API key from the terminal
├── assets/                    # Icons and splash screen
├── .env.example               # Template for API keys. Keep values blank.
├── app.json                   # Expo config (name, permissions, plugins)
├── AGENTS.md                  # Notes for AI coding assistants
└── package.json
```

Import from `src/` using the `@/` alias, for example `import { classify } from '@/lib/classify'`.

## How It Works Under the Hood

1. **Capture** (`src/app/index.tsx`): `expo-image-picker` opens the camera or photo library and returns a base64 JPEG at 50% quality to keep uploads small.
2. **Detect** (`src/lib/vision.ts`): the image goes to Cloud Vision with `LABEL_DETECTION` and `OBJECT_LOCALIZATION`. Labels from both are merged and sorted by confidence. Requests time out after 15 seconds. In development, detected labels are logged to the Expo terminal as `[vision] detected: …`.
3. **Classify** (`src/lib/classify.ts`): each label is matched against keyword lists for each category, weighted by confidence. The highest-scoring category wins. The user can always override it.
4. **Locate** (`src/lib/location.ts`): `expo-location` gets the phone's position. If permission is denied, it falls back to the University of Washington.
5. **Rank** (`src/app/results.tsx`): centers are filtered by category, sorted by straight-line distance (haversine formula), and shown on a map and in a list.

## Common Tasks

### Add a donation center
Add an entry to `src/data/centers.json`:
```json
{
  "id": "unique-kebab-case-id",
  "name": "Example Food Bank",
  "address": "123 Main St, Seattle, WA",
  "latitude": 47.6062,
  "longitude": -122.3321,
  "accepts": ["food"]
}
```
`accepts` can include `"clothing"`, `"furniture"`, and `"food"`. To get coordinates, right-click the location in Google Maps.

**Data sources for the full directory:**
- [King County "What Do I Do With…?"](https://kingcounty.gov/tools/what-do-i-do-with) ([dataset](https://catalog-beta.data.gov/dataset/what-do-i-do-with-recycling-options-in-king-county)): maps materials to the places that accept them
- [Emergency Food and Meals, Seattle and King County](https://cos-data.seattle.gov/d/kkzf-ntnu): food banks with coordinates (CSV/JSON)

### Improve item detection
If Vision returns a label that doesn't match any category, check the `[vision] detected:` log and add the word to the right list in `KEYWORDS` in `src/lib/classify.ts`.

### Add a new category
1. Add it to the `Category` type and `CATEGORIES` in `src/constants/categories.ts`.
2. Add a keyword list in `src/lib/classify.ts`.
3. Tag centers with it in `src/data/centers.json`.

### Permissions
Permission prompts are configured in `app.json` through Expo config plugins:

| Permission | iOS | Android | Why |
| --- | --- | --- | --- |
| Camera | `NSCameraUsageDescription` | `CAMERA` | Take photos of donation items |
| Location | `NSLocationWhenInUseUsageDescription` | `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Find donation centers nearby |
| Photo library | `NSPhotoLibraryUsageDescription` | `READ_MEDIA_IMAGES` | Upload existing photos |

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Expo Go won't connect or load | See [If the app won't connect](#if-the-app-wont-connect). |
| "Auto-detect is off" banner | No key in `.env`, or Expo was started before you added it. Restart with `npx expo start --clear`. |
| Vision error in the app | Run `npm run test:vision` and check the [error table](#setting-up-google-vision). |
| Wrong category detected | Add the missing label to `src/lib/classify.ts` (see [Improve item detection](#improve-item-detection)). |
| Distances measured from UW | Location permission was denied. Enable it in your phone's Settings → Expo Go. |
| Weird dependency errors | Run `npx expo-doctor`, then `npx expo install --fix`. |

## Git Workflow

- `main` holds the stable version. Do feature work on a branch (for example `vision`) and open a pull request into `main`.
- Before committing, run `npm run typecheck` and check `git status` to confirm `.env` isn't listed.
- **Never** stage `.env`, and never put a real key in `.env.example`.

## Building for the App Stores

Expo Go is enough for development and demos. To make standalone builds, use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx eas-cli@latest build --platform ios
npx eas-cli@latest build --platform android
```

Before releasing, move the Vision API key behind a backend (see [Keeping the key safe](#-keeping-the-key-safe)), and add a Google Maps API key for Android map tiles.
