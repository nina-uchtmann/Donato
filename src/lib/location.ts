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
