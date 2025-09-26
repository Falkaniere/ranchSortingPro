// utils/classification.js

/**
 * Define a categoria da dupla (1D ou 2D) com base nas combinações de categorias dos competidores.
 */
export function getDuoCategory(duo) {
  const [c1, c2] = duo.map((c) => c.category);

  const is = (cat) => [c1, c2].includes(cat);

  // 🔹 Combinações válidas de 1D
  if (
    (is('Aberta') && is('Amador 19')) ||
    (is('Aberta') && is('Amador Light')) ||
    (is('Amador 19') && is('Amador Light'))
  ) {
    return '1D';
  }

  // 🔹 Combinações válidas de 2D
  if (
    (is('Aberta') && is('Principiante')) ||
    (is('Amador 19') && is('Principiante')) ||
    (is('Amador Light') && is('Principiante')) ||
    (c1 === 'Amador Light' && c2 === 'Amador Light') ||
    (c1 === 'Principiante' && c2 === 'Principiante')
  ) {
    return '2D';
  }

  // 🔹 Se não bate em nenhuma regra → inválido
  return 'INVALID';
}

/**
 * Classifica o ranking final em 1D e 2D respeitando regras:
 * - 1D tem prioridade de preenchimento (até 10 vagas).
 * - Duplas 2D podem subir para 1D caso sobre vaga.
 * - Caso contrário, ficam no 2D (até 10 vagas).
 */
export function classifyFinal(ranking) {
  const final1D = [];
  const final2D = [];

  for (const r of ranking) {
    const cat = getDuoCategory(r.duo);

    if (cat === '1D') {
      if (final1D.length < 10) {
        final1D.push({ ...r, category: '1D' });
      }
    } else if (cat === '2D') {
      if (final1D.length < 10) {
        final1D.push({ ...r, category: '2D->1D' });
      } else if (final2D.length < 10) {
        final2D.push({ ...r, category: '2D' });
      }
    }
  }

  return { oneD: final1D, twoD: final2D };
}
