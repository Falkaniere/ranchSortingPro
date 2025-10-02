// src/screens/Registration/index.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Competitor, RiderCategory } from 'core/models/Competidor';
import { generateUniqueDuos } from 'core/logic/pairing';
import { Duo } from 'core/models/Duo';

interface RegistrationProps {
  competitors: Competitor[];
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
  numRounds: number;
  setNumRounds: React.Dispatch<React.SetStateAction<number>>;
  setRounds: React.Dispatch<React.SetStateAction<Duo[]>>;
}

export default function Registration({
  competitors,
  setCompetitors,
  numRounds,
  setNumRounds,
  setRounds,
}: RegistrationProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    category: 'Open' as RiderCategory,
  });

  function addCompetitor() {
    if (!form.name.trim()) return alert('Name required');

    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      category: form.category,
      passes: numRounds, // 👈 todos herdam numRounds
    };

    setCompetitors([...competitors, newCompetitor]);
    setForm({ name: '', category: 'Open' });
  }

  function handleSortDuos() {
    try {
      const { duos } = generateUniqueDuos(
        competitors.map((c) => ({ ...c, passes: numRounds }))
      );
      setRounds(duos);
      navigate('/duos');
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="registration-container">
      <h1>Registration</h1>

      <div>
        <label>
          Number of Passes:
          <input
            type="number"
            min={1}
            value={numRounds}
            onChange={(e) => setNumRounds(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="form">
        <input
          type="text"
          placeholder="Competitor Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value as RiderCategory })
          }
        >
          <option value="Open">Open</option>
          <option value="Amateur19">Amateur 19</option>
          <option value="AmateurLight">Amateur Light</option>
          <option value="Beginner">Beginner</option>
        </select>
        <button onClick={addCompetitor}>Add Competitor</button>
      </div>

      <h2>Competitors</h2>
      <ul>
        {competitors.map((c) => (
          <li key={c.id}>
            {c.name} — {c.category}
          </li>
        ))}
      </ul>

      {competitors.length > 1 && (
        <button onClick={handleSortDuos}>Sort Duos</button>
      )}
    </div>
  );
}
