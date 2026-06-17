import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { FinalAggregationEntry } from 'core/logic/finals';
import { useToast } from '../../components/ui/Toast';
import { exportToExcel } from 'utils/exportExcel';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Spinner';

export default function FinalResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { getFinalAggregates, duosMeta, results: qualifierResults, finalResults } = useResults();
  const { duos: compDuos, competition, advanceStatus } = useCompetition();
  const [isFinishing, setIsFinishing] = useState(false);

  const aggregates = getFinalAggregates();
  const metaDuos = duosMeta.length > 0 ? duosMeta : compDuos;

  // While a finished competition is being loaded from Firestore, ResultContext
  // may be empty for the first render cycle. Show a spinner in that window
  // instead of a misleading "no results" empty state.
  const isFinished = competition?.status === 'finished';
  const hasFirestoreData =
    (competition?.qualifierResults?.length ?? 0) > 0 ||
    (competition?.finalResults?.length ?? 0) > 0;
  const resultContextReady = qualifierResults.length > 0 || finalResults.length > 0;
  const isLoadingResults = isFinished && hasFirestoreData && !resultContextReady;

  const rows = aggregates.map((a: FinalAggregationEntry, idx: number) => {
    const duo = metaDuos.find((d) => d.id === a.duoId);
    return {
      position: idx + 1,
      duoId: a.duoId,
      duoLabel: duo?.label ?? a.duoId,
      group: a.group,
      totalCattle: a.totalCattle,
      totalTime: a.totalTimeSeconds,
    };
  });

  const rows1D = rows.filter((r) => r.group === '1D');
  const rows2D = rows.filter((r) => r.group === '2D');

  function medal(pos: number) {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return pos.toString();
  }

  async function handleFinish() {
    setIsFinishing(true);
    try {
      await advanceStatus('finished');
      navigate('/');
    } catch {
      toast('Erro ao finalizar a competição. Tente novamente.', 'error');
    } finally {
      setIsFinishing(false);
    }
  }

  function exportResults() {
    exportToExcel(
      rows.map((r) => ({
        '#': r.position,
        Dupla: r.duoLabel,
        Grupo: r.group,
        'Total Bois': r.totalCattle,
        'Total Tempo (s)': r.totalTime.toFixed(2),
      })),
      'Resultados_Finais'
    );
  }

  function ResultTable({ items, label }: { items: typeof rows; label: string }) {
    return (
      <Card title={label} noPadding>
        {items.length === 0 ? (
          <EmptyState title="Sem resultados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dust-50 border-b border-dust-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Dupla</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Grupo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Total Bois</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Total Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dust-100">
                {items.map((r, idx) => (
                  <tr
                    key={r.duoId}
                    className={[
                      'transition-colors',
                      idx === 0 ? 'bg-hay-50' : idx === 1 ? 'bg-dust-50' : 'hover:bg-dust-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 text-lg text-center w-12">{medal(idx + 1)}</td>
                    <td className="px-4 py-3 font-semibold text-rope-800 max-w-[160px] truncate">{r.duoLabel}</td>
                    <td className="px-4 py-3 text-center"><GroupBadge group={r.group} size="md" /></td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-saddle-700 text-base">{r.totalCattle}</span>
                      <span className="text-rope-400 text-xs ml-1">bois</span>
                    </td>
                    <td className="px-4 py-3 text-center text-rope-600 font-medium">
                      {r.totalTime.toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Resultados Finais"
        subtitle={`${rows.length} dupla${rows.length !== 1 ? 's' : ''} classificada${rows.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="outline" size="sm" onClick={exportResults} disabled={rows.length === 0}>
            Exportar Excel
          </Button>
        }
      />

      {isLoadingResults ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Sem resultados ainda"
          description={
            isFinished
              ? 'Nenhum resultado registrado nesta competição.'
              : 'Registre os resultados da final para ver a classificação.'
          }
          action={
            !isFinished ? (
              <Button variant="outline" onClick={() => navigate(`/competition/${id}/final`)}>
                ← Ir para a Final
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {rows1D.length > 0 && <ResultTable items={rows1D} label={`Classificação 1D — Aberta (${rows1D.length} duplas)`} />}
          {rows2D.length > 0 && <ResultTable items={rows2D} label={`Classificação 2D (${rows2D.length} duplas)`} />}

          <div className="flex justify-center pt-2">
            {competition?.status === 'finished' ? (
              <Button variant="secondary" onClick={() => navigate('/')}>
                Voltar ao Início
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={isFinishing}>
                Finalizar Competição
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
