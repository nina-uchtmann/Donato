const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
const ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

export const hasVisionKey = Boolean(API_KEY);

export type VisionLabel = { description: string; score: number };

/**
 * Sends a base64 JPEG to Google Cloud Vision and returns label and object
 * detections, highest confidence first. The photo is not stored anywhere.
 */
export async function detectLabels(base64Image: string): Promise<VisionLabel[]> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GOOGLE_VISION_API_KEY');

  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  const json = await res.json();
  const result = json.responses?.[0];
  if (!res.ok || result?.error) {
    throw new Error(result?.error?.message ?? json.error?.message ?? `Vision API error ${res.status}`);
  }

  const labels: VisionLabel[] = (result.labelAnnotations ?? []).map((l: any) => ({
    description: l.description,
    score: l.score,
  }));
  const objects: VisionLabel[] = (result.localizedObjectAnnotations ?? []).map((o: any) => ({
    description: o.name,
    score: o.score,
  }));

  return [...objects, ...labels].sort((a, b) => b.score - a.score);
}
