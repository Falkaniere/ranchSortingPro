import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Competitor, RiderCategory } from 'core/models/Competidor';
import { Duo } from 'core/models/Duo';
import { generateUniqueDuos } from 'core/logic/pairing';
import './index.css';
import { useResults } from 'context/ResultContext';

interface RegistrationProps {
  competitors: Competitor[];
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
  numRounds: number;
  setNumRounds: React.Dispatch<React.SetStateAction<number>>;
  setRounds: React.Dispatch<React.SetStateAction<Duo[]>>;
}

const categories: { label: string; value: RiderCategory }[] = [
  { label: 'Aberta', value: 'Open' },
  { label: 'Amador 19', value: 'Amateur19' },
  { label: 'Amador Light', value: 'AmateurLight' },
  { label: 'Principiante', value: 'Beginner' },
];

export default function Registration({
  competitors,
  setCompetitors,
  numRounds,
  setNumRounds,
  setRounds,
}: RegistrationProps) {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<RiderCategory>('Open');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // dentro do componente
  const { setDuosMeta } = useResults();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<RiderCategory>('Open');

  function addCompetitor() {
    if (!name.trim()) {
      alert('O nome é obrigatório.');
      return;
    }
    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      passes: numRounds,
    };
    setCompetitors((prev) => [...prev, newCompetitor]);

    setName('');
    setCategory('Open');
    nameInputRef.current?.focus();
  }

  function startEdit(c: Competitor) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditCategory(c.category);
  }

  function saveEdit() {
    if (!editingId) return;
    if (!editName.trim()) {
      alert('O nome é obrigatório.');
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
      `Tem certeza que deseja remover ${competitor.name}?`
    );
    if (!confirmDelete) return;

    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSortDuos() {
    if (competitors.length < 2) {
      alert('É necessário pelo menos 2 competidores para sortear as duplas.');
      return;
    }

    try {
      const normalized = competitors.map((c) => ({ ...c, passes: numRounds }));
      const { duos } = generateUniqueDuos(normalized, {
        passesPerCompetitor: numRounds,
        method: 'auto',
      });

      // 🧠 Aqui adicionamos o label legível com o nome dos dois competidores
      const duosWithLabels = duos.map((duo) => {
        const riderOne = competitors.find((c) => c.id === duo.riderOneId);
        const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
        const label = `${riderOne?.name ?? '?'} 🤝 ${riderTwo?.name ?? '?'}`;
        return { ...duo, label };
      });

      setRounds(duosWithLabels);
      setDuosMeta(duosWithLabels); // salva no contexto com nomes
      navigate('/duos');
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="registration-container">
      <h1>Cadastro de Competidores</h1>

      {/* Número de passadas */}
      <div className="rounds-form">
        <label>
          Número de passadas:
          <input
            className="rounds-input"
            type="number"
            min={1}
            value={numRounds}
            onChange={(e) => {
              console.log('TA MUDANDO O VALOR AQUI', e.target.value);
              setNumRounds(Number(e.target.value));
            }}
          />
        </label>
      </div>

      {/* Form de cadastro */}
      <div className="form">
        <input
          ref={nameInputRef}
          type="text"
          placeholder="Nome do competidor"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
        />

        <div className="category-toggle">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`cat-btn ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button className="add-btn" onClick={addCompetitor}>
          Adicionar
        </button>
      </div>

      {/* Lista */}
      <h2>Competidores ({competitors.length})</h2>
      <ul>
        {competitors.map((c, index) => (
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
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="row-actions">
                  <button className="save-btn" onClick={saveEdit}>
                    Salvar
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="competitor-row">
                <span className="competitor-info">
                  <span className="competitor-index">{index + 1}.</span>
                  <span className="competitor-name">
                    {c.name} —{' '}
                    {categories.find((cat) => cat.value === c.category)?.label}
                  </span>
                </span>
                <div className="row-actions">
                  <button className="edit-btn" onClick={() => startEdit(c)}>
                    Editar
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeCompetitor(c.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {competitors.length > 1 && (
        <button style={{ marginTop: '1rem' }} onClick={handleSortDuos}>
          Sortear Duplas
        </button>
      )}
    </div>
  );
}
