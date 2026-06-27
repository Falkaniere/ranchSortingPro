import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useToast } from '../../components/ui/Toast';
import { useSubscription } from '../../hooks/useSubscription';
import { PassResult } from 'core/models/PassResult';
import { Duo, DuoGroup } from 'core/models/Duo';
import { exportToExcel } from 'utils/exportExcel';
import { exportResultsToPng } from 'utils/exportPng';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { UpgradeBadge, UpgradeModal } from '../../components/ui/UpgradePrompt';
import { QuickSelect } from '../../components/ui/QuickSelect';

type PendingEntry = {
  duoId: string;
  label: string;
  group: DuoGroup;
  cattleCount: number;
  timeSeconds: number;
};

type FormState = { cattle: number | null; calledCattle: number | null; time: string };
const emptyForm = (): FormState => ({ cattle: null, calledCattle: null, time: '' });

export default function Finals() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isPro } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { getFinalists, getBestQualifierScores, addFinalResult, finalResults, duosMeta } = useResults();
  const { competition } = useCompetition();
  const isFinished = competition?.status === 'finished';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const finalists = useMemo(() => getFinalists(), [finalResults]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bestScores = useMemo(() => getBestQualifierScores(), [finalResults]);

  // Default: 2D vai primeiro
  const [activeTab, setActiveTab] = useState<'1D' | '2D'>('2D');
  const [forms, setForms] = useState<Record<'1D' | '2D', FormState>>({ '1D': emptyForm(), '2D': emptyForm() });
  const [timeError, setTimeError] = useState('');

  function toPendingEntries(entries: Array<{ duoId: string; cattleCount: number; timeSeconds: number }>): PendingEntry[] {
    return entries.map((e) => {
      const duo = duosMeta.find((d: Duo) => d.id === e.duoId);
      return {
        duoId: e.duoId,
        label: duo?.label ?? e.duoId,
        group: duo?.group ?? '1D',
        cattleCount: e.cattleCount,
        timeSeconds: e.timeSeconds,
      };
    });
  }

  function getPendingList(category: '1D' | '2D'): PendingEntry[] {
    const sorted = category === '1D'
      ? [...finalists.finalists1D].reverse()
      : [...finalists.finalists2D].reverse();
    return toPendingEntries(sorted).filter(
      (entry) => !finalResults.some((r: PassResult) => r.duoId === entry.duoId && r.stage === 'Final')
    );
  }

  const pending1D = getPendingList('1D');
  const pending2D = getPendingList('2D');
  const pendingActive = activeTab === '1D' ? pending1D : pending2D;
  const currentDuo = pendingActive[0] ?? null;
  const currentForm = forms[activeTab];
  const is2DComplete = pending2D.length === 0 && finalists.finalists2D.length > 0;

  const partials = useMemo(() => {
    return finalResults
      .filter((r) => r.stage === 'Final')
      .map((r: PassResult) => {
        const duo = duosMeta.find((d: Duo) => d.id === r.duoId);
        const quali = bestScores.get(r.duoId);
        if (!duo || !quali) return null;
        return {
          duoId: r.duoId,
          label: duo.label,
          group: duo.group,
          qualiCattle: quali.cattleCount,
          qualiTime: quali.timeSeconds,
          finalCattle: r.cattleCount,
          finalTime: r.timeSeconds,
          calledCattle: r.calledCattle,
          avgCattle: (quali.cattleCount + r.cattleCount) / 2,
          avgTime: (quali.timeSeconds + r.timeSeconds) / 2,
        };
      })
      .filter(Boolean);
  }, [finalResults, bestScores, duosMeta]); // eslint-disable-line react-hooks/exhaustive-deps

  function validateForm() {
    if (currentForm.cattle === null) {
      toast('Selecione a quantidade de bois.', 'error');
      return false;
    }
    const t = Number(currentForm.time);
    if (!currentForm.time || isNaN(t) || t <= 0) {
      setTimeError('Tempo inválido');
      return false;
    }
    setTimeError('');
    return true;
  }

  function saveFinalResult(isSAT = false) {
    if (!currentDuo) return;
    if (!isSAT && !validateForm()) return;
    const c = isSAT ? 0 : currentForm.cattle!;
    const t = isSAT ? 120 : Number(currentForm.time);
    addFinalResult(currentDuo.duoId, c, t, isSAT, currentForm.calledCattle ?? undefined);
    setForms({ ...forms, [activeTab]: emptyForm() });
    setTimeError('');
    toast(isSAT ? 'SAT registrado!' : 'Resultado salvo!', 'success');
  }

  function handleTabChange(tab: '1D' | '2D') {
    setActiveTab(tab);
    setForms({ ...forms, [tab]: emptyForm() });
    setTimeError('');
  }

  function setFormField(field: keyof FormState, value: any) {
    setForms({ ...forms, [activeTab]: { ...currentForm, [field]: value } });
    if (field === 'time') setTimeError('');
  }

  function formatTime(s: number) {
    return s >= 120 ? 'SAT' : `${s.toFixed(2)}s`;
  }

  const partialsFiltered = partials.filter((p) => p?.group === activeTab);

  const FINAL_COLUMNS = [
    { header: '#', width: 36, align: 'center' as const },
    { header: 'DUPLA', width: 170, align: 'left' as const },
    { header: 'GRP', width: 44, align: 'center' as const },
    { header: 'B.C', width: 44, align: 'center' as const },
    { header: 'Q.BOIS', width: 52, align: 'center' as const },
    { header: 'Q.TEMPO', width: 64, align: 'center' as const },
    { header: 'F.BOIS', width: 52, align: 'center' as const },
    { header: 'F.TEMPO', width: 64, align: 'center' as const },
    { header: 'MÉD.B', width: 52, align: 'center' as const },
    { header: 'MÉD.T', width: 64, align: 'center' as const },
  ];

  function handleExportFinalPng() {
    const sorted = [...partialsFiltered].sort(
      (a, b) => (b?.avgCattle ?? 0) - (a?.avgCattle ?? 0) || (a?.avgTime ?? 0) - (b?.avgTime ?? 0)
    );
    const rows = sorted.map((p, idx) => ({
      cells: [
        idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : String(idx + 1),
        p?.label ?? '',
        p?.group ?? '',
        p?.calledCattle != null ? String(p.calledCattle) : '—',
        String(p?.qualiCattle ?? ''),
        formatTime(p?.qualiTime ?? 0),
        String(p?.finalCattle ?? ''),
        formatTime(p?.finalTime ?? 0),
        (p?.avgCattle ?? 0).toFixed(1),
        formatTime(p?.avgTime ?? 0),
      ],
      highlight: idx < 3,
      isSAT: (p?.finalTime ?? 0) >= 120,
    }));
    exportResultsToPng({
      title: `Final ${activeTab} — Parciais`,
      subtitle: `${partialsFiltered.length} duplas · ${activeTab === '1D' ? 'Profissional' : 'Amador'}`,
      columns: FINAL_COLUMNS,
      rows,
      fileName: `Resultados_Final_${activeTab}`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Final"
        subtitle={`${finalists.finalists1D.length} finalistas 1D · ${finalists.finalists2D.length} finalistas 2D`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {!isPro && <UpgradeBadge />}
            <Button
              variant="outline"
              size="sm"
              onClick={
                isPro
                  ? () => {
                      exportToExcel(
                        partialsFiltered.map((p, idx) => ({
                          '#': idx + 1,
                          Dupla: p?.label,
                          Grupo: p?.group,
                          'Boi Cantado': p?.calledCattle ?? '',
                          'Bois Qualif.': p?.qualiCattle,
                          'Tempo Qualif.': p?.qualiTime?.toFixed(2),
                          'Bois Final': p?.finalCattle,
                          'Tempo Final': p?.finalTime?.toFixed(2),
                          'Média Bois': p?.avgCattle?.toFixed(1),
                          'Média Tempo': p?.avgTime?.toFixed(2),
                        })),
                        `Resultados_Finais_${activeTab}`
                      );
                    }
                  : () => setUpgradeOpen(true)
              }
              disabled={partialsFiltered.length === 0}
            >
              Planilha {activeTab}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={isPro ? handleExportFinalPng : () => setUpgradeOpen(true)}
              disabled={partialsFiltered.length === 0}
            >
              PNG {activeTab}
            </Button>
            <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
          </div>
        }
      />

      {/* Tabs — 2D primeiro, 1D bloqueada até 2D encerrar */}
      <div className="flex gap-0 mb-5 bg-white rounded-xl border border-dust-300 p-1 w-fit">
        {(['2D', '1D'] as const).map((tab) => {
          const isBlocked = tab === '1D' && !is2DComplete && finalists.finalists2D.length > 0;
          return (
            <button
              key={tab}
              onClick={() => !isBlocked && handleTabChange(tab)}
              disabled={isBlocked}
              title={isBlocked ? 'Aguarde o encerramento da categoria 2D' : undefined}
              className={[
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                activeTab === tab
                  ? 'bg-saddle-600 text-white shadow-sm'
                  : isBlocked
                  ? 'text-rope-300 cursor-not-allowed'
                  : 'text-rope-500 hover:text-rope-800',
              ].join(' ')}
            >
              Categoria {tab}
              <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab ? 'bg-saddle-500 text-white' : 'bg-dust-200 text-rope-400'}`}>
                {tab === '1D' ? finalists.finalists1D.length : finalists.finalists2D.length}
              </span>
              {isBlocked && <span className="ml-1 text-xs">🔒</span>}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {/* Entry form */}
        {!isFinished && <div className="md:col-span-1 lg:col-span-2 flex flex-col gap-4">
          {currentDuo ? (
            <Card title={`Registrar resultado — ${activeTab}`}>
              <div className="mb-4 p-3 rounded-lg bg-hay-50 border border-hay-200">
                <p className="text-xs text-hay-700 font-medium mb-0.5">Dupla atual</p>
                <p className="text-rope-800 font-semibold text-sm">{currentDuo.label}</p>
                <div className="flex gap-2 mt-1">
                  <GroupBadge group={currentDuo.group} />
                  <span className="text-xs text-rope-400">
                    Qualif.: {currentDuo.cattleCount} bois / {formatTime(currentDuo.timeSeconds)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <QuickSelect
                  label="Boi Cantado"
                  value={currentForm.calledCattle}
                  onChange={(v) => setFormField('calledCattle', v)}
                  min={0}
                  max={9}
                  cols={5}
                />

                <QuickSelect
                  label="Quantidade de Bois"
                  value={currentForm.cattle}
                  onChange={(v) => setFormField('cattle', v)}
                  min={0}
                  max={10}
                  cols={6}
                />

                <div>
                  <label className="text-sm font-medium text-rope-700 block mb-1">Tempo (segundos)</label>
                  <input
                    type="number" min={0.01} step={0.01} placeholder="45.5"
                    value={currentForm.time}
                    onChange={(e) => setFormField('time', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-hay-400 ${timeError ? 'border-brand-500' : 'border-dust-300'}`}
                  />
                  {timeError && <p className="text-xs text-brand-500 mt-0.5">{timeError}</p>}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveFinalResult(false)} fullWidth>Salvar</Button>
                  <Button onClick={() => saveFinalResult(true)} variant="danger" title="SAT">SAT</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-4">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-semibold text-pasture-700">Categoria {activeTab} completa!</p>
                {activeTab === '2D' && pending1D.length > 0 && (
                  <Button className="mt-3" size="sm" onClick={() => handleTabChange('1D')}>
                    Ir para 1D →
                  </Button>
                )}
              </div>
            </Card>
          )}

          {pendingActive.length > 0 && (
            <Card title={`Aguardando — ${activeTab} (${pendingActive.length})`} noPadding>
              <ul className="divide-y divide-dust-200 max-h-64 overflow-y-auto">
                {pendingActive.map((entry, i) => (
                  <li key={entry.duoId} className="px-4 py-2.5 flex items-center gap-2">
                    <span className="text-rope-400 text-xs w-5">{i + 1}.</span>
                    <span className="text-rope-700 text-sm flex-1 truncate">{entry.label}</span>
                    <span className="text-xs text-rope-400">{entry.cattleCount}b / {formatTime(entry.timeSeconds)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {pending1D.length === 0 && pending2D.length === 0 && finalists.finalists1D.length > 0 && (
            <Button onClick={() => navigate(`/competition/${id}/final-results`)} size="lg" fullWidth>
              Ver Resultados Finais →
            </Button>
          )}
        </div>}

        {/* Results table */}
        <Card className={isFinished ? 'md:col-span-2 lg:col-span-5' : 'md:col-span-1 lg:col-span-3'} title={`Parciais ${activeTab} (${partialsFiltered.length})`} noPadding>
          {partialsFiltered.length === 0 ? (
            <EmptyState icon="🏆" title="Sem resultados ainda" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dust-50 border-b border-dust-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase">Dupla</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase">B.C</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase hidden sm:table-cell">Q.B</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase hidden sm:table-cell">Q.T</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase">F.B</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase">F.T</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase hidden sm:table-cell">Méd.B</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase hidden sm:table-cell">Méd.T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dust-100">
                  {partialsFiltered
                    .sort((a, b) => {
                      if (!a || !b) return 0;
                      return b.avgCattle - a.avgCattle || a.avgTime - b.avgTime;
                    })
                    .map((p, idx) => (
                      <tr key={p?.duoId} className={idx === 0 ? 'bg-hay-50' : 'hover:bg-dust-50 transition-colors'}>
                        <td className="px-3 py-2.5 text-rope-400 text-xs font-semibold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-rope-800 text-xs max-w-[120px] truncate">{p?.label}</td>
                        <td className="px-3 py-2.5 text-center text-rope-500 text-xs">{p?.calledCattle ?? '—'}</td>
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs hidden sm:table-cell">{p?.qualiCattle}</td>
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs hidden sm:table-cell">{formatTime(p?.qualiTime ?? 0)}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-rope-800 text-xs">{p?.finalCattle}</td>
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs">{formatTime(p?.finalTime ?? 0)}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-saddle-700 text-xs hidden sm:table-cell">{p?.avgCattle?.toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs hidden sm:table-cell">{p?.avgTime?.toFixed(2)}s</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="px-4 py-2 bg-dust-50 border-t border-dust-200 text-xs text-rope-400">
                B.C = Boi Cantado · Q.B = Bois Qualif. · F.B = Bois Final · F.T = Tempo Final
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
