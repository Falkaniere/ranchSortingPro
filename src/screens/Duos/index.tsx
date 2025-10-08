import React from 'react';
import { Duo } from 'core/models/Duo';
import { useNavigate } from 'react-router-dom';
import { Competitor } from 'core/index';

export interface DuosProps {
  competitors: Competitor[];
  rounds: Duo[];
  setRounds: React.Dispatch<React.SetStateAction<Duo[]>>;
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
}

export default function Duos({
  competitors,
  rounds,
  setRounds, // 👈 garanta que está sendo recebido
  setCompetitors,
}: DuosProps) {
  const navigate = useNavigate();

  return (
    <div className="duos-container">
      <h1>Duplas sorteadas</h1>

      {rounds.length === 0 && <p>Nenhuma dupla sorteada ainda.</p>}

      {rounds.length > 0 && (
        <ul>
          {rounds.map((duo) => {
            const riderOne = competitors.find((c) => c.id === duo.riderOneId);
            const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
            return (
              <li key={duo.id} className="duo-item">
                {riderOne?.name ?? '??'} 🤝 {riderTwo?.name ?? '??'} —{' '}
                {duo.group}
              </li>
            );
          })}
        </ul>
      )}

      {rounds.length > 0 && (
        <button onClick={() => navigate('/record')}>
          Ir para as Eliminatórias
        </button>
      )}
    </div>
  );
}
