// screens/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home({
  competitors,
  setCompetitors,
  setRounds,
  setResults,
  setFinalResults,
}) {
  const navigate = useNavigate();
  const startNewCompetition = () => {
    setCompetitors([]);
    setRounds([]);
    setResults([]);
    setFinalResults([]);
    navigate('/registration');
  };

  const continueWithExisting = () => {
    if (competitors.length < 2) {
      alert('⚠️ You need at least 2 competitors to continue.');
      return;
    }
    // Resetar tudo exceto nomes
    setRounds([]);
    setResults([]);
    setFinalResults([]);
    navigate('/duos');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h1>🏇 Ranch Sorting</h1>
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <button onClick={startNewCompetition}>Start New Competition</button>
        {competitors.length > 1 && (
          <button onClick={continueWithExisting}>
            Continue with Current Competitors
          </button>
        )}
      </div>

      {competitors.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h2>Registered Competitors</h2>
          <p>Total: {competitors.length}</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {competitors.map((c, i) => (
              <li key={i}>👤 {c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
