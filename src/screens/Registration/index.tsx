import React, { useState } from 'react';
import { Competitor, RiderCategory } from 'core/models/Competidor';

interface RegistrationProps {
  competitors: Competitor[];
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
  numRounds: number;
  setNumRounds: React.Dispatch<React.SetStateAction<number>>;
  setRounds: React.Dispatch<any>; // rounds gerados depois
}

export default function Registration({
  competitors,
  setCompetitors,
  numRounds,
  setNumRounds,
  setRounds,
}: RegistrationProps) {
  const [form, setForm] = useState({
    name: '',
    category: 'Open' as RiderCategory,
    passes: 1,
  });

  function addCompetitor() {
    if (!form.name.trim()) {
      alert('Name is required.');
      return;
    }

    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      category: form.category,
      passes: form.passes,
    };

    setCompetitors([...competitors, newCompetitor]);
    setForm({ name: '', category: 'Open', passes: 1 });
  }

  return (
    <div className="registration-container">
      <h1>Registration</h1>

      <div className="form">
        <input
          type="text"
          placeholder="Name"
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
        <input
          type="number"
          min={1}
          placeholder="Passes"
          value={form.passes}
          onChange={(e) => setForm({ ...form, passes: Number(e.target.value) })}
        />
        <button onClick={addCompetitor}>Add Competitor</button>
      </div>

      <h2>Competitors</h2>
      <ul>
        {competitors.map((c) => (
          <li key={c.id}>
            {c.name} — {c.category} — {c.passes} passes
          </li>
        ))}
      </ul>

      <div className="rounds-setting">
        <label>
          Number of Rounds:
          <input
            type="number"
            min={1}
            value={numRounds}
            onChange={(e) => setNumRounds(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
