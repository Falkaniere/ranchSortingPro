import { Competitor } from 'core/models/Competidor';
import { Duo, duoKeyFromRiders, computeDuoGroup } from '../models/Duo';

export interface PairingOutput {
  duos: Duo[];
  warnings: string[];
}

export function generateUniqueDuos(
  competitors: Competitor[],
  rngSeed = Date.now()
): PairingOutput {
  const warnings: string[] = [];
  const totalSlots = competitors.reduce((acc, c) => acc + c.passes, 0);
  if (totalSlots % 2 !== 0)
    throw new Error(`Total passes must be even. Got ${totalSlots}`);

  const maxPartners = competitors.length - 1;
  competitors.forEach((c) => {
    if (c.passes > maxPartners)
      throw new Error(`${c.name} exceeds max partners (${maxPartners}).`);
  });

  const duos: Duo[] = [];
  const paired = new Set<string>();
  let seed = rngSeed;
  const state = competitors.map((c) => ({ ...c, remaining: c.passes }));

  function rand() {
    seed = (seed * 1664525 + 1013904223) % 0xffffffff;
    return seed / 0xffffffff;
  }

  while (state.some((c) => c.remaining > 0)) {
    const a = state.find((c) => c.remaining > 0)!;
    const candidates = state.filter(
      (c) =>
        c.id !== a.id &&
        c.remaining > 0 &&
        !paired.has(duoKeyFromRiders(a.id, c.id))
    );
    if (candidates.length === 0)
      throw new Error('Pairing failed, adjust passes.');
    const b = candidates[Math.floor(rand() * candidates.length)];

    const group = computeDuoGroup(a.category, b.category);
    const id = duoKeyFromRiders(a.id, b.id);
    duos.push({ id, riderOneId: a.id, riderTwoId: b.id, group });
    paired.add(id);
    a.remaining -= 1;
    b.remaining -= 1;
  }

  return { duos, warnings };
}
