// utils/classification.js
// 🔹 Determina a categoria da dupla
export function getDuoCategory(duo) {
  const [c1, c2] = duo.map((c) => c.category);
  const is = (cat) => [c1, c2].includes(cat);

  // 🔹 1D combinações — qualquer dupla que tenha pelo menos um competidor "mais forte"
  if (
    (c1 === 'Aberta' && c2 === 'Aberta') ||
    (c1 === 'Amador 19' && c2 === 'Amador 19') ||
    (c1 === 'Aberta' && c2 === 'Amador 19') ||
    (c1 === 'Aberta' && c2 === 'Amador Light') ||
    (c1 === 'Amador 19' && c2 === 'Amador Light')
  ) {
    return '1D';
  }

  // 🔹 2D combinações
  if (
    (c1 === 'Aberta' && c2 === 'Principiante') ||
    (c1 === 'Amador 19' && c2 === 'Principiante') ||
    (c1 === 'Amador Light' && c2 === 'Amador Light') ||
    (c1 === 'Amador Light' && c2 === 'Principiante') ||
    (c1 === 'Principiante' && c2 === 'Principiante')
  ) {
    return '2D';
  }

  // Se não encaixar em nenhuma regra → inválido
  return 'INVALID';
}

// 🔹 Classificação final respeitando regras
export function classifyFinal(ranking) {
  const final1D = [];
  const final2D = [];

  for (const r of ranking) {
    const cat = getDuoCategory(r.duo);

    if (cat === '1D') {
      // 1D só entra no 1D
      if (final1D.length < 10) {
        final1D.push({ ...r, category: '1D' });
      }
    } else if (cat === '2D') {
      // 2D pode entrar no 1D
      if (final1D.length < 10) {
        final1D.push({ ...r, category: '2D->1D' });
      } else if (final2D.length < 10) {
        final2D.push({ ...r, category: '2D' });
      }
    }
    // duplas INVALID ficam de fora (desclassificadas)
  }

  return { oneD: final1D, twoD: final2D };
}
