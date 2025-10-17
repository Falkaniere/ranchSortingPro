import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Competitor } from 'core/models/Competidor';
import { Duo } from 'core/models/Duo';
import './index.css';

interface HomeProps {
  competitors: Competitor[];
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
  setRounds: React.Dispatch<React.SetStateAction<Duo[]>>;
}

export default function Home({
  competitors,
  setCompetitors,
  setRounds,
}: HomeProps) {
  const navigate = useNavigate();

  function handleReset() {
    if (window.confirm('Reset all competitors and duos?')) {
      setCompetitors([]);
      setRounds([]);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1>🏆 Ranch Sorting Pro</h1>
      <button
        style={{ marginBottom: '16px' }}
        onClick={() => navigate('/registration')}
      >
        Registrar Competidores
      </button>
      <button onClick={() => navigate('/duos')}>
        Já tenho duplas cadastradas
      </button>
      {competitors.length > 0 && (
        <button className="reset" onClick={handleReset}>
          ❌ Reset All
        </button>
      )}
    </div>
  );
}
