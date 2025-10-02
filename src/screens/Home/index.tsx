import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Competitor } from 'core/models/Competidor';
import { Duo } from 'core/models/Duo';

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
    if (
      window.confirm(
        'Are you sure you want to reset competitors and duos? This cannot be undone.'
      )
    ) {
      setCompetitors([]);
      setRounds([]);
    }
  }

  return (
    <div className="home-container">
      <h1>🏆 Ranch Sorting Pro</h1>

      <div className="menu">
        <button onClick={() => navigate('/registration')}>
          ➕ Registration
        </button>
        <button onClick={() => navigate('/duos')}>🤝 Generate Duos</button>
        <button onClick={() => navigate('/record')}>
          ✍️ Record Qualifiers
        </button>
        <button onClick={() => navigate('/qualifiers-results')}>
          📊 Qualifiers Results
        </button>
        <button onClick={() => navigate('/final')}>🔥 Finals</button>
        <button onClick={() => navigate('/final-results')}>
          🏁 Final Results
        </button>
        <button onClick={() => navigate('/overview')}>
          👀 Rounds Overview
        </button>
      </div>

      <div className="status">
        <p>Competitors registered: {competitors.length}</p>
      </div>

      <button className="reset" onClick={handleReset}>
        ❌ Reset All
      </button>
    </div>
  );
}
