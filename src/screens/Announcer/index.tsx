import React, { useMemo } from 'react';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { PassResult } from 'core/models/PassResult';
import { GroupBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-saddle-800 border-saddle-700 text-white' : 'bg-white border-dust-300'}`}>
      <p className={`text-xs uppercase tracking-wide mb-1 ${highlight ? 'text-saddle-300' : 'text-rope-400'}`}>{label}</p>
      <p className={`text-3xl font-bold font-serif ${highlight ? 'text-white' : 'text-rope-800'}`}>{value}</p>
    </div>
  );
}

function requestFullscreen() {
  try {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  } catch {
    // Ignore unsupported browsers
  }
}

export default function Announcer() {
  const { results, finalResults, duosMeta, getFinalists } = useResults();
  const { competition, duos: compDuos } = useCompetition();

  const status = competition?.status ?? 'qualifier';
  const allDuos = duosMeta.length > 0 ? duosMeta : compDuos;

  // Determina quais resultados e duplas usar conforme etapa
  const activeResults = status === 'final' ? finalResults : results;
  const stage = status === 'final' ? 'Final' : 'Qualifier';

  const registeredIds = useMemo(
    () => new Set(activeResults.filter((r: PassResult) => r.stage === stage).map((r) => r.duoId)),
    [activeResults, stage]
  );

  // Para a final, precisamos da lista ordenada de finalistas
  const finalists = useMemo(() => {
    if (status !== 'final') return null;
    return getFinalists();
  }, [status, results]); // eslint-disable-line react-hooks/exhaustive-deps

  const orderedDuos = useMemo(() => {
    if (status === 'final' && finalists) {
      // Exibe 2D primeiro, depois 1D — reverso (pior entra primeiro)
      const all2D = [...finalists.finalists2D].reverse();
      const all1D = [...finalists.finalists1D].reverse();
      const combined = [...all2D, ...all1D];
      return combined
        .map((entry) => allDuos.find((d) => d.id === entry.duoId))
        .filter(Boolean) as typeof allDuos;
    }
    return allDuos;
  }, [status, finalists, allDuos]);

  const pendingDuos = orderedDuos.filter((d) => !registeredIds.has(d.id));
  const currentDuo = pendingDuos[0] ?? null;
  const nextDuo = pendingDuos[1] ?? null;

  // Última passada registrada
  const lastResult = useMemo(() => {
    const stageResults = activeResults.filter((r: PassResult) => r.stage === stage);
    return stageResults[stageResults.length - 1] ?? null;
  }, [activeResults, stage]);

  const lastDuo = lastResult ? allDuos.find((d) => d.id === lastResult.duoId) : null;

  const total = orderedDuos.length;
  const done = registeredIds.size;
  const remaining = total - done;

  function formatTime(s: number, sat?: boolean) {
    return sat ? 'SAT' : `${s.toFixed(2)}s`;
  }

  const stageLabel = status === 'final' ? 'Final' : 'Qualificatória';

  return (
    <div className="min-h-[60vh] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-semibold text-rope-800">Visão do Locutor</h2>
          <p className="text-sm text-rope-400">{stageLabel} · {competition?.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={requestFullscreen}>
          Tela Cheia ⛶
        </Button>
      </div>

      {/* Próxima e seguinte */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {/* Próxima dupla — destaque principal */}
        <div className="rounded-2xl bg-saddle-800 text-white p-4 sm:p-6 border border-saddle-700 shadow-lg">
          <p className="text-saddle-300 text-xs uppercase tracking-widest mb-2">Próxima Passada</p>
          {currentDuo ? (
            <>
              <p className="text-4xl sm:text-5xl font-bold font-serif text-hay-300 mb-2">
                #{currentDuo.passNumber ?? '—'}
              </p>
              <p className="text-lg sm:text-2xl font-semibold leading-tight mb-3 break-words">{currentDuo.label}</p>
              <GroupBadge group={currentDuo.group} size="md" />
            </>
          ) : (
            <p className="text-xl sm:text-2xl text-saddle-300 font-semibold mt-2">
              {total === 0 ? 'Sem duplas' : '✅ Etapa concluída!'}
            </p>
          )}
        </div>

        {/* Dupla seguinte — pré-anúncio */}
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-dust-300 shadow-sm">
          <p className="text-rope-400 text-xs uppercase tracking-widest mb-2">Em Seguida</p>
          {nextDuo ? (
            <>
              <p className="text-2xl sm:text-3xl font-bold font-serif text-saddle-600 mb-2">
                #{nextDuo.passNumber ?? '—'}
              </p>
              <p className="text-base sm:text-xl font-semibold text-rope-800 leading-tight mb-3 break-words">{nextDuo.label}</p>
              <GroupBadge group={nextDuo.group} size="md" />
            </>
          ) : (
            <p className="text-rope-300 text-lg mt-2">—</p>
          )}
        </div>
      </div>

      {/* Última passada */}
      {lastResult && lastDuo && (
        <div className="rounded-xl bg-white border border-dust-300 p-4 sm:p-5">
          <p className="text-rope-400 text-xs uppercase tracking-widest mb-3">Última Passada</p>
          <div className="flex flex-wrap items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rope-800 text-base sm:text-lg break-words leading-snug">{lastDuo.label}</p>
              <GroupBadge group={lastDuo.group} />
            </div>
            <div className="flex gap-4 sm:gap-6 text-center shrink-0">
              {lastResult.calledCattle !== undefined && (
                <div>
                  <p className="text-xs text-rope-400">B. Cantado</p>
                  <p className="text-xl sm:text-2xl font-bold text-saddle-700">{lastResult.calledCattle}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-rope-400">Bois</p>
                <p className="text-xl sm:text-2xl font-bold text-rope-800">{lastResult.cattleCount}</p>
              </div>
              <div>
                <p className="text-xs text-rope-400">Tempo</p>
                <p className="text-xl sm:text-2xl font-bold text-rope-800">{formatTime(lastResult.timeSeconds, lastResult.isSAT)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Total" value={total} />
        <StatCard label="Concluídas" value={done} highlight />
        <StatCard label="Restantes" value={remaining} />
      </div>
    </div>
  );
}
