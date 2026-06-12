import { useEffect, useRef } from 'react';
import { useResults } from '../../context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';

export function ResultSyncBridge() {
  const { results, finalResults } = useResults();
  const { competition, persistQualifierResults, persistFinalResults } = useCompetition();

  // Each ref tracks the last competition id whose initial mount was already skipped,
  // preventing hydrated data from being written straight back to Firestore and
  // resetting correctly when the user switches to a different competition.
  const qualInit = useRef<string | null>(null);
  const finalInit = useRef<string | null>(null);

  useEffect(() => {
    if (!competition?.id) return;
    if (qualInit.current !== competition.id) { qualInit.current = competition.id; return; }
    persistQualifierResults(results);
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!competition?.id) return;
    if (finalInit.current !== competition.id) { finalInit.current = competition.id; return; }
    persistFinalResults(finalResults);
  }, [finalResults]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
