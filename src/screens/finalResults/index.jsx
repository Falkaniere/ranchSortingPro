import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function FinalResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const finalResults = location.state?.finalResults || [];

  // Agrupar resultados por dupla
  const rankingMap = {};

  finalResults.forEach((r) => {
    const key = r.duo.join('-');
    if (!rankingMap[key]) {
      rankingMap[key] = {
        duo: r.duo,
        passes: [], // tempos de cada passada
        finalTime: 0,
        totalCattle: 0,
      };
    }
    rankingMap[key].passes.push(r.previousTime);
    rankingMap[key].finalTime = r.time;
    rankingMap[key].totalCattle += r.cattle;
  });

  const ranking = Object.values(rankingMap).map((r) => {
    const allTimes = [...r.passes, r.finalTime];
    const averageTime = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
    return {
      ...r,
      allTimes,
      averageTime,
    };
  });

  // Ordenar: maior quantidade de bois → menor média
  ranking.sort((a, b) => {
    if (b.totalCattle !== a.totalCattle) return b.totalCattle - a.totalCattle;
    return a.averageTime - b.averageTime;
  });

  return (
    <div className="container">
      <h2>Resultado Final 🏆</h2>
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
              <span>
                {index + 1}. {r.duo[0]} & {r.duo[1]}
              </span>
              <span>
                Passadas: {r.passes.join('s, ')}s | Final: {r.finalTime}s |
                Média: {r.averageTime.toFixed(2)}s | Bois: {r.totalCattle}
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
