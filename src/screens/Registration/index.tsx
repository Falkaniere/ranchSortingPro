import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Competitor, RiderCategory } from 'core/models/Competidor';
import { Duo } from 'core/models/Duo';
import { generateUniqueDuos } from 'core/logic/pairing';
import './index.css';

interface RegistrationProps {
  competitors: Competitor[];
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
  numRounds: number;
  setNumRounds: React.Dispatch<React.SetStateAction<number>>;
  setRounds: React.Dispatch<React.SetStateAction<Duo[]>>;
}

const categories: RiderCategory[] = [
  'Open',
  'Amateur19',
  'AmateurLight',
  'Beginner',
];

export default function Registration({
  competitors,
  setCompetitors,
  numRounds,
  setNumRounds,
  setRounds,
}: RegistrationProps) {
  const navigate = useNavigate();

  // Add form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RiderCategory>('Open');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<RiderCategory>('Open');

  function addCompetitor() {
    if (!name.trim()) {
      alert('Name is required.');
      return;
    }
    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      passes: numRounds, // todos herdam o mesmo número de passadas
    };
    setCompetitors((prev) => [...prev, newCompetitor]);
    setName('');
    setCategory('Open');
  }

  function startEdit(c: Competitor) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditCategory(c.category);
  }

  function saveEdit() {
    if (!editingId) return;
    if (!editName.trim()) {
      alert('Name is required.');
      return;
    }
    setCompetitors((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? { ...c, name: editName.trim(), category: editCategory }
          : c
      )
    );
    setEditingId(null);
  }

  function removeCompetitor(id: string) {
    const competitor = competitors.find((c) => c.id === id);
    if (!competitor) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${competitor.name}?`
    );
    if (!confirmDelete) return;

    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSortDuos() {
    if (competitors.length < 2) {
      alert('You need at least 2 competitors to sort duos.');
      return;
    }
    try {
      // garante que todos têm passes = numRounds
      const normalized = competitors.map((c) => ({ ...c, passes: numRounds }));
      const { duos } = generateUniqueDuos(normalized);
      setRounds(duos);
      navigate('/duos');
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="registration-container">
      <h1>Register Competitors</h1>

      {/* Número de passadas (único para todos) */}
      <div className="rounds-form">
        <label>
          Number of passes (for all):
          <input
            type="number"
            min={1}
            value={numRounds}
            onChange={(e) => setNumRounds(Number(e.target.value))}
          />
        </label>
      </div>

      {/* Form de cadastro */}
      <div className="form">
        <input
          type="text"
          placeholder="Competitor name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as RiderCategory)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button onClick={addCompetitor}>Add</button>
      </div>

      {/* Lista com edição/remoção */}
      <h2>Competitors</h2>
      <ul>
        {competitors.map((c) => (
          <li key={c.id}>
            {editingId === c.id ? (
              <div className="edit-row">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <select
                  className="category-select"
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(e.target.value as RiderCategory)
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="row-actions">
                  <button className="save-btn" onClick={saveEdit}>
                    Save
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="competitor-row">
                <span>
                  {c.name} — {c.category}
                </span>
                <div className="row-actions">
                  <button className="edit-btn" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeCompetitor(c.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Avançar para o sorteio */}
      {competitors.length > 1 && (
        <button style={{ marginTop: '1rem' }} onClick={handleSortDuos}>
          Sort Duos
        </button>
      )}
    </div>
  );
}
