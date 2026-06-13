export type RiderCategory = 'Open' | 'AmateurLight';

// Migrates legacy category values to the simplified 2-category model.
export function normalizeCategory(cat: string): RiderCategory {
  if (cat === 'AmateurLight' || cat === 'Beginner') return 'AmateurLight';
  return 'Open'; // Open, Amateur19, or any unknown value → Open
}

export interface Competitor {
  id: string;
  name: string;
  category: RiderCategory;
  // Number of passes (rounds) this competitor must ride in the qualifier stage
  passes: number;
  // Optional link to the global CompetitorProfile (populated by auto-linking)
  profileId?: string;
}
