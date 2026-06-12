import { useEffect, useRef } from 'react';
import { useResults } from '../../context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';

/**
 * Syncs ResultContext state (qualifier + final results) to Firestore
 * via CompetitionContext whenever results change.
 * Must be rendered inside both providers.
 */
export function ResultSyncBridge() {
  const { results, finalResults } = useResults();
  const { competition, persistQualifierResults, persistFinalResults } = useCompetition();

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (!competition?.id) return;
    persistQualifierResults(results);
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!competition?.id) return;
    persistFinalResults(finalResults);
  }, [finalResults]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
