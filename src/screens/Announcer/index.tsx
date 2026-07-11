import React, { useMemo } from 'react';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { PassResult } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import { GroupBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TimeToBeatCard } from '../../components/ui/TimeToBeatCard';
import { computeTimeToBeat } from 'core/logic/finals';
import { formatTime } from '../../utils/formatTime';

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
  const { results, finalResults, duosMeta, getFinalists, getBestQualifierScores, getFinalAggregates } = useResults();
  const { competition, duos: compDuos } = useCompetition();

  const status = competition?.status ?? 'qualifier';
  const allDuos = duosMeta.length > 0 ? duosMeta : compDuos;

  // Determina quais resultados e duplas usar conforme etapa
  const activeResults = status === 'final' ? finalResults : results;
  const stage = status === 'final' ? 'Final' : 'Qualifier';

  // Para a final, precisamos da lista ordenada de finalistas
  const finalists = useMemo(() => {
    if (status !== 'final') return null;
    return getFinalists(competition?.finalsCutoff);
  }, [status, results, competition?.finalsCutoff]); // eslint-disable-line react-hooks/exhaustive-deps

  // Uma dupla 2D que também entra no top geral corre a final 1D em vez da
  // 2D (nunca as duas) — por isso a fila é de (dupla, bracket), não só de duplas.
  const orderedEntries = useMemo(() => {
    if (status === 'final' && finalists) {
      // Exibe 2D primeiro, depois 1D — reverso (pior entra primeiro)
      const all2D = [...finalists.finalists2D].reverse().map((e) => ({ duoId: e.duoId, bracket: '2D' as DuoGroup }));
      const all1D = [...finalists.finalists1D].reverse().map((e) => ({ duoId: e.duoId, bracket: '1D' as DuoGroup }));
      return [...all2D, ...all1D];
    }
    return allDuos.map((d) => ({ duoId: d.id, bracket: undefined as DuoGroup | undefined }));
  }, [status, finalists, allDuos]);

  const groupByDuoId = useMemo(
    () => new Map(allDuos.map((d) => [d.id, d.group])),
    [allDuos]
  );

  const registeredKeys = useMemo(
    () => new Set(
      activeResults
        .filter((r: PassResult) => r.stage === stage)
        .map((r) =>
          stage === 'Final' ? `${r.duoId}:${r.bracket ?? groupByDuoId.get(r.duoId) ?? '1D'}` : r.duoId
        )
    ),
    [activeResults, stage, groupByDuoId]
  );

  const pendingEntries = orderedEntries.filter(
    (e) => !registeredKeys.has(stage === 'Final' ? `${e.duoId}:${e.bracket}` : e.duoId)
  );

  function entryToDuo(entry: { duoId: string; bracket?: DuoGroup } | undefined) {
    if (!entry) return null;
    const duo = allDuos.find((d) => d.id === entry.duoId);
    return duo ? { ...duo, bracket: entry.bracket } : null;
  }

  const currentDuo = entryToDuo(pendingEntries[0]);
  const nextDuo = entryToDuo(pendingEntries[1]);

  // "Tempo a bater" da próxima dupla da final: líder atual do bracket dela
  // (agregado qualificatória + final) vs. a nota fixa de qualificatória dela.
  // O agregado é reconstruído do zero (best scores + aggregate + sort), então
  // é memoizado uma vez e reaproveitado para o líder e para o tempo a bater.
  const currentBracket = currentDuo?.bracket ?? currentDuo?.group;

  const bracketLeaderEntry = useMemo(() => {
    if (status !== 'final' || !currentBracket) return null;
    return getFinalAggregates().find((e) => e.bracket === currentBracket) ?? null;
  }, [status, currentBracket, getFinalAggregates]);

  const timeToBeat = useMemo(() => {
    if (status !== 'final' || !currentDuo) return null;
    const quali = getBestQualifierScores().get(currentDuo.id);
    if (!quali) return null;
    return computeTimeToBeat(
      { cattleCount: quali.cattleCount, timeSeconds: quali.timeSeconds },
      bracketLeaderEntry
    );
  }, [status, currentDuo, getBestQualifierScores, bracketLeaderEntry]);

  const leaderLabel = useMemo(() => {
    if (!bracketLeaderEntry) return undefined;
    return allDuos.find((d) => d.id === bracketLeaderEntry.duoId)?.label;
  }, [bracketLeaderEntry, allDuos]);

  // Última passada registrada
  const lastResult = useMemo(() => {
    const stageResults = activeResults.filter((r: PassResult) => r.stage === stage);
    return stageResults[stageResults.length - 1] ?? null;
  }, [activeResults, stage]);

  const lastDuo = lastResult ? allDuos.find((d) => d.id === lastResult.duoId) : null;

  const total = orderedEntries.length;
  const done = registeredKeys.size;
  const remaining = total - done;

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
              <p className="text-lg sm:text-2xl font-semibold leading-tight mb-3 line-clamp-2 overflow-hidden">{currentDuo.label}</p>
              <div className="flex items-center gap-2">
                <GroupBadge group={currentDuo.group} size="md" />
                {currentDuo.bracket && currentDuo.bracket !== currentDuo.group && (
                  <span className="text-xs text-saddle-200">correndo na Final {currentDuo.bracket}</span>
                )}
              </div>
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
              <p className="text-base sm:text-xl font-semibold text-rope-800 leading-tight mb-3 line-clamp-2 overflow-hidden">{nextDuo.label}</p>
              <div className="flex items-center gap-2">
                <GroupBadge group={nextDuo.group} size="md" />
                {nextDuo.bracket && nextDuo.bracket !== nextDuo.group && (
                  <span className="text-xs text-rope-400">correndo na Final {nextDuo.bracket}</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-rope-300 text-lg mt-2">—</p>
          )}
        </div>
      </div>

      {/* Tempo a bater — só na final, com uma dupla na fila */}
      {status === 'final' && currentDuo && (
        <TimeToBeatCard
          bracket={currentBracket ?? currentDuo.group}
          timeToBeat={timeToBeat}
          leaderLabel={leaderLabel}
          variant="hero"
        />
      )}

      {/* Última passada */}
      {lastResult && lastDuo && (
        <div className="rounded-xl bg-white border border-dust-300 p-4 sm:p-5">
          <p className="text-rope-400 text-xs uppercase tracking-widest mb-3">Última Passada</p>
          <div className="flex flex-wrap items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rope-800 text-base sm:text-lg line-clamp-2 overflow-hidden leading-snug">{lastDuo.label}</p>
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
