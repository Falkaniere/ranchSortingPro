import React from 'react';
import { useResults } from 'context/ResultContext';
import ResultsTable, { ResultsRow } from 'components/ResultsTable';
import { DuoGroup } from 'core/models/Duo';

interface FinalResultsProps {
  duos?: { id: string; label: string; group: DuoGroup }[];
}

export default function FinalResults({ duos = [] }: FinalResultsProps) {
  const { getFinalAggregates } = useResults();

  const groupMap = new Map(duos.map((d) => [d.id, d.group]));
  const aggregates = getFinalAggregates(groupMap);

  const rows: ResultsRow[] = aggregates.map((a, idx) => {
    const duo = duos.find((d) => d.id === a.duoId);
    return {
      duoId: a.duoId,
      duoLabel: duo?.label ?? a.duoId,
      group: a.group,
      totalCattle: a.totalCattle,
      totalTimeSeconds: a.totalTimeSeconds,
      position: idx + 1,
    };
  });

  return <ResultsTable title="Final Results" rows={rows} showTotals />;
}
