import { selectFinalists, aggregateFinals, computeTimeToBeat } from './finals';

function score(duoId, group, cattleCount, timeSeconds, doublePrincipiante) {
  return { duoId, group, cattleCount, timeSeconds, doublePrincipiante };
}

describe('selectFinalists', () => {
  it('classifica o top X geral para a final 1D e o top X das duplas 2D para a final 2D (etapas independentes)', () => {
    const scores = new Map([
      ['a', score('a', '1D', 10, 20)],
      ['b', score('b', '2D', 10, 21)], // 2ª geral — entra na 1D E lidera a 2D
      ['c', score('c', '1D', 9, 20)],
      ['d', score('d', '2D', 8, 20)],
      ['e', score('e', '1D', 7, 20)],
    ]);

    const { finalists1D, finalists2D } = selectFinalists(scores, 3);

    expect(finalists1D.map((f) => f.duoId)).toEqual(['a', 'b', 'c']);
    // Classificação independente: b entra na 1D e, por ser 2D, também disputa a 2D.
    expect(finalists2D.map((f) => f.duoId)).toEqual(['b', 'd']);
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

  it('dupla Principiante+Principiante bem colocada disputa as duas finais (classificação independente)', () => {
    const scores = new Map([
      ['pp', score('pp', '1D', 10, 10, true)],
      ['c2d', score('c2d', '2D', 2, 40)],
    ]);

    const { finalists1D, finalists2D } = selectFinalists(scores, 1);

    // pp lidera o geral (entra na 1D) e, por ser Principiante+Principiante,
    // também lidera a 2D — as etapas são independentes.
    expect(finalists1D.map((f) => f.duoId)).toEqual(['pp']);
    expect(finalists2D.map((f) => f.duoId)).toEqual(['pp']);
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
  it('classifica pela passada da final (todos zerados), sem somar a qualificatória, separando por bracket', () => {
    const base = new Map([
      ['b', score('b', '2D', 10, 21)],
    ]);
    const finalResults = [
      { id: '1', duoId: 'b', stage: 'Final', bracket: '2D', cattleCount: 9, timeSeconds: 22 },
    ];

    const aggregates = aggregateFinals(base, finalResults);
    expect(aggregates).toHaveLength(1);
    // Vale só a final: 9 bois / 22s (não 19 / 43 do acumulado).
    expect(aggregates[0]).toMatchObject({ group: '2D', bracket: '2D', finalCattle: 9, finalTimeSeconds: 22 });
  });

  it('ordena por mais bois e depois menor tempo, usando apenas os números da final', () => {
    const base = new Map([
      ['slowMoreCattle', score('slowMoreCattle', '1D', 3, 15)],
      ['fastLessCattle', score('fastLessCattle', '1D', 10, 15)],
      ['fastMoreCattle', score('fastMoreCattle', '1D', 1, 90)],
    ]);
    const finalResults = [
      // Melhor qualificatória não importa: só conta a final abaixo.
      { id: '1', duoId: 'slowMoreCattle', stage: 'Final', bracket: '1D', cattleCount: 10, timeSeconds: 40 },
      { id: '2', duoId: 'fastLessCattle', stage: 'Final', bracket: '1D', cattleCount: 8, timeSeconds: 20 },
      { id: '3', duoId: 'fastMoreCattle', stage: 'Final', bracket: '1D', cattleCount: 10, timeSeconds: 30 },
    ];

    const aggregates = aggregateFinals(base, finalResults);
    // 10 bois/30s vence 10 bois/40s (tempo), ambos à frente de 8 bois.
    expect(aggregates.map((a) => a.duoId)).toEqual(['fastMoreCattle', 'slowMoreCattle', 'fastLessCattle']);
  });
});

describe('computeTimeToBeat', () => {
  it('retorna null quando ainda não há líder no bracket', () => {
    expect(computeTimeToBeat(null)).toBeNull();
  });

  it('expõe o resultado da final do líder como alvo a bater', () => {
    // Líder fez 9 bois / 22s na passada da final.
    const ttb = computeTimeToBeat({ finalCattle: 9, finalTimeSeconds: 22 });
    // Para bater: igualar 9 bois em menos de 22s (ou pegar mais bois).
    expect(ttb.cattleToBeat).toBe(9);
    expect(ttb.targetTimeSeconds).toBe(22);
    expect(ttb.leaderCattle).toBe(9);
    expect(ttb.leaderTimeSeconds).toBe(22);
  });
});
