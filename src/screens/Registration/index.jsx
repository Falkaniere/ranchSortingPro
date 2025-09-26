// screens/Registration.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = ['Aberta', 'Amador 19', 'Amador Light', 'Principiante'];

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
  const [category, setCategory] = useState(categories[0]);
  const navigate = useNavigate();

  const addCompetitor = () => {
    if (name.trim() !== '') {
      setCompetitors([...competitors, { name: name.trim(), category }]);
      setName('');
      setCategory(categories[0]);
    }
  };

  const handleNext = () => {
    if (competitors.length < 2)
      return alert('Adicione pelo menos 2 competidores.');
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
            <li key={i}>
              👤 {c.name} — <strong>{c.category}</strong>
            </li>
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
