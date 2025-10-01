import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PassResult, normalizeSAT } from '../core/models/PassResult';
import { Duo, DuoGroup } from '../core/models/Duo';
import { buildBestQualifierScorePerDuo } from '../core/logic/scoring';
import { selectFinalists, aggregateFinals } from '../core/logic/finals';

// Types for context state
interface ResultsContextValue {
  passResults: PassResult[];
  addResult: (result: PassResult) => void;
  getQualifierStandings: (
    duoGroupById: Map<string, DuoGroup>
  ) => ReturnType<typeof buildBestQualifierScorePerDuo>;
  getFinalists: (
    duoGroupById: Map<string, DuoGroup>
  ) => ReturnType<typeof selectFinalists>;
  getFinalAggregates: (
    duoGroupById: Map<string, DuoGroup>
  ) => ReturnType<typeof aggregateFinals>;
}

const ResultsContext = createContext<ResultsContextValue | undefined>(
  undefined
);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [passResults, setPassResults] = useState<PassResult[]>([]);

  function addResult(result: PassResult) {
    setPassResults((prev) => [...prev, normalizeSAT(result)]);
  }

  function getQualifierStandings(duoGroupById: Map<string, DuoGroup>) {
    return buildBestQualifierScorePerDuo(passResults, duoGroupById);
  }

  function getFinalists(duoGroupById: Map<string, DuoGroup>) {
    const bestScores = buildBestQualifierScorePerDuo(passResults, duoGroupById);
    return selectFinalists(bestScores);
  }

  function getFinalAggregates(duoGroupById: Map<string, DuoGroup>) {
    const bestScores = buildBestQualifierScorePerDuo(passResults, duoGroupById);
    return aggregateFinals(bestScores, passResults);
  }

  return (
    <ResultsContext.Provider
      value={{
        passResults,
        addResult,
        getQualifierStandings,
        getFinalists,
        getFinalAggregates,
      }}
    >
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error('useResults must be used inside ResultsProvider');
  return ctx;
}
