import { Competitor } from '../models/Competidor';
import { Duo, computeDuoGroup } from '../models/Duo';

export interface PairingOutput {
  duos: Duo[];
  warnings: string[];
}

export interface PairingOptions {
  rngSeed?: number;
  passesPerCompetitor?: number; // 👈 usa SEMPRE o valor global passado pela tela
  method?: 'auto' | 'roundRobin' | 'havelHakimi';
}

function seededRandom(seedState: { seed: number }): number {
  // LCG
  seedState.seed = (seedState.seed * 1664525 + 1013904223) >>> 0;
  return seedState.seed / 0xffffffff;
}

function shuffleInPlace<T>(arr: T[], seedState: { seed: number }) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seedState) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Round-robin (método do círculo) — funciona para N par.
 * Gera N-1 rodadas; cada rodada tem N/2 duplas, cobrindo todas as combinações sem repetição.
 * Se "passes" < N-1, devolvemos apenas as primeiras "passes" rodadas.
 */
function roundRobinPairs(
  competitors: Competitor[],
  passes: number,
  seedState: { seed: number }
): Duo[] {
  const n = competitors.length;
  if (n % 2 !== 0)
    throw new Error('Round-robin requer número PAR de competidores.');

  // embaralha ordem inicial para variar o sorteio
  const order = [...competitors];
  shuffleInPlace(order, seedState);

  const rounds: Array<Array<[Competitor, Competitor]>> = [];
  // método do círculo: fixa o primeiro e rotaciona o resto
  const fixed = order[0];
  let ring = order.slice(1); // tamanho n-1

  const totalPossibleRounds = n - 1;
  const useRounds = Math.min(passes, totalPossibleRounds);

  for (let r = 0; r < useRounds; r++) {
    const pairs: Array<[Competitor, Competitor]> = [];
    // par 0: fixed com último do ring
    pairs.push([fixed, ring[ring.length - 1]]);
    // pares restantes: i vs (len-2-i)
    for (let i = 0; i < n / 2 - 1; i++) {
      pairs.push([ring[i], ring[ring.length - 2 - i]]);
    }
    rounds.push(pairs);

    // rotação: move o último para o começo
    ring = [ring[ring.length - 1], ...ring.slice(0, ring.length - 1)];
  }

  // flatten e map para Duo
  const duos: Duo[] = [];
  for (const pairs of rounds) {
    for (const [a, b] of pairs) {
      const id = [a.id, b.id].sort().join('🤝');
      duos.push({
        id,
        riderOneId: a.id,
        riderTwoId: b.id,
        group: computeDuoGroup(a.category, b.category),
      });
    }
  }
  return duos;
}

/**
 * Havel–Hakimi para sequência regular (todos com o mesmo grau = passes).
 * Funciona para N ímpar (quando N*passes é par) ou como fallback geral.
 * Recomeça com outra seed se encalhar (até maxTries).
 */
function havelHakimiRegular(
  competitors: Competitor[],
  passes: number,
  seedState: { seed: number },
  maxTries = 50
): Duo[] {
  const n = competitors.length;
  const neededEdges = (n * passes) / 2;

  for (let attempt = 0; attempt < maxTries; attempt++) {
    // estado
    const nodes = competitors.map((c) => ({
      id: c.id,
      category: c.category,
      remaining: passes,
      neighbors: new Set<string>(),
    }));

    // quebra empates com shuffle leve
    shuffleInPlace(nodes, seedState);

    const byId = new Map(nodes.map((x) => [x.id, x]));
    const edges: Array<[string, string]> = [];

    let ok = true;
    // enquanto houver algum com remaining > 0
    while (true) {
      nodes.sort((a, b) => b.remaining - a.remaining);
      if (nodes[0].remaining === 0) break; // terminou

      const v = nodes[0];
      const r = v.remaining;

      const candidates = nodes
        .slice(1)
        .filter((u) => u.remaining > 0 && !v.neighbors.has(u.id));

      if (candidates.length < r) {
        ok = false; // encalhou
        break;
      }

      // conecta v aos r primeiros (maiores remaining), com leve randomização
      shuffleInPlace(candidates, seedState);
      candidates.sort((a, b) => b.remaining - a.remaining);
      const chosen = candidates.slice(0, r);

      for (const u of chosen) {
        v.neighbors.add(u.id);
        u.neighbors.add(v.id);
        v.remaining -= 1;
        u.remaining -= 1;
        const [a, b] = [v.id, u.id].sort();
        edges.push([a, b]);
      }
    }

    if (!ok) {
      // tenta de novo com outra seed
      continue;
    }

    // converte arestas em Duos
    const duos: Duo[] = edges.map(([aId, bId]) => {
      const a = byId.get(aId)!;
      const b = byId.get(bId)!;
      return {
        id: [aId, bId].join('🤝'),
        riderOneId: aId,
        riderTwoId: bId,
        group: computeDuoGroup(a.category, b.category),
      };
    });

    if (duos.length === neededEdges) {
      // embaralha a ordem final para não ficar previsível
      shuffleInPlace(duos, seedState);
      return duos;
    }
  }

  throw new Error(
    'Falha ao gerar duplas sem repetição. Tente reduzir as passadas ou alterar a seed.'
  );
}

export function generateUniqueDuos(
  competitorsInput: Competitor[],
  options: PairingOptions = {}
): PairingOutput {
  const seedState = { seed: (options.rngSeed ?? Date.now()) >>> 0 };

  const n = competitorsInput.length;
  if (n < 2) throw new Error('É necessário pelo menos 2 competidores.');

  // 👇 usa o passes global se passado; se não, tenta inferir
  let passes = options.passesPerCompetitor;
  if (passes == null) {
    const distinct = new Set(competitorsInput.map((c) => c.passes));
    if (distinct.size !== 1) {
      throw new Error(
        'Número de passadas deve ser único para todos os competidores.'
      );
    }
    passes = competitorsInput[0].passes;
  }

  if (passes < 0) throw new Error('Passadas não pode ser negativo.');
  if (passes > n - 1) {
    throw new Error(`Passadas (${passes}) não pode exceder N-1 (${n - 1}).`);
  }

  // condição necessária: N * passes precisa ser par
  if ((n * passes) % 2 !== 0) {
    throw new Error(`N x passadas deve ser par. N=${n}, passadas=${passes}.`);
  }

  const competitors: Competitor[] = competitorsInput.map((c) => ({
    ...c,
    passes: passes!, // garante que seja number
  }));

  let duos: Duo[] = [];
  if (
    (options.method === 'roundRobin' || options.method === 'auto') &&
    n % 2 === 0
  ) {
    duos = roundRobinPairs(competitors, passes, seedState);
  } else if (options.method === 'roundRobin' && n % 2 !== 0) {
    throw new Error('Round-robin requer número PAR de competidores.');
  } else {
    duos = havelHakimiRegular(competitors, passes, seedState);
  }

  return { duos, warnings: [] };
}
