# Donato

**Snap it. Sort it. Donate it.**

Donato is a mobile app for **iOS and Android**, built at **DubHacks '26**, that makes donating as easy as taking a photo. Point your camera at something you no longer need, whether that's a jacket, a chair, or a few cans of soup. Donato works out what it is and shows you the nearest places that will take it.

> 👩‍💻 **Want to run or work on the code?** See [DEVELOPMENT.md](DEVELOPMENT.md).

---

## The Problem

Most people want to donate, but the process gets in the way:

- **Which places take what?** Food banks don't take couches, and many thrift stores don't take mattresses or open food.
- **Where's the closest one?** Donation centers are spread out, and their policies are hard to find.
- **Is it even worth it?** When it takes this much effort, usable items end up in the trash.

Donato removes those steps so that giving something away takes less effort than throwing it out.

## How It Works

1. 📸 **Snap.** Take a photo of your item, or upload one from your photo library.
2. 🧠 **Identify.** Donato recognizes your items with Google Vision and sorts them into categories, from clothing and furniture to electronics, books, and food. Photograph a whole donation pile and it picks every kind of item it sees. Tap to add or remove categories if it guesses wrong.
3. 📍 **Locate.** Donato uses your location to find nearby places that accept *those items*, not just the closest donation center. Places that take everything in your pile come first.
4. 🧭 **Go.** See results on a map and in a list sorted by distance, then tap **Directions** to open Apple Maps or Google Maps.

## What You Can Donate

| Category | Examples | Where it goes |
| --- | --- | --- |
| 👕 Clothing & shoes | Jackets, jeans, sneakers, bags | Goodwill, St. Vincent de Paul, Treehouse, WestSide Baby |
| 🛋️ Furniture | Chairs, sofas, tables, dressers | Goodwill (Ballard, Shoreline), Habitat for Humanity stores |
| 🍳 Kitchen & household | Mugs, pans, lamps, blankets, small appliances | Goodwill, St. Vincent de Paul, Assistance League |
| 📱 Electronics | Phones, laptops, headphones, TVs | PCs for People, Goodwill |
| 📚 Books, toys & games | Books, DVDs, stuffed animals, LEGO, puzzles, board games | Friends of the Seattle Public Library, WestSide Baby, KidVantage, Goodwill |
| ⚽ Sports & outdoors | Bikes, tents, skis, outdoor gear | Bike Works, The Mountaineers, Value Village |
| 🎸 Musical instruments | Guitars, violins, keyboards | Ted Brown Music, Music4Life, Seattle JazzED |
| 🥫 Food | Canned goods, pasta, cereal | Food banks |

Donato covers **all of Washington State**, with the most detail in the Seattle area.

## Try It

Donato is a hackathon project and isn't in the App Store or Google Play yet. To try it:

1. **Install Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent). If you already have it, update it to the latest version.
2. **Create a free Expo account** at [expo.dev/signup](https://expo.dev/signup), then open Expo Go and sign in.
3. **Ask a team member for the QR code** (they'll show it on their laptop).
4. **Scan it:**
   - **iPhone:** open the regular **Camera** app, point it at the QR code, and tap the **Open in Expo Go** banner.
   - **Android:** open **Expo Go** and tap **Scan QR code**.
5. **Wait for it to load.** The first load takes about 30 seconds.
6. **Allow access** when asked. On iPhone, tap **Allow** for *local network* access, or the app can't connect. Then allow the camera and location. The prompts say "Expo Go" instead of "Donato". That's expected.

## Privacy

- **No account needed.** There's no sign-up or login.
- **Photos aren't saved.** Your photo is sent to Google Vision to identify the item, then discarded. Donato doesn't store or upload it anywhere else.
- **Your location stays on your phone.** It's only used to sort nearby places by distance. If you don't allow location access, Donato shows distances from the University of Washington instead.

## Good to Know

Donato lists about **480 donation spots across Washington**:

- **About 40 spots our team checked by hand** against each organization's own website in October 2026. These have the most detailed notes.
- **About 440 more from public data:** [OpenStreetMap](https://www.openstreetmap.org) (statewide), the City of Seattle's food bank list, and King County's reuse directory. Each one shows its source.

Hours and what they accept change, so tap **Donation info** or **Call** before dropping off.

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).

## Roadmap

- [x] Statewide directory from public datasets
- [ ] "Open now" badges from structured hours
- [ ] Perishable vs. non-perishable food detection
- [ ] Detect multiple items in a single photo
- [ ] Pickup scheduling for large furniture
- [ ] Item condition check (e.g., "too worn to donate → find textile recycling")
- [ ] Real-time needs from partner organizations ("This shelter needs winter coats")
- [ ] Donation history and impact tracking

## Built With

React Native · Expo · TypeScript · Google Cloud Vision · React Native Maps

## Team

Built with 💚 at **DubHacks '26** by:

- Nina Marie Uchtmann
- Priyanka Mungra
- Emily
- Veer
