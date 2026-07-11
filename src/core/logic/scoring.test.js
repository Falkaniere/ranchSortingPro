import {
  compareByScore,
  buildBestQualifierScorePerDuo,
  standingsFromScores,
} from './scoring';

describe('compareByScore', () => {
  it('ranks more cattle first', () => {
    expect(
      compareByScore(
        { cattleCount: 10, timeSeconds: 40 },
        { cattleCount: 9, timeSeconds: 20 }
      )
    ).toBeLessThan(0);
  });

  it('breaks ties on cattle by the faster time', () => {
    expect(
      compareByScore(
        { cattleCount: 10, timeSeconds: 20 },
        { cattleCount: 10, timeSeconds: 40 }
      )
    ).toBeLessThan(0);
  });
});

describe('buildBestQualifierScorePerDuo', () => {
  const meta = new Map([
    ['d1', { group: '1D' }],
    ['d2', { group: '2D', doublePrincipiante: false }],
  ]);

  it('keeps only the best pass per duo (more cattle wins)', () => {
    const results = [
      { id: 'a', duoId: 'd1', stage: 'Qualifier', cattleCount: 5, timeSeconds: 20 },
      { id: 'b', duoId: 'd1', stage: 'Qualifier', cattleCount: 8, timeSeconds: 40 },
    ];
    const best = buildBestQualifierScorePerDuo(results, meta);
    expect(best.get('d1')).toMatchObject({ cattleCount: 8, timeSeconds: 40, group: '1D' });
  });

  it('breaks cattle ties on the better (lower) time', () => {
    const results = [
      { id: 'a', duoId: 'd1', stage: 'Qualifier', cattleCount: 8, timeSeconds: 40 },
      { id: 'b', duoId: 'd1', stage: 'Qualifier', cattleCount: 8, timeSeconds: 25 },
    ];
    expect(buildBestQualifierScorePerDuo(results, meta).get('d1').timeSeconds).toBe(25);
  });

  it('ignores Final passes and normalizes SAT to 0 cattle / 120s', () => {
    const results = [
      { id: 'a', duoId: 'd2', stage: 'Final', cattleCount: 10, timeSeconds: 10 },
      { id: 'b', duoId: 'd2', stage: 'Qualifier', cattleCount: 3, timeSeconds: 15, isSAT: true },
    ];
    const best = buildBestQualifierScorePerDuo(results, meta);
    expect(best.get('d2')).toMatchObject({ cattleCount: 0, timeSeconds: 120, group: '2D' });
  });

  it('defaults the group to 1D when no meta is supplied for the duo', () => {
    const results = [
      { id: 'a', duoId: 'unknown', stage: 'Qualifier', cattleCount: 1, timeSeconds: 10 },
    ];
    expect(buildBestQualifierScorePerDuo(results, meta).get('unknown').group).toBe('1D');
  });
});

describe('standingsFromScores', () => {
  it('returns entries sorted by ranking', () => {
    const map = new Map([
      ['a', { duoId: 'a', group: '1D', cattleCount: 8, timeSeconds: 30 }],
      ['b', { duoId: 'b', group: '1D', cattleCount: 10, timeSeconds: 45 }],
      ['c', { duoId: 'c', group: '1D', cattleCount: 8, timeSeconds: 20 }],
    ]);
    expect(standingsFromScores(map).map((s) => s.duoId)).toEqual(['b', 'c', 'a']);
  });
});
