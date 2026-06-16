import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Competitor } from '../core/models/Competidor';
import { Duo } from '../core/models/Duo';
import { PassResult } from '../core/models/PassResult';
import {
  Competition,
  CompetitionStatus,
  updateCompetition,
} from '../services/firebase/competitions';

interface CompetitionContextValue {
  competition: Competition | null;
  competitors: Competitor[];
  duos: Duo[];
  numRounds: number;
  isSaving: boolean;
  loadCompetition: (c: Competition) => void;
  clearCompetition: () => void;
  setCompetitors: (c: Competitor[]) => void;
  setDuos: (d: Duo[]) => void;
  setNumRounds: (n: number) => void;
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
  const [isSaving, setIsSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<Competition>>({});

  const save = useCallback(
    (patch: Partial<Competition>) => {
      if (!competition?.id) return;
      // Merge incoming patch so rapid sequential saves don't drop earlier fields.
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const currentId = competition.id;
      debounceRef.current = setTimeout(async () => {
        const accumulated = { ...pendingPatchRef.current };
        pendingPatchRef.current = {};
        setIsSaving(true);
        try {
          await updateCompetition(currentId, accumulated);
          setCompetition((prev) => (prev ? { ...prev, ...accumulated } : prev));
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    },
    [competition?.id]
  );

  function loadCompetition(c: Competition) {
    // Cancel any pending save for the previous competition.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingPatchRef.current = {};
    setCompetition(c);
    setCompetitorsState(c.competitors ?? []);
    setDuosState(c.duos ?? []);
    setNumRoundsState(c.numRounds ?? 1);
  }

  function clearCompetition() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingPatchRef.current = {};
    setCompetition(null);
    setCompetitorsState([]);
    setDuosState([]);
    setNumRoundsState(1);
  }

  function setCompetitors(c: Competitor[]) {
    setCompetitorsState(c);
    save({ competitors: c });
  }

  function setDuos(d: Duo[]) {
    setDuosState(d);
    save({ duos: d });
  }

  function setNumRounds(n: number) {
    setNumRoundsState(n);
    save({ numRounds: n });
  }

  const advanceStatus = useCallback(
    async (next: CompetitionStatus): Promise<void> => {
      if (!competition?.id) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const merged = { ...pendingPatchRef.current, status: next };
      pendingPatchRef.current = {};
      setIsSaving(true);
      try {
        await updateCompetition(competition.id, merged);
        setCompetition((prev) => (prev ? { ...prev, ...merged } : prev));
      } finally {
        setIsSaving(false);
      }
    },
    [competition?.id]
  );

  function persistQualifierResults(results: PassResult[]) {
    save({ qualifierResults: results });
  }

  function persistFinalResults(results: PassResult[]) {
    save({ finalResults: results });
  }

  return (
    <CompetitionContext.Provider
      value={{
        competition,
        competitors,
        duos,
        numRounds,
        isSaving,
        loadCompetition,
        clearCompetition,
        setCompetitors,
        setDuos,
        setNumRounds,
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
