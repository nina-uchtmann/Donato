// Builds src/data/imported.json from public datasets covering Washington State.
//
// Usage: npm run import:data
//
// Sources (in priority order when two describe the same place):
//   1. src/data/centers.json   hand-checked by the team; never modified, always wins
//   2. Seattle open data       "Emergency Food and Meals Seattle and King County" (food banks)
//   3. King County             "What do I do with...?" (free drop-off reuse/donation sites)
//   4. OpenStreetMap           food banks, charity shops, and clothing donation bins statewide
//
// If a source fails to download, its entries from the previous imported.json are
// kept, so a flaky server never wipes data. OpenStreetMap data is © OpenStreetMap
// contributors, available under the ODbL; the app must show that attribution.
//
// Places without a street address get one from OpenStreetMap's Nominatim reverse
// geocoder (1 request per second, per its usage policy). Results are saved in
// scripts/geocode-cache.json, so later runs only look up new places.
// Pass --no-geocode to skip this step.
import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../src/data/imported.json', import.meta.url);
const CURATED = new URL('../src/data/centers.json', import.meta.url);
const GEOCODE_CACHE = new URL('./geocode-cache.json', import.meta.url);
const SKIP_GEOCODE = process.argv.includes('--no-geocode');
const USER_AGENT = 'Donato/1.0 (DubHacks 2026 donation finder; github.com/nina-uchtmann/Donato)';

/** Rough bounding box for Washington State, used to drop bad coordinates. */
const WA = { south: 45.54, north: 49.01, west: -124.85, east: -116.91 };

// --- Category rules ---------------------------------------------------------

const ALL_GOODS = ['clothing', 'household', 'books', 'toys'];

/**
 * Known donation organizations and what their stores usually take. Matched against
 * the place's name, brand, or operator. Order matters: the first match wins.
 */
const ORGANIZATIONS = [
  { match: /habitat for humanity|\brestore\b/i, accepts: ['furniture', 'household'] },
  { match: /goodwill/i, accepts: ['clothing', 'household', 'electronics', 'books', 'toys', 'sports'] },
  { match: /salvation army/i, accepts: ['clothing', 'furniture', 'household', 'books', 'toys'] },
  { match: /(st\.?|saint) vincent de paul/i, accepts: ['clothing', 'furniture', 'household', 'books', 'toys'] },
  { match: /deseret/i, accepts: ['clothing', 'furniture', 'household', 'electronics', 'books', 'toys'] },
  { match: /value village|savers/i, accepts: ['clothing', 'household', 'books', 'toys', 'sports'] },
  { match: /northwest center|big blue truck/i, accepts: ['clothing', 'household', 'books', 'toys'] },
  { match: /big brothers big sisters/i, accepts: ['clothing', 'household', 'books', 'toys'] },
  { match: /treehouse/i, accepts: ['clothing', 'books', 'toys'] },
  { match: /friends of the .*library|library book ?(sale|store|shop)/i, accepts: ['books'] },
];

function organizationAccepts(...names) {
  const text = names.filter(Boolean).join(' ');
  const accepts = ORGANIZATIONS.find((o) => o.match.test(text))?.accepts;
  return accepts && [...accepts]; // copy, since merging adds to each place's list
}

/** King County material names mapped to Donato categories. */
const KC_MATERIALS = {
  'Clothing, Shoes, and Fabrics': 'clothing',
  Books: 'books',
  'Household Furniture': 'furniture',
  'Office Furniture': 'furniture',
  'Edible food for donation': 'food', // "Food" alone means food scraps for compost
  'Bicycles and Bicycle Parts': 'sports',
  'Small Household Appliances': 'household',
  'Computers, Laptops, Tablets': 'electronics',
  'Cell Phones and Smart Devices': 'electronics',
  'Gaming Devices': 'electronics',
  'Audio Video and Camera equipment': 'electronics',
};

/** King County mixes donation sites with recyclers, so every listing must mention reuse. */
const REUSE_WORDS = /donat|reuse|re-use|resale|resell|refurbish|thrift|charit|nonprofit|non-profit/i;

