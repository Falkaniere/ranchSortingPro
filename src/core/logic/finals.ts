import { DuoScore, PassResult, normalizeSAT } from '../models/PassResult';
import { DuoGroup } from '../models/Duo';
import { DEFAULT_FINALS_CUTOFF } from '../constants';
import { standingsFromScores } from './scoring';

export interface FinalsSelection {
  finalists1D: DuoScore[];
  finalists2D: DuoScore[];
  finalsOrder1D: string[];
  finalsOrder2D: string[];
}

/**
 * Seleciona os finalistas conforme o corte (top X) configurado na prova.
 *
 * A final 1D é aberta: reúne o top X geral, independente da categoria da
 * dupla. A final 2D é restrita: reúne apenas o top X entre as duplas da
 * categoria 2D. Por isso uma dupla 2D pode aparecer nas duas finais (ela
 * corre em ambas), mas uma dupla 1D nunca aparece na final 2D.
 */
export function selectFinalists(
  qualifierBestScores: Map<string, DuoScore>,
  topN: number = DEFAULT_FINALS_CUTOFF
): FinalsSelection {
  const overall = standingsFromScores(qualifierBestScores);

  const finalists1D = overall.slice(0, topN);
  const finalists2D = overall.filter((e) => e.group === '2D').slice(0, topN);

  return {
    finalists1D,
    finalists2D,
    finalsOrder1D: finalists1D.map((e) => e.duoId).reverse(),
    finalsOrder2D: finalists2D.map((e) => e.duoId).reverse(),
  };
}

export interface FinalAggregationEntry {
  duoId: string;
  /** Categoria real da dupla (1D ou 2D). */
  group: DuoGroup;
  /** Qual final este total pertence — pode diferir de `group` para duplas 2D que também correm na final 1D. */
  bracket: DuoGroup;
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
    const bracket = pass.bracket ?? base.group;
    map.set(`${n.duoId}:${bracket}`, {
      duoId: n.duoId,
      group: base.group,
      bracket,
      totalCattle: base.cattleCount + n.cattleCount,
      totalTimeSeconds: base.timeSeconds + n.timeSeconds,
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.totalCattle !== a.totalCattle) return b.totalCattle - a.totalCattle;
    return a.totalTimeSeconds - b.totalTimeSeconds;
  });
}
