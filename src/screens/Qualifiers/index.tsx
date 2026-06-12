import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useToast } from '../../components/ui/Toast';
import { PassResult, DuoScore } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import { compareByScore } from 'core/logic/scoring';
import { exportToExcel } from 'utils/exportExcel';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';

type PartialRow = DuoScore & { duoLabel: string; isSAT?: boolean };

export default function Qualifiers() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { addQualifierResult, updateQualifierResult, results, duosMeta } = useResults();
  const { duos: compDuos } = useCompetition();

  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });
  const [formErrors, setFormErrors] = useState<{ cattle?: string; time?: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ cattleCount: '', timeSeconds: '' });

  const metaDuos = duosMeta.length > 0 ? duosMeta : compDuos;
  const duos = metaDuos.map((d, index) => ({ ...d, number: index + 1 }));

  const registeredDuoIds = new Set(
    results.filter((r: PassResult) => r.stage === 'Qualifier').map((r) => r.duoId)
  );

  const pendingDuos = duos.filter((d) => !registeredDuoIds.has(d.id));
  const currentDuo = pendingDuos[0] ?? null;

  const partials: PartialRow[] = results
    .filter((r: PassResult) => r.stage === 'Qualifier')
    .map((r) => {
      const duo = duos.find((d) => d.id === r.duoId);
      return {
        duoId: r.duoId,
        duoLabel: duo?.label ?? r.duoId,
        group: (duo?.group ?? '1D') as DuoGroup,
        cattleCount: r.cattleCount,
        timeSeconds: r.timeSeconds,
        isSAT: r.isSAT,
      };
    })
    .sort((a, b) => compareByScore(a, b));

  function validateForm() {
    const e: typeof formErrors = {};
    const cattle = Number(form.cattleCount);
    const time = Number(form.timeSeconds);
    if (form.cattleCount === '' || isNaN(cattle) || cattle < 0 || cattle > 10) {
      e.cattle = 'Bois: 0 a 10';
    }
    if (form.timeSeconds === '' || isNaN(time) || time <= 0) {
      e.time = 'Tempo inválido';
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function saveQualifierResult(isSAT = false) {
    if (!currentDuo) return;
    if (!isSAT && !validateForm()) return;

    const cattle = isSAT ? 0 : Number(form.cattleCount);
    const time = isSAT ? 120 : Number(form.timeSeconds);

    addQualifierResult(currentDuo.id, cattle, time, isSAT);
    setForm({ cattleCount: '', timeSeconds: '' });
    setFormErrors({});
    toast(isSAT ? `SAT registrado para ${currentDuo.label}` : `Resultado salvo!`, 'success');
  }

  function startEdit(row: PartialRow & { isSAT?: boolean }) {
    setEditingId(row.duoId);
    setEditForm({
      cattleCount: row.cattleCount.toString(),
      timeSeconds: row.timeSeconds.toString(),
    });
  }

  function saveEdit(duoId: string) {
    const cattle = Number(editForm.cattleCount);
    const time = Number(editForm.timeSeconds);
    if (isNaN(cattle) || cattle < 0 || cattle > 10) {
      toast('Bois inválido (0–10)', 'error');
      return;
    }
    if (isNaN(time) || time <= 0) {
      toast('Tempo inválido', 'error');
      return;
    }
    updateQualifierResult(duoId, cattle, time);
    setEditingId(null);
    toast('Resultado atualizado!', 'success');
  }

  const allRegistered = pendingDuos.length === 0 && duos.length > 0;

  function formatTime(s: number) {
    if (s >= 120) return 'SAT';
    return `${s.toFixed(2)}s`;
  }

  return (
    <div>
      <PageHeader
        title="Qualificatória"
        subtitle={`${registeredDuoIds.size} de ${duos.length} duplas registradas`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToExcel(
                partials.map((p, idx) => ({
                  '#': idx + 1,
                  Dupla: p.duoLabel,
                  Grupo: p.group,
                  Bois: p.cattleCount,
                  'Tempo (s)': p.timeSeconds,
                  SAT: p.isSAT ? 'Sim' : 'Não',
                })),
                'Resultados_Qualificatorias'
              )
            }
            disabled={partials.length === 0}
          >
            Exportar Excel
          </Button>
        }
      />

      {duos.length === 0 ? (
        <EmptyState
          icon="🐄"
          title="Nenhuma dupla cadastrada"
          description="Volte para sortear as duplas antes de registrar resultados."
          action={
            <Button variant="outline" onClick={() => navigate(`/competition/${id}/duos`)}>
              ← Ir para duplas
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Entry form */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {currentDuo ? (
              <Card title="Registrar resultado">
                <div className="mb-4 p-3 rounded-lg bg-hay-50 border border-hay-200">
                  <p className="text-xs text-hay-700 font-medium mb-0.5">Dupla atual</p>
                  <p className="text-rope-800 font-semibold text-sm">
                    {currentDuo.number}. {currentDuo.label}
                  </p>
                  <GroupBadge group={currentDuo.group} size="sm" />
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-medium text-rope-700 block mb-1">
                      Bois (0–10)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      placeholder="0"
                      value={form.cattleCount}
                      onChange={(e) => { setForm({ ...form, cattleCount: e.target.value }); setFormErrors({}); }}
                      className={[
                        'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-hay-400',
                        formErrors.cattle ? 'border-brand-500' : 'border-dust-300',
                      ].join(' ')}
                    />
                    {formErrors.cattle && <p className="text-xs text-brand-500 mt-0.5">{formErrors.cattle}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-rope-700 block mb-1">
                      Tempo (segundos)
                    </label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="45.5"
                      value={form.timeSeconds}
                      onChange={(e) => { setForm({ ...form, timeSeconds: e.target.value }); setFormErrors({}); }}
                      className={[
                        'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-hay-400',
                        formErrors.time ? 'border-brand-500' : 'border-dust-300',
                      ].join(' ')}
                    />
                    {formErrors.time && <p className="text-xs text-brand-500 mt-0.5">{formErrors.time}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveQualifierResult(false)} fullWidth>
                      Salvar
                    </Button>
                    <Button
                      onClick={() => saveQualifierResult(true)}
                      variant="danger"
                      title="Sem Aproveitamento Técnico"
                    >
                      SAT
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-semibold text-pasture-700">Todas as duplas registradas!</p>
                </div>
              </Card>
            )}

            {/* Pending */}
            {pendingDuos.length > 0 && (
              <Card title={`Aguardando (${pendingDuos.length})`} noPadding>
                <ul className="divide-y divide-dust-200 max-h-64 overflow-y-auto">
                  {pendingDuos.map((duo) => (
                    <li key={duo.id} className="px-4 py-2.5 flex items-center gap-2">
                      <span className="text-rope-400 text-xs w-5">{duo.number}.</span>
                      <span className="text-rope-700 text-sm flex-1 truncate">{duo.label}</span>
                      <GroupBadge group={duo.group} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {allRegistered && (
              <Button onClick={() => navigate(`/competition/${id}/final`)} size="lg" fullWidth>
                Ir para a Final →
              </Button>
            )}
          </div>

          {/* Results table */}
          <Card className="lg:col-span-3" title={`Parciais (${partials.length})`} noPadding>
            {partials.length === 0 ? (
              <EmptyState icon="📋" title="Sem resultados ainda" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dust-50 border-b border-dust-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Dupla</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Grp</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Bois</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide">Tempo</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-rope-500 uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dust-100">
                    {partials.map((p, idx) => (
                      <tr key={p.duoId} className="hover:bg-dust-50 transition-colors">
                        <td className="px-4 py-2.5 text-rope-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-rope-800 max-w-[160px] truncate">{p.duoLabel}</td>
                        <td className="px-4 py-2.5 text-center"><GroupBadge group={p.group} /></td>

                        {editingId === p.duoId ? (
                          <>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                value={editForm.cattleCount}
                                onChange={(e) => setEditForm({ ...editForm, cattleCount: e.target.value })}
                                className="w-16 px-2 py-1 border border-hay-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-hay-400 text-center"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                value={editForm.timeSeconds}
                                onChange={(e) => setEditForm({ ...editForm, timeSeconds: e.target.value })}
                                className="w-20 px-2 py-1 border border-hay-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-hay-400 text-center"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-1">
                                <button onClick={() => saveEdit(p.duoId)} className="px-2 py-1 bg-pasture-600 text-white text-xs rounded hover:bg-pasture-700">✓</button>
                                <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-dust-300 text-rope-600 text-xs rounded hover:bg-dust-400">✕</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2.5 text-center font-semibold text-rope-700">{p.cattleCount}</td>
                            <td className="px-4 py-2.5 text-center text-rope-600">{formatTime(p.timeSeconds)}</td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => startEdit(p as any)}
                                className="p-1.5 rounded text-rope-400 hover:text-saddle-600 hover:bg-dust-100 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
