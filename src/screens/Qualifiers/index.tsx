import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useToast } from '../../components/ui/Toast';
import { useSubscription } from '../../hooks/useSubscription';
import { PassResult, DuoScore } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import { compareByScore } from 'core/logic/scoring';
import { exportToExcel } from 'utils/exportExcel';
import { exportResultsToPng } from 'utils/exportPng';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { UpgradeBadge, UpgradeModal } from '../../components/ui/UpgradePrompt';
import { QuickSelect } from '../../components/ui/QuickSelect';
import { Modal } from '../../components/ui/Modal';

type PartialRow = DuoScore & { duoLabel: string; isSAT?: boolean; calledCattle?: number };

export default function Qualifiers() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const toast = useToast();
  const { addQualifierResult, updateQualifierResult, results, duosMeta } = useResults();
  const { duos: compDuos, advanceStatus, competition } = useCompetition();
  const isFinished = competition?.status === 'finished';

  const [cattle, setCattle] = useState<number | null>(null);
  const [calledCattle, setCalledCattle] = useState<number | null>(null);
  const [timeSeconds, setTimeSeconds] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCattle, setEditCattle] = useState<number | null>(null);
  const [editCalledCattle, setEditCalledCattle] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('');

  const [selectDuoOpen, setSelectDuoOpen] = useState(false);
  const [overrideDuoId, setOverrideDuoId] = useState<string | null>(null);

  const metaDuos = duosMeta.length > 0 ? duosMeta : compDuos;
  const duos = metaDuos.map((d, index) => ({ ...d, number: d.passNumber ?? index + 1 }));

  const registeredDuoIds = new Set(
    results.filter((r: PassResult) => r.stage === 'Qualifier').map((r) => r.duoId)
  );

  const pendingDuos = duos.filter((d) => !registeredDuoIds.has(d.id));
  const currentDuo = overrideDuoId
    ? (pendingDuos.find((d) => d.id === overrideDuoId) ?? pendingDuos[0] ?? null)
    : (pendingDuos[0] ?? null);

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
        calledCattle: r.calledCattle,
      };
    })
    .sort((a, b) => compareByScore(a, b));

  // Separação para regra de ranking 2D
  const partials1D = partials.filter((p) => p.group === '1D');
  const partials2D = partials.filter((p) => p.group === '2D');
  const show2D = partials2D.length > 0;

  function validateForm() {
    if (cattle === null) {
      toast('Selecione a quantidade de bois.', 'error');
      return false;
    }
    const t = Number(timeSeconds);
    if (!timeSeconds || isNaN(t) || t <= 0) {
      setTimeError('Tempo inválido');
      return false;
    }
    setTimeError('');
    return true;
  }

  function saveQualifierResult(isSAT = false) {
    if (!currentDuo) return;
    if (!isSAT && !validateForm()) return;

    const c = isSAT ? 0 : cattle!;
    const t = isSAT ? 120 : Number(timeSeconds);

    addQualifierResult(currentDuo.id, c, t, isSAT, calledCattle ?? undefined);
    setCattle(null);
    setCalledCattle(null);
    setTimeSeconds('');
    setTimeError('');
    setOverrideDuoId(null);
    toast(isSAT ? `SAT registrado para ${currentDuo.label}` : 'Resultado salvo!', 'success');
  }

  function startEdit(row: PartialRow) {
    setEditingId(row.duoId);
    setEditCattle(row.cattleCount);
    setEditCalledCattle(row.calledCattle ?? null);
    setEditTime(row.timeSeconds.toString());
  }

  function saveEdit(duoId: string) {
    if (editCattle === null) { toast('Selecione a quantidade de bois', 'error'); return; }
    const t = Number(editTime);
    if (isNaN(t) || t <= 0) { toast('Tempo inválido', 'error'); return; }
    updateQualifierResult(duoId, editCattle, t, editCalledCattle ?? undefined);
    setEditingId(null);
    toast('Resultado atualizado!', 'success');
  }

  const allRegistered = pendingDuos.length === 0 && duos.length > 0;

  function formatTime(s: number, sat?: boolean) {
    return sat ? 'SAT' : `${s.toFixed(2)}s`;
  }

  const QUAL_COLUMNS = [
    { header: '#', width: 36, align: 'center' as const },
    { header: 'DUPLA', width: 200, align: 'left' as const },
    { header: 'GRP', width: 44, align: 'center' as const },
    { header: 'B.CANT', width: 56, align: 'center' as const },
    { header: 'BOIS', width: 44, align: 'center' as const },
    { header: 'TEMPO', width: 68, align: 'center' as const },
  ];

  function buildQualifierRows(rows: PartialRow[], startPos = 1) {
    return rows.map((p, idx) => ({
      cells: [
        String(startPos + idx),
        p.duoLabel,
        p.group,
        p.calledCattle != null ? String(p.calledCattle) : '—',
        String(p.cattleCount),
        formatTime(p.timeSeconds, p.isSAT),
      ],
      highlight: idx === 0,
      isSAT: p.isSAT,
    }));
  }

  function handleExportPng() {
    const rows1D = buildQualifierRows(partials1D);
    const rows2D = buildQualifierRows(partials2D);
    const combinedRows = [
      { cells: [`Ranking 1D — Profissional (${partials1D.length})`], isGroupHeader: true },
      ...rows1D,
      ...(show2D
        ? [
            { cells: [`Ranking 2D — Amador (${partials2D.length})`], isGroupHeader: true },
            ...rows2D,
          ]
        : []),
    ];
    exportResultsToPng({
      title: 'Classificatória — Parciais',
      subtitle: `${partials.length} passadas registradas`,
      columns: QUAL_COLUMNS,
      rows: combinedRows,
      fileName: 'Resultados_Qualificatorias',
    });
  }

  async function handleGoToFinal() {
    setIsAdvancing(true);
    try {
      await advanceStatus('final');
      navigate(`/competition/${id}/final`);
    } catch {
      toast('Erro ao avançar para a Final. Tente novamente.', 'error');
    } finally {
      setIsAdvancing(false);
    }
  }

  function RankingTable({ rows, title }: { rows: PartialRow[]; title: string }) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-rope-500 uppercase tracking-wide px-4 py-2 border-b border-dust-200 bg-dust-50">
          {title}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dust-50 border-b border-dust-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-rope-500">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-rope-500">Dupla</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-rope-500">B.Cant.</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-rope-500">Bois</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-rope-500">Tempo</th>
                {!isFinished && <th className="px-3 py-2 text-center text-xs font-semibold text-rope-500"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-dust-100">
              {rows.map((p, idx) => (
                <tr key={p.duoId} className="hover:bg-dust-50 transition-colors">
                  <td className="px-3 py-2 text-rope-400 text-xs">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-rope-800 text-xs max-w-[140px] truncate">{p.duoLabel}</td>
                  {editingId === p.duoId && !isFinished ? (
                    <>
                      <td className="px-2 py-1.5">
                        <input type="number" min={0} max={9} value={editCalledCattle ?? ''} onChange={(e) => setEditCalledCattle(e.target.value ? Number(e.target.value) : null)} className="w-14 px-2 py-1 border border-hay-400 rounded text-sm text-center focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min={0} max={10} value={editCattle ?? ''} onChange={(e) => setEditCattle(e.target.value ? Number(e.target.value) : null)} className="w-14 px-2 py-1 border border-hay-400 rounded text-sm text-center focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-20 px-2 py-1 border border-hay-400 rounded text-sm text-center focus:outline-none" />
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
                      <td className="px-3 py-2 text-center text-rope-500 text-xs">{p.calledCattle ?? '—'}</td>
                      <td className="px-3 py-2 text-center font-semibold text-rope-700">{p.cattleCount}</td>
                      <td className="px-3 py-2 text-center text-rope-600 text-xs">{formatTime(p.timeSeconds, p.isSAT)}</td>
                      {!isFinished && (
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => startEdit(p)} className="p-1.5 rounded text-rope-400 hover:text-saddle-600 hover:bg-dust-100 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Qualificatória"
        subtitle={`${registeredDuoIds.size} de ${duos.length} duplas registradas`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {!isPro && <UpgradeBadge />}
            <Button
              variant="outline"
              size="sm"
              onClick={
                isPro
                  ? () =>
                      exportToExcel(
                        partials.map((p, idx) => ({
                          '#': idx + 1,
                          Dupla: p.duoLabel,
                          Grupo: p.group,
                          'Boi Cantado': p.calledCattle ?? '',
                          Bois: p.cattleCount,
                          'Tempo (s)': p.timeSeconds,
                          SAT: p.isSAT ? 'Sim' : 'Não',
                        })),
                        'Resultados_Qualificatorias'
                      )
                  : () => setUpgradeOpen(true)
              }
              disabled={partials.length === 0}
            >
              Planilha
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={isPro ? handleExportPng : () => setUpgradeOpen(true)}
              disabled={partials.length === 0}
            >
              PNG
            </Button>
            <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
          </div>
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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {/* Entry form */}
          {!isFinished && <div className="md:col-span-1 lg:col-span-2 flex flex-col gap-4">
            {currentDuo ? (
              <Card title="Registrar resultado">
                <div className="mb-4 p-3 rounded-lg bg-hay-50 border border-hay-200">
                  <p className="text-xs text-hay-700 font-medium mb-0.5">Passada {currentDuo.number}</p>
                  <p className="text-rope-800 font-semibold text-sm">{currentDuo.label}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <GroupBadge group={currentDuo.group} size="sm" />
                    {pendingDuos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectDuoOpen(true)}
                        className="text-xs text-rope-400 hover:text-saddle-600 underline underline-offset-2 transition-colors"
                      >
                        Escolher outra dupla
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <QuickSelect
                    label="Boi Cantado"
                    value={calledCattle}
                    onChange={setCalledCattle}
                    min={0}
                    max={9}
                    cols={5}
                  />

                  <QuickSelect
                    label="Quantidade de Bois"
                    value={cattle}
                    onChange={setCattle}
                    min={0}
                    max={10}
                    cols={6}
                  />

                  <div>
                    <label className="text-sm font-medium text-rope-700 block mb-1">
                      Tempo (segundos)
                    </label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="45.5"
                      value={timeSeconds}
                      onChange={(e) => { setTimeSeconds(e.target.value); setTimeError(''); }}
                      className={[
                        'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-hay-400',
                        timeError ? 'border-brand-500' : 'border-dust-300',
                      ].join(' ')}
                    />
                    {timeError && <p className="text-xs text-brand-500 mt-0.5">{timeError}</p>}
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

            {pendingDuos.length > 0 && (
              <Card title={`Aguardando (${pendingDuos.length})`} noPadding>
                <ul className="divide-y divide-dust-200 max-h-64 overflow-y-auto">
                  {pendingDuos.map((duo) => (
                    <li key={duo.id} className="px-4 py-2.5 flex items-center gap-2">
                      <span className="text-rope-400 text-xs w-6 font-mono">{duo.number}.</span>
                      <span className="text-rope-700 text-sm flex-1 truncate">{duo.label}</span>
                      <GroupBadge group={duo.group} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {allRegistered && (
              <Button onClick={handleGoToFinal} loading={isAdvancing} size="lg" fullWidth>
                Ir para a Final →
              </Button>
            )}
          </div>}

          {/* Modal: seleção manual de dupla */}
          <Modal
            isOpen={selectDuoOpen}
            onClose={() => setSelectDuoOpen(false)}
            title="Escolher dupla"
            size="sm"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs text-rope-400 mb-2">Selecione uma dupla pendente para registrar agora.</p>
              <ul className="divide-y divide-dust-200 border border-dust-200 rounded-lg max-h-72 overflow-y-auto">
                {pendingDuos.map((duo) => (
                  <li key={duo.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOverrideDuoId(duo.id);
                        setCattle(null);
                        setCalledCattle(null);
                        setTimeSeconds('');
                        setTimeError('');
                        setSelectDuoOpen(false);
                      }}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dust-50 text-left transition-colors',
                        overrideDuoId === duo.id ? 'bg-hay-50' : '',
                      ].join(' ')}
                    >
                      <span className="text-rope-400 text-xs font-mono w-6 shrink-0">{duo.number}.</span>
                      <span className="flex-1 text-sm text-rope-800 truncate">{duo.label}</span>
                      <GroupBadge group={duo.group} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Modal>

          {/* Results table */}
          <Card className={isFinished ? 'md:col-span-2 lg:col-span-5' : 'md:col-span-1 lg:col-span-3'} title={`Parciais (${partials.length})`} noPadding>
            {partials.length === 0 ? (
              <EmptyState icon="📋" title="Sem resultados ainda" />
            ) : (
              <div>
                <RankingTable rows={partials1D} title={`Ranking 1D — Profissional (${partials1D.length})`} />

                {show2D && (
                  <RankingTable rows={partials2D} title={`Ranking 2D — Amador (${partials2D.length})`} />
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
