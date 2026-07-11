import {
  canPair,
  computeDuoGroup,
  isDoublePrincipiante,
  duoKeyFromRiders,
} from './Duo';

describe('canPair', () => {
  it('rejects only Aberta + Aberta', () => {
    expect(canPair('Aberta', 'Aberta')).toBe(false);
  });

  it('accepts every other combination', () => {
    const cats = ['Aberta', '19', 'Light', 'Principiante'];
    for (const a of cats) {
      for (const b of cats) {
        if (a === 'Aberta' && b === 'Aberta') continue;
        expect(canPair(a, b)).toBe(true);
      }
    }
  });
});

describe('computeDuoGroup', () => {
  it('is 2D when exactly one rider is Principiante', () => {
    expect(computeDuoGroup('Aberta', 'Principiante')).toBe('2D');
    expect(computeDuoGroup('Principiante', 'Light')).toBe('2D');
    expect(computeDuoGroup('19', 'Principiante')).toBe('2D');
  });

  it('is 1D for Principiante + Principiante (counts as 1D)', () => {
    expect(computeDuoGroup('Principiante', 'Principiante')).toBe('1D');
  });

  it('is 1D for any pair without a Principiante', () => {
    expect(computeDuoGroup('Aberta', '19')).toBe('1D');
    expect(computeDuoGroup('Light', 'Light')).toBe('1D');
    expect(computeDuoGroup('19', 'Light')).toBe('1D');
  });
});

describe('isDoublePrincipiante', () => {
  it('is true only for Principiante + Principiante', () => {
    expect(isDoublePrincipiante('Principiante', 'Principiante')).toBe(true);
    expect(isDoublePrincipiante('Principiante', 'Light')).toBe(false);
    expect(isDoublePrincipiante('Aberta', '19')).toBe(false);
  });
});

describe('duoKeyFromRiders', () => {
  it('is order-independent (sorts the two ids)', () => {
    expect(duoKeyFromRiders('b', 'a')).toBe('a_b');
    expect(duoKeyFromRiders('a', 'b')).toBe('a_b');
  });
});
