const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
const ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const TIMEOUT_MS = 15000;

export const hasVisionKey = Boolean(API_KEY);

export type VisionLabel = { description: string; score: number };

/**
 * Sends a base64 JPEG to Google Cloud Vision and returns label and object
 * detections, highest confidence first. The photo is not stored anywhere.
 */
export async function detectLabels(base64Image: string): Promise<VisionLabel[]> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GOOGLE_VISION_API_KEY');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    throw new Error(
      controller.signal.aborted
        ? 'Google Vision took too long to respond. Check your connection and try again.'
        : "Couldn't reach Google Vision. Check your internet connection.",
    );
  } finally {
    clearTimeout(timeout);
  }

  const json = await res.json();
  const result = json.responses?.[0];
  const apiError = json.error?.message ?? result?.error?.message;
  if (!res.ok || apiError) {
    if (__DEV__) console.warn('[vision] API error:', apiError ?? res.status);
    throw new Error(friendlyError(apiError ?? `HTTP ${res.status}`));
  }

  const labels: VisionLabel[] = (result?.labelAnnotations ?? []).map((l: any) => ({
    description: l.description,
    score: l.score,
  }));
  const objects: VisionLabel[] = (result?.localizedObjectAnnotations ?? []).map((o: any) => ({
    description: o.name,
    score: o.score,
  }));

  const all = [...objects, ...labels].sort((a, b) => b.score - a.score);
  if (__DEV__) console.log('[vision] detected:', all.map((l) => `${l.description} (${l.score.toFixed(2)})`).join(', '));
  return all;
}

/** Turns Google's error messages for common setup mistakes into actionable hints. */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('api key not valid')) {
    return 'Your Vision API key is invalid. Check EXPO_PUBLIC_GOOGLE_VISION_API_KEY in .env, then restart with `npx expo start --clear`.';
  }
  if (m.includes('billing')) {
    return 'Billing is not enabled for your Google Cloud project. Link a billing account in the Cloud console.';
  }
  if (m.includes('has not been used') || m.includes('is disabled')) {
    return 'The Cloud Vision API is not enabled for your project. Enable it in the Cloud console and wait a minute.';
  }
  if (m.includes('blocked')) {
    return 'Your API key is restricted from calling Cloud Vision. Add "Cloud Vision API" to the key\'s API restrictions.';
  }
  return `Google Vision error: ${message}`;
}