// --- Helpers -----------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(urls, options = {}, { attempts = 4, label }) {
  const list = Array.isArray(urls) ? urls : [urls];
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    for (const url of list) {
      try {
        const res = await fetch(url, {
          ...options,
          headers: { 'User-Agent': USER_AGENT, ...options.headers },
          signal: AbortSignal.timeout(240_000),
        });
        const text = await res.text();
        const body = text.trimStart();
        if (res.ok && (body.startsWith('{') || body.startsWith('['))) {
          return JSON.parse(text);
        }
        lastError = new Error(`${new URL(url).host} → HTTP ${res.status}: ${text.slice(0, 80).replace(/\s+/g, ' ')}`);
      } catch (e) {
        lastError = e;
      }
      console.log(`  … ${label}: ${lastError.message}`);
    }
    if (attempt < attempts - 1) {
      const wait = 10_000 * 2 ** attempt;
      console.log(`  … ${label}: retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  throw lastError;
}

function inWashington(lat, lon) {
  return lat >= WA.south && lat <= WA.north && lon >= WA.west && lon <= WA.east;
}

function slug(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function stripHtml(text = '') {
  return text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Shortens text to roughly `max` characters, ending on a sentence or word boundary. */
function clip(text, max = 180) {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  return sentence > max * 0.5 ? cut.slice(0, sentence + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

function cleanUrl(url) {
  if (!url) return undefined;
  const u = url.trim();
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function cleanPhone(phone) {
  const digits = (phone ?? '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (digits.length !== 10) return undefined;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Drops undefined/empty fields so the JSON stays small. */
function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)),
  );
}

// --- Source: OpenStreetMap ---------------------------------------------------

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const OVERPASS_QUERY = `
[out:json][timeout:180];
area["ISO3166-2"="US-WA"][admin_level=4]->.wa;
(
  nwr["amenity"="food_bank"](area.wa);
  nwr["social_facility"="food_bank"](area.wa);
  nwr["shop"="charity"](area.wa);
  nwr["shop"="second_hand"](area.wa);
  nwr["amenity"="recycling"]["recycling:clothes"="yes"](area.wa);
);
out center tags;`;

function osmAddress(t) {
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const city = t['addr:city'];
  if (street && city) return `${street}, ${city}, WA`;
  if (street) return `${street}, WA`;
  if (city) return `${city}, WA`;
  return undefined;
}

function fromOsm(el) {
  const t = el.tags ?? {};
  const latitude = el.lat ?? el.center?.lat;
  const longitude = el.lon ?? el.center?.lon;
  if (latitude == null || longitude == null) return null;
  if (t.disused === 'yes' || t['disused:shop'] || t.opening_hours === 'closed') return null;

  const names = [t.name, t.brand, t.operator];
  const isFoodBank = t.amenity === 'food_bank' || t.social_facility === 'food_bank';
  const isClothesBin = t.amenity === 'recycling';
  let accepts;
  let name = t.name;
  let note;

  if (isFoodBank) {
    if (/\bWIC\b/.test(t.name ?? '')) return null; // nutrition benefit offices, not food banks
    accepts = ['food'];
    note = 'Call ahead to confirm they accept food donations.';
  } else if (isClothesBin) {
    accepts = ['clothing'];
    name = t.name ?? (t.operator ? `${t.operator} clothing bin` : 'Clothing donation bin');
    note = 'Unattended donation bin. Bag clothing and shoes; nothing left outside the bin.';
  } else if (t.shop === 'charity') {
    accepts = organizationAccepts(...names) ?? [...ALL_GOODS];
  } else {
    // shop=second_hand also covers consignment and resale shops that buy items, so
    // only keep stores run by (or donating to) known charities.
    accepts = organizationAccepts(...names);
    if (!accepts) return null;
  }
  if (!name) return null;

  return compact({
    id: `osm-${el.type[0]}${el.id}`,
    name,
    address: osmAddress(t),
    latitude: +latitude.toFixed(5),
    longitude: +longitude.toFixed(5),
    accepts,
    note,
    hours: t.opening_hours,
    phone: cleanPhone(t.phone ?? t['contact:phone']),
    website: cleanUrl(t.website ?? t['contact:website']),
    source: 'osm',
  });
}

async function loadOsm() {
  const json = await fetchWithRetry(
    OVERPASS_SERVERS,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(OVERPASS_QUERY),
    },
    { label: 'OpenStreetMap' },
  );
  return json.elements.map(fromOsm).filter(Boolean);
}

// --- Source: Seattle open data (food banks) -----------------------------------

async function loadSeattleFood() {
  const rows = await fetchWithRetry(
    'https://data.seattle.gov/resource/kkzf-ntnu.json?$limit=5000',
    {},
    { label: 'Seattle food' },
  );

  const byPlace = new Map();
  for (const r of rows) {
    if (!/food bank/i.test(r.food_resource_type ?? '')) continue; // skip meal-only programs
    if (r.operational_status && !/open/i.test(r.operational_status)) continue;
    const latitude = Number(r.latitude);
    const longitude = Number(r.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (byPlace.has(key)) continue;

    // Some listings name only the site ("Skykomish"), so fall back to the agency.
    const name = /food|pantry|bank|market|cupboard|mission|kitchen|church|center|centre|ministr/i.test(r.location ?? '')
      ? r.location
      : r.agency || r.location;
    const hours = r.days_hours && !/unknown/i.test(r.days_hours) ? r.days_hours : undefined;
    const serves = r.who_they_serve && !/general public/i.test(r.who_they_serve) ? `Serves: ${r.who_they_serve}.` : '';
    byPlace.set(
      key,
      compact({
        id: `sea-${slug(name)}`,
        name,
        address: r.address,
        latitude: +latitude.toFixed(5),
        longitude: +longitude.toFixed(5),
        accepts: ['food'],
        note: `${serves} Call ahead to confirm they accept food donations.`.trim(),
        hours,
        phone: cleanPhone(r.phone_number),
        website: cleanUrl(r.website?.url),
        source: 'seattle',
        updated: r.date_updated,
      }),
    );
  }
  return [...byPlace.values()];
}

// --- Source: King County "What do I do with...?" ------------------------------

async function loadKingCounty() {
  const materials = Object.keys(KC_MATERIALS).map((m) => `'${m.replace(/'/g, "''")}'`).join(',');
  const url =
    'https://data.kingcounty.gov/resource/zqwi-c5q3.json?' +
    new URLSearchParams({ $where: `material_handled in(${materials})`, $limit: '5000' });
  const rows = await fetchWithRetry(url, {}, { label: 'King County' });

  const byProvider = new Map();
  for (const r of rows) {
    const category = KC_MATERIALS[r.material_handled];
    const geo = r.geolocation ?? r.location ?? r.mapping_location;
    const latitude = Number(geo?.latitude);
    const longitude = Number(geo?.longitude);
    if (!category || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    if (r.dropoff_allowed !== 'True') continue;
    if (/multiple locations|see website|call for locations|pick-?up service only/i.test(`${r.provider_name} ${r.provider_address}`)) continue;

    const description = stripHtml(r.service_description);
    const fee = stripHtml(r.fee);
    const isCharity = Boolean(organizationAccepts(r.provider_name));
    const mentionsReuse = isCharity || REUSE_WORDS.test(`${r.provider_name} ${description}`);
    if (/\$\s?\.?\d/.test(fee) && !isCharity) continue; // paid recycling/disposal service
    if (!mentionsReuse) continue; // recycling, composting, or disposal only

    const id = `kc-${r.providerid}`;
    const existing = byProvider.get(id);
    if (existing) {
      if (!existing.accepts.includes(category)) existing.accepts.push(category);
      continue;
    }

    let address = r.provider_address;
    try {
      const h = JSON.parse(geo.human_address ?? '{}');
      if (!address && h.address) address = `${h.address}, ${r.city ?? 'WA'}`;
    } catch {}
    if (address && r.city && !address.includes(r.city)) address = `${address}, ${r.city}, WA`;

    byProvider.set(id, {
      id,
      name: r.provider_name,
      address,
      latitude: +latitude.toFixed(5),
      longitude: +longitude.toFixed(5),
      accepts: [category],
      note: clip(description) || undefined,
      hours: stripHtml(r.hours) || undefined,
      phone: cleanPhone(r.phone),
      website: cleanUrl(r.provider_url?.url),
      source: 'kingcounty',
      updated: '2022',
    });
  }
  return [...byProvider.values()].map(compact);
}

