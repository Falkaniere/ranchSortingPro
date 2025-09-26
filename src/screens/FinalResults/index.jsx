// src/screens/FinalResults/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FinalResults({ finalResults = [] }) {
  const navigate = useNavigate();

  // Agrupar resultados por dupla
  const rankingMap = {};
  finalResults.forEach((r) => {
    const key = r.duo.join('🤝');
    if (!rankingMap[key]) {
      rankingMap[key] = {
        duo: r.duo,
        pass: r.pass,
        qualifTime: r.previousTime || 0,
        finalTime: r.time || 0,
        finalCattle: r.cattle || 0,
        qualifBois: r.previousBois || 0, // caso precise futuramente
      };
    }
  });

  // Calcular médias combinadas
  const ranking = Object.values(rankingMap).map((r) => {
    const avgTime =
      r.qualifTime > 0 ? (r.qualifTime + r.finalTime) / 2 : r.finalTime;

    const avgBois =
      r.qualifBois > 0 ? (r.qualifBois + r.finalCattle) / 2 : r.finalCattle;

    return {
      ...r,
      avgTime,
      avgBois,
    };
  });

  // Ordenar: maior bois → menor tempo
  ranking.sort((a, b) => {
    if (b.avgBois !== a.avgBois) return b.avgBois - a.avgBois;
    return a.avgTime - b.avgTime;
  });

  return (
    <div className="container">
      <h2>🏆 Resultado Final</h2>
      <div className="card">
        <ol style={{ paddingLeft: 20 }}>
          {ranking.map((r, index) => (
            <li
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid #ccc',
                marginBottom: 4,
                borderRadius: 4,
              }}
            >
              <span style={{ fontWeight: 'bold' }}>
                {index + 1}. {r.duo[0]} & {r.duo[1]}
              </span>
              <span style={{ textAlign: 'right', minWidth: 400 }}>
                Qualif Med: {r.qualifTime.toFixed(3)}s | Final:{' '}
                {r.finalTime.toFixed(3)}s | Bois Final: {r.finalCattle} |{' '}
                <strong>
                  Média: {r.avgTime.toFixed(3)}s • Bois: {r.avgBois.toFixed(2)}
                </strong>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <button style={{ marginTop: 20 }} onClick={() => navigate('/')}>
        Voltar para Home
      </button>
    </div>
  );
}
