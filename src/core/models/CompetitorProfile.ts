export interface CompetitorProfile {
  id: string;
  displayName: string;
  aliases: string[];
  normalizedName: string;
  userId?: string;
  email?: string;
  status: 'unclaimed' | 'claimed' | 'merged';
  mergedIntoProfileId?: string;
  createdAt: string;
  updatedAt: string;
  claimedAt?: string;
}

export interface CompetitorLink {
  id: string;
  profileId: string;
  competitionId: string;
  competitorId: string;
  matchType: 'auto_exact' | 'auto_fuzzy' | 'organizer' | 'claimed';
  confidence: number;
  createdAt: string;
  createdBy?: string;
}
