import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { PassResult, DuoScore } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import { compareByScore } from 'core/logic/scoring';
import './index.css';

type PartialRow = DuoScore & { duoLabel: string };

export default function Qualifiers() {
  const navigate = useNavigate();
  const { addQualifierResult, results, duosMeta } = useResults();
  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });

  // Duplas já registradas
  const registeredDuos = results
    .filter((r: PassResult) => r.stage === 'Qualifier')
    .map((r: PassResult) => r.duoId);

  // Pendentes (do contexto)
  const duos = duosMeta;
  const pendingDuos = duos.filter((d) => !registeredDuos.includes(d.id));
  const currentDuo = pendingDuos[0] ?? null;

  const partials: PartialRow[] = results
    .filter((r: PassResult) => r.stage === 'Qualifier')
    .map((r: PassResult) => {
      const duo = duos.find((d) => d.id === r.duoId);
      return {
        duoId: r.duoId,
        duoLabel: duo?.label ?? r.duoId,
        group: (duo?.group ?? '1D') as DuoGroup,
        cattleCount: r.cattleCount,
        timeSeconds: r.timeSeconds,
      };
    })
    .sort((a, b) => compareByScore(a, b));

  function saveQualifierResult(isSAT = false) {
    if (!currentDuo) return;

    const cattle = isSAT ? 0 : Number(form.cattleCount);
    const time = isSAT ? 120 : Number(form.timeSeconds);

    if (!isSAT) {
      if (isNaN(cattle) || cattle < 0 || cattle > 10) {
        alert('Bois inválido (0-10).');
        return;
      }
      if (isNaN(time) || time <= 0) {
        alert('Tempo inválido.');
        return;
      }
    }

    addQualifierResult(currentDuo.id, cattle, time, isSAT);
    setForm({ cattleCount: '', timeSeconds: '' });
  }

  const allRegistered = pendingDuos.length === 0;

  return (
    <div className="qualifiers-container">
      <h1>Qualificatórias</h1>

      {currentDuo && (
        <div className="form">
          <div className="current-duo">
            <strong>Dupla atual:</strong> {currentDuo.label} ({currentDuo.group}
            )
          </div>
          <input
            type="number"
            placeholder="Bois"
            value={form.cattleCount}
            onChange={(e) => setForm({ ...form, cattleCount: e.target.value })}
          />
          <input
            type="number"
            placeholder="Tempo (s)"
            value={form.timeSeconds}
            onChange={(e) => setForm({ ...form, timeSeconds: e.target.value })}
          />
          <button onClick={() => saveQualifierResult(false)}>Salvar</button>
          <button onClick={() => saveQualifierResult(true)}>SAT</button>
        </div>
      )}

      <div className="pending-list">
        <h2>Próximas duplas</h2>
        <ul className="pending-list-items">
          {pendingDuos.map((duo) => (
            <li key={duo.id}>
              {duo.label} — {duo.group}
            </li>
          ))}
        </ul>
      </div>

      <div className="partials">
        <h2>Parciais</h2>
        {partials.length === 0 ? (
          <p>Sem resultados ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Grupo</th>
                <th>Bois</th>
                <th>Tempo</th>
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

      {allRegistered && (
        <button onClick={() => navigate('/final')}>Ir para Finais</button>
      )}
    </div>
  );
}
