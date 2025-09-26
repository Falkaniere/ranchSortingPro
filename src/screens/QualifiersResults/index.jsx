// screens/QualifiersResults.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { classifyFinal } from '../../utils/classification';

export default function QualifiersResults({ results }) {
  const navigate = useNavigate();

  // Agrupar resultados
  const ranking = useMemo(() => {
    const grouped = [];

    results.forEach((result) => {
      const key = result.duo.map((c) => c.name).join('🤝');
      let item = grouped.find((r) => r.key === key);
      if (!item) {
        item = {
          key,
          duo: result.duo,
          totalCattle: 0,
          bestTime: Infinity,
        };
        grouped.push(item);
      }
      item.totalCattle += result.cattle;
      if (result.time < item.bestTime) item.bestTime = result.time;
    });

    grouped.sort((a, b) => {
      if (b.totalCattle !== a.totalCattle) return b.totalCattle - a.totalCattle;
      return a.bestTime - b.bestTime;
    });

    return grouped;
  }, [results]);

  const classified = useMemo(() => classifyFinal(ranking), [ranking]);

  return (
    <div className="container">
      <h2>Ranking das Qualificatórias</h2>

      <div className="card">
        <h3>Classificados 1D (1 a 10)</h3>
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Dupla</th>
              <th>Bois</th>
              <th>Melhor Tempo</th>
            </tr>
          </thead>
          <tbody>
            {classified.oneD.map((r, i) => (
              <tr key={r.key}>
                <td>{i + 1}</td>
                <td>
                  {r.duo[0].name} & {r.duo[1].name}
                </td>
                <td>{r.totalCattle}</td>
                <td>{r.bestTime}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Classificados 2D (11 a 20)</h3>
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Dupla</th>
              <th>Bois</th>
              <th>Melhor Tempo</th>
            </tr>
          </thead>
          <tbody>
            {classified.twoD.map((r, i) => (
              <tr key={r.key}>
                <td>{i + 11}</td>
                <td>
                  {r.duo[0].name} & {r.duo[1].name}
                </td>
                <td>{r.totalCattle}</td>
                <td>{r.bestTime}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => navigate('/final', { state: { ranking, classified } })}
      >
        Ir para a Final
      </button>
    </div>
  );
}
