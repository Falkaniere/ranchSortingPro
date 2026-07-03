import React, { createContext, useCallback, useContext, useState } from 'react';
import { PassResult, DuoScore, SAT_TIME_SECONDS } from 'core/models/PassResult';
import { Duo, DuoGroup } from 'core/models/Duo';
import { buildBestQualifierScorePerDuo } from 'core/logic/scoring';
import {
  selectFinalists,
  aggregateFinals,
  FinalsSelection,
  FinalAggregationEntry,
} from 'core/logic/finals';

interface ResultsContextValue {
  /** Resultados de qualificatória (somente stage === "Qualifier") */
  results: PassResult[];

  /** Resultados de final (somente stage === "Final") */
  finalResults: PassResult[];

  /** Metadados das duplas (id, label, group) */
  duosMeta: Duo[];
  setDuosMeta: React.Dispatch<React.SetStateAction<Duo[]>>;

  /** Inicializa os resultados a partir dos dados salvos de uma competição */
  initializeFromCompetition: (
    qualifierResults: PassResult[],
    finals: PassResult[],
    duos: Duo[]
  ) => void;

  /** Adiciona resultado da qualificatória */
  addQualifierResult: (
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    isSAT?: boolean,
    calledCattle?: number
  ) => void;

  /** Atualiza resultado existente da qualificatória */
  updateQualifierResult: (
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    calledCattle?: number
  ) => void;

  /** Adiciona resultado da final */
  addFinalResult: (
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    isSAT?: boolean,
    calledCattle?: number
  ) => void;

  /** Mapa com o melhor resultado por dupla nas qualificatórias */
  getBestQualifierScores: () => Map<string, DuoScore>;

  /** Seleção de finalistas conforme regras (core/logic/finals) */
  getFinalists: () => FinalsSelection;

  /** Agregados finais (qualificatória + final), com totais */
  getFinalAggregates: () => FinalAggregationEntry[];
}

const ResultsContext = createContext<ResultsContextValue | undefined>(
  undefined
);

export function ResultsProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<PassResult[]>([]);
  const [finalResults, setFinalResults] = useState<PassResult[]>([]);
  const [duosMeta, setDuosMeta] = useState<Duo[]>([]);

  // -----------------------------
  //  INITIALIZE FROM COMPETITION
  // -----------------------------
  function initializeFromCompetition(
    qualifierResults: PassResult[],
    finals: PassResult[],
    duos: Duo[]
  ) {
    setResults(qualifierResults);
    setFinalResults(finals);
    setDuosMeta(duos);
  }

  // -----------------------------
  //  ADD RESULTS
  // -----------------------------
  function addQualifierResult(
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    isSAT = false,
    calledCattle?: number
  ) {
    const newResult: PassResult = {
      id: crypto.randomUUID(),
      duoId,
      stage: 'Qualifier',
      cattleCount: isSAT ? 0 : cattleCount,
      timeSeconds: isSAT ? SAT_TIME_SECONDS : timeSeconds,
      isSAT,
      calledCattle,
      createdAtISO: new Date().toISOString(),
    };
    setResults((prev) => [...prev, newResult]);
  }

  function updateQualifierResult(
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    calledCattle?: number
  ) {
    setResults((prev) =>
      prev.map((r) =>
        r.duoId === duoId && r.stage === 'Qualifier'
          ? {
              ...r,
              cattleCount,
              timeSeconds,
              calledCattle,
              updatedAtISO: new Date().toISOString(),
            }
          : r
      )
    );
  }

  function addFinalResult(
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    isSAT = false,
    calledCattle?: number
  ) {
    const newResult: PassResult = {
      id: crypto.randomUUID(),
      duoId,
      stage: 'Final',
      cattleCount: isSAT ? 0 : cattleCount,
      timeSeconds: isSAT ? SAT_TIME_SECONDS : timeSeconds,
      isSAT,
      calledCattle,
      createdAtISO: new Date().toISOString(),
    };
    setFinalResults((prev) => [...prev, newResult]);
  }

  // -----------------------------
  //  BEST QUALIFIER SCORES
  // -----------------------------
  const getBestQualifierScores = useCallback((): Map<string, DuoScore> => {
    const duoGroupById: Map<string, DuoGroup> = new Map(
      duosMeta.map((d) => [d.id, d.group])
    );
    return buildBestQualifierScorePerDuo(results, duoGroupById);
  }, [results, duosMeta]);

  // -----------------------------
  //  FINALISTS (core/logic/finals)
  // -----------------------------
  const getFinalists = useCallback((): FinalsSelection => {
    const best = getBestQualifierScores();
    return selectFinalists(best);
  }, [getBestQualifierScores]);

  // -----------------------------
  //  FINAL AGGREGATES (core/logic/finals)
  // -----------------------------
  const getFinalAggregates = useCallback((): FinalAggregationEntry[] => {
    const best = getBestQualifierScores();
    return aggregateFinals(best, finalResults);
  }, [getBestQualifierScores, finalResults]);

  const value: ResultsContextValue = {
    results,
    finalResults,
    duosMeta,
    setDuosMeta,
    initializeFromCompetition,
    addQualifierResult,
    updateQualifierResult,
    addFinalResult,
    getBestQualifierScores,
    getFinalists,
    getFinalAggregates,
  };

  return (
    <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
  );
}

export function useResults(): ResultsContextValue {
  const ctx = useContext(ResultsContext);
  if (!ctx) {
    throw new Error('useResults must be used inside ResultsProvider');
  }
  return ctx;
}
