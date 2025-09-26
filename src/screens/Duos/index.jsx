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

  // Flatten para criar lista sequencial de passadas
  const duosWithIds = rounds.flat().map((duo, index) => ({
    id: index + 1,
    duo,
  }));

  return (
    <div className="container">
      <h2>Passadas & Duplas</h2>

      <table className="card" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Passada</th>
            <th>Competidores</th>
          </tr>
        </thead>
        <tbody>
          {duosWithIds.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                {item.duo[0]} 🤝 {item.duo[1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => navigate('/record')} style={{ marginTop: 20 }}>
        Start Qualifiers
      </button>
    </div>
  );
}
