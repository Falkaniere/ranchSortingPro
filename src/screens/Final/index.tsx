import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useToast } from '../../components/ui/Toast';
import { PassResult } from 'core/models/PassResult';
import { Duo, DuoGroup } from 'core/models/Duo';
import { exportToExcel } from 'utils/exportExcel';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';

type PendingEntry = {
  duoId: string;
  label: string;
  group: DuoGroup;
  cattleCount: number;
  timeSeconds: number;
};

export default function Finals() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { getFinalists, getBestQualifierScores, addFinalResult, finalResults, duosMeta } = useResults();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const finalists = useMemo(() => getFinalists(), [finalResults]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bestScores = useMemo(() => getBestQualifierScores(), [finalResults]);

  const [forms, setForms] = useState({
    '1D': { cattleCount: '', timeSeconds: '' },
    '2D': { cattleCount: '', timeSeconds: '' },
  });
  const [activeTab, setActiveTab] = useState<'1D' | '2D'>('1D');
  const [formErrors, setFormErrors] = useState<{ cattle?: string; time?: string }>({});

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
    const base = category === '1D'
      ? toPendingEntries(finalists.finalists1D)
      : toPendingEntries(finalists.finalists2D);
    return base.filter((entry) => !finalResults.some((r: PassResult) => r.duoId === entry.duoId && r.stage === 'Final'));
  }

  const pending1D = getPendingList('1D');
  const pending2D = getPendingList('2D');
  const pendingActive = activeTab === '1D' ? pending1D : pending2D;
  const currentDuo = pendingActive[pendingActive.length - 1] ?? null;
  const currentForm = forms[activeTab];

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
          avgCattle: (quali.cattleCount + r.cattleCount) / 2,
          avgTime: (quali.timeSeconds + r.timeSeconds) / 2,
        };
      })
      .filter(Boolean);
  }, [finalResults, bestScores, duosMeta, finalists]);

  function validateForm() {
    const e: typeof formErrors = {};
    const cattle = Number(currentForm.cattleCount);
    const time = Number(currentForm.timeSeconds);
    if (currentForm.cattleCount === '' || isNaN(cattle) || cattle < 0 || cattle > 10) e.cattle = 'Bois: 0 a 10';
    if (currentForm.timeSeconds === '' || isNaN(time) || time <= 0) e.time = 'Tempo inválido';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function saveFinalResult(isSAT = false) {
    if (!currentDuo) return;
    if (!isSAT && !validateForm()) return;
    const cattle = isSAT ? 0 : Number(currentForm.cattleCount);
    const time = isSAT ? 120 : Number(currentForm.timeSeconds);
    addFinalResult(currentDuo.duoId, cattle, time, isSAT);
    setForms({ ...forms, [activeTab]: { cattleCount: '', timeSeconds: '' } });
    setFormErrors({});
    toast(isSAT ? `SAT registrado!` : `Resultado salvo!`, 'success');
  }

  function handleTabChange(tab: '1D' | '2D') {
    setActiveTab(tab);
    setForms({ ...forms, [tab]: { cattleCount: '', timeSeconds: '' } });
    setFormErrors({});
  }

  function formatTime(s: number) {
    return s >= 120 ? 'SAT' : `${s.toFixed(2)}s`;
  }

  const partialsFiltered = partials.filter((p) => p?.group === activeTab);

  return (
    <div>
      <PageHeader
        title="Final"
        subtitle={`${finalists.finalists1D.length} finalistas 1D · ${finalists.finalists2D.length} finalistas 2D`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToExcel(
                partialsFiltered.map((p, idx) => ({
                  '#': idx + 1,
                  Dupla: p?.label,
                  Grupo: p?.group,
                  'Bois Qualif.': p?.qualiCattle,
                  'Tempo Qualif.': p?.qualiTime?.toFixed(2),
                  'Bois Final': p?.finalCattle,
                  'Tempo Final': p?.finalTime?.toFixed(2),
                  'Média Bois': p?.avgCattle?.toFixed(1),
                  'Média Tempo': p?.avgTime?.toFixed(2),
                })),
                `Resultados_Finais_${activeTab}`
              );
            }}
            disabled={partialsFiltered.length === 0}
          >
            Exportar {activeTab}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-0 mb-5 bg-white rounded-xl border border-dust-300 p-1 w-fit">
        {(['1D', '2D'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={[
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab
                ? 'bg-saddle-600 text-white shadow-sm'
                : 'text-rope-500 hover:text-rope-800',
            ].join(' ')}
          >
            Categoria {tab}
            <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab ? 'bg-saddle-500 text-white' : 'bg-dust-200 text-rope-400'}`}>
              {tab === '1D' ? finalists.finalists1D.length : finalists.finalists2D.length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Entry form */}
        <div className="lg:col-span-2 flex flex-col gap-4">
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

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm font-medium text-rope-700 block mb-1">Bois (0–10)</label>
                  <input
                    type="number" min={0} max={10} placeholder="0"
                    value={currentForm.cattleCount}
                    onChange={(e) => { setForms({ ...forms, [activeTab]: { ...currentForm, cattleCount: e.target.value } }); setFormErrors({}); }}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-hay-400 ${formErrors.cattle ? 'border-brand-500' : 'border-dust-300'}`}
                  />
                  {formErrors.cattle && <p className="text-xs text-brand-500 mt-0.5">{formErrors.cattle}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-rope-700 block mb-1">Tempo (segundos)</label>
                  <input
                    type="number" min={0.01} step={0.01} placeholder="45.5"
                    value={currentForm.timeSeconds}
                    onChange={(e) => { setForms({ ...forms, [activeTab]: { ...currentForm, timeSeconds: e.target.value } }); setFormErrors({}); }}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-hay-400 ${formErrors.time ? 'border-brand-500' : 'border-dust-300'}`}
                  />
                  {formErrors.time && <p className="text-xs text-brand-500 mt-0.5">{formErrors.time}</p>}
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
                <p className="font-semibold text-pasture-700">
                  Categoria {activeTab} completa!
                </p>
                {activeTab === '1D' && pending2D.length > 0 && (
                  <Button className="mt-3" size="sm" onClick={() => handleTabChange('2D')}>
                    Ir para 2D →
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

          {pending1D.length === 0 && pending2D.length === 0 && (
            <Button onClick={() => navigate(`/competition/${id}/final-results`)} size="lg" fullWidth>
              Ver Resultados Finais →
            </Button>
          )}
        </div>

        {/* Results table */}
        <Card className="lg:col-span-3" title={`Parciais ${activeTab} (${partialsFiltered.length})`} noPadding>
          {partialsFiltered.length === 0 ? (
            <EmptyState icon="🏆" title="Sem resultados ainda" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dust-50 border-b border-dust-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Dupla</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Q.B</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Q.T</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">F.B</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">F.T</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Méd.B</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Méd.T</th>
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
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs">{p?.qualiCattle}</td>
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs">{formatTime(p?.qualiTime ?? 0)}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-rope-800 text-xs">{p?.finalCattle}</td>
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs">{formatTime(p?.finalTime ?? 0)}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-saddle-700 text-xs">{p?.avgCattle?.toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center text-rope-600 text-xs">{p?.avgTime?.toFixed(2)}s</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="px-4 py-2 bg-dust-50 border-t border-dust-200 text-xs text-rope-400">
                Q.B = Bois Qualif. · Q.T = Tempo Qualif. · F.B = Bois Final · F.T = Tempo Final
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
