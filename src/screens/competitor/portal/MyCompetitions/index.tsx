import React from 'react';
import { Link } from 'react-router-dom';
import { CompetitionHistoryEntry } from '../../../../services/firebase/competitorHistory';
import { Card } from '../../../../components/ui/Card';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { STATUS_LABELS } from '../../../../core/constants';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-dust-200 text-rope-500',
  qualifier: 'bg-blue-100 text-blue-700',
  final: 'bg-hay-100 text-hay-700',
  finished: 'bg-green-100 text-green-700',
};

interface Props {
  history: CompetitionHistoryEntry[];
}

export default function MyCompetitions({ history }: Props) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon="🏟️"
        title="Nenhuma competição encontrada"
        description="Suas competições aparecerão aqui após serem vinculadas ao seu perfil."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {history.map((entry) => (
        <CompetitionCard key={entry.competitionId} entry={entry} />
      ))}
    </div>
  );
}

function CompetitionCard({ entry }: { entry: CompetitionHistoryEntry }) {
  const date = entry.eventDate
    ? new Date(entry.eventDate + 'T12:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const qualPasses = entry.passes.filter((p) => p.stage === 'Qualifier');
  const finalPasses = entry.passes.filter((p) => p.stage === 'Final');
  const totalCattle = entry.passes.reduce((s, p) => s + p.cattleCount, 0);

  return (
    <Card noPadding>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-serif font-semibold text-rope-800 text-base">
              {entry.competitionName}
            </h3>
            {entry.location && (
              <p className="text-rope-400 text-xs mt-0.5">📍 {entry.location}</p>
            )}
            {date && <p className="text-rope-400 text-xs mt-0.5">📅 {date}</p>}
          </div>
          <span
            className={[
              'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
              STATUS_COLOR[entry.status] ?? 'bg-dust-200 text-rope-500',
            ].join(' ')}
          >
            {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS] ?? entry.status}
          </span>
        </div>

        <div className="flex gap-4 text-xs text-rope-500">
          <span>🐄 {totalCattle} bois totais</span>
          <span>📋 {qualPasses.length} qualificatória{qualPasses.length !== 1 ? 's' : ''}</span>
          {finalPasses.length > 0 && (
            <span>🏆 {finalPasses.length} final</span>
          )}
        </div>
      </div>

      {entry.status === 'finished' && (
        <div className="px-5 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl">
          <Link
            to={`/portal/results/${entry.competitionId}`}
            className="text-sm text-saddle-600 hover:text-saddle-800 font-medium"
          >
            Ver resultados →
          </Link>
        </div>
      )}
    </Card>
  );
}
