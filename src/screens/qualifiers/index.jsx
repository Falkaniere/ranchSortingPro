import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Qualifiers() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultados = location.state?.resultados || [];

  // agrupar por dupla
  const ranking = [];
  resultados.forEach((r) => {
    const key = r.dupla.join('-');
    let item = ranking.find((x) => x.key === key);

    if (!item) {
      item = {
        key,
        dupla: r.dupla,
        totalBois: 0,
        menorTempo: Infinity,
      };
      ranking.push(item);
    }

    item.totalBois += r.quantidade;
    if (r.tempo < item.menorTempo) {
      item.menorTempo = r.tempo;
    }
  });

  // ordenar: maior bois → menor tempo
  ranking.sort((a, b) => {
    if (b.totalBois !== a.totalBois) {
      return b.totalBois - a.totalBois;
    }
    return a.menorTempo - b.menorTempo;
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Classificação</h2>
      <ol>
        {ranking.map((r) => (
          <li key={r.key}>
            {r.dupla[0]} & {r.dupla[1]} → {r.totalBois} bois | ⏱ {r.menorTempo}s
          </li>
        ))}
      </ol>

      <button
        style={{ marginTop: '20px' }}
        onClick={() => navigate('/final', { state: { ranking } })}
      >
        Iniciar Final
      </button>
    </div>
  );
}

export default Qualifiers;
