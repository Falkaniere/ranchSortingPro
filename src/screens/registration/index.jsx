import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Registration({
  competitors,
  setCompetitors,
  numRounds,
  setNumRounds,
}) {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const addCompetitor = () => {
    if (name.trim() !== '') {
      setCompetitors([...competitors, name.trim()]);
      setName('');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Registro de competidores</h2>
      <input
        type="text"
        placeholder="Nome do competidor"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={addCompetitor}>Adicionar</button>

      <div style={{ marginTop: 20 }}>
        <label>Número de passadas: </label>
        <input
          type="number"
          value={numRounds}
          min={1}
          onChange={(e) => setNumRounds(Number(e.target.value))}
        />
      </div>

      <ul>
        {competitors.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <button
        disabled={competitors.length < 2}
        onClick={() => navigate('/duos')}
      >
        Gerar Duplas
      </button>
    </div>
  );
}
