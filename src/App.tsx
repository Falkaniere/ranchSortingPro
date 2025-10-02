import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from 'screens/Home';
import Registration from 'screens/Registration';
import Duos from 'screens/Duos';
import Qualifiers from 'screens/Qualifiers';
import QualifiersResults from 'screens/QualifiersResults';
import Final from 'screens/Final';
import FinalResults from 'screens/FinalResults';
import RoundsOverview from 'screens/RoundsOverview';
import { ResultsProvider } from 'context/ResultContext';

import { Competitor } from 'core/models/Competidor';
import { Duo } from 'core/models/Duo';

export default function App() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [numRounds, setNumRounds] = useState(1);
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
                numRounds={numRounds}
                rounds={rounds}
                setRounds={setRounds}
                setCompetitors={setCompetitors}
              />
            }
          />
          <Route path="/record" element={<Qualifiers duos={rounds} />} />
          <Route
            path="/overview"
            element={<RoundsOverview rounds={rounds} />}
          />
          <Route path="/qualifiers-results" element={<QualifiersResults />} />
          <Route path="/final" element={<Final duos={rounds} />} />
          <Route path="/final-results" element={<FinalResults />} />
        </Routes>
      </Router>
    </ResultsProvider>
  );
}
