import { normalizeName, nameSimilarity } from './nameNormalization';

describe('normalizeName', () => {
  it('lowercases, strips accents and punctuation, and collapses whitespace', () => {
    expect(normalizeName('  José  DA Silva-Júnior! ')).toBe('jose da silvajunior');
  });

  it('returns an empty string for punctuation-only input', () => {
    expect(normalizeName('...')).toBe('');
  });
});

describe('nameSimilarity', () => {
  it('is 1 for names that normalize identically', () => {
    expect(nameSimilarity('João Silva', 'joao  silva')).toBe(1);
  });

  it('is 1 when both names are empty after normalization', () => {
    expect(nameSimilarity('!!!', '???')).toBe(1);
  });

  it('is high for a small typo and low for unrelated names', () => {
    expect(nameSimilarity('João Silva', 'João Silvaa')).toBeGreaterThan(0.8);
    expect(nameSimilarity('João Silva', 'Pedro Alves')).toBeLessThan(0.5);
  });
});
