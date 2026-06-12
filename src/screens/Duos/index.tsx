import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useToast } from '../../components/ui/Toast';
import { exportToExcel } from 'utils/exportExcel';
import { importDuosFromExcel } from 'utils/importExcel';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GroupBadge, CategoryBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';

export default function Duos() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { setDuosMeta } = useResults();
  const { competitors, duos, setDuos, setCompetitors: setCompetitorsCtx } = useCompetition();

  // importDuosFromExcel expects a React dispatch; wrap our setter
  const setCompetitors: React.Dispatch<React.SetStateAction<typeof competitors>> = (
    value
  ) => {
    const next = typeof value === 'function' ? value(competitors) : value;
    setCompetitorsCtx(next);
  };
  const fileRef = useRef<HTMLInputElement>(null);

  const duos1D = duos.filter((d) => d.group === '1D');
  const duos2D = duos.filter((d) => d.group === '2D');

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

  function handleExport() {
    exportToExcel(
      duos.map((duo) => {
        const a = competitors.find((c) => c.id === duo.riderOneId);
        const b = competitors.find((c) => c.id === duo.riderTwoId);
        return {
          Dupla: `${a?.name ?? '?'} 🤝 ${b?.name ?? '?'}`,
          Grupo: duo.group,
          Categoria_A: a?.category ?? '',
          Categoria_B: b?.category ?? '',
        };
      }),
      'Duplas_Cadastradas'
    );
  }

  function DuoList({ items }: { items: typeof duos }) {
    return (
      <ul className="divide-y divide-dust-200">
        {items.map((duo, i) => {
          const a = competitors.find((c) => c.id === duo.riderOneId);
          const b = competitors.find((c) => c.id === duo.riderTwoId);
          return (
            <li key={duo.id} className="px-5 py-3 flex items-center gap-3">
              <span className="text-rope-400 text-xs w-6 text-right shrink-0">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-rope-800 text-sm">{a?.name ?? '?'}</span>
                  {a && <CategoryBadge category={a.category} />}
                  <span className="text-rope-400 text-sm">🤝</span>
                  <span className="font-medium text-rope-800 text-sm">{b?.name ?? '?'}</span>
                  {b && <CategoryBadge category={b.category} />}
                </div>
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={duos.length === 0}>
              Exportar Excel
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
            <Card title={`Grupo 1D — Aberta (${duos1D.length} duplas)`} noPadding>
              <DuoList items={duos1D} />
            </Card>
          )}
          {duos2D.length > 0 && (
            <Card title={`Grupo 2D — Demais categorias (${duos2D.length} duplas)`} noPadding>
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
    </div>
  );
}
