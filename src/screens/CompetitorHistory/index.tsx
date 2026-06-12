import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export default function CompetitorHistory() {
  const { competitorId } = useParams<{ competitorId: string }>();
  const navigate = useNavigate();
  const { results, finalResults, duosMeta } = useResults();
  const { competitors, duos: compDuos } = useCompetition();

  const allDuos = duosMeta.length > 0 ? duosMeta : compDuos;
  const competitor = competitors.find((c) => c.id === competitorId);

  // Duplas em que este competidor participou
  const myDuos = useMemo(
    () => allDuos.filter((d) => d.riderOneId === competitorId || d.riderTwoId === competitorId),
    [allDuos, competitorId]
  );
  const myDuoIds = useMemo(() => new Set(myDuos.map((d) => d.id)), [myDuos]);

  const qualResults = useMemo(
    () => results.filter((r) => r.stage === 'Qualifier' && myDuoIds.has(r.duoId)),
    [results, myDuoIds]
  );

  const finResults = useMemo(
    () => finalResults.filter((r) => r.stage === 'Final' && myDuoIds.has(r.duoId)),
    [finalResults, myDuoIds]
  );

  function getDuo(duoId: string) {
    return allDuos.find((d) => d.id === duoId);
  }

  function getPartnerName(duoId: string) {
    const duo = getDuo(duoId);
    if (!duo) return '?';
    const partnerId = duo.riderOneId === competitorId ? duo.riderTwoId : duo.riderOneId;
    return competitors.find((c) => c.id === partnerId)?.name ?? '?';
  }

  function getPassNumber(duoId: string) {
    return getDuo(duoId)?.passNumber ?? '?';
  }

  // Estatísticas das qualificatórias
  const qualStats = useMemo(() => {
    if (qualResults.length === 0) return null;
    const sats = qualResults.filter((r) => r.isSAT).length;
    const avgCattle = qualResults.reduce((s, r) => s + r.cattleCount, 0) / qualResults.length;
    const avgTime = qualResults.reduce((s, r) => s + r.timeSeconds, 0) / qualResults.length;
    return { sats, avgCattle, avgTime };
  }, [qualResults]);

  // Estatísticas das finais
  const finStats = useMemo(() => {
    if (finResults.length === 0) return null;
    const sats = finResults.filter((r) => r.isSAT).length;
    const avgCattle = finResults.reduce((s, r) => s + r.cattleCount, 0) / finResults.length;
    const avgTime = finResults.reduce((s, r) => s + r.timeSeconds, 0) / finResults.length;
    return { sats, avgCattle, avgTime };
  }, [finResults]);

  function formatTime(s: number, sat?: boolean) {
    return sat ? 'SAT' : `${s.toFixed(2)}s`;
  }

  if (!competitor) {
    return (
      <div className="py-10">
        <EmptyState icon="👤" title="Competidor não encontrado" description="Verifique o link e tente novamente." action={<Button variant="outline" onClick={() => navigate(-1)}>← Voltar</Button>} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Histórico — ${competitor.name}`}
        subtitle={`${qualResults.length} passada${qualResults.length !== 1 ? 's' : ''} nas qualificatórias · ${finResults.length} na final`}
        backTo=""
        actions={<Button variant="outline" size="sm" onClick={() => navigate(-1)}>← Voltar</Button>}
      />

      {/* Qualificatórias */}
      <div className="flex flex-col gap-5">
        <Card title={`Qualificatórias (${qualResults.length})`} noPadding>
          {qualResults.length === 0 ? (
            <EmptyState icon="📋" title="Sem passadas registradas" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dust-50 border-b border-dust-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500">Passada</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500">Parceiro</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Grp</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">B.Cant.</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Bois</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Tempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dust-100">
                    {qualResults.map((r) => (
                      <tr key={r.id} className={r.isSAT ? 'bg-brand-50' : 'hover:bg-dust-50'}>
                        <td className="px-4 py-2.5 text-rope-500 text-xs font-mono">#{getPassNumber(r.duoId)}</td>
                        <td className="px-4 py-2.5 font-medium text-rope-800 text-sm">{getPartnerName(r.duoId)}</td>
                        <td className="px-4 py-2.5 text-center"><GroupBadge group={getDuo(r.duoId)?.group ?? '1D'} /></td>
                        <td className="px-4 py-2.5 text-center text-rope-500 text-sm">{r.calledCattle ?? '—'}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-rope-700">{r.cattleCount}</td>
                        <td className="px-4 py-2.5 text-center text-rope-600 text-sm">{formatTime(r.timeSeconds, r.isSAT)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {qualStats && (
                <div className="px-4 py-3 bg-dust-50 border-t border-dust-200 flex flex-wrap gap-4 text-xs text-rope-600">
                  <span>Média bois: <strong className="text-rope-800">{qualStats.avgCattle.toFixed(2)}</strong></span>
                  <span>Tempo médio: <strong className="text-rope-800">{formatTime(qualStats.avgTime)}</strong></span>
                  <span>SATs: <strong className="text-brand-600">{qualStats.sats}</strong></span>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Finais */}
        <Card title={`Final (${finResults.length})`} noPadding>
          {finResults.length === 0 ? (
            <EmptyState icon="🏆" title="Sem passadas na final" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dust-50 border-b border-dust-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500">Passada</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500">Parceiro</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Grp</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">B.Cant.</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Bois</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500">Tempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dust-100">
                    {finResults.map((r) => (
                      <tr key={r.id} className={r.isSAT ? 'bg-brand-50' : 'hover:bg-dust-50'}>
                        <td className="px-4 py-2.5 text-rope-500 text-xs font-mono">#{getPassNumber(r.duoId)}</td>
                        <td className="px-4 py-2.5 font-medium text-rope-800 text-sm">{getPartnerName(r.duoId)}</td>
                        <td className="px-4 py-2.5 text-center"><GroupBadge group={getDuo(r.duoId)?.group ?? '1D'} /></td>
                        <td className="px-4 py-2.5 text-center text-rope-500 text-sm">{r.calledCattle ?? '—'}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-rope-700">{r.cattleCount}</td>
                        <td className="px-4 py-2.5 text-center text-rope-600 text-sm">{formatTime(r.timeSeconds, r.isSAT)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {finStats && (
                <div className="px-4 py-3 bg-dust-50 border-t border-dust-200 flex flex-wrap gap-4 text-xs text-rope-600">
                  <span>Média bois: <strong className="text-rope-800">{finStats.avgCattle.toFixed(2)}</strong></span>
                  <span>Tempo médio: <strong className="text-rope-800">{formatTime(finStats.avgTime)}</strong></span>
                  <span>SATs: <strong className="text-brand-600">{finStats.sats}</strong></span>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
