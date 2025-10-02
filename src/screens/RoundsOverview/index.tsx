import React from 'react';
import { Duo, DuoGroup } from 'core/models/Duo';
import { useResults } from 'context/ResultContext';
import { PassResult } from 'core/models/PassResult';

interface RoundsOverviewProps {
  rounds: Duo[];
  duosMeta?: { id: string; label: string; group: DuoGroup }[];
}

export default function RoundsOverview({
  rounds,
  duosMeta = [],
}: RoundsOverviewProps) {
  const { passResults } = useResults();

  function resultsForDuo(duoId: string): PassResult[] {
    return passResults.filter((r) => r.duoId === duoId);
  }

  return (
    <div className="rounds-overview-container">
      <h1>Rounds Overview</h1>

      {rounds.length === 0 && <p>No duos generated yet.</p>}

      {rounds.length > 0 && (
        <table className="overview-table">
          <thead>
            <tr>
              <th>Duo</th>
              <th>Group</th>
              <th>Results</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((duo) => {
              const duoMeta = duosMeta.find((d) => d.id === duo.id);
              const results = resultsForDuo(duo.id);

              return (
                <tr key={duo.id}>
                  <td>
                    {duoMeta?.label ?? `${duo.riderOneId} 🤝 ${duo.riderTwoId}`}
                  </td>
                  <td>{duo.group}</td>
                  <td>
                    {results.length === 0 && <span>No results yet</span>}
                    {results.length > 0 && (
                      <ul>
                        {results.map((r, idx) => (
                          <li key={idx}>
                            {r.stage} → {r.cattleCount} cattle / {r.timeSeconds}
                            s {r.isSAT && '(SAT)'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
