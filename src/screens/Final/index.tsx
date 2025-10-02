import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { PassResult, DuoScore } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import { compareByScore } from 'core/logic/scoring';
import './index.css';

interface FinalsProps {
  duos: { id: string; label: string; group: DuoGroup }[];
}

type PartialRow = DuoScore & { duoLabel: string };

export default function Finals({ duos }: FinalsProps) {
  const navigate = useNavigate();
  const { addResult, getFinalists, passResults } = useResults();
  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });
  const [activeTab, setActiveTab] = useState<'1D' | '2D'>('1D');

  // Finalistas
  const groupMap = new Map(duos.map((d) => [d.id, d.group]));
  const { finalsOrder1D, finalsOrder2D } = getFinalists(groupMap);

  // Já registrados (Final)
  const registeredFinals = passResults
    .filter((r) => r.stage === 'Final')
    .map((r) => r.duoId);

  // Pendentes
  const pending1D = duos.filter(
    (d) => finalsOrder1D.includes(d.id) && !registeredFinals.includes(d.id)
  );
  const pending2D = duos.filter(
    (d) => finalsOrder2D.includes(d.id) && !registeredFinals.includes(d.id)
  );

  const current1D = pending1D[0] ?? null;
  const current2D = pending2D[0] ?? null;

  // Parciais
  const partials1D: PartialRow[] = passResults
    .filter((r) => r.stage === 'Final' && finalsOrder1D.includes(r.duoId))
    .map((r) => {
      const duo = duos.find((d) => d.id === r.duoId);
      return {
        duoId: r.duoId,
        duoLabel: duo?.label ?? r.duoId,
        group: '1D' as DuoGroup,
        cattleCount: r.cattleCount,
        timeSeconds: r.timeSeconds,
      };
    })
    .sort((a, b) => compareByScore(a, b));

  const partials2D: PartialRow[] = passResults
    .filter((r) => r.stage === 'Final' && finalsOrder2D.includes(r.duoId))
    .map((r) => {
      const duo = duos.find((d) => d.id === r.duoId);
      return {
        duoId: r.duoId,
        duoLabel: duo?.label ?? r.duoId,
        group: '2D' as DuoGroup,
        cattleCount: r.cattleCount,
        timeSeconds: r.timeSeconds,
      };
    })
    .sort((a, b) => compareByScore(a, b));

  // Salvar resultado
  function saveFinalResult(isSAT = false) {
    const currentDuo = activeTab === '1D' ? current1D : current2D;
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
      stage: 'Final',
      cattleCount: cattle,
      timeSeconds: time,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };

    addResult(newResult);
    setForm({ cattleCount: '', timeSeconds: '' });
  }

  const allRegistered = pending1D.length === 0 && pending2D.length === 0;

  return (
    <div className="finals-container">
      <h1>Finals</h1>

      {/* Abas */}
      <div className="tabs">
        <button
          className={activeTab === '1D' ? 'active' : ''}
          onClick={() => setActiveTab('1D')}
        >
          1D
        </button>
        <button
          className={activeTab === '2D' ? 'active' : ''}
          onClick={() => setActiveTab('2D')}
        >
          2D
        </button>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="tab-content">
        {activeTab === '1D' && (
          <>
            {current1D && (
              <div className="form">
                <div className="current-duo">
                  <strong>Current Duo:</strong> {current1D.label} (1D)
                </div>
                <input
                  type="number"
                  placeholder="Cattle count"
                  value={form.cattleCount}
                  onChange={(e) =>
                    setForm({ ...form, cattleCount: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Time (s)"
                  value={form.timeSeconds}
                  onChange={(e) =>
                    setForm({ ...form, timeSeconds: e.target.value })
                  }
                />
                <button onClick={() => saveFinalResult(false)}>Save</button>
                <button onClick={() => saveFinalResult(true)}>SAT</button>
              </div>
            )}

            <h2>Pending Duos (1D)</h2>
            <ul>
              {pending1D.map((duo) => (
                <li key={duo.id}>{duo.label}</li>
              ))}
            </ul>

            {partials1D.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Duo</th>
                    <th>Cattle</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {partials1D.map((p, idx) => (
                    <tr key={p.duoId}>
                      <td>{idx + 1}</td>
                      <td>{p.duoLabel}</td>
                      <td>{p.cattleCount}</td>
                      <td>{p.timeSeconds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === '2D' && (
          <>
            {current2D && (
              <div className="form">
                <div className="current-duo">
                  <strong>Current Duo:</strong> {current2D.label} (2D)
                </div>
                <input
                  type="number"
                  placeholder="Cattle count"
                  value={form.cattleCount}
                  onChange={(e) =>
                    setForm({ ...form, cattleCount: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Time (s)"
                  value={form.timeSeconds}
                  onChange={(e) =>
                    setForm({ ...form, timeSeconds: e.target.value })
                  }
                />
                <button onClick={() => saveFinalResult(false)}>Save</button>
                <button onClick={() => saveFinalResult(true)}>SAT</button>
              </div>
            )}

            <h2>Pending Duos (2D)</h2>
            <ul>
              {pending2D.map((duo) => (
                <li key={duo.id}>{duo.label}</li>
              ))}
            </ul>

            {partials2D.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Duo</th>
                    <th>Cattle</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {partials2D.map((p, idx) => (
                    <tr key={p.duoId}>
                      <td>{idx + 1}</td>
                      <td>{p.duoLabel}</td>
                      <td>{p.cattleCount}</td>
                      <td>{p.timeSeconds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {allRegistered && (
        <button onClick={() => navigate('/final-results')}>
          Go to Results
        </button>
      )}
    </div>
  );
}
