import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventRegister({ rounds, results, setResults }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedDuo, setSelectedDuo] = useState([]);
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });
  const [editIndex, setEditIndex] = useState(null);
  const navigate = useNavigate();

  // Geração de IDs fixos de passadas
  const duosWithIds = rounds.flat().map((duo, index) => ({
    id: index + 1, // número fixo da passada
    duo,
  }));

  const duos = rounds[currentRound] || [];
  const pendingDuos = duos.filter(
    (d) =>
      !results.some(
        (r) => r.round === currentRound && r.duo.join('🤝') === d.join('🤝')
      )
  );

  const saveRound = (duo, bullNum, cattleNum, timeNum) => {
    const newResult = {
      round: currentRound,
      duo,
      bullNumber: bullNum,
      cattle: cattleNum,
      time: timeNum,
      id: duosWithIds.find((item) => item.duo.join('🤝') === duo.join('🤝'))
        ?.id, // mantém ID fixo
    };

    if (editIndex !== null) {
      const updated = [...results];
      updated[editIndex] = newResult;
      setResults(updated);
      setEditIndex(null);
    } else {
      setResults([...results, newResult]);
    }

    setSelectedDuo([]);
    setForm({ bullNumber: '', cattle: '', time: '' });
  };

  const handleSave = () => {
    if (selectedDuo.length === 0) return alert('Selecione uma dupla.');

    const bullNum = Number(form.bullNumber);
    const cattleNum = Number(form.cattle);
    const timeNum = Number(form.time);

    if (isNaN(bullNum) || bullNum < 0 || bullNum > 9)
      return alert('Número do boi inválido! Use 0-9.');
    if (isNaN(cattleNum) || cattleNum < 0 || cattleNum > 10)
      return alert('Quantidade de bois inválida! Use 0-10.');
    if (isNaN(timeNum) || timeNum <= 0)
      return alert('Tempo inválido! Deve ser maior que 0.');

    saveRound(selectedDuo, bullNum, cattleNum, timeNum);
  };

  const handleSAT = () => {
    if (selectedDuo.length === 0) return alert('Selecione uma dupla.');
    saveRound(selectedDuo, 0, 0, 120); // automaticamente S.A.T
  };

  const handleEdit = (index) => {
    const r = results[index];
    setSelectedDuo(r.duo);
    setForm({
      bullNumber: r.bullNumber,
      cattle: r.cattle,
      time: r.time,
    });
    setEditIndex(index);
  };

  const handleNext = () => {
    if (currentRound < rounds.length - 1) setCurrentRound(currentRound + 1);
    else navigate('/qualifiers-results');
  };

  return (
    <div className="container">
      <h2>Registro de passada - Round {currentRound + 1}</h2>

      <div className="card">
        <h3>Duplas pendentes</h3>
        <ul>
          {pendingDuos.map((d, i) => {
            const duoId = duosWithIds.find(
              (item) => item.duo.join('🤝') === d.join('🤝')
            )?.id;
            return (
              <li key={i}>
                Passada {duoId}: {d[0]} 🤝 {d[1]}
                <button onClick={() => setSelectedDuo(d)} className="secondary">
                  Registrar
                </button>
              </li>
            );
          })}
        </ul>

        {selectedDuo.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>
              Registrar: {selectedDuo[0]} & {selectedDuo[1]}
            </h3>
            <div className="flex" style={{ gap: 10 }}>
              <input
                type="number"
                placeholder="Número do boi (0-9)"
                value={form.bullNumber}
                min={0}
                max={9}
                onChange={(e) =>
                  setForm({ ...form, bullNumber: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Quantidade de bois (0-10)"
                value={form.cattle}
                min={0}
                max={10}
                onChange={(e) => setForm({ ...form, cattle: e.target.value })}
              />
              <input
                type="number"
                placeholder="Tempo (s)"
                value={form.time}
                min={0.001}
                step={0.001}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
              <button onClick={handleSave}>
                {editIndex !== null ? 'Atualizar' : 'Salvar'}
              </button>
              <button className="secondary" onClick={handleSAT}>
                Marcar S.A.T
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Resultados</h3>
        <ul>
          {results
            .filter((r) => r.round === currentRound)
            .map((r, i) => (
              <li key={i}>
                Passada {r.id}: {r.duo[0]} & {r.duo[1]} → 🐂 {r.cattle} | ⏱{' '}
                {r.time}s
                <button
                  onClick={() => handleEdit(results.indexOf(r))}
                  className="secondary"
                >
                  Corrigir
                </button>
              </li>
            ))}
        </ul>
      </div>

      {pendingDuos.length === 0 && (
        <button style={{ marginTop: 20 }} onClick={handleNext}>
          {currentRound < rounds.length - 1
            ? 'Próximo Round'
            : 'Finalizar Qualificatórias'}
        </button>
      )}
    </div>
  );
}
