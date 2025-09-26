// screens/Registration.jsx
import React, { useState, useMemo } from 'react';
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

  // 🔹 Cálculo de duplas totais
  const totalDuplas = useMemo(() => {
    const n = competitors.length;
    if (n < 2 || numRounds < 1) return 0;
    return (n * numRounds) / 2;
  }, [competitors, numRounds]);

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
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCompetitor(); // 🔹 Pressionou Enter → adicionar
            }}
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
          <label>Quantidade de Passadas por Competidor: </label>
          <input
            type="number"
            value={numRounds}
            min={1}
            onChange={(e) => setNumRounds(Number(e.target.value))}
          />
        </div>

        {/* 🔹 Contagem total */}
        <div style={{ marginTop: 20 }}>
          <strong>Total: {competitors.length} competidores registrados</strong>
        </div>

        {/* 🔹 Preview de quantas duplas serão formadas */}
        {totalDuplas > 0 && (
          <div style={{ marginTop: 10, color: '#007bff' }}>
            Serão geradas <strong>{totalDuplas}</strong> duplas no total.
          </div>
        )}

        <ul style={{ marginTop: 10 }}>
          {competitors.map((c, i) => (
            <li key={i}>
              {i + 1}. 👤 {c.name} — <strong>{c.category}</strong>
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