// --- Merging -----------------------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'of', 'and', 'a', 'at', 'in', 'food', 'bank', 'pantry', 'store', 'thrift', 'shop',
  'donation', 'center', 'centre', 'seattle', 'wa', 'inc', 'community', 'clothing', 'bin',
]);

function nameTokens(name) {
  return new Set(
    name.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w && !STOP_WORDS.has(w)),
  );
}

function nameSimilarity(a, b) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.min(ta.size, tb.size);
}

function metersBetween(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/**
 * Compares two listings. 'same' means the same organization (close and similarly
 * named). 'overlap' means nearly on top of each other with overlapping categories,
 * which is likely a duplicate but not safe to merge details from.
 */
function compare(a, b) {
  const meters = metersBetween(a, b);
  if (meters > 250) return null;
  if (nameSimilarity(a.name, b.name) >= 0.5) return 'same';
  if (meters <= 40 && a.accepts.some((c) => b.accepts.includes(c))) return 'overlap';
  return null;
}

/** Simple grid so duplicate checks only compare nearby places (~1 km cells). */
function makeGrid() {
  const cells = new Map();
  const key = (lat, lon) => `${Math.floor(lat * 100)},${Math.floor(lon * 100)}`;
  return {
    add(place) {
      const k = key(place.latitude, place.longitude);
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(place);
    },
    near(place) {
      const lat = Math.floor(place.latitude * 100);
      const lon = Math.floor(place.longitude * 100);
      const out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) out.push(...(cells.get(`${lat + dy},${lon + dx}`) ?? []));
      return out;
    },
  };
}

