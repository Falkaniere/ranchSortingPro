import React from 'react';
import { CompetitionHistoryEntry } from '../../../../services/firebase/competitorHistory';
import { Card } from '../../../../components/ui/Card';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { GroupBadge } from '../../../../components/ui/Badge';
import { formatTime } from '../../../../utils/formatTime';

interface Props {
  history: CompetitionHistoryEntry[];
}

export default function MyPasses({ history }: Props) {
  const allPasses = history.flatMap((h) =>
    h.passes.map((p) => ({ ...p, competitionName: h.competitionName }))
  );

  if (allPasses.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Nenhuma passada registrada"
        description="Suas passadas aparecerão aqui após serem vinculadas ao seu perfil."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {history.map((entry) => {
        if (entry.passes.length === 0) return null;
        return <CompetitionPassBlock key={entry.competitionId} entry={entry} />;
      })}
    </div>
  );
}


function CompetitionPassBlock({ entry }: { entry: CompetitionHistoryEntry }) {
  const date = entry.eventDate
    ? new Date(entry.eventDate + 'T12:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Card
      title={entry.competitionName}
      subtitle={[entry.location, date].filter(Boolean).join(' · ')}
      noPadding
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-dust-50 border-b border-dust-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500">Etapa</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500">Parceiro</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Grupo</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">B.Cant.</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Bois</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Tempo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dust-100">
            {entry.passes.map((pass, i) => (
              <tr
                key={`${pass.duoId}-${i}`}
                className={pass.isSAT ? 'bg-brand-50' : 'hover:bg-dust-50'}
              >
                <td className="px-4 py-2.5">
                  <span
                    className={[
                      'text-xs px-1.5 py-0.5 rounded font-medium',
                      pass.stage === 'Qualifier'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-hay-50 text-hay-700',
                    ].join(' ')}
                  >
                    {pass.stage === 'Qualifier' ? 'Qualificatória' : 'Final'}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-medium text-rope-800">{pass.partnerName}</td>
                <td className="px-4 py-2.5 text-center">
                  <GroupBadge group={pass.group as '1D' | '2D'} />
                </td>
                <td className="px-4 py-2.5 text-center text-rope-500">
                  {pass.calledCattle ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-center font-semibold text-rope-700">
                  {pass.cattleCount}
                </td>
                <td className="px-4 py-2.5 text-center text-rope-600">
                  {formatTime(pass.timeSeconds, pass.isSAT)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
