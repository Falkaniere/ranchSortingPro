import React from 'react';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { PassResult } from 'core/models/PassResult';
import { Card } from '../../components/ui/Card';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';

export default function RoundsOverview() {
  const { results, duosMeta } = useResults();
  const { duos: compDuos } = useCompetition();

  const metaDuos = duosMeta.length > 0 ? duosMeta : compDuos;

  function resultsForDuo(duoId: string): PassResult[] {
    return results.filter((r: PassResult) => r.duoId === duoId);
  }

  function formatTime(s: number) {
    return s >= 120 ? 'SAT' : `${s.toFixed(2)}s`;
  }

  return (
    <div>
      <PageHeader
        title="Visão Geral das Passadas"
        subtitle={`${metaDuos.length} duplas · ${results.length} passadas registradas`}
      />

      {metaDuos.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Nenhuma dupla registrada"
          description="As duplas aparecerão aqui após serem sorteadas."
        />
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dust-50 border-b border-dust-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Dupla</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Grupo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Passadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dust-100">
                {metaDuos.map((duo, idx) => {
                  const duoResults = resultsForDuo(duo.id);
                  return (
                    <tr key={duo.id} className="hover:bg-dust-50 transition-colors">
                      <td className="px-4 py-3 text-rope-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-rope-800">{duo.label ?? duo.id}</td>
                      <td className="px-4 py-3 text-center">
                        <GroupBadge group={duo.group} />
                      </td>
                      <td className="px-4 py-3">
                        {duoResults.length === 0 ? (
                          <span className="text-rope-300 text-xs">Sem resultados</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {duoResults.map((r, i) => (
                              <span
                                key={i}
                                className={[
                                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                                  r.isSAT
                                    ? 'bg-brand-50 text-brand-600 border-brand-200'
                                    : 'bg-pasture-50 text-pasture-700 border-pasture-200',
                                ].join(' ')}
                              >
                                <span className="font-semibold">{r.stage === 'Qualifier' ? 'Q' : 'F'}</span>
                                {r.isSAT ? 'SAT' : `${r.cattleCount}b · ${formatTime(r.timeSeconds)}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
