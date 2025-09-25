// screens/Duos.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Duos({ competitors, numRounds, rounds, setRounds }) {
  const navigate = useNavigate();

  const generateRounds = (list, totalRounds) => {
    const roundsArray = [];
    const n = list.length;
    const copy = [...list];
    if (n % 2 !== 0) copy.push('ghost');

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
      copy.push(first);
    }
    return roundsArray;
  };

  useEffect(() => {
    if (rounds.length === 0) {
      setRounds(generateRounds(competitors, numRounds));
    }
  }, [competitors, numRounds, rounds, setRounds]);

  return (
    <div className="container">
      <h2>Passadas & Duplas</h2>
      {rounds.map((r, idx) => (
        <div key={idx} className="card">
          <h3>Passadas {idx + 1}</h3>
          <ul>
            {r.map((d, i) => (
              <li key={i}>
                {d[0]} 🤝 {d[1]}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button onClick={() => navigate('/record')}>Start Qualifiers</button>
    </div>
  );
}
