export type Category =
  | 'clothing'
  | 'furniture'
  | 'household'
  | 'electronics'
  | 'books-toys'
  | 'sports'
  | 'instruments'
  | 'food';

export const CATEGORIES: Record<Category, { label: string; emoji: string }> = {
  clothing: { label: 'Clothing & shoes', emoji: '👕' },
  furniture: { label: 'Furniture', emoji: '🛋️' },
  household: { label: 'Kitchen & household', emoji: '🍳' },
  electronics: { label: 'Electronics', emoji: '📱' },
  'books-toys': { label: 'Books, toys & games', emoji: '📚' },
  sports: { label: 'Sports & outdoors', emoji: '⚽' },
  instruments: { label: 'Musical instruments', emoji: '🎸' },
  food: { label: 'Food', emoji: '🥫' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && value in CATEGORIES;
}

export const colors = {
  primary: '#2E7D5B',
  primaryLight: '#E3F2EA',
  text: '#1B1F1D',
  muted: '#5F6B66',
  border: '#D9E2DD',
  background: '#F7FAF8',
  card: '#FFFFFF',
  warning: '#8A5A00',
  warningBg: '#FFF4D6',
};
