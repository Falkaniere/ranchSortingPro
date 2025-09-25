import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Duos({ competitors, numRounds, rounds, setRounds }) {
  const navigate = useNavigate();

  const generateRounds = (list, totalRounds) => {
    const roundsArray = [];
    const n = list.length;
    const copy = [...list];
    if (n % 2 !== 0) copy.push('ghost'); // placeholder for odd number

    for (let r = 0; r < totalRounds; r++) {
      const duos = [];
      const used = new Set();
      for (let i = 0; i < copy.length; i++) {
        if (used.has(copy[i]) || copy[i] === 'ghost') continue;
        for (let j = i + 1; j < copy.length; j++) {
          if (!used.has(copy[j]) && copy[j] !== 'ghost') {
            duos.push([copy[i], copy[j]]);
            used.add(copy[i]);
            used.add(copy[j]);
            break;
          }
        }
      }
      roundsArray.push(duos);
      const first = copy.shift();
      copy.push(first); // simple rotation
    }
    return roundsArray;
  };

  useEffect(() => {
    if (rounds.length === 0) {
      const generated = generateRounds(competitors, numRounds);
      setRounds(generated);
    }
  }, [competitors, numRounds, rounds, setRounds]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Passadas & Duplas</h2>
      {rounds.map((r, idx) => (
        <div key={idx}>
          <h3>Passada {idx + 1}</h3>
          <ul>
            {r.map((d, i) => (
              <li key={i}>
                {d[0]} 🤝 {d[1]}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button onClick={() => navigate('/record')}>
        Iniciar Registro das Passadas
      </button>
    </div>
  );
}
