import { normalizeCategory } from './Competidor';

describe('normalizeCategory', () => {
  it('maps the current 4-category values through unchanged', () => {
    expect(normalizeCategory('Aberta')).toBe('Aberta');
    expect(normalizeCategory('19')).toBe('19');
    expect(normalizeCategory('Light')).toBe('Light');
    expect(normalizeCategory('Principiante')).toBe('Principiante');
  });

  it('normalizes aliases regardless of spacing/punctuation/case', () => {
    expect(normalizeCategory('Amador 19')).toBe('19');
    expect(normalizeCategory('amador19')).toBe('19');
    expect(normalizeCategory('Amador/Light')).toBe('Light');
    expect(normalizeCategory('AMADORLIGHT')).toBe('Light');
  });

  it('migrates legacy 2-category / raw values to the 2D group', () => {
    // Bare "Amador" in the old model always meant the 2D group.
    expect(normalizeCategory('Amador')).toBe('Principiante');
    expect(normalizeCategory('2D')).toBe('Principiante');
    expect(normalizeCategory('beginner')).toBe('Principiante');
  });

  it('falls back to Aberta for open/1D/unknown/empty values', () => {
    expect(normalizeCategory('Open')).toBe('Aberta');
    expect(normalizeCategory('1D')).toBe('Aberta');
    expect(normalizeCategory('qualquer coisa')).toBe('Aberta');
    expect(normalizeCategory('')).toBe('Aberta');
    // Guards against null/undefined coming from raw imports.
    expect(normalizeCategory(undefined)).toBe('Aberta');
  });
});
