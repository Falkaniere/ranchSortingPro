// src/screens/QualifiersResults.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QualifiersResults({ results }) {
  const navigate = useNavigate();
  const ranking = [];

  // Agrupar por dupla
  results.forEach((r) => {
    const key = r.duo.join('-');
    let item = ranking.find((x) => x.key === key);
    if (!item) {
      item = {
        key,
        duo: r.duo,
        totalCattle: 0,
        bestTime: Infinity,
      };
      ranking.push(item);
    }
    item.totalCattle += r.cattle;
    if (r.time < item.bestTime) item.bestTime = r.time;
  });

  // Ordenar: maior quantidade de bois → menor tempo
  ranking.sort((a, b) => {
    if (b.totalCattle !== a.totalCattle) return b.totalCattle - a.totalCattle;
    return a.bestTime - b.bestTime;
  });

  return (
    <div className="container">
      <h2>Ranking das Qualificatórias</h2>
      <div className="card">
        <ol>
          {ranking.map((r) => (
            <li key={r.key}>
              {r.duo[0]} & {r.duo[1]} → {r.totalCattle} bois | ⏱ {r.bestTime}s
            </li>
          ))}
        </ol>
      </div>
      <button onClick={() => navigate('/final', { state: { ranking } })}>
        Ir para a Final
      </button>
    </div>
  );
}
