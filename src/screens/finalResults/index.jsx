// src/screens/FinalResults.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function FinalResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const finalResults = location.state?.finalResults || [];

  const ranking = finalResults
    .map((r) => ({
      duo: r.duo,
      previousTime: r.previousTime,
      finalTime: r.time,
      averageTime: (r.previousTime + r.time) / 2,
      cattle: r.cattle,
    }))
    .sort((a, b) => {
      if (b.cattle !== a.cattle) return b.cattle - a.cattle;
      return a.averageTime - b.averageTime;
    });

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Resultado Final 🏆</h2>
      <ol style={{ display: 'inline-block', textAlign: 'left' }}>
        {ranking.map((r, i) => (
          <li key={i}>
            {r.duo[0]} & {r.duo[1]} → Passada: {r.previousTime}s | Final:{' '}
            {r.finalTime}s | Média: {r.averageTime.toFixed(2)}s | Bois:{' '}
            {r.cattle}
          </li>
        ))}
      </ol>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => navigate('/')}>Voltar para Home</button>
      </div>
    </div>
  );
}
