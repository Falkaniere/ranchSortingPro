// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Registration from './screens/Registration';
import Duos from './screens/Duos';
import EventRegister from './screens/EventRegister';
import QualifiersResults from './screens/QualifiersResults';
import Final from './screens/Final';
import FinalResults from './screens/FinalResults';
import Home from './screens/Home';
export default function App() {
  const [competitors, setCompetitors] = useState([]);
  const [numRounds, setNumRounds] = useState(1);
  const [rounds, setRounds] = useState([]); // array de rounds com duplas
  const [results, setResults] = useState([]); // resultados qualificatórias
  const [finalResults, setFinalResults] = useState([]); // resultados final

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              competitors={competitors}
              setCompetitors={setCompetitors}
              setRounds={setRounds}
              setResults={setResults}
              setFinalResults={setFinalResults}
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
              setResults={setResults}
              setFinalResults={setFinalResults}
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
              setResults={setResults}
            />
          }
        />
        <Route
          path="/qualifiers-results"
          element={<QualifiersResults results={results} />}
        />
        <Route
          path="/final"
          element={
            <Final
              results={results}
              finalResults={finalResults}
              setFinalResults={setFinalResults}
            />
          }
        />
        <Route
          path="/final-results"
          element={<FinalResults finalResults={finalResults} />}
        />
      </Routes>
    </Router>
  );
}
