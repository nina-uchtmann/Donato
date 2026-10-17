import type { Category } from '@/constants/categories';
import type { VisionLabel } from './vision';

const KEYWORDS: Record<Category, string[]> = {
  clothing: [
    'clothing', 'shirt', 't-shirt', 'jacket', 'coat', 'jeans', 'pants', 'trousers', 'dress',
    'skirt', 'sweater', 'hoodie', 'sleeve', 'outerwear', 'shoe', 'footwear', 'sneakers', 'boot',
    'hat', 'scarf', 'glove', 'sock', 'textile', 'fashion', 'top', 'shorts', 'handbag', 'bag',
  ],
  furniture: [
    'furniture', 'chair', 'couch', 'sofa', 'table', 'desk', 'bed', 'dresser', 'shelf',
    'shelving', 'cabinet', 'drawer', 'lamp', 'stool', 'bench', 'nightstand', 'bookcase',
    'mattress', 'cushion', 'rug', 'mirror', 'kitchenware', 'cookware', 'tableware', 'appliance',
  ],
  food: [
    'food', 'canned', 'tin', 'can', 'produce', 'fruit', 'vegetable', 'bread', 'cereal',
    'pasta', 'rice', 'snack', 'grocery', 'ingredient', 'staple food', 'baked goods',
    'bottle', 'packaged goods', 'drink', 'beverage', 'soup', 'bean', 'dish', 'meal',
  ],
};

/** Picks the donation category whose keywords best match the Vision labels. */
export function classify(labels: VisionLabel[]): Category | null {
  const scores: Record<Category, number> = { clothing: 0, furniture: 0, food: 0 };

  for (const { description, score } of labels) {
    const text = description.toLowerCase();
    for (const category of Object.keys(KEYWORDS) as Category[]) {
      if (KEYWORDS[category].some((k) => text === k || text.split(/\s+/).includes(k))) {
        scores[category] += score;
      }
    }
  }

  const [best, bestScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return bestScore > 0 ? (best as Category) : null;
}
