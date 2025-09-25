// src/screens/Final.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Final({ finalResults, setFinalResults }) {
  const navigate = useNavigate();
  const location = useLocation();
  const qualifiersRanking = location.state?.ranking || [];

  // Ordenar para final: pior desempenho primeiro
  const [pendingDuos, setPendingDuos] = useState(
    [...qualifiersRanking].sort((a, b) => {
      if (a.totalCattle !== b.totalCattle) return a.totalCattle - b.totalCattle;
      return b.bestTime - a.bestTime;
    })
  );

  const [selectedDuo, setSelectedDuo] = useState(null);
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });

  const handleSave = () => {
    if (!selectedDuo) return;

    // Salvar na lista de resultados finais
    setFinalResults([
      ...finalResults,
      {
        duo: selectedDuo.duo, // usar duo original
        previousTime: selectedDuo.bestTime || 0,
        bullNumber: form.bullNumber,
        cattle: Number(form.cattle),
        time: Number(form.time),
      },
    ]);

    // Remover dupla da lista de pendentes
    setPendingDuos(
      pendingDuos.filter((d) => d.duo.join('-') !== selectedDuo.duo.join('-'))
    );

    // Resetar seleção e formulário
    setSelectedDuo(null);
    setForm({ bullNumber: '', cattle: '', time: '' });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Final</h2>
      <h3>Duplas a registrar (pior para melhor)</h3>
      <ul>
        {pendingDuos.map((d, i) => (
          <li key={i}>
            {d.duo[0]} & {d.duo[1]} | Passada anterior: {d.bestTime}s{' '}
            <button onClick={() => setSelectedDuo(d)}>Selecionar</button>
          </li>
        ))}
      </ul>

      {selectedDuo && (
        <div style={{ marginTop: '20px' }}>
          <h3>
            Registrar Final - {selectedDuo.duo[0]} & {selectedDuo.duo[1]}
          </h3>
          <input
            type="number"
            placeholder="Número do boi"
            value={form.bullNumber}
            onChange={(e) => setForm({ ...form, bullNumber: e.target.value })}
          />
          <input
            type="number"
            placeholder="Quantidade de bois"
            value={form.cattle}
            onChange={(e) => setForm({ ...form, cattle: e.target.value })}
          />
          <input
            type="number"
            placeholder="Tempo (s)"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <button onClick={handleSave}>Salvar</button>
        </div>
      )}

      <h3 style={{ marginTop: '30px' }}>Resultados parciais da Final</h3>
      <ul>
        {finalResults.map((r, i) => (
          <li key={i}>
            {r.duo[0]} & {r.duo[1]} → 🐂 {r.cattle} | ⏱ {r.time}s
          </li>
        ))}
      </ul>

      <button
        style={{ marginTop: '20px' }}
        disabled={pendingDuos.length > 0}
        onClick={() => navigate('/final-results', { state: { finalResults } })}
      >
        Ver Resultado Final
      </button>
    </div>
  );
}
