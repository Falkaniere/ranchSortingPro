// src/context/ResultContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { PassResult, DuoScore } from 'core/models/PassResult';
import { Duo, DuoGroup } from 'core/models/Duo';
import {
  buildBestQualifierScorePerDuo,
  standingsFromScores,
} from 'core/logic/scoring';
import {
  selectFinalists,
  aggregateFinals,
  FinalsSelection,
  FinalAggregationEntry,
} from 'core/logic/finals';

export interface ResultsContextValue {
  // Qualificatórias
  results: PassResult[];
  addQualifierResult: (
    duoId: string,
    cattle: number,
    time: number,
    isSAT?: boolean
  ) => void;

  // Finais
  finalResults: PassResult[];
  addFinalResult: (
    duoId: string,
    cattle: number,
    time: number,
    isSAT?: boolean
  ) => void;

  // Metadados de duplas (para mapear duoId -> group)
  duosMeta: Duo[];
  setDuosMeta: (duos: Duo[]) => void;

  // Scores/seleções
  getBestQualifierScores: () => Map<string, DuoScore>;
  getFinalists: (maxPerFinal?: number) => FinalsSelection;
  getFinalAggregates: () => FinalAggregationEntry[];
}

const ResultsContext = createContext<ResultsContextValue | undefined>(
  undefined
);

export function ResultsProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<PassResult[]>([]);
  const [finalResults, setFinalResults] = useState<PassResult[]>([]);
  const [duosMeta, setDuosMeta] = useState<Duo[]>([]);

  function addQualifierResult(
    duoId: string,
    cattle: number,
    time: number,
    isSAT = false
  ) {
    const newResult: PassResult = {
      duoId,
      stage: 'Qualifier',
      cattleCount: isSAT ? 0 : cattle,
      timeSeconds: isSAT ? 120 : time,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };
    setResults((prev) => [...prev, newResult]);
  }

  function addFinalResult(
    duoId: string,
    cattle: number,
    time: number,
    isSAT = false
  ) {
    const newResult: PassResult = {
      duoId,
      stage: 'Final',
      cattleCount: isSAT ? 0 : cattle,
      timeSeconds: isSAT ? 120 : time,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };
    setFinalResults((prev) => [...prev, newResult]);
  }

  function getBestQualifierScores(): Map<string, DuoScore> {
    // duoId -> group (1D/2D)
    const duoGroupById: Map<string, DuoGroup> = new Map(
      duosMeta.map((d) => [d.id, d.group])
    );
    return buildBestQualifierScorePerDuo(results, duoGroupById);
  }

  function getFinalists(maxPerFinal = 10): FinalsSelection {
    const bestScores = getBestQualifierScores();
    return selectFinalists(bestScores, maxPerFinal);
  }

  function getFinalAggregates(): FinalAggregationEntry[] {
    const bestScores = getBestQualifierScores();
    return aggregateFinals(bestScores, finalResults);
  }

  return (
    <ResultsContext.Provider
      value={{
        results,
        addQualifierResult,
        finalResults,
        addFinalResult,
        duosMeta,
        setDuosMeta,
        getBestQualifierScores,
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
  if (!ctx) throw new Error('useResults must be used within ResultsProvider');
  return ctx;
}
