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
 * dupla — uma dupla 2D pode entrar nela se ranquear alto o suficiente.
 *
 * A final 2D é restrita às duplas 2D (e às Principiante+Principiante, que
 * contam como 1D mas servem de reserva) que NÃO entraram no top X da 1D —
 * uma dupla nunca disputa as duas finais, e uma dupla 1D "de verdade" (sem
 * Principiante) nunca cai na 2D.
 */
export function selectFinalists(
  qualifierBestScores: Map<string, DuoScore>,
  topN: number = DEFAULT_FINALS_CUTOFF
): FinalsSelection {
  const cutoff = Number.isFinite(topN) ? Math.max(1, Math.trunc(topN)) : DEFAULT_FINALS_CUTOFF;
  const overall = standingsFromScores(qualifierBestScores);

  const finalists1D = overall.slice(0, cutoff);
  const finalists1DIds = new Set(finalists1D.map((e) => e.duoId));

  const finalists2D = overall
    .filter((e) => (e.group === '2D' || e.doublePrincipiante) && !finalists1DIds.has(e.duoId))
    .slice(0, cutoff);

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
  /** Qual final este total pertence — pode diferir de `group` quando uma dupla 2D corre a final 1D em vez da 2D. */
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

/** Score da qualificatória de uma dupla — base fixa para o cálculo do total na final. */
export interface QualiScore {
  cattleCount: number;
  timeSeconds: number;
}

/** Total (qualificatória + final) de um concorrente já classificado no bracket. */
export interface FinalTotal {
  totalCattle: number;
  totalTimeSeconds: number;
}

/**
 * "Tempo a ser batido": o que a dupla prestes a correr precisa fazer na final
 * para assumir a liderança do bracket.
 *
 * A classificação da final é pelo total acumulado (qualificatória + final):
 * mais bois primeiro, depois menor tempo somado (ver `aggregateFinals`). Como
 * a nota da qualificatória da dupla é fixa e conhecida, dá para dizer de
 * antemão o que ela precisa na passada da final.
 */
export interface TimeToBeat {
  /** Total de bois do líder atual (referência a superar/empatar). */
  leaderTotalCattle: number;
  /** Tempo somado do líder atual. */
  leaderTotalTimeSeconds: number;
  /** Bois que a dupla precisa pegar na final para EMPATAR o total de bois do líder. */
  cattleToTie: number;
  /**
   * Tempo máximo na final (exclusivo) para superar o líder, assumindo que a
   * dupla empate o total de bois. Se <= 0, empatar os bois não basta: é
   * preciso pegar mais bois que o líder.
   */
  targetFinalTimeSeconds: number;
}

/**
 * Calcula o tempo a ser batido pela `currentQuali` diante do `leader` atual do
 * bracket. Retorna `null` quando ainda não há líder (ninguém correu a final) —
 * nesse caso a dupla assume a ponta apenas completando a passada.
 */
export function computeTimeToBeat(
  currentQuali: QualiScore,
  leader: FinalTotal | null
): TimeToBeat | null {
  if (!leader) return null;
  return {
    leaderTotalCattle: leader.totalCattle,
    leaderTotalTimeSeconds: leader.totalTimeSeconds,
    cattleToTie: leader.totalCattle - currentQuali.cattleCount,
    targetFinalTimeSeconds: leader.totalTimeSeconds - currentQuali.timeSeconds,
  };
}
