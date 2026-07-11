import { generateUniqueDuos } from './pairing';

function makeCompetitors(n, category = 'Light', passes = 1) {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    name: `Competidor ${i}`,
    category,
    passes,
  }));
}

function pairKey(duo) {
  return [duo.riderOneId, duo.riderTwoId].sort().join('|');
}

describe('generateUniqueDuos — validation', () => {
  it('requires at least 2 competitors', () => {
    expect(() => generateUniqueDuos(makeCompetitors(1))).toThrow(/pelo menos 2/i);
  });

  it('rejects passes greater than n-1 (cannot face more distinct rivals)', () => {
    expect(() =>
      generateUniqueDuos(makeCompetitors(4), { passesPerCompetitor: 5 })
    ).toThrow(/maior do que o permitido/i);
  });

  it('rejects negative passes', () => {
    expect(() =>
      generateUniqueDuos(makeCompetitors(4), { passesPerCompetitor: -1 })
    ).toThrow(/negativo/i);
  });
});

describe('generateUniqueDuos — uniqueness (guards the "duplicated duos" bug)', () => {
  it('never repeats the same pair and gives each competitor the requested passes', () => {
    const competitors = makeCompetitors(6, 'Light', 3);
    const { duos } = generateUniqueDuos(competitors, {
      passesPerCompetitor: 3,
      rngSeed: 42,
    });

    // No pair (unordered) appears twice.
    const keys = duos.map(pairKey);
    expect(new Set(keys).size).toBe(keys.length);

    // Each competitor rides exactly 3 times.
    const counts = new Map();
    for (const d of duos) {
      counts.set(d.riderOneId, (counts.get(d.riderOneId) ?? 0) + 1);
      counts.set(d.riderTwoId, (counts.get(d.riderTwoId) ?? 0) + 1);
    }
    for (const c of competitors) expect(counts.get(c.id)).toBe(3);

    // Total edges = N * passes / 2.
    expect(duos.length).toBe((6 * 3) / 2);
  });

  it('assigns a sequential passNumber to every duo', () => {
    const { duos } = generateUniqueDuos(makeCompetitors(4, 'Light', 1), {
      passesPerCompetitor: 1,
      rngSeed: 7,
    });
    expect(duos.map((d) => d.passNumber)).toEqual(
      Array.from({ length: duos.length }, (_, i) => i + 1)
    );
  });
});

describe('generateUniqueDuos — determinism', () => {
  it('produces identical output for the same seed', () => {
    const a = generateUniqueDuos(makeCompetitors(6, 'Light', 2), {
      passesPerCompetitor: 2,
      rngSeed: 123,
    });
    const b = generateUniqueDuos(makeCompetitors(6, 'Light', 2), {
      passesPerCompetitor: 2,
      rngSeed: 123,
    });
    expect(a.duos.map(pairKey)).toEqual(b.duos.map(pairKey));
  });
});

describe('generateUniqueDuos — category rules', () => {
  it('never pairs Aberta with Aberta (throws when no compatible pairing exists)', () => {
    expect(() =>
      generateUniqueDuos(makeCompetitors(4, 'Aberta', 1), { passesPerCompetitor: 1 })
    ).toThrow();
  });

  it('warns and grants one extra pass when N*passes is odd', () => {
    const { duos, warnings } = generateUniqueDuos(makeCompetitors(5, 'Light', 1), {
      passesPerCompetitor: 1,
      rngSeed: 9,
    });
    // 5 riders * 1 pass = 5 (odd) → one rider gets a 2nd pass → 3 duos, 6 slots.
    expect(duos.length).toBe(3);
    expect(warnings.some((w) => /passada extra/i.test(w))).toBe(true);
  });
});
