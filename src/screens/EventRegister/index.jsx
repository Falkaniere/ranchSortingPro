// screens/EventRegister.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventRegister({ rounds, results, setResults }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedDuo, setSelectedDuo] = useState([]);
  const [bullNumber, setBullNumber] = useState('');
  const [cattleCount, setCattleCount] = useState('');
  const [time, setTime] = useState('');
  const navigate = useNavigate();

  const duos = rounds[currentRound] || [];
  const pendingDuos = duos.filter(
    (d) =>
      !results.some(
        (r) => r.round === currentRound && r.duo.join('🤝') === d.join('🤝')
      )
  );

  const handleEdit = (r) => {
    setSelectedDuo(r.duo);
    setBullNumber(r.bullNumber);
    setCattleCount(r.cattle);
    setTime(r.time);

    // Remover registro antigo para atualizar depois
    setResults(results.filter((res) => res !== r));
  };

  const saveRound = () => {
    if (selectedDuo.length === 0) return alert('Selecione a dupla.');
    if (bullNumber < 0 || bullNumber > 9) return alert('Boi de número 0-9.');
    if (cattleCount < 0 || cattleCount > 10)
      return alert('Quantidade de bois 0-10.');
    if (!time || time <= 0) return alert('Insira um tempo válido.');

    setResults([
      ...results,
      {
        round: currentRound,
        duo: selectedDuo,
        bullNumber: Number(bullNumber),
        cattle: Number(cattleCount),
        time: Number(time),
      },
    ]);

    setSelectedDuo([]);
    setBullNumber('');
    setCattleCount('');
    setTime('');
  };

  const handleNext = () => {
    if (currentRound < rounds.length - 1) setCurrentRound(currentRound + 1);
    else navigate('/qualifiers-results');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Passada - número {currentRound + 1}</h2>

      <h3>Duplas pendentes</h3>
      <ul>
        {pendingDuos.map((d, i) => (
          <li key={i}>
            {d[0]} 🤝 {d[1]}{' '}
            <button onClick={() => setSelectedDuo(d)}>Registrar</button>
          </li>
        ))}
      </ul>

      {selectedDuo.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>
            Registrar: {selectedDuo[0]} & {selectedDuo[1]}
          </h3>
          <input
            type="number"
            placeholder="Boi de número (0-9)"
            value={bullNumber}
            onChange={(e) => setBullNumber(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantidade de bois (0-10)"
            value={cattleCount}
            onChange={(e) => setCattleCount(e.target.value)}
          />
          <input
            type="number"
            placeholder="Time (s)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <button onClick={saveRound}>Salvar</button>
        </div>
      )}

      <h3>Resultados Registrados</h3>
      <ul>
        {results
          .filter((r) => r.round === currentRound)
          .map((r, i) => (
            <li key={i}>
              {r.duo[0]} & {r.duo[1]} → 🐂 {r.bullNumber} | {r.cattle} bois | ⏱{' '}
              {r.time}s
              <button style={{ marginLeft: 10 }} onClick={() => handleEdit(r)}>
                Corrigir
              </button>
            </li>
          ))}
      </ul>

      {pendingDuos.length === 0 && (
        <button style={{ marginTop: 20 }} onClick={handleNext}>
          {currentRound < rounds.length - 1
            ? 'Próxima Rodada'
            : 'Finalizar Qualificatórias'}
        </button>
      )}
    </div>
  );
}
