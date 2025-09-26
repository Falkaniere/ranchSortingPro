// src/screens/QualifiersResults.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QualifiersResults({ results }) {
  const navigate = useNavigate();
  const ranking = [];

  // Agrupar por dupla
  results.forEach((result) => {
    const key = result.duo.join('-');
    let item = ranking.find((ranked) => ranked.key === key);
    if (!item) {
      item = {
        key,
        duo: result.duo,
        totalCattle: 0,
        bestTime: Infinity,
      };
      ranking.push(item);
    }
    item.totalCattle += result.cattle;
    if (result.time < item.bestTime) item.bestTime = result.time;
  });

  // Ordenar: maior quantidade de bois → menor tempo
  ranking.sort((first, second) => {
    if (second.totalCattle !== first.totalCattle)
      return second.totalCattle - first.totalCattle;
    return first.bestTime - second.bestTime;
  });

  return (
    <div className="container">
      <h2>Ranking das Qualificatórias</h2>
      <div className="card">
        <ol>
          {ranking.map((ranked) => (
            <li key={ranked.key}>
              {ranked.duo[0]} & {ranked.duo[1]} → {ranked.totalCattle} bois | ⏱{' '}
              {ranked.bestTime}s
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
