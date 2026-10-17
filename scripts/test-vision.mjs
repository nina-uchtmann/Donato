// Checks your Google Vision API key from the terminal, without the phone.
// Usage: npm run test:vision [path/to/photo.jpg]
import { readFile } from 'node:fs/promises';

const key = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
if (!key) {
  console.error('✗ EXPO_PUBLIC_GOOGLE_VISION_API_KEY is not set. Add it to .env (see .env.example).');
  process.exit(1);
}

// With no photo given, the app icon is used, which is enough to confirm the key works.
const path = process.argv[2] ?? 'assets/icon.png';
const image = { content: (await readFile(path)).toString('base64') };
console.log(`Sending ${path} to Google Vision…`);

const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requests: [
      {
        image,
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
        ],
      },
    ],
  }),
});

const json = await res.json();
const error = json.error ?? json.responses?.[0]?.error;
if (!res.ok || error) {
  console.error(`✗ Google Vision returned an error (HTTP ${res.status}):\n  ${error?.message ?? JSON.stringify(json)}`);
  process.exit(1);
}

const result = json.responses[0];
console.log('\n✓ Your key works!\n');
for (const o of result.localizedObjectAnnotations ?? []) {
  console.log(`  object  ${o.name.padEnd(24)} ${(o.score * 100).toFixed(0)}%`);
}
for (const l of result.labelAnnotations ?? []) {
  console.log(`  label   ${l.description.padEnd(24)} ${(l.score * 100).toFixed(0)}%`);
}
