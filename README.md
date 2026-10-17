# Donato

**Snap it. Sort it. Donate it.**

Donato is a cross-platform mobile app for **iOS and Android**, built for **DubHacks '26**, that makes donating as easy as taking a photo. Point your camera at something you no longer need, whether that's a jacket, a chair, or a few cans of soup. Donato works out what it is and shows you the nearest places that will take it.

---

## The Problem

Most people want to donate, but the process gets in the way:

- **Which places take what?** Food banks don't take couches, and many thrift stores don't take mattresses or open food.
- **Where's the closest one?** Donation centers are spread out, and their hours and policies are hard to find.
- **Is it even worth it?** When it takes this much effort, usable items end up in the trash.

Donato removes those steps so that giving something away takes less effort than throwing it out.

## How It Works

1. **Snap.** Take a photo of your item with the in-app camera, or upload one from your photo library.
2. **Identify.** Donato sends the photo to the [Google Cloud Vision API](https://cloud.google.com/vision), maps the returned labels and objects to a donation category (clothing, furniture, food, and more) and notes details that affect where it can go, such as perishable vs. non-perishable food.
3. **Locate.** Using your device's location, Donato finds nearby donation centers, food banks, shelters, and drop-off points that accept that kind of item.
4. **Go.** Browse results on a map or in a list sorted by distance, check hours and accepted items, and get directions with one tap.

## Features

- 📱 **Cross-platform.** One codebase runs natively on iOS and Android.
- 📸 **Camera-first capture.** Photograph items directly in the app or pick from your photo library.
- 🧠 **Item recognition with Google Vision.** Uses Cloud Vision label and object detection to sort items into categories:
  - 👕 **Clothing and shoes**
  - 🛋️ **Furniture and household goods**
  - 🥫 **Food** (non-perishable and perishable)
- 📍 **Location-aware search.** Finds the nearest *applicable* locations, not just the nearest ones.
- 🗺️ **Map and list views.** Distance, hours, contact info, and accepted items at a glance.
- 🧭 **One-tap directions.** Opens turn-by-turn navigation in Apple Maps or Google Maps.
- 🔒 **Privacy-conscious.** Location is used only to find nearby centers and is never shared.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React Native with [Expo](https://expo.dev) |
| Language | TypeScript |
| Navigation | Expo Router |
| Camera and photo upload | `expo-camera`, `expo-image-picker` |
| Item recognition | Google Cloud Vision API (label and object detection) |
| Location | `expo-location` |
| Maps and places | `react-native-maps`, Google Places API |
| Builds | EAS Build |

> _Update this table to match the final implementation._

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+ and npm
- The [Expo Go](https://expo.dev/go) app on your iOS or Android phone, **or** a simulator/emulator:
  - iOS Simulator (macOS with Xcode)
  - Android Emulator (Android Studio)
- A Google Cloud project with these APIs enabled:
  - **Cloud Vision API** (item recognition)
  - **Places API** (finding donation centers)
  - **Maps SDK for Android** (Android maps)

### Setup

1. **Clone the repo and install dependencies**
   ```bash
   git clone <repo-url>
   cd Donato
   npm install
   ```

2. **Add your API keys.** Create a `.env` file in the project root (it is gitignored):
   ```bash
   EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_vision_api_key
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_places_api_key
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
   ```
   > ⚠️ `EXPO_PUBLIC_` variables are bundled into the app, so anyone with the app can extract them. That's fine for a hackathon demo, but restrict each key to its API in the Google Cloud Console. Before a public release, move Vision calls behind a small backend (e.g., a Cloud Function) so the key stays on the server.

3. **Start the dev server**
   ```bash
   npx expo start
   ```
   - Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS) to run on your phone.
   - Press `i` to open the iOS Simulator or `a` to open the Android Emulator.

4. **Grant permissions** for camera, photos, and location when prompted.

### Building for Devices

```bash
npm install -g eas-cli
eas build --platform ios       # iOS build
eas build --platform android   # Android build
```

## Permissions

| Permission | iOS | Android | Why |
| --- | --- | --- | --- |
| Camera | `NSCameraUsageDescription` | `CAMERA` | Take photos of donation items |
| Location | `NSLocationWhenInUseUsageDescription` | `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Find donation centers near you |
| Photo library | `NSPhotoLibraryUsageDescription` | `READ_MEDIA_IMAGES` | Upload existing photos |

Permission strings are configured in `app.json` through the Expo config plugins.

## Project Structure

```
Donato/
├── app/                   # Screens and routes (Expo Router)
│   ├── index.tsx          # Home / capture screen
│   ├── results.tsx        # Nearby donation centers (map + list)
│   └── center/[id].tsx    # Donation center details
├── components/            # Reusable UI components
├── services/
│   ├── vision.ts          # Google Cloud Vision API client
│   ├── classify.ts        # Maps Vision labels to donation categories
│   ├── location.ts        # Device location helpers
│   └── places.ts          # Nearby donation-center search
├── constants/             # Categories, colors, config
├── assets/                # Icons, splash screen, images
├── app.json               # Expo config (name, permissions, plugins)
└── package.json
```

## Roadmap

- [ ] Detect multiple items in a single photo
- [ ] Pickup scheduling for large furniture
- [ ] Item condition check (e.g., "too worn to donate → find textile recycling")
- [ ] Donation history and impact tracking
- [ ] Real-time needs from partner organizations ("This shelter needs winter coats")
- [ ] Web version

## Team

Built with 💚 at **DubHacks '26** by:

- Nina Marie Uchtmann
- Priyanka Mungra
- Emily
- Veer

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
