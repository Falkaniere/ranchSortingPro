import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useSubscription } from '../../hooks/useSubscription';
import { signOut } from '../../services/firebase/auth';
import {
  Competition,
  createCompetition,
  deleteCompetition,
  listCompetitions,
} from '../../services/firebase/competitions';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { UpgradeBadge, UpgradeModal } from '../../components/ui/UpgradePrompt';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isPro, limits } = useSubscription();
  const { loadCompetition } = useCompetition();
  const navigate = useNavigate();
  const toast = useToast();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    listCompetitions(user.uid)
      .then(setCompetitions)
      .catch(() => toast('Erro ao carregar competições.', 'error'))
      .finally(() => setIsLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!newName.trim()) { setNameError('Informe um nome'); return; }
    if (!user) return;
    setCreating(true);
    try {
      const c = await createCompetition(user.uid, newName.trim(), newLocation.trim(), newDate);
      setCompetitions((prev) => [c, ...prev]);
      setCreateOpen(false);
      setNewName(''); setNewLocation(''); setNewDate('');
      toast('Competição criada!', 'success');
      loadCompetition(c);
      navigate(`/competition/${c.id}/registration`);
    } catch {
      toast('Erro ao criar competição.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCompetition(deleteTarget.id);
      setCompetitions((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast('Competição excluída.', 'info');
      setDeleteTarget(null);
    } catch {
      toast('Erro ao excluir.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  function handleOpen(competition: Competition) {
    loadCompetition(competition);
    const routes: Record<string, string> = {
      draft: 'registration',
      qualifier: 'record',
      final: 'final',
      finished: 'final-results',
    };
    navigate(`/competition/${competition.id}/${routes[competition.status] ?? 'registration'}`);
  }

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  const statusOrder: Record<string, number> = {
    qualifier: 0, final: 1, draft: 2, finished: 3,
  };

  return (
    <div className="min-h-screen bg-dust-100">
      {/* Header */}
      <header className="bg-saddle-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤠</span>
          <span className="font-serif font-bold text-xl">Ranch Sorting Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-saddle-200 text-sm hidden sm:block">
            Olá, {user?.displayName ?? user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}
            className="text-saddle-200 hover:text-white hover:bg-saddle-700">
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif font-bold text-rope-800 text-2xl md:text-3xl">
              Minhas Competições
            </h1>
            <p className="text-rope-400 text-sm mt-1">
              {competitions.length} competição{competitions.length !== 1 ? 'ões' : ''} registrada{competitions.length !== 1 ? 's' : ''}
              {!isPro && (
                <span className="ml-2 text-xs text-hay-700 font-medium">· Plano Basic</span>
              )}
            </p>
          </div>
          {(() => {
            const activeCount = competitions.filter((c) => c.status !== 'finished').length;
            const atLimit = !isPro && limits.maxActiveCompetitions !== null && activeCount >= limits.maxActiveCompetitions;
            return (
              <div className="flex items-center gap-2">
                {atLimit && <UpgradeBadge />}
                <Button
                  onClick={atLimit ? () => setUpgradeOpen(true) : () => setCreateOpen(true)}
                  size="lg"
                  leftIcon={<span className="text-base">+</span>}
                  variant={atLimit ? 'outline' : 'primary'}
                >
                  Nova Competição
                </Button>
              </div>
            );
          })()}
        </div>
        <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : competitions.length === 0 ? (
          <EmptyState
            icon="🏟️"
            title="Nenhuma competição ainda"
            description="Crie sua primeira competição de Ranch Sorting para começar a registrar os resultados."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                Criar primeira competição
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...competitions].sort((a, b) =>
              (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
            ).map((c) => (
              <CompetitionCard
                key={c.id}
                competition={c}
                onOpen={() => handleOpen(c)}
                onDelete={() => setDeleteTarget(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setNewName(''); setNameError(''); }}
        title="Nova Competição"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              Criar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome da competição *"
            placeholder="Ex: 1º Ranch Sorting do Fazendão"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
            error={nameError}
            autoFocus
          />
          <Input
            label="Local"
            placeholder="Ex: Haras São João, Campinas - SP"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <Input
            label="Data do evento"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir competição"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}

function CompetitionCard({
  competition: c,
  onOpen,
  onDelete,
}: {
  competition: Competition;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const date = c.eventDate
    ? new Date(c.eventDate + 'T12:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <Card className="hover:border-saddle-400 transition-colors cursor-pointer group" noPadding>
      <div className="p-5" onClick={onOpen}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-serif font-semibold text-rope-800 text-base leading-tight group-hover:text-saddle-700 transition-colors">
            {c.name}
          </h3>
          <StatusBadge status={c.status} />
        </div>
        {c.location && (
          <p className="text-rope-400 text-xs flex items-center gap-1 mb-1">
            <span>📍</span> {c.location}
          </p>
        )}
        {date && (
          <p className="text-rope-400 text-xs flex items-center gap-1 mb-3">
            <span>📅</span> {date}
          </p>
        )}
        <div className="flex gap-3 text-xs text-rope-400">
          <span>👥 {c.competitors.length} competidores</span>
          <span>🤝 {c.duos.length} duplas</span>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl flex justify-between">
        <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          Abrir
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-brand-500 hover:bg-brand-500/10"
        >
          Excluir
        </Button>
      </div>
    </Card>
  );
}
