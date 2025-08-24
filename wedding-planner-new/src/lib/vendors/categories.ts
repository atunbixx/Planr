// Centralized vendor categories and helpers
// Keep this file UI-agnostic (no component or icon imports)

export type VendorCategoryId =
  | 'photography'
  | 'catering'
  | 'venue'
  | 'flowers'
  | 'music'
  | 'cake'
  | 'attire'
  | 'transportation'
  | 'other';

export interface VendorCategory {
  id: VendorCategoryId;
  name: string;
  color: string;
}

export const VENDOR_CATEGORIES: VendorCategory[] = [
  { id: 'photography', name: 'Photography', color: '#333333' },
  { id: 'catering', name: 'Catering', color: '#666666' },
  { id: 'venue', name: 'Venue', color: '#999999' },
  { id: 'flowers', name: 'Flowers', color: '#4CAF50' },
  { id: 'music', name: 'Music/DJ', color: '#2196F3' },
  { id: 'cake', name: 'Cake', color: '#FF9800' },
  { id: 'attire', name: 'Attire', color: '#9C27B0' },
  { id: 'transportation', name: 'Transportation', color: '#795548' },
  { id: 'other', name: 'Other', color: '#999999' },
];

// Common synonyms/aliases mapped to canonical ids
const SYNONYMS: Record<string, VendorCategoryId> = {
  photographer: 'photography',
  videographer: 'photography',
  caterer: 'catering',
  florist: 'flowers',
  dj: 'music',
  entertainment: 'music',
  transport: 'transportation',
};

const nameToIdMap: Record<string, VendorCategoryId> = VENDOR_CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c.id;
  acc[c.name.toLowerCase()] = c.id;
  return acc;
}, { ...SYNONYMS } as Record<string, VendorCategoryId>);

// Normalize free-form category text to a known id when possible.
// If unknown, return a lowercased trimmed value to avoid breaking existing data.
export function normalizeCategory(input: string): string {
  const raw = (input || '').trim();
  const key = raw.toLowerCase();
  const mapped = nameToIdMap[key];
  return mapped ?? key; // keep free-form but normalized to lowercase
}

export function isKnownCategoryId(id: string): id is VendorCategoryId {
  return Boolean((VENDOR_CATEGORIES as VendorCategory[]).find(c => c.id === id));
}
