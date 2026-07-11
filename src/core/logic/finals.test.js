import { selectFinalists, aggregateFinals, computeTimeToBeat } from './finals';

function score(duoId, group, cattleCount, timeSeconds, doublePrincipiante) {
  return { duoId, group, cattleCount, timeSeconds, doublePrincipiante };
}

describe('selectFinalists', () => {
  it('classifica o top X geral para a final 1D e o top X restante da categoria 2D para a final 2D', () => {
    const scores = new Map([
      ['a', score('a', '1D', 10, 20)],
      ['b', score('b', '2D', 10, 21)], // 2ª geral — entra no top 3 e "usa" sua vaga na 1D
      ['c', score('c', '1D', 9, 20)],
      ['d', score('d', '2D', 8, 20)],
      ['e', score('e', '1D', 7, 20)],
    ]);

    const { finalists1D, finalists2D } = selectFinalists(scores, 3);

    expect(finalists1D.map((f) => f.duoId)).toEqual(['a', 'b', 'c']);
    // b já garantiu vaga na 1D — não disputa também a 2D.
    expect(finalists2D.map((f) => f.duoId)).toEqual(['d']);
  });

  it('nunca inclui uma dupla 1D "de verdade" (sem Principiante) na final 2D', () => {
    const scores = new Map([
      ['a', score('a', '1D', 10, 20)],
      ['b', score('b', '1D', 9, 20)],
    ]);

    const { finalists2D } = selectFinalists(scores, 1);
    expect(finalists2D).toEqual([]);
  });

  it('usa o corte padrão (top 10) quando nenhum topN é informado', () => {
    const scores = new Map(
      Array.from({ length: 15 }, (_, i) => [`d${i}`, score(`d${i}`, '1D', 15 - i, 20)])
    );
    const { finalists1D } = selectFinalists(scores);
    expect(finalists1D).toHaveLength(10);
  });

  it('dupla Principiante+Principiante entra no pool geral da 1D, mas cai para a 2D se não se classificar', () => {
    const scores = new Map([
      ['a', score('a', '1D', 10, 20)],
      ['b', score('b', '1D', 9, 20)],
      // group '1D' porque é Principiante+Principiante, mas com resultado fraco
      ['pp', score('pp', '1D', 1, 50, true)],
      ['c2d', score('c2d', '2D', 2, 40)],
    ]);

    const { finalists1D, finalists2D } = selectFinalists(scores, 2);

    expect(finalists1D.map((f) => f.duoId)).toEqual(['a', 'b']);
    // pp não entrou no top 2 geral, mas por ser Principiante+Principiante
    // ainda disputa a 2D junto com as duplas 2D "de verdade".
    expect(finalists2D.map((f) => f.duoId)).toEqual(['c2d', 'pp']);
  });

  it('dupla Principiante+Principiante que entra no top geral não disputa também a 2D', () => {
    const scores = new Map([
      ['pp', score('pp', '1D', 10, 10, true)],
      ['c2d', score('c2d', '2D', 2, 40)],
    ]);

    const { finalists1D, finalists2D } = selectFinalists(scores, 1);

    expect(finalists1D.map((f) => f.duoId)).toEqual(['pp']);
    expect(finalists2D.map((f) => f.duoId)).toEqual(['c2d']);
  });

  it('normaliza um topN inválido (decimal, zero, negativo ou NaN) para um inteiro >= 1', () => {
    const scores = new Map([
      ['a', score('a', '1D', 10, 20)],
      ['b', score('b', '1D', 9, 20)],
      ['c', score('c', '1D', 8, 20)],
    ]);

    expect(selectFinalists(scores, 1.9).finalists1D.map((f) => f.duoId)).toEqual(['a']);
    expect(selectFinalists(scores, 0).finalists1D.map((f) => f.duoId)).toEqual(['a']);
    expect(selectFinalists(scores, -5).finalists1D.map((f) => f.duoId)).toEqual(['a']);
    expect(selectFinalists(scores, NaN).finalists1D).toHaveLength(3);
  });
});

describe('aggregateFinals', () => {
  it('agrega o total (qualificatória + final) separando por bracket', () => {
    const base = new Map([
      ['b', score('b', '2D', 10, 21)],
    ]);
    const finalResults = [
      { id: '1', duoId: 'b', stage: 'Final', bracket: '2D', cattleCount: 9, timeSeconds: 22 },
    ];

    const aggregates = aggregateFinals(base, finalResults);
    expect(aggregates).toHaveLength(1);
    expect(aggregates[0]).toMatchObject({ group: '2D', bracket: '2D', totalCattle: 19, totalTimeSeconds: 43 });
  });
});

describe('computeTimeToBeat', () => {
  it('retorna null quando ainda não há líder no bracket', () => {
    expect(computeTimeToBeat({ cattleCount: 8, timeSeconds: 30 }, null)).toBeNull();
  });

  it('calcula bois a empatar e o tempo-alvo da final para ultrapassar o líder', () => {
    // Líder: 19 bois / 43s no total. Dupla atual fez 8 bois / 20s na qualif.
    const ttb = computeTimeToBeat(
      { cattleCount: 8, timeSeconds: 20 },
      { totalCattle: 19, totalTimeSeconds: 43 }
    );
    // Precisa pegar 19 - 8 = 11 bois no total... na verdade 11 na final para empatar.
    expect(ttb.cattleToTie).toBe(11);
    // E fazer a final em menos de 43 - 20 = 23s.
    expect(ttb.targetFinalTimeSeconds).toBe(23);
    expect(ttb.leaderTotalCattle).toBe(19);
    expect(ttb.leaderTotalTimeSeconds).toBe(43);
  });

  it('sinaliza (tempo-alvo <= 0) quando empatar os bois não basta — precisa de mais bois', () => {
    // Dupla tem qualif. muito lenta: mesmo empatando os bois, o tempo já estourou.
    const ttb = computeTimeToBeat(
      { cattleCount: 5, timeSeconds: 60 },
      { totalCattle: 10, totalTimeSeconds: 50 }
    );
    expect(ttb.cattleToTie).toBe(5);
    expect(ttb.targetFinalTimeSeconds).toBeLessThanOrEqual(0);
  });

  it('cattleToTie === 0 quando a qualif. empata o total de bois do líder — decisão fica no tempo', () => {
    // Dupla com 10 bois na qualif. vs. líder com 10 bois no total: pegar 0 na
    // final empata os bois; ainda dá para liderar fazendo a final em < 15s.
    const ttb = computeTimeToBeat(
      { cattleCount: 10, timeSeconds: 25 },
      { totalCattle: 10, totalTimeSeconds: 40 }
    );
    expect(ttb.cattleToTie).toBe(0);
    expect(ttb.targetFinalTimeSeconds).toBe(15);
  });

  it('sinaliza (bois a empatar < 0) quando a qualif. já supera o líder em bois', () => {
    const ttb = computeTimeToBeat(
      { cattleCount: 12, timeSeconds: 30 },
      { totalCattle: 10, totalTimeSeconds: 40 }
    );
    expect(ttb.cattleToTie).toBeLessThanOrEqual(0);
  });
});
