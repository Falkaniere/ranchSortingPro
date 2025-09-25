import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './screens/home/index';
import Registration from './screens/registration/index';
import Duos from './screens/duos/index';
import Qualifiers from './screens/qualifiers/index';
import Finals from './screens/finals/index';
import FinalResults from './screens/finalResults/index';
import { EventRegister } from './screens/events';

export default function App() {
  const [competitors, setCompetitors] = useState([]);
  const [numRounds, setNumRounds] = useState(1);
  const [rounds, setRounds] = useState([]);
  const [results, setResults] = useState([]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home competitors={competitors} setCompetitors={setCompetitors} />
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
            />
          }
        />
        <Route
          path="/record"
          element={
            <EventRegister
              rounds={rounds}
              results={results}
              competitors={competitors}
              setCompetitors={setCompetitors}
              setRounds={setRounds}
              setResults={setResults}
              setNumRounds={setNumRounds}
              numRounds={numRounds}
            />
          }
        />
        <Route path="/qualifiers" element={<Qualifiers results={results} />} />
        <Route path="/finals" element={<Finals results={results} />} />
        <Route
          path="/final-results"
          element={<FinalResults results={results} />}
        />
      </Routes>
    </Router>
  );
}
