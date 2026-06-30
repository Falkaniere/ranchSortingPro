import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Competitor, RiderCategory } from 'core/models/Competidor';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { CategoryBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ConfirmModal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { CATEGORIES } from '../../core/constants';

interface CompetitorListProps {
  competitors: Competitor[];
  setCompetitors: (c: Competitor[]) => void;
  isFinished: boolean;
  competitionId: string | undefined;
  numRounds: number;
  canSort: boolean;
  isSorting: boolean;
  onSortDuos: () => void;
}

export function CompetitorList({
  competitors,
  setCompetitors,
  isFinished,
  competitionId,
  numRounds,
  canSort,
  isSorting,
  onSortDuos,
}: CompetitorListProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<RiderCategory>('Open'); // 'Open' = Profissional

  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);

  function startEdit(c: Competitor) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditCategory(c.category);
  }

  function saveEdit() {
    if (!editingId) return;
    if (!editName.trim()) { toast('O nome é obrigatório', 'error'); return; }
    setCompetitors(
      competitors.map((c) =>
        c.id === editingId ? { ...c, name: editName.trim(), category: editCategory } : c
      )
    );
    setEditingId(null);
    toast('Competidor atualizado!', 'success');
  }

  function confirmDelete(c: Competitor) {
    setDeleteTarget(c);
  }

  function doDelete() {
    if (!deleteTarget) return;
    setCompetitors(competitors.filter((c) => c.id !== deleteTarget.id));
    toast(`${deleteTarget.name} removido.`, 'info');
    setDeleteTarget(null);
  }

  return (
    <>
      <Card
        className={isFinished ? 'md:col-span-2 lg:col-span-5' : 'md:col-span-1 lg:col-span-3'}
        title={`Competidores (${competitors.length})`}
        noPadding
      >
        {competitors.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Nenhum competidor ainda"
            description="Adicione competidores usando o formulário ao lado."
          />
        ) : (
          <ul className="divide-y divide-dust-200">
            {competitors.map((c, index) => (
              <li key={c.id} className="px-4 py-3">
                {editingId === c.id && !isFinished ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-hay-400 focus:outline-none focus:ring-2 focus:ring-hay-400 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setEditCategory(cat.value)}
                          className={[
                            'flex-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                            editCategory === cat.value
                              ? 'bg-saddle-600 text-white border-saddle-700'
                              : 'bg-white text-rope-500 border-dust-300 hover:border-saddle-400',
                          ].join(' ')}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit}>Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-rope-400 text-xs w-5 text-right shrink-0">{index + 1}.</span>
                      <span className="font-medium text-rope-800 text-sm truncate">{c.name}</span>
                      <CategoryBadge category={c.category} />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!isFinished && <button
                        onClick={() => navigate(`/competition/${competitionId}/competitor/${c.id}/history`)}
                        className="p-1.5 rounded-md text-rope-400 hover:text-saddle-700 hover:bg-dust-100 transition-colors"
                        title="Histórico"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>}
                      {!isFinished && <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 rounded-md text-rope-400 hover:text-saddle-700 hover:bg-dust-100 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>}
                      {!isFinished && <button
                        onClick={() => confirmDelete(c)}
                        className="p-1.5 rounded-md text-rope-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                        title="Remover"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {canSort && !isFinished && (
          <div className="px-4 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl">
            <Button onClick={onSortDuos} loading={isSorting} fullWidth>
              Sortear Duplas ({competitors.length} competidores, {numRounds} passada{numRounds !== 1 ? 's' : ''})
            </Button>
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Remover competidor"
        message={`Tem certeza que deseja remover ${deleteTarget?.name}?`}
        confirmLabel="Remover"
      />
    </>
  );
}
