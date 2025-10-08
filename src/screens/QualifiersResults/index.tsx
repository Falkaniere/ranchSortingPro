import React from 'react';
import { useResults } from 'context/ResultContext';
import { standingsFromScores } from 'core/logic/scoring';
import { Duo } from 'core/models/Duo';

interface QualifiersResultsProps {
  duos?: Duo[];
}

export default function QualifiersResults({
  duos = [],
}: QualifiersResultsProps) {
  const { getBestQualifierScores } = useResults();
  const best = getBestQualifierScores();
  const standings = standingsFromScores(best);

  return (
    <div style={{ padding: 24 }}>
      <h1>Resultados das Qualificatórias</h1>
      {standings.length === 0 ? (
        <p>Sem resultados ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Dupla</th>
              <th>Categoria</th>
              <th>Bois</th>
              <th>Tempo</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const duo = duos.find((d) => d.id === s.duoId);
              return (
                <tr key={s.duoId}>
                  <td>{idx + 1}</td>
                  <td>{duo?.label ?? s.duoId}</td>
                  <td>{s.group}</td>
                  <td>{s.cattleCount}</td>
                  <td>{s.timeSeconds}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
