import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

/** Used when location permission is denied. University of Washington, home of DubHacks. */
export const FALLBACK_COORDS: Coords = { latitude: 47.6553, longitude: -122.3035 };

export async function getUserCoords(): Promise<{ coords: Coords; isFallback: boolean }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { coords: FALLBACK_COORDS, isFallback: true };

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
      isFallback: false,
    };
  } catch {
    return { coords: FALLBACK_COORDS, isFallback: true };
  }
}

/**
 * Turns a city, ZIP code, or address into coordinates using the phone's built-in
 * geocoder. Searches are assumed to be in Washington unless a state is given.
 * Returns null when nothing matches. Android needs location permission for this.
 */
export async function geocode(query: string): Promise<Coords | null> {
  const text = query.trim();
  if (!text) return null;
  const withState = /\b(wa|washington)\b|,\s*[a-z]{2}\b/i.test(text) ? text : `${text}, Washington`;
  const [match] = await Location.geocodeAsync(withState);
  return match ? { latitude: match.latitude, longitude: match.longitude } : null;
}

/** A short name for a spot, like "Fremont, Seattle" or "Spokane". Null if unknown. */
export async function placeName(coords: Coords): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (!place) return null;
    const area = place.district && place.district !== place.city ? place.district : null;
    return [area, place.city ?? place.subregion].filter(Boolean).join(', ') || place.name || null;
  } catch {
    return null;
  }
}

/** Great-circle distance in miles (haversine formula). */
export function distanceMiles(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
