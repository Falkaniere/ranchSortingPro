import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResultadoFinal({ resultados }) {
  const navigate = useNavigate();

  const ranking = Array.from(
    resultados.reduce((map, r) => {
      r.dupla.forEach((c) => {
        if (!map.has(c)) map.set(c, { bois: 0, tempo: 0, rodadas: 0 });
        map.get(c).bois += r.bois;
        map.get(c).tempo += r.tempo;
        map.get(c).rodadas += 1;
      });
      return map;
    }, new Map())
  )
    .map(([nome, data]) => ({
      nome,
      mediaBois: data.bois / data.rodadas,
      mediaTempo: data.tempo / data.rodadas,
    }))
    .sort((a, b) => b.mediaBois - a.mediaBois || a.mediaTempo - b.mediaTempo);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Resultado Final 🏆</h2>
      <ol style={{ display: 'inline-block', textAlign: 'left' }}>
        {ranking.map((r, i) => (
          <li key={i}>
            {r.nome} → Bois médio: {r.mediaBois.toFixed(2)}, Tempo médio:{' '}
            {r.mediaTempo.toFixed(2)}s
          </li>
        ))}
      </ol>
      <div style={{ marginTop: 20 }}>
        <button onClick={() => navigate('/')}>Voltar para Home</button>
      </div>
    </div>
  );
}
