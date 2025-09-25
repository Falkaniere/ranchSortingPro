// screens/Registration.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Registration({
  competitors,
  setCompetitors,
  numRounds,
  setNumRounds,
  setRounds,
  setResults,
  setFinalResults,
}) {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const addCompetitor = () => {
    if (name.trim() !== '') {
      setCompetitors([...competitors, name.trim()]);
      setName('');
    }
  };

  const handleNext = () => {
    if (competitors.length < 2) return alert('Add at least 2 competitors.');
    // Reset rounds e resultados
    setRounds([]);
    setResults([]);
    setFinalResults([]);
    navigate('/duos');
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Registrar Competidores</h2>
        <div className="flex">
          <input
            type="text"
            placeholder="Nome do Competidor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={addCompetitor}>Adicionar</button>
        </div>

        <div style={{ marginTop: 20 }}>
          <label>Quantidade de Passadas: </label>
          <input
            type="number"
            value={numRounds}
            min={1}
            onChange={(e) => setNumRounds(Number(e.target.value))}
          />
        </div>

        <ul style={{ marginTop: 20 }}>
          {competitors.map((c, i) => (
            <li key={i}>👤 {c}</li>
          ))}
        </ul>

        <button
          style={{ marginTop: 20 }}
          disabled={competitors.length < 2}
          onClick={handleNext}
        >
          Sortear Duplas
        </button>
      </div>
    </div>
  );
}
