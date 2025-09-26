// utils/classification.js

// 🔹 Determina a categoria da dupla
export function getDuoCategory(duo) {
  const [c1, c2] = duo.map((c) => c.category);
  const set = new Set([c1, c2]);

  // 🔹 Regras 1D (duplas fortes)
  const oneDCombos = [
    ['Aberta', 'Aberta'],
    ['Amador 19', 'Amador 19'],
    ['Aberta', 'Amador 19'],
    ['Aberta', 'Amador Light'],
    ['Amador 19', 'Amador Light'],
  ].map((arr) => new Set(arr));

  if (
    oneDCombos.some(
      (combo) =>
        combo.size === set.size && [...combo].every((cat) => set.has(cat))
    )
  ) {
    return '1D';
  }

  // 🔹 Regras 2D (mais fracas ou principiantes)
  const twoDCombos = [
    ['Aberta', 'Principiante'],
    ['Amador 19', 'Principiante'],
    ['Amador Light', 'Amador Light'],
    ['Amador Light', 'Principiante'],
    ['Principiante', 'Principiante'],
  ].map((arr) => new Set(arr));

  if (
    twoDCombos.some(
      (combo) =>
        combo.size === set.size && [...combo].every((cat) => set.has(cat))
    )
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
      }
      // senão vai pro 2D
      else if (final2D.length < 10) {
        final2D.push({ ...r, category: '2D' });
      }
    }
    // duplas INVALID ficam de fora
  }

  return { oneD: final1D, twoD: final2D };
}
