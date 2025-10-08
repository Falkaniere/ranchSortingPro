import { PassResult, DuoScore, SAT_TIME_SECONDS } from 'core/models/PassResult';
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
      const group = duoGroupById.get(r.duoId) ?? '1D';
      const existing = best.get(r.duoId);

      const current: DuoScore = {
        duoId: r.duoId,
        group,
        cattleCount: r.cattleCount,
        timeSeconds: r.timeSeconds,
      };

      if (!existing) {
        best.set(r.duoId, current);
      } else {
        // Mantém o melhor: mais bois e menor tempo
        const better =
          r.cattleCount > existing.cattleCount ||
          (r.cattleCount === existing.cattleCount &&
            r.timeSeconds < existing.timeSeconds);

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

/**
 * Gera estatísticas finais combinando resultados da qualificatória e da final.
 * Calcula a média de bois e tempo de cada dupla (somente se participou das duas fases).
 */
export function buildFinalAggregates(
  qualifier: Map<string, DuoScore>,
  finals: PassResult[],
  duosGroup: Map<string, DuoGroup>
): DuoScore[] {
  const aggregates: DuoScore[] = [];

  finals.forEach((f) => {
    const q = qualifier.get(f.duoId);
    if (!q) return; // ignorar se não participou das qualificatórias

    const group = duosGroup.get(f.duoId) ?? '1D';

    const avgCattle = (q.cattleCount + f.cattleCount) / 2;
    const avgTime =
      (normalizeTime(q.timeSeconds) + normalizeTime(f.timeSeconds)) / 2;

    aggregates.push({
      duoId: f.duoId,
      group,
      cattleCount: avgCattle,
      timeSeconds: avgTime,
    });
  });

  return aggregates.sort(compareByScore);
}

/**
 * Normaliza tempo: se for SAT (>=120s), retorna o tempo máximo.
 */
function normalizeTime(time: number): number {
  if (time >= SAT_TIME_SECONDS) return SAT_TIME_SECONDS;
  return time;
}
