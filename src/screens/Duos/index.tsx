import React from 'react';
import { Competitor } from 'core/models/Competidor';
import { Duo } from 'core/models/Duo';
import { generateUniqueDuos } from 'core/logic/pairing';

interface DuosProps {
  competitors: Competitor[];
  numRounds: number;
  rounds: Duo[];
  setRounds: React.Dispatch<React.SetStateAction<Duo[]>>;
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
}

export default function Duos({
  competitors,
  numRounds,
  rounds,
  setRounds,
}: DuosProps) {
  function handleGenerate() {
    try {
      const { duos, warnings } = generateUniqueDuos(competitors);
      if (warnings.length > 0) {
        console.warn('Pairing warnings:', warnings);
      }
      setRounds(duos);
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <div className="duos-container">
      <h1>Duos</h1>
      <button onClick={handleGenerate}>Generate Duos</button>

      {rounds.length > 0 && (
        <>
          <h2>Generated Duos</h2>
          <ul>
            {rounds.map((duo) => {
              const riderOne = competitors.find((c) => c.id === duo.riderOneId);
              const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
              return (
                <li key={duo.id}>
                  {riderOne?.name} 🤝 {riderTwo?.name} — Group {duo.group}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
