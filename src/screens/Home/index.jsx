// src/screens/Home/index.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home({
  competitors,
  setCompetitors,
  setRounds,
  setResults,
  setFinalResults,
}) {
  const navigate = useNavigate();
  const [newCompetitor, setNewCompetitor] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');

  const startNewCompetition = () => {
    setCompetitors([]);
    setRounds([]);
    setResults([]);
    setFinalResults([]);
    navigate('/registration');
  };

  const continueWithExisting = () => {
    if (competitors.length < 2) {
      alert('⚠️ Você precisa de pelo menos 2 competidores.');
      return;
    }
    setRounds([]);
    setResults([]);
    setFinalResults([]);
    navigate('/duos');
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() === '') return;
    setCompetitors([
      ...competitors,
      { name: newCompetitor.trim(), category: 'Aberta' }, // categoria padrão
    ]);
    setNewCompetitor('');
  };

  const saveEdit = (index) => {
    if (editingName.trim() === '') return;
    const updated = [...competitors];
    updated[index] = { ...updated[index], name: editingName.trim() };
    setCompetitors(updated);
    setEditingIndex(null);
    setEditingName('');
  };

  const removeCompetitor = (index) => {
    if (window.confirm('Tem certeza que deseja remover este competidor?')) {
      const updated = competitors.filter((_, i) => i !== index);
      setCompetitors(updated);
    }
  };

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>🏇 Ranch Sorting</h1>
      <div className="flex" style={{ justifyContent: 'center', margin: 20 }}>
        <button onClick={startNewCompetition}>Iniciar Nova Competição</button>
        <button className="secondary" onClick={() => navigate('/duos')}>
          Já tenho sorteio
        </button>
        {competitors.length > 1 && (
          <button onClick={continueWithExisting} className="secondary">
            Continuar com os mesmos competidores
          </button>
        )}
      </div>

      {/* 🔹 Input de adicionar competidores sempre visível */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Adicionar competidor"
          value={newCompetitor}
          onChange={(e) => setNewCompetitor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
        />
        <button onClick={addCompetitor}>Adicionar</button>
      </div>

      {competitors.length > 0 && (
        <div className="card">
          <h2>Competidores Registrados</h2>
          <p>Total: {competitors.length}</p>
          <ul>
            {competitors.map((c, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {editingIndex === i ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(i)}
                    />
                    <button onClick={() => saveEdit(i)}>Salvar</button>
                    <button onClick={() => setEditingIndex(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    👤 {c.name} — <strong>{c.category}</strong>{' '}
                    <button
                      onClick={() => {
                        setEditingIndex(i);
                        setEditingName(c.name);
                      }}
                      className="secondary"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => removeCompetitor(i)}
                      className="danger"
                      style={{ marginLeft: 10 }}
                    >
                      Remover
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
