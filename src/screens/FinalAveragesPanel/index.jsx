// src/components/FinalAveragesPanel.jsx
import React, { useMemo } from 'react';

/**
 * props:
 * - rounds
 * - qualifiersResults: array (qualificatórias)
 * - finalResults: array (final)
 */
export default function FinalAveragesPanel({
  rounds = [],
  qualifiersResults = [],
  finalResults = [],
}) {
  // duo -> id map
  const duoIdMap = useMemo(() => {
    const map = new Map();
    rounds.flat().forEach((duo, idx) => {
      if (!duo) return;
      map.set(duo.join('🤝'), idx + 1);
    });
    return map;
  }, [rounds]);

  const combined = useMemo(() => {
    const map = new Map();

    // qualificatórias
    qualifiersResults.forEach((r) => {
      const key = r.duo.join('🤝');
      if (!map.has(key))
        map.set(key, {
          duo: r.duo,
          qualCount: 0,
          qualSumC: 0,
          qualSumT: 0,
          finalCount: 0,
          finalSumC: 0,
          finalSumT: 0,
        });
      const item = map.get(key);
      item.qualCount += 1;
      item.qualSumC += Number(r.cattle || 0);
      item.qualSumT += Number(r.time || 0);
    });

    // final results
    finalResults.forEach((r) => {
      const key = r.duo.join('🤝');
      if (!map.has(key))
        map.set(key, {
          duo: r.duo,
          qualCount: 0,
          qualSumC: 0,
          qualSumT: 0,
          finalCount: 0,
          finalSumC: 0,
          finalSumT: 0,
        });
      const item = map.get(key);
      item.finalCount += 1;
      item.finalSumC += Number(r.cattle || 0);
      item.finalSumT += Number(r.time || 0);
    });

    // transformar em array com médias
    const arr = Array.from(map.values()).map((it) => {
      const totalCount = it.qualCount + it.finalCount;
      const totalC = it.qualSumC + it.finalSumC;
      const totalT = it.qualSumT + it.finalSumT;
      const avgQualC = it.qualCount ? it.qualSumC / it.qualCount : 0;
      const avgQualT = it.qualCount ? it.qualSumT / it.qualCount : 0;
      const avgFinalC = it.finalCount ? it.finalSumC / it.finalCount : 0;
      const avgFinalT = it.finalCount ? it.finalSumT / it.finalCount : 0;
      const avgCombinedC = totalCount ? totalC / totalCount : 0;
      const avgCombinedT = totalCount ? totalT / totalCount : 0;
      return {
        duo: it.duo,
        id: duoIdMap.get(it.duo.join('🤝')) || null,
        qualCount: it.qualCount,
        avgQualC,
        avgQualT,
        finalCount: it.finalCount,
        avgFinalC,
        avgFinalT,
        avgCombinedC,
        avgCombinedT,
        totalCount,
      };
    });

    // ordenar por avgCombinedC desc, avgCombinedT asc
    arr.sort((a, b) => {
      if (b.avgCombinedC !== a.avgCombinedC)
        return b.avgCombinedC - a.avgCombinedC;
      return a.avgCombinedT - b.avgCombinedT;
    });

    return arr;
  }, [qualifiersResults, finalResults, duoIdMap]);

  return (
    <div className="card" style={{ minWidth: 360 }}>
      <h3>Médias (Qualif + Final)</h3>
      {combined.length === 0 ? (
        <p style={{ color: '#666' }}>Nenhum dado disponível.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '6px' }}>#</th>
              <th style={{ padding: '6px' }}>Dupla</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>Avg Q Bois</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>
                Avg Q Tempo
              </th>
              <th style={{ padding: '6px', textAlign: 'right' }}>Final Bois</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>
                Final Tempo
              </th>
              <th style={{ padding: '6px', textAlign: 'right' }}>
                Avg Total Bois
              </th>
              <th style={{ padding: '6px', textAlign: 'right' }}>
                Avg Total Tempo
              </th>
            </tr>
          </thead>
          <tbody>
            {combined.map((r, i) => (
              <tr
                key={r.duo.join('-')}
                style={{ borderBottom: '1px solid #fafafa' }}
              >
                <td style={{ padding: '6px', width: 28 }}>{r.id ?? i + 1}</td>
                <td style={{ padding: '6px' }}>
                  {r.duo[0]} & {r.duo[1]}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgQualC.toFixed(2)}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgQualT.toFixed(2)}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgFinalC ? r.avgFinalC.toFixed(2) : '-'}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgFinalT ? r.avgFinalT.toFixed(2) : '-'}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgCombinedC.toFixed(2)}
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>
                  {r.avgCombinedT.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
