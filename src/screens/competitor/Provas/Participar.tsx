import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Competition,
  getCompetition,
} from '../../../services/firebase/competitions';
import {
  createDuoRegistration,
  getUserRegistration,
} from '../../../services/firebase/duoRegistrations';
import { RiderCategory } from '../../../core/models/Competidor';
import { canPair, computeDuoGroup } from '../../../core/models/Duo';
import { CATEGORIES, REGISTRATION_STATUS_LABELS } from '../../../core/constants';
import { normalizeName } from '../../../utils/nameNormalization';
import { DuoRegistration } from '../../../core/models/DuoRegistration';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../components/ui/Toast';

function CategoryPicker({
  value,
  onChange,
}: {
  value: RiderCategory;
  onChange: (c: RiderCategory) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(cat.value)}
          aria-pressed={value === cat.value}
          title={cat.hint}
          className={[
            'px-3 py-2 rounded-lg text-sm font-medium border transition-all text-center',
            value === cat.value
              ? 'bg-saddle-600 text-white border-saddle-700 shadow-sm'
              : 'bg-white text-rope-600 border-dust-300 hover:border-saddle-400',
          ].join(' ')}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export default function CompetitorParticipar() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [existing, setExisting] = useState<DuoRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cat1, setCat1] = useState<RiderCategory>('Aberta');
  const [name2, setName2] = useState('');
  const [cat2, setCat2] = useState<RiderCategory>('Principiante');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const name1 = user?.displayName ?? user?.email ?? '';

  useEffect(() => {
    if (!competitionId || !user) return;
    setIsLoading(true);
    Promise.all([
      getCompetition(competitionId).catch(() => {
        toast('Erro ao carregar a prova.', 'error');
        return null;
      }),
      // Falha aqui (ex.: regras ainda não publicadas) não deve travar o formulário.
      getUserRegistration(user.uid, competitionId).catch(() => null),
    ])
      .then(([comp, reg]) => {
        setCompetition(comp);
        setExisting(reg);
      })
      .finally(() => setIsLoading(false));
  }, [competitionId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name1.trim()) e.name1 = 'Seu nome não está disponível. Atualize seu perfil.';
    if (!name2.trim()) e.name2 = 'Informe o nome do parceiro';
    else if (name1.trim() && normalizeName(name2) === normalizeName(name1)) {
      e.name2 = 'O parceiro deve ser diferente de você.';
    }
    if (!canPair(cat1, cat2)) {
      e.pair = 'Dupla Aberta + Aberta não é permitida. Ajuste uma das categorias.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !competitionId || !user) return;
    setSubmitting(true);
    try {
      await createDuoRegistration(
        competitionId,
        user.uid,
        { name: name1.trim(), category: cat1 },
        { name: name2.trim(), category: cat2 }
      );
      setDone(true);
    } catch (err: any) {
      toast(err?.message ?? 'Erro ao enviar inscrição. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPix() {
    if (!competition?.pixKey) return;
    try {
      await navigator.clipboard.writeText(competition.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Não foi possível copiar. Copie manualmente.', 'warning');
    }
  }

  const fee = competition?.entryFee && competition.entryFee > 0
    ? competition.entryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <div className="min-h-screen bg-dust-100 flex flex-col">
      <header className="bg-saddle-800 text-white px-4 py-4 flex items-center gap-3 shadow-md">
        <button
          onClick={() => navigate('/competitor/provas')}
          className="text-saddle-300 hover:text-white transition-colors p-1"
          aria-label="Voltar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-serif font-bold text-base leading-tight">Participar da prova</h1>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !competition ? (
          <Card>
            <p className="text-rope-500 text-sm text-center py-4">
              Prova não encontrada ou não está mais disponível.
            </p>
          </Card>
        ) : done || (existing && existing.status !== 'rejected') ? (
          // Inscrição recusada NÃO bloqueia: mostra o formulário para reenviar.
          <ConfirmationState
            competitionName={competition.name}
            status={done ? 'pending' : (existing?.status ?? 'pending')}
            onBack={() => navigate('/competitor/provas')}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif font-bold text-rope-800 text-xl">{competition.name}</h2>
              {competition.location && (
                <p className="text-rope-400 text-sm">📍 {competition.location}</p>
              )}
            </div>

            {/* Competidor 1 (usuário logado) */}
            <Card title="Competidor 1 (você)">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-rope-700 mb-1">Nome</p>
                  <div className="px-3 py-2 rounded-lg border border-dust-300 bg-dust-50 text-rope-700 text-sm">
                    {name1 || '—'}
                  </div>
                  {errors.name1 && <p className="text-brand-500 text-xs mt-1">{errors.name1}</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-rope-700 mb-2">Categoria</p>
                  <CategoryPicker value={cat1} onChange={setCat1} />
                </div>
              </div>
            </Card>

            {/* Competidor 2 (parceiro) */}
            <Card title="Competidor 2 (parceiro)">
              <div className="flex flex-col gap-3">
                <Input
                  label="Nome do parceiro"
                  placeholder="Ex: Maria Souza"
                  value={name2}
                  maxLength={100}
                  onChange={(e) => { setName2(e.target.value); setErrors((p) => ({ ...p, name2: '' })); }}
                  error={errors.name2}
                />
                <div>
                  <p className="text-sm font-medium text-rope-700 mb-2">Categoria</p>
                  <CategoryPicker value={cat2} onChange={setCat2} />
                </div>
              </div>
            </Card>

            {errors.pair && (
              <p className="text-brand-500 text-sm text-center">{errors.pair}</p>
            )}
            {!errors.pair && canPair(cat1, cat2) && (
              <p className="text-rope-400 text-xs text-center">
                Esta dupla será classificada no grupo <strong>{computeDuoGroup(cat1, cat2)}</strong>.
              </p>
            )}

            {/* Pagamento PIX */}
            {(fee || competition.pixKey) && (
              <Card title="Pagamento (PIX)">
                <div className="flex flex-col gap-3">
                  {fee && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-rope-500">Valor da inscrição</span>
                      <span className="text-lg font-bold text-saddle-700">{fee}</span>
                    </div>
                  )}
                  {competition.pixKey && (
                    <div>
                      <p className="text-sm font-medium text-rope-700 mb-1">Chave PIX</p>
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 rounded-lg border border-dust-300 bg-dust-50 text-rope-700 text-sm break-all">
                          {competition.pixKey}
                        </div>
                        <Button variant="outline" size="sm" onClick={copyPix}>
                          {copied ? '✓ Copiado' : 'Copiar'}
                        </Button>
                      </div>
                      <p className="text-xs text-rope-400 mt-2">
                        Após o pagamento, o organizador confirmará sua dupla manualmente.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Button onClick={handleSubmit} loading={submitting} size="lg" fullWidth>
              Confirmar inscrição
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function ConfirmationState({
  competitionName,
  status,
  onBack,
}: {
  competitionName: string;
  status: string;
  onBack: () => void;
}) {
  const isConfirmed = status === 'confirmed';
  return (
    <div className="text-center py-10">
      <div className="text-6xl mb-4">{isConfirmed ? '✅' : '⏳'}</div>
      <h2 className="font-serif font-bold text-rope-800 text-2xl mb-2">
        {isConfirmed ? 'Dupla confirmada!' : 'Aguardando confirmação'}
      </h2>
      <p className="text-rope-500 mb-1">{competitionName}</p>
      <p className="text-rope-400 text-sm max-w-sm mx-auto mb-8">
        {isConfirmed
          ? 'Sua dupla foi confirmada e está liberada para competir.'
          : 'Sua inscrição foi enviada. Assim que o organizador verificar o pagamento, sua dupla será confirmada.'}
      </p>
      <span className={[
        'inline-block text-sm px-4 py-2 rounded-full font-medium mb-8',
        isConfirmed
          ? 'bg-pasture-100 text-pasture-800 border border-pasture-400'
          : 'bg-hay-100 text-hay-800 border border-hay-300',
      ].join(' ')}>
        {REGISTRATION_STATUS_LABELS[status] ?? status}
      </span>
      <div>
        <Button variant="outline" onClick={onBack}>
          Voltar às provas
        </Button>
      </div>
    </div>
  );
}
