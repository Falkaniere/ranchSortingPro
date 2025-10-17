import React, { createContext, useContext, useState } from 'react';
import { PassResult, DuoScore } from 'core/models/PassResult';
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

  /** Adiciona resultado da qualificatória */
  addQualifierResult: (
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    isSAT?: boolean
  ) => void;

  /** Atualiza resultado existente da qualificatória */
  updateQualifierResult: (
    duoId: string,
    cattleCount: number,
    timeSeconds: number
  ) => void;

  /** Adiciona resultado da final */
  addFinalResult: (
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    isSAT?: boolean
  ) => void;

  /** Mapa com o melhor resultado por dupla nas qualificatórias */
  getBestQualifierScores: () => Map<string, DuoScore>;

  /** Seleção de finalistas conforme regras (core/logic/finals) */
  getFinalists: (maxPerFinal?: number) => FinalsSelection;

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
  //  ADD RESULTS
  // -----------------------------
  function addQualifierResult(
    duoId: string,
    cattleCount: number,
    timeSeconds: number,
    isSAT = false
  ) {
    const newResult: PassResult = {
      id: crypto.randomUUID(),
      duoId,
      stage: 'Qualifier',
      cattleCount: isSAT ? 0 : cattleCount,
      timeSeconds: isSAT ? 120 : timeSeconds,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };
    setResults((prev) => [...prev, newResult]);
  }

  /** Atualiza resultado existente da qualificatória */
  function updateQualifierResult(
    duoId: string,
    cattleCount: number,
    timeSeconds: number
  ) {
    setResults((prev) =>
      prev.map((r) =>
        r.duoId === duoId && r.stage === 'Qualifier'
          ? {
              ...r,
              cattleCount,
              timeSeconds,
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
    isSAT = false
  ) {
    const newResult: PassResult = {
      id: crypto.randomUUID(),
      duoId,
      stage: 'Final',
      cattleCount: isSAT ? 0 : cattleCount,
      timeSeconds: isSAT ? 120 : timeSeconds,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };
    setFinalResults((prev) => [...prev, newResult]);
  }

  // -----------------------------
  //  BEST QUALIFIER SCORES
  // -----------------------------
  function getBestQualifierScores(): Map<string, DuoScore> {
    const duoGroupById: Map<string, DuoGroup> = new Map(
      duosMeta.map((d) => [d.id, d.group])
    );
    return buildBestQualifierScorePerDuo(results, duoGroupById);
  }

  // -----------------------------
  //  FINALISTS (core/logic/finals)
  // -----------------------------
  function getFinalists(maxPerFinal = 10): FinalsSelection {
    const best = getBestQualifierScores();
    return selectFinalists(best, maxPerFinal);
  }

  // -----------------------------
  //  FINAL AGGREGATES (core/logic/finals)
  // -----------------------------
  function getFinalAggregates(): FinalAggregationEntry[] {
    const best = getBestQualifierScores();
    return aggregateFinals(best, finalResults);
  }

  const value: ResultsContextValue = {
    results,
    finalResults,
    duosMeta,
    setDuosMeta,
    addQualifierResult,
    updateQualifierResult, // ✅ nova função
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
