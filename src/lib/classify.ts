import type { Category } from '@/constants/categories';
import type { VisionLabel } from './vision';

/**
 * Words and phrases that point to each category, written to match the labels
 * Google Vision returns. Plurals don't matter ("shoes" matches "shoe").
 *
 * When a label matches keywords from several categories, the longest phrase
 * wins, so "Table tennis" counts as sports rather than furniture and
 * "Game controller" counts as electronics rather than toys.
 */
const KEYWORDS: Record<Category, string[]> = {
  clothing: [
    'clothing', 'shirt', 't-shirt', 'polo shirt', 'blouse', 'jacket', 'coat', 'jeans', 'denim',
    'pants', 'trousers', 'dress', 'gown', 'skirt', 'sweater', 'hoodie', 'sweatshirt', 'cardigan',
    'sleeve', 'outerwear', 'suit', 'blazer', 'vest', 'uniform', 'swimwear', 'pajamas', 'top',
    'shorts', 'tights', 'costume', 'fashion', 'fashion accessory', 'shoe', 'footwear', 'sneakers',
    'boot', 'sandal', 'slipper', 'high heels', 'hat', 'cap', 'beanie', 'scarf', 'glove', 'mitten',
    'sock', 'belt', 'necktie', 'handbag', 'purse', 'bag', 'backpack', 'wallet', 'luggage',
  ],
  furniture: [
    'furniture', 'chair', 'armchair', 'office chair', 'couch', 'sofa', 'studio couch', 'loveseat',
    'recliner', 'futon', 'ottoman', 'table', 'coffee table', 'end table', 'desk', 'bed',
    'bed frame', 'bunk bed', 'infant bed', 'crib', 'mattress', 'dresser', 'chest of drawers',
    'nightstand', 'wardrobe', 'cupboard', 'sideboard', 'cabinet', 'cabinetry', 'filing cabinet',
    'drawer', 'shelf', 'shelving', 'bookcase', 'stool', 'bench', 'outdoor furniture',
    'entertainment center',
  ],
  household: [
    'kitchenware', 'cookware', 'cookware and bakeware', 'bakeware', 'tableware', 'dishware',
    'serveware', 'drinkware', 'plate', 'bowl', 'mug', 'cup', 'wine glass', 'pot', 'frying pan',
    'saucepan', 'kitchen utensil', 'cutlery', 'home appliance', 'small appliance',
    'kitchen appliance', 'major appliance', 'appliance', 'oven', 'microwave', 'toaster', 'kettle',
    'blender', 'stand mixer', 'coffeemaker', 'refrigerator', 'washing machine', 'clothes dryer',
    'vacuum cleaner', 'clothes iron', 'mechanical fan', 'lamp', 'lampshade', 'light fixture',
    'candle', 'vase', 'picture frame', 'mirror', 'clock', 'home decor', 'rug', 'carpet', 'curtain',
    'bedding', 'bed sheet', 'pillow',
    'cushion', 'blanket', 'duvet', 'towel', 'linens', 'flowerpot', 'basket', 'laundry basket',
    'storage basket', 'hand tool', 'power tool', 'tool',
  ],
  electronics: [
    'electronics', 'electronic device', 'consumer electronics', 'gadget', 'technology',
    'peripheral', 'audio equipment', 'headphones', 'headset', 'earbuds', 'communication device',
    'mobile phone', 'smartphone', 'telephone', 'laptop', 'computer', 'personal computer',
    'desktop computer', 'tablet computer', 'netbook', 'computer keyboard', 'computer mouse',
    'computer monitor', 'input device', 'output device', 'display device', 'flat panel display',
    'television', 'camera', 'digital camera', 'camera lens', 'loudspeaker', 'subwoofer',
    'electrical cable', 'video game console', 'game controller', 'printer', 'router',
    'networking hardware', 'remote control', 'hard disk drive', 'portable media player', 'radio',
    'amplifier', 'smartwatch',
  ],
  books: [
    'book', 'publication', 'novel', 'textbook', 'comic book', 'comics', 'magazine', 'paperback',
    'book cover', 'literature', 'dvd', 'compact disc', 'optical disc', 'phonograph record',
    'gramophone record',
  ],
  'toys-games': [
    'toy', 'toy block', 'lego', 'stuffed toy', 'plush', 'teddy bear', 'doll', 'action figure',
    'figurine', 'puzzle', 'jigsaw puzzle', 'board game', 'tabletop game', 'video game', 'playset',
    'toy vehicle', 'model car', 'rattle', 'baby toys', 'educational toy', 'kite', 'yo-yo',
    'playing card', 'card game', 'dice', 'game',
  ],
  sports: [
    'sports', 'team sport', 'individual sport', 'racquet sport', 'ball game', 'sports equipment',
    'sporting goods', 'ball', 'football', 'soccer ball', 'basketball',
    'volleyball', 'baseball', 'baseball bat', 'baseball glove', 'tennis', 'tennis racket',
    'racket', 'table tennis', 'golf', 'golf club', 'golf ball', 'bicycle', 'bicycle wheel',
    'bicycle frame', 'bicycle helmet', 'helmet', 'skateboard', 'roller skates', 'ice skate',
    'ski', 'snowboard', 'surfboard', 'kayak', 'tent', 'camping', 'sleeping bag', 'fishing rod',
    'dumbbell', 'kettlebell', 'weight training', 'exercise equipment', 'exercise machine',
    'treadmill', 'yoga mat', 'hockey stick', 'sports uniform', 'skateboarding', 'skateboard deck',
    'boardsport', 'extreme sport', 'skatepark', 'roller skating', 'hiking equipment',
  ],
  instruments: [
    'musical instrument', 'string instrument', 'plucked string instrument', 'chordophone',
    'guitar', 'acoustic guitar', 'electric guitar', 'bass guitar', 'ukulele', 'violin', 'cello',
    'piano', 'musical keyboard', 'electronic keyboard', 'drum', 'drum kit',
    'percussion', 'brass instrument', 'trumpet', 'trombone', 'saxophone', 'flute', 'clarinet',
    'wind instrument', 'harmonica', 'folk instrument',
  ],
  food: [
    'food', 'canned', 'canned food', 'tin can', 'canning', 'produce', 'fruit', 'vegetable',
    'natural foods', 'whole food', 'bread', 'cereal', 'breakfast cereal', 'pasta', 'noodle', 'rice',
    'grain', 'snack', 'junk food', 'convenience food', 'grocery', 'ingredient', 'staple food',
    'baked goods', 'packaged goods', 'drink', 'beverage', 'juice', 'soft drink', 'bottled water',
    'soup', 'bean', 'legume', 'nut', 'peanut butter', 'condiment', 'sauce', 'spice', 'cookie',
    'cracker', 'potato chip', 'flour', 'sugar', 'dish', 'cuisine',
  ],
};

