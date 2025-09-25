import React from 'react';
import { useNavigate } from 'react-router-dom';

function Qualifiers({ results }) {
  const navigate = useNavigate();
  const resultados = results || [];
  console.log('Resultados recebidos em Qualifiers:', resultados);

  // agrupar por dupla
  const ranking = [];
  resultados.forEach((r) => {
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

    item.totalCattle += r.cattle; // ✅ nome correto
    if (r.time < item.bestTime) {
      // ✅ nome correto
      item.bestTime = r.time;
    }
  });

  // ordenar: maior gado → menor tempo
  ranking.sort((a, b) => {
    if (b.totalCattle !== a.totalCattle) {
      return b.totalCattle - a.totalCattle;
    }
    return a.bestTime - b.bestTime;
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Qualifiers Ranking</h2>
      <ol>
        {ranking.map((r) => (
          <li key={r.key}>
            {r.duo[0]} & {r.duo[1]} → {r.totalCattle} cattle | ⏱ {r.bestTime}s
          </li>
        ))}
      </ol>

      <button
        style={{ marginTop: '20px' }}
        onClick={() => navigate('/finals', { state: { ranking } })}
      >
        Start Finals
      </button>
    </div>
  );
}

export default Qualifiers;
