import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { PassResult } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import { compareByScore } from 'core/logic/scoring';
import './index.css';

interface QualifiersProps {
  duos: { id: string; label: string; group: DuoGroup }[];
}

export default function Qualifiers({ duos }: QualifiersProps) {
  const navigate = useNavigate();
  const { addResult, passResults } = useResults();

  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });

  // Duplas já registradas
  const registeredDuos = passResults
    .filter((r) => r.stage === 'Qualifier')
    .map((r) => r.duoId);

  // Pendentes
  const pendingDuos = duos.filter((d) => !registeredDuos.includes(d.id));

  // Parciais
  const partials = passResults
    .filter((r) => r.stage === 'Qualifier')
    .map((r) => {
      const duo = duos.find((d) => d.id === r.duoId);
      return {
        duoId: r.duoId,
        duoLabel: duo?.label ?? r.duoId,
        group: duo?.group ?? '1D',
        cattleCount: r.cattleCount,
        timeSeconds: r.timeSeconds,
      };
    })
    .sort(compareByScore);

  // Próxima dupla a registrar = primeira da lista pendente
  const currentDuo = pendingDuos[0] ?? null;

  function saveQualifierResult(isSAT = false) {
    if (!currentDuo) return;

    const cattle = isSAT ? 0 : Number(form.cattleCount);
    const time = isSAT ? 120 : Number(form.timeSeconds);

    if (!isSAT) {
      if (isNaN(cattle) || cattle < 0 || cattle > 10) {
        alert('Invalid cattle count (0-10).');
        return;
      }
      if (isNaN(time) || time <= 0) {
        alert('Invalid time.');
        return;
      }
    }

    const newResult: PassResult = {
      duoId: currentDuo.id,
      stage: 'Qualifier',
      cattleCount: cattle,
      timeSeconds: time,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };

    addResult(newResult);
    setForm({ cattleCount: '', timeSeconds: '' });
  }

  const allRegistered = pendingDuos.length === 0;

  return (
    <div className="qualifiers-container">
      <h1>Qualifiers</h1>

      {/* Form automático para a próxima dupla */}
      {currentDuo && (
        <div className="form">
          <div className="current-duo">
            <strong>Current Duo:</strong> {currentDuo.label} ({currentDuo.group}
            )
          </div>

          <input
            type="number"
            placeholder="Cattle count"
            value={form.cattleCount}
            onChange={(e) => setForm({ ...form, cattleCount: e.target.value })}
          />
          <input
            type="number"
            placeholder="Time (s)"
            value={form.timeSeconds}
            onChange={(e) => setForm({ ...form, timeSeconds: e.target.value })}
          />

          <button onClick={() => saveQualifierResult(false)}>Save</button>
          <button onClick={() => saveQualifierResult(true)}>SAT</button>
        </div>
      )}

      {/* Lista de pendentes */}
      {pendingDuos.length > 0 && (
        <div className="pending-list">
          <h2>Pending Duos</h2>
          <ul>
            {pendingDuos.map((duo) => (
              <li key={duo.id}>
                {duo.label} — Group {duo.group}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Parciais */}
      <div className="partials">
        <h2>Partials</h2>
        {partials.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Duo</th>
                <th>Group</th>
                <th>Cattle</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {partials.map((p, idx) => (
                <tr key={p.duoId}>
                  <td>{idx + 1}</td>
                  <td>{p.duoLabel}</td>
                  <td>{p.group}</td>
                  <td>{p.cattleCount}</td>
                  <td>{p.timeSeconds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Avançar quando todas cadastradas */}
      {allRegistered && (
        <button onClick={() => navigate('/final')}>Go to Finals</button>
      )}
    </div>
  );
}
