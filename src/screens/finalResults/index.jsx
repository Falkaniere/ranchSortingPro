import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ResultadoFinal() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultados = location.state?.resultados || [];

  // ordenar: mais bois primeiro, depois menor tempo
  const ranking = [...resultados].sort((a, b) => {
    if (b.quantidade !== a.quantidade) {
      return b.quantidade - a.quantidade;
    }
    return a.tempo - b.tempo;
  });

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Resultado Final 🏆</h2>
      <ol style={{ textAlign: 'left', display: 'inline-block' }}>
        {ranking.map((r, i) => (
          <li key={i}>
            {r.dupla[0]} & {r.dupla[1]} → 🐂 {r.numeroBoi} | {r.quantidade} bois
            | ⏱ {r.tempo}s
          </li>
        ))}
      </ol>

      <div style={{ marginTop: '30px' }}>
        <button onClick={() => navigate('/')}>Voltar para Home</button>
      </div>
    </div>
  );
}

export default ResultadoFinal;
