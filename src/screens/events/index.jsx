import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function EventRegister({ rounds, results, setResults }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedDuo, setSelectedDuo] = useState([]);
  const [bullNumber, setBullNumber] = useState('');
  const [cattleCount, setCattleCount] = useState('');
  const [time, setTime] = useState('');
  const navigate = useNavigate();

  const duos = rounds[currentRound] || [];

  const registeredDuos = results
    .filter((r) => r.round === currentRound)
    .map((r) => r.duo.join('🤝'));

  const allDuosRegistered = duos.every((d) =>
    registeredDuos.includes(d.join('🤝'))
  );

  function saveRound() {
    if (selectedDuo.length === 0) return alert('Select a duo.');
    if (bullNumber < 0 || bullNumber > 9)
      return alert('Bull number must be between 0 and 9.');
    if (cattleCount < 0 || cattleCount > 10)
      return alert('Cattle count must be up to 10.');
    if (!time || time <= 0) return alert('Enter a valid time.');

    const alreadyRegistered = results.find(
      (r) =>
        r.round === currentRound && r.duo.join('🤝') === selectedDuo.join('🤝')
    );
    if (alreadyRegistered)
      return alert('This duo already registered this round.');

    setResults([
      ...results,
      {
        round: currentRound,
        duo: selectedDuo, // ✅ agora sempre array
        bullNumber: Number(bullNumber),
        cattle: Number(cattleCount),
        time: Number(time),
      },
    ]);

    setSelectedDuo([]);
    setBullNumber('');
    setCattleCount('');
    setTime('');
  }

  function handleNext() {
    if (currentRound < rounds.length - 1) {
      setCurrentRound(currentRound + 1);
    } else {
      navigate('/qualifiers');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Event Registration - Round {currentRound + 1}</h2>

      <select
        value={selectedDuo.join('🤝')}
        onChange={(e) => setSelectedDuo(e.target.value.split('🤝'))}
      >
        <option value="">Select a duo</option>
        {duos.map((d, i) => (
          <option key={i} value={d.join('🤝')}>
            {d[0]} 🤝 {d[1]}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Bull number (0-9)"
        value={bullNumber}
        onChange={(e) => setBullNumber(e.target.value)}
      />
      <input
        type="number"
        placeholder="Cattle count (0-10)"
        value={cattleCount}
        onChange={(e) => setCattleCount(e.target.value)}
      />
      <input
        type="number"
        placeholder="Time (s)"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <button onClick={saveRound}>Save</button>

      <div style={{ marginTop: 20 }}>
        <button disabled={!allDuosRegistered} onClick={handleNext}>
          {currentRound < rounds.length - 1
            ? 'Next Round'
            : 'Finish Qualifiers'}
        </button>
      </div>
    </div>
  );
}
