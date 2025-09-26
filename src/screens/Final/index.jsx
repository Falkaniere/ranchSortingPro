// screens/Final/index.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

export default function Final({ results, finalResults, setFinalResults }) {
  const [selectedDuo, setSelectedDuo] = useState(null);
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });
  const navigate = useNavigate();

  // 🔹 Calcular médias das qualificatórias
  const calcQualifAvg = (duo) => {
    const qualif = results.filter((r) => r.duo.join('🤝') === duo.join('🤝'));
    if (qualif.length === 0) return { avgBois: 0, avgTempo: 0 };

    const avgBois =
      qualif.reduce((sum, r) => sum + r.cattle, 0) / qualif.length;
    const avgTempo = qualif.reduce((sum, r) => sum + r.time, 0) / qualif.length;

    return { avgBois, avgTempo };
  };

  // 🔹 Registrar resultado na Final
  const saveFinal = (isSAT = false) => {
    if (!selectedDuo) return alert('Selecione uma dupla.');

    const bullNum = isSAT ? 0 : Number(form.bullNumber);
    const cattleNum = isSAT ? 0 : Number(form.cattle);
    const timeNum = isSAT ? 120 : Number(form.time);

    if (!isSAT) {
      if (isNaN(bullNum) || bullNum < 0 || bullNum > 9)
        return alert('Número do boi inválido! Use 0-9.');
      if (isNaN(cattleNum) || cattleNum < 0 || cattleNum > 10)
        return alert('Quantidade de bois inválida! Use 0-10.');
      if (isNaN(timeNum) || timeNum <= 0)
        return alert('Tempo inválido! Deve ser maior que 0.');
    }

    const newResult = {
      duo: selectedDuo,
      bullNumber: bullNum,
      cattle: cattleNum,
      time: timeNum,
    };

    setFinalResults([...finalResults, newResult]);
    setSelectedDuo(null);
    setForm({ bullNumber: '', cattle: '', time: '' });
  };

  // 🔹 Juntar todas as duplas que participaram
  const allDuos = [...new Set(results.map((r) => r.duo.join('🤝')))].map((d) =>
    d.split('🤝')
  );

  return (
    <div className="container">
      <h2>🏆 Final</h2>

      <div className="final-grid">
        <div className="card">
          <h3>Duplas Restantes</h3>
          <div className="duo-cards">
            {allDuos
              .filter(
                (d) =>
                  !finalResults.some((r) => r.duo.join('🤝') === d.join('🤝'))
              )
              .map((d, i) => {
                const prev = results.find(
                  (r) => r.duo.join('🤝') === d.join('🤝')
                );
                return (
                  <div key={i} className="duo-card">
                    <div className="duo-info">
                      <strong>
                        {d[0]} & {d[1]}
                      </strong>
                      <span>
                        Passada anterior: {prev ? prev.time + 's' : '-'}
                      </span>
                    </div>
                    <button onClick={() => setSelectedDuo(d)}>
                      Selecionar
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 🔹 Painel de médias */}
        <div className="card">
          <h3>Médias (Qualif + Final)</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Avg Q Bois</th>
                <th>Avg Q Tempo</th>
                <th>Final Bois</th>
                <th>Final Tempo</th>
                <th>Total Avg Bois</th>
                <th>Total Avg Tempo</th>
              </tr>
            </thead>
            <tbody>
              {allDuos.map((d, i) => {
                const { avgBois, avgTempo } = calcQualifAvg(d);
                const final = finalResults.find(
                  (r) => r.duo.join('🤝') === d.join('🤝')
                );
                const totalBois = final
                  ? (avgBois + final.cattle) / 2
                  : avgBois;
                const totalTempo = final
                  ? (avgTempo + final.time) / 2
                  : avgTempo;

                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {d[0]} & {d[1]}
                    </td>
                    <td>{avgBois.toFixed(2)}</td>
                    <td>{avgTempo.toFixed(2)}</td>
                    <td>{final ? final.cattle : '-'}</td>
                    <td>{final ? final.time : '-'}</td>
                    <td>{totalBois.toFixed(2)}</td>
                    <td>{totalTempo.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔹 Formulário de registro */}
      {selectedDuo && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>
            Registrar Final: {selectedDuo[0]} & {selectedDuo[1]}
          </h3>
          <div className="flex">
            <input
              type="number"
              placeholder="Número do boi (0-9)"
              value={form.bullNumber}
              onChange={(e) => setForm({ ...form, bullNumber: e.target.value })}
            />
            <input
              type="number"
              placeholder="Qtd bois (0-10)"
              value={form.cattle}
              onChange={(e) => setForm({ ...form, cattle: e.target.value })}
            />
            <input
              type="number"
              placeholder="Tempo (s)"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
            <button onClick={() => saveFinal(false)}>Salvar</button>
            <button className="danger" onClick={() => saveFinal(true)}>
              S.A.T (120s)
            </button>
          </div>
        </div>
      )}

      {finalResults.length === allDuos.length && (
        <button
          className="primary"
          style={{ marginTop: 20 }}
          onClick={() => navigate('/final-results')}
        >
          Ver Resultado Final
        </button>
      )}
    </div>
  );
}
