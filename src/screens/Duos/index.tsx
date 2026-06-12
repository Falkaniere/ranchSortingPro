import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useToast } from '../../components/ui/Toast';
import { useSubscription } from '../../hooks/useSubscription';
import { exportToExcel } from 'utils/exportExcel';
import { exportDuosToPng } from 'utils/exportPng';
import { importDuosFromExcel } from 'utils/importExcel';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GroupBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { UpgradeModal } from '../../components/ui/UpgradePrompt';
import { Competitor } from '../../core/models/Competidor';

export default function Duos() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isPro } = useSubscription();
  const { setDuosMeta } = useResults();
  const { competitors, duos, setDuos, setCompetitors: setCompetitorsCtx } = useCompetition();

  const setCompetitors: React.Dispatch<React.SetStateAction<typeof competitors>> = (value) => {
    const next = typeof value === 'function' ? value(competitors) : value;
    setCompetitorsCtx(next);
  };
  const fileRef = useRef<HTMLInputElement>(null);

  const [competitorPickerOpen, setCompetitorPickerOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [competitorSearch, setCompetitorSearch] = useState('');

  const duos1D = duos.filter((d) => d.group === '1D');
  const duos2D = duos.filter((d) => d.group === '2D');

  const filteredCompetitors = competitors.filter((c) =>
    c.name.toLowerCase().includes(competitorSearch.toLowerCase())
  );

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedDuos = await importDuosFromExcel(file, competitors, setCompetitors);
      setDuos(importedDuos);
      setDuosMeta(importedDuos);
      toast(`${importedDuos.length} duplas importadas!`, 'success');
      e.target.value = '';
    } catch {
      toast('Erro ao importar. Verifique o formato do arquivo.', 'error');
    }
  }

  function handleExportGeralExcel() {
    exportToExcel(
      duos.map((duo, idx) => {
        const a = competitors.find((c) => c.id === duo.riderOneId);
        const b = competitors.find((c) => c.id === duo.riderTwoId);
        return {
          'Nº Passada': duo.passNumber ?? idx + 1,
          Dupla: `${a?.name ?? '?'} & ${b?.name ?? '?'}`,
          Categoria: duo.group,
        };
      }),
      'Duplas_Sorteio'
    );
  }

  function handleExportGeralPng() {
    exportDuosToPng({
      title: 'Lista de Duplas',
      subtitle: `${duos.length} duplas · ${duos1D.length} na 1D · ${duos2D.length} na 2D`,
      rows: duos.map((duo, idx) => {
        const a = competitors.find((c) => c.id === duo.riderOneId);
        const b = competitors.find((c) => c.id === duo.riderTwoId);
        return {
          passNumber: duo.passNumber ?? idx + 1,
          label: `${a?.name ?? '?'} & ${b?.name ?? '?'}`,
          group: duo.group,
        };
      }),
      fileName: 'Duplas_Sorteio',
    });
  }

  function handleExportCompetidor(comp: Competitor) {
    const myDuos = duos.filter((d) => d.riderOneId === comp.id || d.riderTwoId === comp.id);
    const rows = myDuos.map((duo) => {
      const partner = competitors.find(
        (c) => c.id === (duo.riderOneId === comp.id ? duo.riderTwoId : duo.riderOneId)
      );
      return {
        'Nº Passada': duo.passNumber ?? 0,
        Dupla: duo.label ?? `${comp.name} & ${partner?.name ?? '?'}`,
        Categoria: duo.group,
      };
    });
    rows.sort((a, b) => a['Nº Passada'] - b['Nº Passada']);
    return rows;
  }

  function exportCompetidorExcel(comp: Competitor) {
    const rows = handleExportCompetidor(comp);
    exportToExcel(rows, `Duplas_${comp.name.replace(/\s+/g, '_')}`);
    setCompetitorPickerOpen(false);
    setCompetitorSearch('');
  }

  function exportCompetidorPng(comp: Competitor) {
    const myDuos = duos
      .filter((d) => d.riderOneId === comp.id || d.riderTwoId === comp.id)
      .sort((a, b) => (a.passNumber ?? 0) - (b.passNumber ?? 0));
    exportDuosToPng({
      title: comp.name,
      subtitle: `${myDuos.length} passada${myDuos.length !== 1 ? 's' : ''} no sorteio`,
      rows: myDuos.map((duo) => {
        const partner = competitors.find(
          (c) => c.id === (duo.riderOneId === comp.id ? duo.riderTwoId : duo.riderOneId)
        );
        return {
          passNumber: duo.passNumber ?? 0,
          label: `${comp.name} & ${partner?.name ?? '?'}`,
          group: duo.group,
        };
      }),
      fileName: `Duplas_${comp.name.replace(/\s+/g, '_')}`,
    });
    setCompetitorPickerOpen(false);
    setCompetitorSearch('');
  }

  function DuoList({ items }: { items: typeof duos }) {
    return (
      <ul className="divide-y divide-dust-200">
        {items.map((duo, i) => {
          const a = competitors.find((c) => c.id === duo.riderOneId);
          const b = competitors.find((c) => c.id === duo.riderTwoId);
          const passNum = duo.passNumber ?? i + 1;
          return (
            <li key={duo.id} className="px-4 py-3 flex items-center gap-3">
              <span className="text-rope-400 text-xs w-8 text-right shrink-0 font-mono">
                {passNum}.
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-rope-800 text-sm truncate block">
                  {a?.name ?? '?'} &amp; {b?.name ?? '?'}
                </span>
              </div>
              <GroupBadge group={duo.group} />
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div>
      <PageHeader
        title="Duplas"
        subtitle={`${duos.length} dupla${duos.length !== 1 ? 's' : ''} sorteada${duos.length !== 1 ? 's' : ''} · ${duos1D.length} na 1D · ${duos2D.length} na 2D`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportGeralExcel} disabled={duos.length === 0}>
              Planilha
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportGeralPng} disabled={duos.length === 0}>
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={isPro ? () => setCompetitorPickerOpen(true) : () => setUpgradeOpen(true)}
              disabled={duos.length === 0}
              title={isPro ? 'Exportar por competidor' : 'Disponível no plano Pro'}
            >
              Por Competidor {!isPro && '🔒'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Importar Excel
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        }
      />

      {duos.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="Nenhuma dupla sorteada"
          description="Volte para as inscrições e sorteie as duplas."
          action={
            <Button variant="outline" onClick={() => navigate(`/competition/${id}/registration`)}>
              ← Voltar para inscrições
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {duos1D.length > 0 && (
            <Card title={`Grupo 1D — Profissional (${duos1D.length} duplas)`} noPadding>
              <DuoList items={duos1D} />
            </Card>
          )}
          {duos2D.length > 0 && (
            <Card title={`Grupo 2D — Amador (${duos2D.length} duplas)`} noPadding>
              <DuoList items={duos2D} />
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => navigate(`/competition/${id}/record`)} size="lg">
              Iniciar Qualificatória →
            </Button>
          </div>
        </div>
      )}

      {/* Modal: selecionar competidor para exportar */}
      <Modal
        isOpen={competitorPickerOpen}
        onClose={() => { setCompetitorPickerOpen(false); setCompetitorSearch(''); }}
        title="Exportar por Competidor"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Buscar competidor..."
            value={competitorSearch}
            onChange={(e) => setCompetitorSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-dust-300 focus:outline-none focus:ring-2 focus:ring-hay-400 text-sm"
            autoFocus
          />
          {filteredCompetitors.length === 0 ? (
            <p className="text-center text-rope-400 py-4 text-sm">Nenhum competidor encontrado.</p>
          ) : (
            <ul className="divide-y divide-dust-200 border border-dust-200 rounded-lg max-h-72 overflow-y-auto">
              {filteredCompetitors.map((comp) => {
                const count = duos.filter((d) => d.riderOneId === comp.id || d.riderTwoId === comp.id).length;
                return (
                  <li key={comp.id} className="px-4 py-3 hover:bg-dust-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-rope-800 text-sm truncate">{comp.name}</p>
                        <p className="text-xs text-rope-400">{count} passada{count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => exportCompetidorExcel(comp)}
                          className="px-2.5 py-1 text-xs rounded-md border border-dust-300 text-rope-600 hover:border-saddle-400 hover:text-saddle-700 transition-colors"
                        >
                          Planilha
                        </button>
                        <button
                          type="button"
                          onClick={() => exportCompetidorPng(comp)}
                          className="px-2.5 py-1 text-xs rounded-md border border-dust-300 text-rope-600 hover:border-saddle-400 hover:text-saddle-700 transition-colors"
                        >
                          PNG
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex justify-end pt-1">
            <Button variant="ghost" onClick={() => { setCompetitorPickerOpen(false); setCompetitorSearch(''); }}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
