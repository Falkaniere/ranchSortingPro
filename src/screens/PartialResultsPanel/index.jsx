import React, { useMemo } from 'react';
import { getDuoKey } from '../../utils/getDuoKey';

export default function PartialResultsPanel({ rounds = [], results = [] }) {
  const duoIdMap = useMemo(() => {
    const map = new Map();
    rounds.flat().forEach((duo, idx) => {
      if (!duo) return;
      map.set(getDuoKey(duo), idx + 1);
    });
    return map;
  }, [rounds]);

  const ranking = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      const key = getDuoKey(r.duo);
      if (!map.has(key)) {
        map.set(key, {
          duo: r.duo,
          count: 0,
          sumCattle: 0,
          sumTime: 0,
          id: duoIdMap.get(key) || null,
        });
      }
      const item = map.get(key);
      item.count += 1;
      item.sumCattle += Number(r.cattle || 0);
      item.sumTime += Number(r.time || 0);
    });

    const arr = Array.from(map.values()).map((it) => ({
      duo: it.duo,
      id: it.id,
      count: it.count,
      avgCattle: it.count ? it.sumCattle / it.count : 0,
      avgTime: it.count ? it.sumTime / it.count : 0,
    }));

    arr.sort((a, b) => {
      if (b.avgCattle !== a.avgCattle) return b.avgCattle - a.avgCattle;
      return a.avgTime - b.avgTime;
    });

    return arr;
  }, [results, duoIdMap]);

  return (
    <div className="card" style={{ minWidth: 320 }}>
      <h3>Parcial — Médias</h3>
      {ranking.length === 0 ? (
        <p style={{ color: '#666' }}>Nenhum resultado registrado ainda.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '6px' }}>#</th>
              <th style={{ padding: '6px' }}>Dupla</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>Avg Bois</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>
                Avg Tempo (s)
              </th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr
                key={getDuoKey(r.duo)}
                style={{ borderBottom: '1px solid #fafafa' }}
              >
                <td style={{ padding: '6px', width: 32 }}>{r.id ?? i + 1}</td>
                <td style={{ padding: '6px' }}>
                  {r.duo[0].name} & {r.duo[1].name}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgCattle.toFixed(2)}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgTime.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
