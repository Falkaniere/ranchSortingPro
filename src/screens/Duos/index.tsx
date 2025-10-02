import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Competitor } from 'core/models/Competidor';
import { Duo } from 'core/models/Duo';

interface DuosProps {
  competitors: Competitor[];
  rounds: Duo[];
}

export default function Duos({ competitors, rounds }: DuosProps) {
  const navigate = useNavigate();

  return (
    <div className="duos-container">
      <h1>Generated Duos</h1>

      {rounds.length === 0 && <p>No duos generated yet.</p>}

      {rounds.length > 0 && (
        <ul>
          {rounds.map((duo) => {
            const riderOne = competitors.find((c) => c.id === duo.riderOneId);
            const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
            return (
              <li key={duo.id}>
                {riderOne?.name ?? '??'} 🤝 {riderTwo?.name ?? '??'} — Group{' '}
                {duo.group}
              </li>
            );
          })}
        </ul>
      )}

      {rounds.length > 0 && (
        <button onClick={() => navigate('/record')}>Go to Qualifiers</button>
      )}
    </div>
  );
}
