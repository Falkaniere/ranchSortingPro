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
 * As duas finais são classificadas de forma INDEPENDENTE:
 *
 * - Final 1D (aberta): top X geral, independente da categoria da dupla — uma
 *   dupla 2D pode entrar nela se ranquear alto o suficiente.
 * - Final 2D: top X entre as duplas 2D (e as Principiante+Principiante, que
 *   contam como 1D mas permanecem elegíveis à 2D), ranqueadas sozinhas.
 *
 * Como as etapas são independentes, uma dupla 2D bem colocada pode disputar as
 * DUAS finais. Uma dupla 1D "de verdade" (sem Principiante) nunca entra na 2D.
 */
export function selectFinalists(
  qualifierBestScores: Map<string, DuoScore>,
  topN: number = DEFAULT_FINALS_CUTOFF
): FinalsSelection {
  const cutoff = Number.isFinite(topN) ? Math.max(1, Math.trunc(topN)) : DEFAULT_FINALS_CUTOFF;
  const overall = standingsFromScores(qualifierBestScores);

  // Final 1D: top X geral (todos os tempos válidos, independente da categoria).
  const finalists1D = overall.slice(0, cutoff);

  // Final 2D: top X apenas entre as duplas 2D (+ Principiante+Principiante),
  // classificada sem considerar a 1D.
  const finalists2D = overall
    .filter((e) => e.group === '2D' || e.doublePrincipiante)
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
  /** Qual final esta passada pertence — pode diferir de `group` quando uma dupla 2D corre a final 1D (e, sendo independentes, ela ainda pode ter outra passada na 2D). */
  bracket: DuoGroup;
  /** Bois pegos na passada da final (não acumula com a qualificatória). */
  finalCattle: number;
  /** Tempo da passada da final em segundos (não acumula com a qualificatória). */
  finalTimeSeconds: number;
}

/**
 * Classificação da final. Na final todos começam zerados: vale apenas a passada
 * da final, não o total acumulado com a qualificatória. A qualificatória só
 * definiu quem são os finalistas (ver `selectFinalists`).
 *
 * O `qualifierBestScores` é usado apenas para obter a categoria (`group`) da
 * dupla e para ignorar passadas sem finalista correspondente. A ordenação é
 * a mesma de `compareByScore` (mais bois, depois menor tempo), aplicada aos
 * números da final.
 */
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
      finalCattle: n.cattleCount,
      finalTimeSeconds: n.timeSeconds,
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.finalCattle !== a.finalCattle) return b.finalCattle - a.finalCattle;
    return a.finalTimeSeconds - b.finalTimeSeconds;
  });
}

/** Resultado da passada da final do líder atual do bracket. */
export interface FinalLeader {
  finalCattle: number;
  finalTimeSeconds: number;
}

/**
 * "Tempo a ser batido": o que a dupla prestes a correr precisa fazer na passada
 * da final para assumir a liderança do bracket.
 *
 * Como a classificação da final vale só pela passada da final (todos começam
 * zerados), o alvo é simplesmente bater o líder: pegar pelo menos os bois dele
 * e, empatando os bois, fazer um tempo menor.
 */
export interface TimeToBeat {
  /** Bois do líder na final (referência a empatar/superar). */
  leaderCattle: number;
  /** Tempo do líder na final. */
  leaderTimeSeconds: number;
  /**
   * Bois que a dupla precisa pegar na final para EMPATAR o líder. Empatar os
   * bois ainda exige um tempo menor; pegar mais bois vence independente do tempo.
   */
  cattleToBeat: number;
  /**
   * Tempo máximo na final (exclusivo) para superar o líder empatando os bois.
   */
  targetTimeSeconds: number;
}

/**
 * Calcula o tempo a ser batido diante do `leader` atual do bracket. Retorna
 * `null` quando ainda não há líder (ninguém correu a final) — nesse caso a
 * dupla assume a ponta apenas completando a passada.
 */
export function computeTimeToBeat(leader: FinalLeader | null): TimeToBeat | null {
  if (!leader) return null;
  return {
    leaderCattle: leader.finalCattle,
    leaderTimeSeconds: leader.finalTimeSeconds,
    cattleToBeat: leader.finalCattle,
    targetTimeSeconds: leader.finalTimeSeconds,
  };
}
