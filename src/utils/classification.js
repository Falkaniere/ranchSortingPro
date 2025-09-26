// utils/classification.js
export function getDuoCategory(duo) {
  const [c1, c2] = duo.map((c) => c.category);

  const is = (cat) => [c1, c2].includes(cat);

  // 1D combinações
  if (
    (is('Aberta') && is('Amador 19')) ||
    (is('Aberta') && is('Amador Light')) ||
    (is('Amador 19') && is('Amador Light'))
  ) {
    return '1D';
  }

  // 2D combinações
  if (
    (is('Aberta') && is('Principiante')) ||
    (is('Amador 19') && is('Principiante')) ||
    (c1 === 'Amador Light' && c2 === 'Amador Light') ||
    (is('Amador Light') && is('Principiante')) ||
    (c1 === 'Principiante' && c2 === 'Principiante')
  ) {
    return '2D';
  }

  return 'INVALID';
}

export function classifyFinal(ranking) {
  const final1D = [];
  const final2D = [];

  for (const r of ranking) {
    const cat = getDuoCategory(r.duo);

    // Se for 1D → só pode entrar em 1D
    if (cat === '1D' && final1D.length < 10) {
      final1D.push({ ...r, category: '1D' });
    }

    // Se for 2D → pode entrar em 1D OU 2D
    else if (cat === '2D') {
      if (final1D.length < 10) {
        // tenta classificar no 1D
        final1D.push({ ...r, category: '2D->1D' });
      } else if (final2D.length < 10) {
        // se não couber no 1D, vai para 2D
        final2D.push({ ...r, category: '2D' });
      }
    }
  }

  return { oneD: final1D, twoD: final2D };
}
