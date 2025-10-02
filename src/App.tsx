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

  // 🔑 Criar metadados legíveis das duplas
  const duosMeta = rounds.map((duo) => {
    const riderOne = competitors.find((c) => c.id === duo.riderOneId);
    const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
    return {
      id: duo.id,
      label: `${riderOne?.name ?? '??'} 🤝 ${riderTwo?.name ?? '??'}`,
      group: duo.group,
    };
  });

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
          <Route path="/record" element={<Qualifiers duos={duosMeta} />} />
          <Route
            path="/overview"
            element={<RoundsOverview rounds={rounds} duosMeta={duosMeta} />}
          />
          <Route
            path="/qualifiers-results"
            element={<QualifiersResults duos={duosMeta} />}
          />
          <Route path="/final" element={<Final duos={duosMeta} />} />
          <Route
            path="/final-results"
            element={<FinalResults duos={duosMeta} />}
          />
        </Routes>
      </Router>
    </ResultsProvider>
  );
}