// --- Reverse geocoding (fills in missing addresses) -----------------------------

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

/** A street address has a number in it; "Seattle, WA" alone doesn't count. */
const hasStreetAddress = (place) => /\d/.test(place.address ?? '');

const cacheKey = (p) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;

/** Formats a Nominatim result as "123 Main St, Spokane, WA", or "Near Main St, …" without a house number. */
function formatAddress(a = {}) {
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.suburb ?? a.county;
  const street = a.road ?? a.pedestrian ?? a.footway ?? a.neighbourhood;
  if (!street && !city) return null;
  const line = a.house_number && street ? `${a.house_number} ${street}` : street ? `Near ${street}` : null;
  return [line, city, 'WA'].filter(Boolean).join(', ');
}

async function fillMissingAddresses(places) {
  let cache = {};
  try {
    cache = JSON.parse(await readFile(GEOCODE_CACHE, 'utf8'));
  } catch {}

  const missing = places.filter((p) => !hasStreetAddress(p));
  const toLookUp = missing.filter((p) => !(cacheKey(p) in cache));
  console.log(`\n▸ Addresses: ${missing.length} places missing one, ${toLookUp.length} not looked up before`);
  if (toLookUp.length && SKIP_GEOCODE) console.log('  … skipped (--no-geocode)');
  if (toLookUp.length && !SKIP_GEOCODE) {
    console.log(`  … looking up 1 per second (about ${Math.ceil(toLookUp.length / 60)} min)`);
  }

  let looked = 0;
  for (const place of SKIP_GEOCODE ? [] : toLookUp) {
    const started = Date.now();
    try {
      const url = `${NOMINATIM}?${new URLSearchParams({
        format: 'jsonv2',
        lat: String(place.latitude),
        lon: String(place.longitude),
        zoom: '18',
        addressdetails: '1',
      })}`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20_000) });
      if (res.status === 429 || res.status === 403) {
        console.log(`  ✗ Nominatim refused requests (HTTP ${res.status}). Stopping; run again later.`);
        break;
      }
      if (res.ok) {
        cache[cacheKey(place)] = formatAddress((await res.json()).address);
        looked++;
      }
    } catch (e) {
      console.log(`  … ${place.name}: ${e.message}`);
    }
    // Save progress regularly so an interrupted run doesn't repeat lookups.
    if (looked && looked % 25 === 0) {
      await writeFile(GEOCODE_CACHE, JSON.stringify(cache, null, 1) + '\n');
      console.log(`  … ${looked}/${toLookUp.length}`);
    }
    await sleep(Math.max(0, 1100 - (Date.now() - started)));
  }
  if (looked) await writeFile(GEOCODE_CACHE, JSON.stringify(cache, null, 1) + '\n');

  let filled = 0;
  for (const place of missing) {
    const address = cache[cacheKey(place)];
    if (address) {
      place.address = address;
      filled++;
    }
  }
  console.log(`  ✓ ${filled} addresses filled in, ${missing.length - filled} still missing`);
  return { looked, filled };
}

