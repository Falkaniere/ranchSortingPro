import { normalizeSAT, SAT_TIME_SECONDS } from './PassResult';

describe('normalizeSAT', () => {
  it('leaves a non-SAT result untouched', () => {
    const r = { id: '1', duoId: 'd', stage: 'Qualifier', cattleCount: 7, timeSeconds: 31.2 };
    expect(normalizeSAT(r)).toBe(r); // same reference, not a copy
  });

  it('forces 0 cattle and the penalty time on a SAT result', () => {
    const r = { id: '1', duoId: 'd', stage: 'Qualifier', cattleCount: 9, timeSeconds: 12, isSAT: true };
    const n = normalizeSAT(r);
    expect(n.cattleCount).toBe(0);
    expect(n.timeSeconds).toBe(SAT_TIME_SECONDS);
    expect(r.cattleCount).toBe(9); // original not mutated
  });
});
