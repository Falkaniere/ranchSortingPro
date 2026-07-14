import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompetition } from '../../context/CompetitionContext';
import { DuoRegistration } from '../../core/models/DuoRegistration';
import {
  listRegistrationsByCompetition,
  confirmDuoRegistration,
  rejectDuoRegistration,
} from '../../services/firebase/duoRegistrations';
import { getCompetitionFromServer } from '../../services/firebase/competitions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { CategoryBadge, GroupBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export default function PendingDuos() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { loadCompetition } = useCompetition();
  const toast = useToast();

  const [pending, setPending] = useState<DuoRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    listRegistrationsByCompetition(id)
      .then((regs) => setPending(regs.filter((r) => r.status === 'pending')))
      .catch(() => toast('Erro ao carregar inscrições.', 'error'))
      .finally(() => setIsLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recarrega a prova no contexto para refletir os competidores/duplas recém-adicionados.
  async function refreshCompetition() {
    if (!id) return;
    try {
      const fresh = await getCompetitionFromServer(id);
      if (fresh) loadCompetition(fresh);
    } catch {
      // Best-effort — a próxima navegação recarrega do servidor.
    }
  }

  async function handleConfirm(reg: DuoRegistration) {
    if (!user) return;
    setActioningId(reg.id);
    try {
      await confirmDuoRegistration(reg.id, user.uid);
      setPending((prev) => prev.filter((r) => r.id !== reg.id));
      await refreshCompetition();
      toast('Dupla confirmada e liberada para competir!', 'success');
    } catch (err: any) {
      toast(err?.message ?? 'Erro ao confirmar dupla.', 'error');
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(reg: DuoRegistration) {
    setActioningId(reg.id);
    try {
      await rejectDuoRegistration(reg.id);
      setPending((prev) => prev.filter((r) => r.id !== reg.id));
      toast('Inscrição recusada.', 'info');
    } catch {
      toast('Erro ao recusar inscrição.', 'error');
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Duplas pendentes"
        subtitle={`${pending.length} inscrição${pending.length !== 1 ? 'ões' : ''} aguardando confirmação`}
      />

      <div className="mb-5 p-3 rounded-lg bg-hay-50 border border-hay-200 text-xs text-hay-800">
        Verifique o pagamento (PIX) de cada dupla antes de confirmar. Ao confirmar, a dupla é
        adicionada à prova e liberada para competir — siga direto para a Qualificatória sem
        re-sortear as duplas.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : pending.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Nenhuma dupla pendente"
          description="Inscrições feitas pelos competidores aparecerão aqui para você confirmar."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((reg) => (
            <Card key={reg.id} noPadding>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-rope-400">Dupla inscrita</span>
                  <GroupBadge group={reg.group} />
                </div>
                <div className="flex flex-col gap-2">
                  <RiderRow name={reg.competitorOne.name} category={reg.competitorOne.category} />
                  <RiderRow name={reg.competitorTwo.name} category={reg.competitorTwo.category} />
                </div>
              </div>
              <div className="px-5 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl flex gap-2">
                <Button
                  size="sm"
                  fullWidth
                  loading={actioningId === reg.id}
                  onClick={() => handleConfirm(reg)}
                >
                  Confirmar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={actioningId === reg.id}
                  onClick={() => handleReject(reg)}
                  className="text-brand-500 hover:bg-brand-500/10"
                >
                  Recusar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RiderRow({ name, category }: { name: string; category: DuoRegistration['competitorOne']['category'] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-rope-700 font-medium truncate">{name}</span>
      <CategoryBadge category={category} />
    </div>
  );
}
