import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompetition, Competition } from '../../../../services/firebase/competitions';
import { buildBestQualifierScorePerDuo } from '../../../../core/logic/scoring';
import { aggregateFinals } from '../../../../core/logic/finals';
import { Card } from '../../../../components/ui/Card';
import { GroupBadge } from '../../../../components/ui/Badge';
import { Spinner } from '../../../../components/ui/Spinner';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Button } from '../../../../components/ui/Button';

export default function CompetitionResults() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) return;
    setLoading(true);
    getCompetition(competitionId)
      .then(setCompetition)
      .catch(() => setCompetition(null))
      .finally(() => setLoading(false));
  }, [competitionId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!competition) {
    return (
      <EmptyState
        icon="📊"
        title="Competição não encontrada"
        description="Verifique o link e tente novamente."
        action={<Button variant="outline" onClick={() => navigate('/portal')}>Voltar ao portal</Button>}
      />
    );
  }

  if (competition.status !== 'finished') {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="self-start">
          ← Voltar
        </Button>
        <EmptyState
          icon="⏳"
          title="Resultados ainda não disponíveis"
          description={`A competição "${competition.name}" ainda não foi encerrada.`}
        />
      </div>
    );
  }

  const duoGroupById = new Map(competition.duos.map((d) => [d.id, d.group]));
  const bestQual = buildBestQualifierScorePerDuo(competition.qualifierResults, duoGroupById);
  const aggregates = aggregateFinals(bestQual, competition.finalResults);

  const results1D = aggregates.filter((a) => a.group === '1D');
  const results2D = aggregates.filter((a) => a.group === '2D');

  function getDuoLabel(duoId: string) {
    const duo = competition!.duos.find((d) => d.id === duoId);
    if (duo?.label) return duo.label;
    const r1 = competition!.competitors.find((c) => c.id === duo?.riderOneId);
    const r2 = competition!.competitors.find((c) => c.id === duo?.riderTwoId);
    return `${r1?.name ?? '?'} & ${r2?.name ?? '?'}`;
  }

  const medal = (pos: number) => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          ← Voltar
        </Button>
        <div>
          <h2 className="font-serif font-bold text-rope-800 text-xl">{competition.name}</h2>
          <p className="text-rope-400 text-sm">Resultado final</p>
        </div>
      </div>

      {[
        { label: 'Categoria 1D', data: results1D },
        { label: 'Categoria 2D', data: results2D },
      ].map(({ label, data }) =>
        data.length === 0 ? null : (
          <Card key={label} title={label} noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dust-50 border-b border-dust-200">
                  <tr>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500 w-10">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500">Dupla</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Grupo</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Bois</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Tempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dust-100">
                  {data.map((row, idx) => (
                    <tr key={row.duoId} className="hover:bg-dust-50">
                      <td className="px-4 py-2.5 text-center text-xs text-rope-400 font-mono">
                        {medal(idx + 1) || `${idx + 1}º`}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-rope-800">
                        {getDuoLabel(row.duoId)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <GroupBadge group={row.group} />
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-rope-700">
                        {row.totalCattle}
                      </td>
                      <td className="px-4 py-2.5 text-center text-rope-600">
                        {row.totalTimeSeconds.toFixed(2)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
