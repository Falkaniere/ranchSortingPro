import { DuoScore, PassResult, normalizeSAT } from '../models/PassResult';
import { DuoGroup } from '../models/Duo';
import { standingsFromScores } from './scoring';

export interface FinalsSelection {
  finalists1D: DuoScore[];
  finalists2D: DuoScore[];
  finalsOrder1D: string[];
  finalsOrder2D: string[];
}

export function selectFinalists(
  qualifierBestScores: Map<string, DuoScore>
): FinalsSelection {
  const overall = standingsFromScores(qualifierBestScores);

  // All qualified duos advance to the final — no cap.
  const finalists1D = overall;
  const finalists2D = overall.filter((e) => e.group === '2D');

  return {
    finalists1D,
    finalists2D,
    finalsOrder1D: finalists1D.map((e) => e.duoId).reverse(),
    finalsOrder2D: finalists2D.map((e) => e.duoId).reverse(),
  };
}

export interface FinalAggregationEntry {
  duoId: string;
  group: DuoGroup;
  totalCattle: number;
  totalTimeSeconds: number;
}

export function aggregateFinals(
  qualifierBestScores: Map<string, DuoScore>,
  finalResults: PassResult[]
): FinalAggregationEntry[] {
  const map = new Map<string, FinalAggregationEntry>();
  for (const pass of finalResults.filter((r) => r.stage === 'Final')) {
    const n = normalizeSAT(pass);
    const base = qualifierBestScores.get(n.duoId);
    if (!base) continue;
    map.set(n.duoId, {
      duoId: n.duoId,
      group: base.group,
      totalCattle: base.cattleCount + n.cattleCount,
      totalTimeSeconds: base.timeSeconds + n.timeSeconds,
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.totalCattle !== a.totalCattle) return b.totalCattle - a.totalCattle;
    return a.totalTimeSeconds - b.totalTimeSeconds;
  });
}
