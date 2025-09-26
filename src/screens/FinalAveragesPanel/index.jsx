import React, { useMemo } from 'react';
import { getDuoKey } from '../utils/getDuoKey';

export default function FinalAveragesPanel({
  rounds = [],
  qualifiersResults = [],
  finalResults = [],
}) {
  const duoIdMap = useMemo(() => {
    const map = new Map();
    rounds.flat().forEach((duo, idx) => {
      if (!duo) return;
      map.set(getDuoKey(duo), idx + 1);
    });
    return map;
  }, [rounds]);

  const combined = useMemo(() => {
    const map = new Map();

    qualifiersResults.forEach((r) => {
      const key = getDuoKey(r.duo);
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

    finalResults.forEach((r) => {
      const key = getDuoKey(r.duo);
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

    const arr = Array.from(map.values()).map((it) => {
      const totalCount = it.qualCount + it.finalCount;
      const totalC = it.qualSumC + it.finalSumC;
      const totalT = it.qualSumT + it.finalSumT;

      return {
        duo: it.duo,
        id: duoIdMap.get(getDuoKey(it.duo)) || null,
        avgQualC: it.qualCount ? it.qualSumC / it.qualCount : 0,
        avgQualT: it.qualCount ? it.qualSumT / it.qualCount : 0,
        avgFinalC: it.finalCount ? it.finalSumC / it.finalCount : 0,
        avgFinalT: it.finalCount ? it.finalSumT / it.finalCount : 0,
        avgCombinedC: totalCount ? totalC / totalCount : 0,
        avgCombinedT: totalCount ? totalT / totalCount : 0,
      };
    });

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
              <th>#</th>
              <th>Dupla</th>
              <th>Avg Q Bois</th>
              <th>Avg Q Tempo</th>
              <th>Final Bois</th>
              <th>Final Tempo</th>
              <th>Avg Total Bois</th>
              <th>Avg Total Tempo</th>
            </tr>
          </thead>
          <tbody>
            {combined.map((r, i) => (
              <tr
                key={getDuoKey(r.duo)}
                style={{ borderBottom: '1px solid #fafafa' }}
              >
                <td>{r.id ?? i + 1}</td>
                <td>
                  {r.duo[0].name} & {r.duo[1].name}
                </td>
                <td>{r.avgQualC.toFixed(2)}</td>
                <td>{r.avgQualT.toFixed(2)}</td>
                <td>{r.avgFinalC ? r.avgFinalC.toFixed(2) : '-'}</td>
                <td>{r.avgFinalT ? r.avgFinalT.toFixed(2) : '-'}</td>
                <td>{r.avgCombinedC.toFixed(2)}</td>
                <td>{r.avgCombinedT.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
