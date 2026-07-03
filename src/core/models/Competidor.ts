export type RiderCategory = 'Aberta' | '19' | 'Light' | 'Principiante';

// Migrates legacy category values (2-category model, or raw imports) to the current 4-category model.
export function normalizeCategory(cat: string): RiderCategory {
  const v = (cat ?? '').toLowerCase().trim();
  if (v === '19' || v === 'amateur19') return '19';
  if (v === 'light' || v === 'amateurlight' || v === 'amador') return 'Light';
  if (v === 'principiante' || v === 'beginner') return 'Principiante';
  return 'Aberta'; // Aberta, Open, or any unknown value → Aberta
}

export interface Competitor {
  id: string;
  name: string;
  category: RiderCategory;
  // Number of passes (rounds) this competitor must ride in the qualifier stage
  passes: number;
}
