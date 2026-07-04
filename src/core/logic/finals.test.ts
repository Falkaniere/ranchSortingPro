import { selectFinalists, aggregateFinals } from './finals';
import { DuoScore, PassResult } from '../models/PassResult';

function score(duoId: string, group: '1D' | '2D', cattleCount: number, timeSeconds: number): DuoScore {
  return { duoId, group, cattleCount, timeSeconds };
}

describe('selectFinalists', () => {
  it('classifica o top X geral para a final 1D e o top X da categoria 2D para a final 2D', () => {
    const scores = new Map<string, DuoScore>([
      ['a', score('a', '1D', 10, 20)],
      ['b', score('b', '2D', 10, 21)], // 2ª geral, mas 1ª entre as 2D
      ['c', score('c', '1D', 9, 20)],
      ['d', score('d', '2D', 8, 20)],
      ['e', score('e', '1D', 7, 20)],
    ]);

    const { finalists1D, finalists2D } = selectFinalists(scores, 3);

    expect(finalists1D.map((f) => f.duoId)).toEqual(['a', 'b', 'c']);
    expect(finalists2D.map((f) => f.duoId)).toEqual(['b', 'd']);
  });

  it('nunca inclui uma dupla 1D na final 2D', () => {
    const scores = new Map<string, DuoScore>([
      ['a', score('a', '1D', 10, 20)],
      ['b', score('b', '1D', 9, 20)],
    ]);

    const { finalists2D } = selectFinalists(scores, 10);
    expect(finalists2D).toEqual([]);
  });

  it('usa o corte padrão (top 10) quando nenhum topN é informado', () => {
    const scores = new Map<string, DuoScore>(
      Array.from({ length: 15 }, (_, i) => [`d${i}`, score(`d${i}`, '1D', 15 - i, 20)])
    );
    const { finalists1D } = selectFinalists(scores);
    expect(finalists1D).toHaveLength(10);
  });
});

describe('aggregateFinals', () => {
  it('mantém totais separados por bracket quando uma dupla 2D corre nas duas finais', () => {
    const base = new Map<string, DuoScore>([
      ['b', score('b', '2D', 10, 21)],
    ]);
    const finalResults: PassResult[] = [
      { id: '1', duoId: 'b', stage: 'Final', bracket: '2D', cattleCount: 9, timeSeconds: 22 },
      { id: '2', duoId: 'b', stage: 'Final', bracket: '1D', cattleCount: 10, timeSeconds: 18 },
    ];

    const aggregates = aggregateFinals(base, finalResults);
    expect(aggregates).toHaveLength(2);

    const bracket2D = aggregates.find((a) => a.bracket === '2D');
    const bracket1D = aggregates.find((a) => a.bracket === '1D');
    expect(bracket2D).toMatchObject({ group: '2D', totalCattle: 19, totalTimeSeconds: 43 });
    expect(bracket1D).toMatchObject({ group: '2D', totalCattle: 20, totalTimeSeconds: 39 });
  });
});
