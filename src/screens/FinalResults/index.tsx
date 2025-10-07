import React from 'react';
import { useResults } from 'context/ResultContext';
import { Duo } from 'core/models/Duo';

interface FinalResultsProps {
  duos: Duo[];
}

interface ResultsRow {
  position: number;
  duoId: string;
  duoLabel: string;
  group: string;
  totalCattle: number;
  totalTimeSeconds: number;
}

export default function FinalResults({ duos }: FinalResultsProps) {
  const { getFinalAggregates } = useResults();

  const aggregates = getFinalAggregates();

  const rows: ResultsRow[] = aggregates.map((a, idx) => {
    const duo = duos.find((d) => d.id === a.duoId);
    return {
      position: idx + 1,
      duoId: a.duoId,
      duoLabel: duo?.label ?? a.duoId,
      group: a.group,
      totalCattle: a.totalCattle,
      totalTimeSeconds: a.totalTimeSeconds,
    };
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>Resultados Finais</h1>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Dupla</th>
            <th>Grupo</th>
            <th>Bois (Total)</th>
            <th>Tempo (Total)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.duoId}>
              <td>{r.position}</td>
              <td>{r.duoLabel}</td>
              <td>{r.group}</td>
              <td>{r.totalCattle}</td>
              <td>{r.totalTimeSeconds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