// --- Main ----------------------------------------------------------------------

const SOURCES = [
  { key: 'seattle', label: 'Seattle food banks', load: loadSeattleFood },
  { key: 'kingcounty', label: 'King County reuse directory', load: loadKingCounty },
  { key: 'osm', label: 'OpenStreetMap (Washington)', load: loadOsm },
];

const curated = JSON.parse(await readFile(CURATED, 'utf8'));
let previous = [];
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch {}

const grid = makeGrid();
curated.forEach((c) => grid.add({ ...c, curated: true }));

const merged = [];
const stats = [];
let failures = 0;

for (const source of SOURCES) {
  console.log(`\n▸ ${source.label}`);
  let places;
  let reused = false;
  try {
    places = await source.load();
  } catch (e) {
    failures++;
    places = previous.filter((p) => p.source === source.key);
    reused = true;
    console.log(`  ✗ download failed (${e.message}). Keeping ${places.length} entries from the last import.`);
  }

  let added = 0;
  let duplicates = 0;
  let outside = 0;
  for (const place of places) {
    if (!inWashington(place.latitude, place.longitude)) {
      outside++;
      continue;
    }
    let match;
    let relation;
    for (const other of grid.near(place)) {
      relation = compare(place, other);
      if (relation) {
        match = other;
        break;
      }
    }
    if (match) {
      duplicates++;
      // Fill gaps in an earlier (higher-priority) import of the same organization,
      // but never edit curated entries.
      if (!match.curated && relation === 'same') {
        for (const c of place.accepts) if (!match.accepts.includes(c)) match.accepts.push(c);
        for (const field of ['address', 'phone', 'website', 'hours']) match[field] ??= place[field];
      }
      continue;
    }
    grid.add(place);
    merged.push(place);
    added++;
  }
  stats.push({ source: source.label, found: places.length, added, duplicates, outside, reused });
  console.log(`  ✓ ${places.length} found, ${added} added, ${duplicates} duplicates, ${outside} outside WA`);
}

await fillMissingAddresses(merged);

// Stable ids and order keep git diffs small between runs.
const seen = new Map();
for (const p of merged) {
  const n = seen.get(p.id) ?? 0;
  seen.set(p.id, n + 1);
  if (n) p.id = `${p.id}-${n + 1}`;
  p.accepts.sort();
}
merged.sort((a, b) => a.id.localeCompare(b.id));

const body = '[\n' + merged.map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n]\n';
await writeFile(OUT, body);

console.log('\nSummary');
console.table(stats);
const byCategory = {};
merged.forEach((p) => p.accepts.forEach((c) => (byCategory[c] = (byCategory[c] ?? 0) + 1)));
console.log('By category:', byCategory);
console.log(`\nWrote ${merged.length} places (${(body.length / 1024).toFixed(0)} KB) to src/data/imported.json`);
console.log(`Hand-checked centers.json (${curated.length} places) was not changed.`);
if (failures) {
  console.log(`\n⚠ ${failures} source(s) failed and reused old data. Run again later to refresh them.`);
  process.exitCode = 1;
}
