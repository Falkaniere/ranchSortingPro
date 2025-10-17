import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { PassResult, DuoScore } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import { compareByScore } from 'core/logic/scoring';
import './index.css';
import { exportToExcel } from 'utils/exportExcel';

type PartialRow = DuoScore & { duoLabel: string };

export default function Qualifiers() {
  const navigate = useNavigate();
  const { addQualifierResult, updateQualifierResult, results, duosMeta } =
    useResults();
  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    cattleCount: '',
    timeSeconds: '',
  });

  const registeredDuos = results
    .filter((r: PassResult) => r.stage === 'Qualifier')
    .map((r) => r.duoId);

  const duos = duosMeta.map((d, index) => ({ ...d, number: index + 1 }));
  const pendingDuos = duos.filter((d) => !registeredDuos.includes(d.id));
  const currentDuo = pendingDuos[0] ?? null;

  const partials: PartialRow[] = results
    .filter((r: PassResult) => r.stage === 'Qualifier')
    .map((r) => {
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
        alert('Bois inválido (0–10).');
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

  // --- EDIÇÃO INLINE ---
  function startEdit(row: PartialRow) {
    setEditingId(row.duoId);
    setEditForm({
      cattleCount: row.cattleCount.toString(),
      timeSeconds: row.timeSeconds.toString(),
    });
  }

  function saveEdit(duoId: string) {
    const cattle = Number(editForm.cattleCount);
    const time = Number(editForm.timeSeconds);

    if (isNaN(cattle) || cattle < 0 || cattle > 10) {
      alert('Bois inválido (0–10).');
      return;
    }
    if (isNaN(time) || time <= 0) {
      alert('Tempo inválido.');
      return;
    }

    updateQualifierResult(duoId, cattle, time);
    setEditingId(null);
  }

  const allRegistered = pendingDuos.length === 0;

  return (
    <div className="qualifiersContainer">
      <h1 className="title">Qualificatórias</h1>

      <button
        onClick={() =>
          exportToExcel(
            partials.map((p, idx) => ({
              Passada: idx + 1,
              Dupla: p.duoLabel,
              Categoria: p.group,
              Bois: p.cattleCount,
              Tempo: p.timeSeconds,
            })),
            'Resultados_Qualificatorias'
          )
        }
      >
        Exportar Qualificatórias
      </button>

      {/* Formulário da dupla atual */}
      {currentDuo && (
        <div className="form">
          <div className="currentDuo">
            <strong>Dupla atual:</strong>{' '}
            <span>
              {currentDuo.number}. {currentDuo.label} ({currentDuo.group})
            </span>
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

      {/* Pendentes */}
      <div className="pending">
        <h2>Duplas Pendentes</h2>
        <ul>
          {pendingDuos.map((duo) => (
            <li key={duo.id}>
              <span className="number">{duo.number}</span>
              <span className="label">{duo.label}</span>
              <span className="group">{duo.group}</span>
            </li>
          ))}
        </ul>
      </div>

      {allRegistered && (
        <button className="nextBtn" onClick={() => navigate('/final')}>
          Ir para Finais
        </button>
      )}

      {/* Parciais */}
      <div className="partials">
        <h2>Parciais</h2>
        {partials.length === 0 ? (
          <p>Sem resultados ainda.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Categoria</th>
                <th>Bois</th>
                <th>Tempo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {partials.map((p, idx) => (
                <tr key={p.duoId}>
                  <td>{idx + 1}</td>
                  <td>{p.duoLabel}</td>
                  <td>{p.group}</td>

                  {editingId === p.duoId ? (
                    <>
                      <td>
                        <input
                          type="number"
                          value={editForm.cattleCount}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              cattleCount: e.target.value,
                            })
                          }
                          style={{ width: '70px', padding: '4px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.timeSeconds}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              timeSeconds: e.target.value,
                            })
                          }
                          style={{ width: '70px', padding: '4px' }}
                        />
                      </td>
                      <td>
                        <button
                          className="save-btn"
                          onClick={() => saveEdit(p.duoId)}
                          style={{
                            background: '#22a31b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            marginRight: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setEditingId(null)}
                          style={{
                            background: '#aaa',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{p.cattleCount}</td>
                      <td>{p.timeSeconds}</td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(p)}
                          style={{
                            background: '#0ea5e9',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          Editar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
