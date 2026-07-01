import { PassResult, DuoScore, normalizeSAT } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';

/**
 * Compara duas duplas para ranqueamento.
 * A ordem de prioridade é:
 * 1. Maior número de bois
 * 2. Menor tempo (em segundos)
 */
export function compareByScore(a: DuoScore, b: DuoScore): number {
  if (a.cattleCount !== b.cattleCount) {
    return b.cattleCount - a.cattleCount; // mais bois vem primeiro
  }
  return a.timeSeconds - b.timeSeconds; // menor tempo vem primeiro
}

/**
 * Calcula o melhor resultado por dupla dentro das qualificatórias.
 * Recebe todos os resultados e retorna um mapa (duoId -> melhor resultado).
 */
export function buildBestQualifierScorePerDuo(
  results: PassResult[],
  duoGroupById: Map<string, DuoGroup>
): Map<string, DuoScore> {
  const best = new Map<string, DuoScore>();

  results
    .filter((r) => r.stage === 'Qualifier')
    .forEach((r) => {
      const n = normalizeSAT(r);
      const group = duoGroupById.get(r.duoId) ?? '1D';
      const existing = best.get(r.duoId);

      const current: DuoScore = {
        duoId: r.duoId,
        group,
        cattleCount: n.cattleCount,
        timeSeconds: n.timeSeconds,
      };

      if (!existing) {
        best.set(r.duoId, current);
      } else {
        // Mantém o melhor: mais bois e menor tempo
        const better =
          n.cattleCount > existing.cattleCount ||
          (n.cattleCount === existing.cattleCount &&
            n.timeSeconds < existing.timeSeconds);

        if (better) best.set(r.duoId, current);
      }
    });

  return best;
}

/**
 * Transforma um mapa de DuoScores em um array ordenado por ranking.
 */
export function standingsFromScores(
  scoresMap: Map<string, DuoScore>
): DuoScore[] {
  return Array.from(scoresMap.values()).sort(compareByScore);
}