/** Lowercases, splits into words, and strips plurals ("shoes" → "shoe", "dresses" → "dress"). */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/--/g, ' ')
    .split(/[^a-z0-9'-]+/)
    .filter(Boolean)
    .map((w) => {
      if (w.length <= 3 || w.endsWith('ss')) return w;
      if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
      if (/(s|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
      if (w.endsWith('s')) return w.slice(0, -1);
      return w;
    });
}

/** True if `phrase` appears as consecutive whole words inside `label`. */
function containsPhrase(label: string[], phrase: string[]): boolean {
  for (let i = 0; i + phrase.length <= label.length; i++) {
    if (phrase.every((w, j) => label[i + j] === w)) return true;
  }
  return false;
}

const PHRASES = (Object.keys(KEYWORDS) as Category[]).flatMap((category) =>
  KEYWORDS[category].map((k) => ({ category, words: words(k) })),
);

/**
 * Finds which categories a single label belongs to. Longer phrase matches beat
 * shorter ones, and an exact match beats a partial one. Returns every category
 * tied for the best match.
 */
function categoriesFor(label: string): Category[] {
  const labelWords = words(label);
  let best = 0;
  let found: Category[] = [];
  for (const { category, words: phrase } of PHRASES) {
    if (!containsPhrase(labelWords, phrase)) continue;
    const strength = phrase.length + (phrase.length === labelWords.length ? 0.5 : 0);
    if (strength > best) {
      best = strength;
      found = [category];
    } else if (strength === best && !found.includes(category)) {
      found.push(category);
    }
  }
  return found;
}

/**
 * How much clothing counts when a person is in the photo. Someone holding a
 * tent or riding a skateboard is wearing clothes, and those shouldn't outvote
 * the item itself.
 */
const WORN_CLOTHING_WEIGHT = 0.5;

/**
 * Thresholds for picking more than one category, e.g. for a photo of a donation
 * pile. Besides the top category, another one is included when Vision found a
 * separate object for it, or when its labels are confident and not far behind.
 */
const OBJECT_MIN_SCORE = 0.6;
const LABEL_MIN_SCORE = 0.7;
const LABEL_MIN_SHARE_OF_BEST = 0.4;
const MAX_CATEGORIES = 4;

/** Picks the single donation category whose keywords best match the Vision labels. */
export function classify(labels: VisionLabel[]): Category | null {
  return classifyAll(labels)[0] ?? null;
}

/**
 * Picks every donation category with strong evidence in the photo, best match
 * first. A photo of one item usually gives one category; a pile gives several.
 */
export function classifyAll(labels: VisionLabel[]): Category[] {
  const scores = Object.fromEntries(
    (Object.keys(KEYWORDS) as Category[]).map((c) => [c, 0]),
  ) as Record<Category, number>;
  /** Highest score of a separate object Vision found for each category. */
  const objectScores = { ...scores };

  // Count each label once at its highest score. Vision often repeats a name,
  // such as one "Clothing" object per person, which would inflate that category.
  const unique = new Map<string, number>();
  for (const { description, score } of labels) {
    const key = description.toLowerCase();
    unique.set(key, Math.max(unique.get(key) ?? 0, score));
  }
  const hasPerson = unique.has('person');

  for (const [description, score] of unique) {
    for (const category of categoriesFor(description)) {
      const weight = category === 'clothing' && hasPerson ? WORN_CLOTHING_WEIGHT : 1;
      scores[category] += score * weight;
    }
  }

  for (const { description, score, kind } of labels) {
    if (kind !== 'object') continue;
    for (const category of categoriesFor(description)) {
      // Clothes on a person in the photo aren't a separate item being donated.
      if (category === 'clothing' && hasPerson) continue;
      objectScores[category] = Math.max(objectScores[category], score);
    }
  }

  const ranked = (Object.keys(scores) as Category[])
    .filter((c) => scores[c] > 0)
    .sort((a, b) => scores[b] - scores[a]);
  if (!ranked.length) return [];

  const bestScore = scores[ranked[0]];
  const others = ranked.slice(1).filter((c) => {
    if (objectScores[c] >= OBJECT_MIN_SCORE) return true;
    // Clothing labels with a person in the photo usually describe what they're wearing.
    if (c === 'clothing' && hasPerson) return false;
    return scores[c] >= LABEL_MIN_SCORE && scores[c] >= bestScore * LABEL_MIN_SHARE_OF_BEST;
  });
  return [ranked[0], ...others].slice(0, MAX_CATEGORIES);
}
