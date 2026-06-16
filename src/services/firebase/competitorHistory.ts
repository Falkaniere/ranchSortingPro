import { getLinksByProfileId } from './competitorLinks';
import { getCompetition } from './competitions';

export interface PassEntry {
  duoId: string;
  stage: 'Qualifier' | 'Final';
  partnerName: string;
  partnerCategory: string;
  group: '1D' | '2D';
  cattleCount: number;
  timeSeconds: number;
  isSAT: boolean;
  calledCattle?: number;
  passNumber?: number;
}

export interface CompetitionHistoryEntry {
  competitionId: string;
  competitionName: string;
  location?: string;
  eventDate?: string;
  status: string;
  competitorId: string;
  passes: PassEntry[];
}

export async function getCompetitorHistory(
  profileId: string
): Promise<CompetitionHistoryEntry[]> {
  const links = await getLinksByProfileId(profileId);
  if (links.length === 0) return [];

  const entries: (CompetitionHistoryEntry | null)[] = await Promise.all(
    links.map(async (link) => {
      const competition = await getCompetition(link.competitionId);
      if (!competition) return null;

      const { competitorId } = link;
      const myDuos = competition.duos.filter(
        (d) => d.riderOneId === competitorId || d.riderTwoId === competitorId
      );
      const myDuoIds = new Set(myDuos.map((d) => d.id));

      const allResults = [
        ...competition.qualifierResults,
        ...competition.finalResults,
      ];
      const myResults = allResults.filter((r) => myDuoIds.has(r.duoId));

      const passes: PassEntry[] = myResults.map((r) => {
        const duo = myDuos.find((d) => d.id === r.duoId);
        const partnerId =
          duo?.riderOneId === competitorId ? duo?.riderTwoId : duo?.riderOneId;
        const partner = competition.competitors.find((c) => c.id === partnerId);
        return {
          duoId: r.duoId,
          stage: r.stage,
          partnerName: partner?.name ?? '?',
          partnerCategory: partner?.category ?? 'Open',
          group: (duo?.group ?? '1D') as '1D' | '2D',
          cattleCount: r.cattleCount,
          timeSeconds: r.timeSeconds,
          isSAT: r.isSAT ?? false,
          calledCattle: r.calledCattle,
          passNumber: duo?.passNumber,
        };
      });

      const entry: CompetitionHistoryEntry = {
        competitionId: link.competitionId,
        competitionName: competition.name,
        location: competition.location,
        eventDate: competition.eventDate,
        status: competition.status,
        competitorId,
        passes,
      };
      return entry;
    })
  );

  return entries
    .filter((e): e is CompetitionHistoryEntry => e !== null)
    .sort((a, b) => {
      const da = a.eventDate ?? '';
      const db = b.eventDate ?? '';
      return db.localeCompare(da);
    });
}
