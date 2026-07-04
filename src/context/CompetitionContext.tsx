import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Competitor } from '../core/models/Competidor';
import { Duo } from '../core/models/Duo';
import { PassResult } from '../core/models/PassResult';
import { DEFAULT_FINALS_CUTOFF } from '../core/constants';
import {
  Competition,
  CompetitionStatus,
  updateCompetition,
} from '../services/firebase/competitions';
import { useDebouncedFirestoreSave } from '../hooks/useDebouncedFirestoreSave';

interface CompetitionContextValue {
  competition: Competition | null;
  competitors: Competitor[];
  duos: Duo[];
  numRounds: number;
  finalsCutoff: number;
  isSaving: boolean;
  loadCompetition: (c: Competition) => void;
  clearCompetition: () => void;
  setCompetitors: (c: Competitor[]) => void;
  setDuos: (d: Duo[]) => void;
  advanceStatus: (next: CompetitionStatus) => Promise<void>;
  persistQualifierResults: (results: PassResult[]) => void;
  persistFinalResults: (results: PassResult[]) => void;
}

const CompetitionContext = createContext<CompetitionContextValue | undefined>(
  undefined
);

export function CompetitionProvider({ children }: { children: React.ReactNode }) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [competitors, setCompetitorsState] = useState<Competitor[]>([]);
  const [duos, setDuosState] = useState<Duo[]>([]);
  const [numRounds, setNumRoundsState] = useState(1);
  const [finalsCutoff, setFinalsCutoffState] = useState(DEFAULT_FINALS_CUTOFF);

  const persist = useCallback(async (id: string, patch: Partial<Competition>) => {
    await updateCompetition(id, patch);
    setCompetition((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const { isSaving, save: debouncedSave, flushNow, cancelPending } =
    useDebouncedFirestoreSave<Competition>({ persist });

  const save = useCallback(
    (patch: Partial<Competition>) => debouncedSave(competition?.id, patch),
    [debouncedSave, competition?.id]
  );

  const loadCompetition = useCallback((c: Competition) => {
    // Cancel any pending save for the previous competition.
    cancelPending();
    setCompetition(c);
    setCompetitorsState(c.competitors ?? []);
    setDuosState(c.duos ?? []);
    setNumRoundsState(c.numRounds ?? 1);
    setFinalsCutoffState(c.finalsCutoff ?? DEFAULT_FINALS_CUTOFF);
  }, [cancelPending]);

  const clearCompetition = useCallback(() => {
    cancelPending();
    setCompetition(null);
    setCompetitorsState([]);
    setDuosState([]);
    setNumRoundsState(1);
    setFinalsCutoffState(DEFAULT_FINALS_CUTOFF);
  }, [cancelPending]);

  const setCompetitors = useCallback((c: Competitor[]) => {
    setCompetitorsState(c);
    save({ competitors: c });
  }, [save]);

  const setDuos = useCallback((d: Duo[]) => {
    setDuosState(d);
    save({ duos: d });
  }, [save]);

  const advanceStatus = useCallback(
    async (next: CompetitionStatus): Promise<void> => {
      if (!competition?.id) return;
      await flushNow(competition.id, { status: next });
    },
    [competition?.id, flushNow]
  );

  const persistQualifierResults = useCallback((results: PassResult[]) => {
    save({ qualifierResults: results });
  }, [save]);

  const persistFinalResults = useCallback((results: PassResult[]) => {
    save({ finalResults: results });
  }, [save]);

  return (
    <CompetitionContext.Provider
      value={{
        competition,
        competitors,
        duos,
        numRounds,
        finalsCutoff,
        isSaving,
        loadCompetition,
        clearCompetition,
        setCompetitors,
        setDuos,
        advanceStatus,
        persistQualifierResults,
        persistFinalResults,
      }}
    >
      {children}
    </CompetitionContext.Provider>
  );
}

export function useCompetition(): CompetitionContextValue {
  const ctx = useContext(CompetitionContext);
  if (!ctx) throw new Error('useCompetition must be used inside CompetitionProvider');
  return ctx;
}
