import { DuoScore, PassResult, normalizeSAT } from '../models/PassResult';
import { DuoGroup } from '../models/Duo';

export interface StandingsEntry extends DuoScore {
  position: number;
}

export function compareByScore(a: DuoScore, b: DuoScore): number {
  if (b.cattleCount !== a.cattleCount) return b.cattleCount - a.cattleCount;
  return a.timeSeconds - b.timeSeconds;
}

export function buildBestQualifierScorePerDuo(
  results: PassResult[],
  duoGroupById: Map<string, DuoGroup>
): Map<string, DuoScore> {
  const map = new Map<string, DuoScore>();
  for (const raw of results.filter((r) => r.stage === 'Qualifier')) {
    const r = normalizeSAT(raw);
    const group = duoGroupById.get(r.duoId) ?? '1D';
    const current = map.get(r.duoId);
    const score: DuoScore = {
      duoId: r.duoId,
      group,
      cattleCount: r.cattleCount,
      timeSeconds: r.timeSeconds,
    };
    if (!current || compareByScore(score, current) < 0) map.set(r.duoId, score);
  }
  return map;
}

export function standingsFromScores(
  scores: Map<string, DuoScore>
): StandingsEntry[] {
  return Array.from(scores.values())
    .sort(compareByScore)
    .map((s, idx) => ({ ...s, position: idx + 1 }));
}
