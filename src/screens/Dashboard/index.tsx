import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useSubscription } from '../../hooks/useSubscription';
import { STATUS_ROUTES, DEFAULT_FINALS_CUTOFF, competitionTab, COMPETITION_TAB_LABELS, CompetitionTab } from '../../core/constants';
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
  const [activeTab, setActiveTab] = useState<CompetitionTab>('open');
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newNumRounds, setNewNumRounds] = useState(1);
  const [newFinalsCutoff, setNewFinalsCutoff] = useState(DEFAULT_FINALS_CUTOFF);
  const [newEntryFee, setNewEntryFee] = useState('');
  const [newPixKey, setNewPixKey] = useState('');
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
      const feeValue = Math.max(0, Number(newEntryFee.replace(',', '.')) || 0);
      const c = await createCompetition(user.uid, newName.trim(), newLocation.trim(), newDate, newNumRounds, newFinalsCutoff, feeValue, newPixKey.trim());
      setCompetitions((prev) => [c, ...prev]);
      setCreateOpen(false);
      setNewName(''); setNewLocation(''); setNewDate(''); setNewNumRounds(1); setNewFinalsCutoff(DEFAULT_FINALS_CUTOFF); setNewEntryFee(''); setNewPixKey('');
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
    navigate(`/competition/${competition.id}/${STATUS_ROUTES[competition.status] ?? 'registration'}`);
  }

  async function handleShare(competition: Competition) {
    const url = `${window.location.origin}/competitor/provas/${competition.id}/participar`;
    try {
      if (navigator.share) {
        await navigator.share({ title: competition.name, text: 'Inscreva-se na prova', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast('Link de inscrição copiado!', 'success');
      }
    } catch {
      // Usuário cancelou o compartilhamento nativo — silencioso.
    }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portal')}
            className="text-saddle-200 hover:text-white hover:bg-saddle-700 hidden sm:inline-flex"
          >
            Meu Portal
          </Button>
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
          <>
            {/* Abas por estágio */}
            <div className="flex gap-1 mb-5 border-b border-dust-300 overflow-x-auto scrollbar-none">
              {(['open', 'ongoing', 'finished'] as CompetitionTab[]).map((t) => {
                const count = competitions.filter((c) => competitionTab(c.status) === t).length;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={[
                      'px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                      activeTab === t
                        ? 'border-saddle-600 text-saddle-700'
                        : 'border-transparent text-rope-400 hover:text-rope-700',
                    ].join(' ')}
                  >
                    {COMPETITION_TAB_LABELS[t]}
                    <span className="ml-1.5 text-xs text-rope-400">({count})</span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const filtered = [...competitions]
                .filter((c) => competitionTab(c.status) === activeTab)
                .sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
              if (filtered.length === 0) {
                return (
                  <EmptyState
                    icon="📭"
                    title={`Nenhuma prova ${COMPETITION_TAB_LABELS[activeTab].toLowerCase()}`}
                    description="Não há provas neste estágio no momento."
                  />
                );
              }
              return (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((c) => (
                    <CompetitionCard
                      key={c.id}
                      competition={c}
                      onOpen={() => handleOpen(c)}
                      onDelete={() => setDeleteTarget(c)}
                      onShare={() => handleShare(c)}
                    />
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setNewName(''); setNameError(''); setNewNumRounds(1); setNewFinalsCutoff(DEFAULT_FINALS_CUTOFF); setNewEntryFee(''); setNewPixKey(''); }}
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
          <div>
            <label className="text-sm font-medium text-rope-700 block mb-1">
              Número de passadas
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={newNumRounds}
              onChange={(e) => { const v = Number(e.target.value); setNewNumRounds(isNaN(v) ? 1 : Math.max(1, Math.min(50, v))); }}
              className="w-full px-3 py-2 rounded-lg border border-dust-300 hover:border-saddle-400 focus:outline-none focus:ring-2 focus:ring-hay-400 focus:border-hay-400 text-sm text-rope-800"
            />
            <p className="text-xs text-rope-400 mt-1">
              Aplicado a todos os competidores desta prova.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-rope-700 block mb-1">
              Duplas classificadas para a final (top X)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={newFinalsCutoff}
              onChange={(e) => { const v = Math.trunc(Number(e.target.value)); setNewFinalsCutoff(isNaN(v) ? DEFAULT_FINALS_CUTOFF : Math.max(1, Math.min(100, v))); }}
              className="w-full px-3 py-2 rounded-lg border border-dust-300 hover:border-saddle-400 focus:outline-none focus:ring-2 focus:ring-hay-400 focus:border-hay-400 text-sm text-rope-800"
            />
            <p className="text-xs text-rope-400 mt-1">
              Na final 1D entram as top {newFinalsCutoff} duplas gerais. Na final 2D entram as top {newFinalsCutoff} duplas da categoria 2D.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor da inscrição (R$)"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 150"
              value={newEntryFee}
              onChange={(e) => setNewEntryFee(e.target.value.replace(/[^0-9.,]/g, ''))}
            />
            <Input
              label="Chave PIX"
              type="text"
              placeholder="CPF, e-mail, telefone…"
              value={newPixKey}
              onChange={(e) => setNewPixKey(e.target.value)}
            />
          </div>
          <p className="text-xs text-rope-400 -mt-1">
            Valor e chave PIX ficam visíveis aos competidores na inscrição da prova.
          </p>
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
  onShare,
}: {
  competition: Competition;
  onOpen: () => void;
  onDelete: () => void;
  onShare: () => void;
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
      <div className="px-5 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl flex items-center justify-between gap-2">
        <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          Abrir
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="text-saddle-600 hover:bg-saddle-600/10"
            title="Compartilhar link de inscrição"
          >
            🔗 Compartilhar
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
      </div>
    </Card>
  );
}
