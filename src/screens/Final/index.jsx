import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Final({ finalResults, setFinalResults }) {
  const navigate = useNavigate();
  const location = useLocation();
  const qualifiersRanking = location.state?.ranking || [];

  // Agrupar as duplas igual ao ranking das qualificatórias
  const rankingMap = {};

  qualifiersRanking.forEach((d) => {
    const key = d.duo.join('-');
    if (!rankingMap[key]) {
      rankingMap[key] = { duo: d.duo, totalCattle: 0, bestTime: Infinity };
    }
    rankingMap[key].totalCattle = d.totalCattle || 0;
    rankingMap[key].bestTime = d.bestTime || Infinity;
  });

  const groupedDuos = Object.values(rankingMap);

  // Ordenar: maior quantidade de bois → menor tempo
  const duosOrder = groupedDuos.sort((a, b) => {
    if (b.totalCattle !== a.totalCattle) return b.totalCattle - a.totalCattle;
    return a.bestTime - b.bestTime;
  });

  const [selectedDuo, setSelectedDuo] = useState(null);
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });

  // duplas que ainda não foram registradas na final
  const pendingDuos = duosOrder.filter(
    (d) => !finalResults.some((r) => r.duo.join('-') === d.duo.join('-'))
  );

  const handleSave = () => {
    if (!selectedDuo) return;

    const bullNum = Number(form.bullNumber);
    const cattleNum = Number(form.cattle);
    const timeNum = Number(form.time);

    if (isNaN(bullNum) || bullNum < 0 || bullNum > 9)
      return alert('Número do boi inválido! Use 0-9.');
    if (isNaN(cattleNum) || cattleNum < 0 || cattleNum > 10)
      return alert('Quantidade de bois inválida! Use 0-10.');
    if (isNaN(timeNum) || timeNum <= 0)
      return alert('Tempo inválido! Deve ser maior que 0.');

    setFinalResults([
      ...finalResults,
      {
        duo: selectedDuo,
        previousTime: selectedDuo.bestTime || 0,
        bullNumber: bullNum,
        cattle: cattleNum,
        time: timeNum,
      },
    ]);

    setSelectedDuo(null);
    setForm({ bullNumber: '', cattle: '', time: '' });
  };

  return (
    <div className="container">
      <h2>Final</h2>

      <div className="card">
        <h3>Duplas Restantes</h3>
        <ul>
          {pendingDuos.map((d, i) => (
            <li key={i}>
              {d.duo[0]} & {d.duo[1]} → {d.totalCattle} bois | ⏱ {d.bestTime}s{' '}
              <button
                onClick={() => setSelectedDuo(d.duo)}
                className="secondary"
              >
                Selecionar
              </button>
            </li>
          ))}
        </ul>

        {selectedDuo && (
          <div style={{ marginTop: 20 }}>
            <h3>
              Registrar Final - {selectedDuo[0]} & {selectedDuo[1]}
            </h3>
            <div className="flex">
              <input
                type="number"
                placeholder="Número do boi (0-9)"
                value={form.bullNumber}
                onChange={(e) =>
                  setForm({ ...form, bullNumber: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Quantidade de bois (0-10)"
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
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Resultados Finais Registrados</h3>
        <ul>
          {finalResults.map((r, i) => (
            <li key={i}>
              {r.duo[0]} & {r.duo[1]} → 🐂 {r.cattle} | ⏱ {r.time}s
            </li>
          ))}
        </ul>
      </div>

      <button
        style={{ marginTop: 20 }}
        disabled={finalResults.length < duosOrder.length}
        onClick={() => navigate('/final-results', { state: { finalResults } })}
      >
        Ver Resultado Final
      </button>
    </div>
  );
}
