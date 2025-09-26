// screens/Qualifiers/index.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

export const getDuoKey = (duo) => duo.map((p) => p.name).join('🤝');

export default function Qualifiers({ rounds, results, setResults }) {
  const [selectedDuo, setSelectedDuo] = useState(null);
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef(null);

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
      round: 0,
      bullNumber: bullNum,
      cattle: cattleNum,
      time: timeNum,
    };

    setResults([
      ...results.filter((r) => getDuoKey(r.duo) !== getDuoKey(selectedDuo)),
      newResult,
    ]);
    setSelectedDuo(null);
    setForm({ bullNumber: '', cattle: '', time: '' });
  };

  // 🔹 Calcular médias da qualif
  const calcQualifAvg = (duo) => {
    const key = getDuoKey(duo);
    const qualif = results.filter((r) => getDuoKey(r.duo) === key);
    if (qualif.length === 0) return { avgBois: 0, avgTempo: 0 };

    const avgBois =
      qualif.reduce((sum, r) => sum + r.cattle, 0) / qualif.length;
    const avgTempo = qualif.reduce((sum, r) => sum + r.time, 0) / qualif.length;

    return { avgBois, avgTempo };
  };

  // 🔹 Todas as duplas (flatten dos rounds)
  const allDuos = rounds.flat().map((d) => d);

  // 🔹 Scroll automático até o fim quando selecionar
  useEffect(() => {
    if (selectedDuo && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedDuo]);

  // 🔹 Mostrar botão "voltar ao topo" quando rolar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="container">
      <h2>🏇 Qualificatórias</h2>

      <div className="final-grid">
        {/* 🔹 Lista de duplas restantes */}
        <div className="card">
          <h3>Duplas</h3>
          <div className="duo-cards">
            {allDuos
              .filter(
                (d) => !results.some((r) => getDuoKey(r.duo) === getDuoKey(d))
              )
              .map((d, i) => (
                <div key={i} className="duo-card">
                  <div className="duo-info">
                    <strong>
                      {d[0].name} & {d[1].name}
                    </strong>
                    <span>Passada #{i + 1}</span>
                  </div>
                  <button onClick={() => setSelectedDuo(d)}>Selecionar</button>
                </div>
              ))}
          </div>
        </div>

        {/* 🔹 Painel de médias */}
        <div className="card">
          <h3>Parciais</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Média Bois</th>
                <th>Média Tempo</th>
              </tr>
            </thead>
            <tbody>
              {[...new Set(results.map((r) => getDuoKey(r.duo)))].map(
                (duoKey, i) => {
                  const originalResult = results.find(
                    (r) => getDuoKey(r.duo) === duoKey
                  );
                  const duo = originalResult.duo;
                  const { avgBois, avgTempo } = calcQualifAvg(duo);
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        {duo[0].name} & {duo[1].name}
                      </td>
                      <td>{avgBois.toFixed(2)}</td>
                      <td>{avgTempo.toFixed(2)}</td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          {results.length === allDuos.length && (
            <button
              className="primary"
              style={{ marginTop: 20 }}
              onClick={() => navigate('/final')}
            >
              Ir para Final
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Formulário de registro */}
      {selectedDuo && (
        <div className="card" style={{ marginTop: 20 }} ref={bottomRef}>
          <h3>
            Registrar Qualificatória: {selectedDuo[0].name} &{' '}
            {selectedDuo[1].name}
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

      {/* 🔹 Botão flutuante para voltar ao topo */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            padding: '10px 14px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          ⬆️
        </button>
      )}
    </div>
  );
}
