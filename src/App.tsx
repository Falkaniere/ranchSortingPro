// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from 'screens/Home';
import Registration from 'screens/Registration';
import Duos from 'screens/Duos';
import Qualifiers from 'screens/Qualifiers';
import Finals from 'screens/Final';
import FinalResults from 'screens/FinalResults';
import RoundsOverview from 'screens/RoundsOverview';

import { ResultsProvider } from 'context/ResultContext';
import { Duo } from 'core/models/Duo';
import { Competitor } from './core';

export default function App() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [numRounds, setNumRounds] = useState<number>(1);
  const [rounds, setRounds] = useState<Duo[]>([]);

  return (
    <ResultsProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                competitors={competitors}
                setCompetitors={setCompetitors}
                setRounds={setRounds}
              />
            }
          />
          <Route
            path="/registration"
            element={
              <Registration
                competitors={competitors}
                setCompetitors={setCompetitors}
                numRounds={numRounds}
                setNumRounds={setNumRounds}
                setRounds={setRounds}
              />
            }
          />
          <Route
            path="/duos"
            element={
              <Duos
                competitors={competitors}
                rounds={rounds}
                setRounds={setRounds}
                setCompetitors={setCompetitors}
              />
            }
          />
          <Route path="/record" element={<Qualifiers />} />
          <Route path="/final" element={<Finals />} />
          <Route
            path="/final-results"
            element={<FinalResults duos={rounds} />}
          />
          <Route
            path="/overview"
            element={<RoundsOverview rounds={rounds} />}
          />
        </Routes>
      </Router>
    </ResultsProvider>
  );
}
