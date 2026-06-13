import { Competitor } from '../core/models/Competidor';
import {
  searchProfilesByNormalizedName,
  createCompetitorProfile,
} from './firebase/competitorProfiles';
import {
  createCompetitorLink,
  getLinkForCompetitor,
} from './firebase/competitorLinks';

// Creates or reuses a CompetitorProfile and links it to the competition entry.
// Runs silently — never throws; errors are swallowed to protect organizer flow.
export async function tryAutoLinkCompetitor(
  competitor: Competitor,
  competitionId: string
): Promise<void> {
  try {
    const existing = await getLinkForCompetitor(competitionId, competitor.id);
    if (existing) return;

    const exactMatches = await searchProfilesByNormalizedName(competitor.name);
    let profileId: string;

    if (exactMatches.length > 0) {
      profileId = exactMatches[0].id;
      await createCompetitorLink({
        profileId,
        competitionId,
        competitorId: competitor.id,
        matchType: 'auto_exact',
        confidence: 1.0,
      });
    } else {
      const newProfile = await createCompetitorProfile(competitor.name);
      profileId = newProfile.id;
      await createCompetitorLink({
        profileId,
        competitionId,
        competitorId: competitor.id,
        matchType: 'auto_exact',
        confidence: 1.0,
      });
    }
  } catch {
    // Intentionally silent — auto-linking is best-effort
  }
}
