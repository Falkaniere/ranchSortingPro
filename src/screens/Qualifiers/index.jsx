import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

export default function Qualifiers({ duos, results, setResults }) {
  const [selectedDuo, setSelectedDuo] = useState(null);
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });
  const navigate = useNavigate();

  // 🔹 Registrar resultado (inclui S.A.T)

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight, // Scrolls to the total height of the document
      behavior: 'smooth', // Provides a smooth scrolling animation
    });
  };
  const saveResult = (isSAT = false) => {
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

    setResults([...results, newResult]);
    setSelectedDuo(null);
    setForm({ bullNumber: '', cattle: '', time: '' });
  };

  // 🔹 Todas as passadas enumeradas
  const allRounds = duos.map((d, index) => ({
    number: index + 1,
    duo: d,
    result: results.find((r) => r.duo.join('🤝') === d.join('🤝')),
  }));

  // 🔹 Cálculo de médias parciais
  const calcAvg = (duo) => {
    const res = results.filter((r) => r.duo.join('🤝') === duo.join('🤝'));
    if (res.length === 0) return { avgBois: 0, avgTempo: 0 };

    const avgBois = res.reduce((sum, r) => sum + r.cattle, 0) / res.length;
    const avgTempo = res.reduce((sum, r) => sum + r.time, 0) / res.length;

    return { avgBois, avgTempo };
  };

  const allDuos = [...new Set(duos.map((d) => d.join('🤝')))].map((d) =>
    d.split('🤝')
  );

  return (
    <div className="container">
      <h2>🏇 Qualificatórias</h2>

      <div className="qualif-grid">
        {/* 🔹 Lista de passadas */}
        <div className="card">
          <h3>Passadas</h3>
          <div className="duo-cards">
            {allRounds.map((round) => (
              <div key={round.number} className="duo-card">
                <div className="duo-info">
                  <strong>
                    #{round.number} — {round.duo[0]} & {round.duo[1]}
                  </strong>
                  <span>
                    Passada:{' '}
                    {round.result
                      ? `${round.result.time}s (${round.result.cattle} bois)`
                      : 'Aguardando...'}
                  </span>
                </div>
                {!round.result && (
                  <button
                    onClick={() => {
                      setSelectedDuo(round.duo);
                      scrollToBottom();
                    }}
                  >
                    Registrar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 Painel de médias parciais */}
        <div className="card">
          <h3>Médias Parciais</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Avg Bois</th>
                <th>Avg Tempo</th>
              </tr>
            </thead>
            <tbody>
              {allDuos.map((d, i) => {
                const { avgBois, avgTempo } = calcAvg(d);
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {d[0]} & {d[1]}
                    </td>
                    <td>{avgBois.toFixed(2)}</td>
                    <td>{avgTempo.toFixed(2)}</td>
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
            Registrar: {selectedDuo[0]} & {selectedDuo[1]}
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
            <button onClick={() => saveResult(false)}>Salvar</button>
            <button className="danger" onClick={() => saveResult(true)}>
              S.A.T (120s)
            </button>
          </div>
        </div>
      )}

      {results.length === duos.length && (
        <button
          className="primary"
          style={{ marginTop: 20 }}
          onClick={() => navigate('/final')}
        >
          Ir para Final
        </button>
      )}
    </div>
  );
}
