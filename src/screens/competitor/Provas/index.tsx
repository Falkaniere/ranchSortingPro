import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { signOut } from '../../../services/firebase/auth';
import {
  Competition,
  listOpenCompetitions,
  getCompetitionsByIds,
} from '../../../services/firebase/competitions';
import {
  DuoRegistration,
} from '../../../core/models/DuoRegistration';
import { listRegistrationsByUser } from '../../../services/firebase/duoRegistrations';
import { REGISTRATION_STATUS_LABELS } from '../../../core/constants';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';

type Tab = 'available' | 'registered';

function formatFee(fee?: number): string | null {
  if (!fee || fee <= 0) return null;
  return fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(eventDate?: string): string | null {
  if (!eventDate) return null;
  return new Date(eventDate + 'T12:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function CompetitorProvas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('available');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [registrations, setRegistrations] = useState<DuoRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);

    // Queries desacopladas: uma falhar (ex.: regras de duoRegistrations ainda não
    // publicadas) não pode zerar a outra. As provas disponíveis carregam sempre.
    const openP = listOpenCompetitions().catch(() => {
      toast('Erro ao carregar provas disponíveis.', 'error');
      return [] as Competition[];
    });
    const regsP = listRegistrationsByUser(user.uid).catch(() => [] as DuoRegistration[]);

    Promise.all([openP, regsP])
      .then(async ([open, regs]) => {
        if (cancelled) return;
        setRegistrations(regs);
        // Provas de inscrições que já saíram do "draft" (em andamento/finalizadas)
        // não vêm em listOpenCompetitions — busca-as para exibir nome/data no card.
        const known = new Set(open.map((c) => c.id));
        const missingIds = Array.from(
          new Set(regs.map((r) => r.competitionId).filter((cid) => !known.has(cid)))
        );
        const extra = missingIds.length
          ? await getCompetitionsByIds(missingIds).catch(() => [] as Competition[])
          : [];
        if (!cancelled) setCompetitions([...open, ...extra]);
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Provas em que o usuário já se inscreveu (não mostrar em "Disponíveis").
  const registeredIds = useMemo(
    () => new Set(registrations.map((r) => r.competitionId)),
    [registrations]
  );
  const available = useMemo(
    () => competitions.filter((c) => !registeredIds.has(c.id)),
    [competitions, registeredIds]
  );

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-dust-100 flex flex-col">
      {/* Header */}
      <header className="bg-saddle-800 text-white px-4 py-4 flex items-center justify-between shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐴</span>
          <div>
            <h1 className="font-serif font-bold text-base leading-tight">Provas</h1>
            <p className="text-saddle-300 text-xs">{user?.displayName ?? user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-saddle-200 hover:text-white hover:bg-saddle-700"
        >
          Sair
        </Button>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-dust-300">
        <div className="max-w-xl mx-auto flex">
          {([
            { key: 'available', label: 'Disponíveis', count: available.length },
            { key: 'registered', label: 'Inscrito', count: registrations.length },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-saddle-600 text-saddle-700'
                  : 'border-transparent text-rope-400 hover:text-rope-700',
              ].join(' ')}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 text-xs text-rope-400">({t.count})</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : tab === 'available' ? (
          available.length === 0 ? (
            <EmptyState
              icon="🏟️"
              title="Nenhuma prova disponível"
              description="Não há provas abertas para inscrição no momento. Volte mais tarde."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {available.map((c) => (
                <AvailableCard
                  key={c.id}
                  competition={c}
                  onParticipate={() => navigate(`/competitor/provas/${c.id}/participar`)}
                />
              ))}
            </div>
          )
        ) : registrations.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nenhuma inscrição"
            description="Suas inscrições aparecerão aqui. Escolha uma prova disponível para participar."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {registrations.map((r) => {
              const comp = competitions.find((c) => c.id === r.competitionId);
              return <RegistrationCard key={r.id} registration={r} competition={comp} />;
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AvailableCard({
  competition: c,
  onParticipate,
}: {
  competition: Competition;
  onParticipate: () => void;
}) {
  const fee = formatFee(c.entryFee);
  const date = formatDate(c.eventDate);
  return (
    <Card noPadding>
      <div className="p-5">
        <h3 className="font-serif font-semibold text-rope-800 text-base leading-tight mb-1">
          {c.name}
        </h3>
        {c.location && <p className="text-rope-400 text-xs mb-0.5">📍 {c.location}</p>}
        {date && <p className="text-rope-400 text-xs mb-0.5">📅 {date}</p>}
        {fee && <p className="text-saddle-700 text-sm font-medium mt-2">💰 {fee}</p>}
      </div>
      <div className="px-5 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl">
        <Button onClick={onParticipate} fullWidth size="lg">
          Participar
        </Button>
      </div>
    </Card>
  );
}

const REG_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-hay-100 text-hay-800 border border-hay-300',
  confirmed: 'bg-pasture-100 text-pasture-800 border border-pasture-400',
  rejected: 'bg-brand-500/10 text-brand-600 border border-brand-500/30',
};

function RegistrationCard({
  registration: r,
  competition: c,
}: {
  registration: DuoRegistration;
  competition?: Competition;
}) {
  const date = formatDate(c?.eventDate);
  return (
    <Card noPadding>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-serif font-semibold text-rope-800 text-base leading-tight">
            {c?.name ?? 'Prova'}
          </h3>
          <span
            className={[
              'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
              REG_STATUS_STYLE[r.status] ?? 'bg-dust-200 text-rope-500',
            ].join(' ')}
          >
            {REGISTRATION_STATUS_LABELS[r.status] ?? r.status}
          </span>
        </div>
        {date && <p className="text-rope-400 text-xs mb-2">📅 {date}</p>}
        <div className="text-sm text-rope-600">
          <p>🤝 {r.competitorOne.name} & {r.competitorTwo.name}</p>
          <p className="text-xs text-rope-400 mt-0.5">Grupo {r.group}</p>
        </div>
      </div>
    </Card>
  );
}
