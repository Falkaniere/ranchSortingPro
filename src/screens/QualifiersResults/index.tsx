import React from 'react';
import { standingsFromScores } from 'core/logic/scoring';
import ResultsTable, { ResultsRow } from 'components/ResultsTable';
import { DuoGroup } from 'core/models/Duo';
import { useResults } from 'context/ResultContext';

interface QualifiersResultsProps {
  duos?: { id: string; label: string; group: DuoGroup }[];
}

export default function QualifiersResults({
  duos = [],
}: QualifiersResultsProps) {
  const { getQualifierStandings } = useResults();

  const groupMap = new Map(duos.map((d) => [d.id, d.group]));
  const standings = standingsFromScores(getQualifierStandings(groupMap));

  const rows: ResultsRow[] = standings.map((s) => {
    const duo = duos.find((d) => d.id === s.duoId);
    return {
      duoId: s.duoId,
      duoLabel: duo?.label ?? s.duoId,
      group: s.group,
      cattleCount: s.cattleCount,
      timeSeconds: s.timeSeconds,
      position: s.position,
    };
  });

  return <ResultsTable title="Qualifiers Standings" rows={rows} />;
}
