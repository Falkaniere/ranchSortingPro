// src/screens/RoundsOverview.jsx
import PartialResultsPanel from '@screens/PartialResultsPanel';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoundsOverview({ rounds = [], results = [] }) {
  const navigate = useNavigate();

  // Lista sequencial de duos com id
  const duosWithIds = rounds.flat().map((duo, idx) => ({
    id: idx + 1,
    duo,
  }));

  // status: registered? (checa se existe algum resultado com id)
  const isRegistered = (id) => results.some((result) => result.id === id);

  // próximo id pendente (menor que não está registrado)
  const nextPending =
    duosWithIds.find((duo) => !isRegistered(duo.id))?.id || null;

  return (
    <div
      className="container"
      style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}
    >
      <div>
        <h2>Visão Geral das Passadas</h2>
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: 8 }}>Passada</th>
                <th style={{ padding: 8 }}>Dupla</th>
                <th style={{ padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {duosWithIds.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #fafafa' }}>
                  <td style={{ padding: 8 }}>{item.id}</td>
                  <td style={{ padding: 8 }}>
                    {item.duo ? `${item.duo[0]} & ${item.duo[1]}` : '—'}
                  </td>
                  <td style={{ padding: 8 }}>
                    {isRegistered(item.id) ? (
                      <span style={{ color: 'green' }}>Done</span>
                    ) : (
                      <span style={{ color: '#cc6600' }}>
                        {nextPending === item.id ? 'Next' : 'Pending'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate('/record')}>
              Ir para Registro
            </button>
          </div>
        </div>
      </div>

      <div>
        <PartialResultsPanel rounds={rounds} results={results} />
      </div>
    </div>
  );
}
