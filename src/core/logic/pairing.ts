import { Competitor } from '../models/Competidor';
import { Duo, computeDuoGroup, canPair } from '../models/Duo';

export interface PairingOutput {
  duos: Duo[];
  warnings: string[];
}

export interface PairingOptions {
  rngSeed?: number;
  passesPerCompetitor?: number;
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
 */
function roundRobinPairs(
  competitors: Competitor[],
  passes: number,
  seedState: { seed: number }
): Duo[] {
  const n = competitors.length;
  if (n % 2 !== 0)
    throw new Error('Round-robin requer número PAR de competidores.');

  const order = [...competitors];
  shuffleInPlace(order, seedState);

  const rounds: Array<Array<[Competitor, Competitor]>> = [];
  const fixed = order[0];
  let ring = order.slice(1);

  const totalPossibleRounds = n - 1;
  const useRounds = Math.min(passes, totalPossibleRounds);

  for (let r = 0; r < useRounds; r++) {
    const pairs: Array<[Competitor, Competitor]> = [];
    pairs.push([fixed, ring[ring.length - 1]]);
    for (let i = 0; i < n / 2 - 1; i++) {
      pairs.push([ring[i], ring[ring.length - 2 - i]]);
    }
    rounds.push(pairs);
    ring = [ring[ring.length - 1], ...ring.slice(0, ring.length - 1)];
  }

  const duos: Duo[] = [];
  for (const pairs of rounds) {
    for (const [a, b] of pairs) {
      if (!canPair(a.category, b.category)) continue;
      const id = [a.id, b.id].sort().join('_');
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
 * Havel–Hakimi para sequência regular ou heterogênea (graus diferentes por competidor).
 * Funciona para N ímpar (quando N*passes é par) ou como fallback geral.
 * Recomeça com outra seed se encalhar (até maxTries).
 */
function havelHakimiRegular(
  competitors: Competitor[],
  passes: number,
  seedState: { seed: number },
  maxTries = 50,
  extraCompetitorId?: string
): Duo[] {
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const nodes = competitors.map((c) => ({
      id: c.id,
      category: c.category,
      // Competidor com passada extra recebe 1 a mais
      remaining: c.id === extraCompetitorId ? passes + 1 : passes,
      neighbors: new Set<string>(),
    }));

    shuffleInPlace(nodes, seedState);

    const byId = new Map(nodes.map((x) => [x.id, x]));
    const edges: Array<[string, string]> = [];

    let ok = true;
    while (true) {
      nodes.sort((a, b) => b.remaining - a.remaining);
      if (nodes[0].remaining === 0) break;

      const v = nodes[0];
      const r = v.remaining;

      const candidates = nodes
        .slice(1)
        .filter(
          (u) =>
            u.remaining > 0 &&
            !v.neighbors.has(u.id) &&
            canPair(v.category, u.category)
        );

      if (candidates.length < r) {
        ok = false;
        break;
      }

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

    if (!ok) continue;

    const duos: Duo[] = edges.map(([aId, bId]) => {
      const a = byId.get(aId)!;
      const b = byId.get(bId)!;
      return {
        id: [aId, bId].join('_'),
        riderOneId: aId,
        riderTwoId: bId,
        group: computeDuoGroup(a.category, b.category),
      };
    });

    const totalEdges = extraCompetitorId
      ? ((competitors.length - 1) * passes + (passes + 1)) / 2
      : (competitors.length * passes) / 2;

    if (duos.length === totalEdges) {
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

  let passes = options.passesPerCompetitor;
  if (passes == null) {
    const distinct = new Set(competitorsInput.map((c) => c.passes));
    if (distinct.size !== 1) {
      throw new Error('Número de passadas deve ser único para todos os competidores.');
    }
    passes = competitorsInput[0].passes;
  }

  if (passes < 0) throw new Error('Passadas não pode ser negativo.');
  if (passes > n - 1) {
    throw new Error(
      `Número de passadas (${passes}) maior do que o permitido.\n` +
      `Com ${n} competidores, cada um pode correr no máximo ${n - 1} passada${n - 1 !== 1 ? 's' : ''} ` +
      `(uma contra cada adversário diferente).\n` +
      `Reduza as passadas para ${n - 1} ou menos, ou adicione mais competidores.`
    );
  }

  const competitors: Competitor[] = competitorsInput.map((c) => ({
    ...c,
    passes: passes!,
  }));

  const warnings: string[] = [];
  let extraCompetitorId: string | undefined;

  // Quando N*passes é ímpar (N ímpar e passes ímpar), sortear um competidor para receber passada extra
  if ((n * passes) % 2 !== 0) {
    const idx = Math.floor(seededRandom(seedState) * n);
    extraCompetitorId = competitors[idx].id;
    warnings.push(
      `${competitors[idx].name} recebeu uma passada extra por número ímpar de competidores.`
    );
  }

  let duos: Duo[] = [];
  if (
    (options.method === 'roundRobin' || options.method === 'auto') &&
    n % 2 === 0 &&
    !extraCompetitorId
  ) {
    duos = roundRobinPairs(competitors, passes, seedState);
  } else if (options.method === 'roundRobin' && n % 2 !== 0) {
    throw new Error('Round-robin requer número PAR de competidores.');
  } else {
    duos = havelHakimiRegular(competitors, passes, seedState, 50, extraCompetitorId);
  }

  // Atribui passNumber sequencial a cada dupla
  duos = duos.map((d, i) => ({ ...d, passNumber: i + 1 }));

  // Detecta competidores que ficaram com menos passadas por incompatibilidade de categoria
  const roundCount = new Map<string, number>();
  for (const duo of duos) {
    roundCount.set(duo.riderOneId, (roundCount.get(duo.riderOneId) ?? 0) + 1);
    roundCount.set(duo.riderTwoId, (roundCount.get(duo.riderTwoId) ?? 0) + 1);
  }
  const underserved = competitors.filter(
    (c) => {
      const expected = c.id === extraCompetitorId ? passes! + 1 : passes!;
      return (roundCount.get(c.id) ?? 0) < expected;
    }
  );
  if (underserved.length > 0) {
    warnings.push(
      `${underserved.length} competidor(es) ficaram com menos passadas por falta de adversários compatíveis: ` +
      underserved.map((c) => c.name).join(', ')
    );
  }

  return { duos, warnings };
}
