import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  DuoRegistration,
  RegistrationRider,
} from '../../core/models/DuoRegistration';
import { Competitor } from '../../core/models/Competidor';
import {
  Duo,
  canPair,
  computeDuoGroup,
  duoKeyFromRiders,
  isDoublePrincipiante,
} from '../../core/models/Duo';
import { normalizeName } from '../../utils/nameNormalization';
import { timestampToISO, timestampToISOOrUndefined } from './firestoreHelpers';

const COLLECTION = 'duoRegistrations';

function toRegistration(id: string, data: any): DuoRegistration {
  return {
    id,
    competitionId: data.competitionId,
    createdBy: data.createdBy,
    competitorOne: data.competitorOne,
    competitorTwo: data.competitorTwo,
    // Sempre derivado das categorias — nunca confiar no `group` gravado (pode
    // estar inconsistente se o doc foi criado por um cliente adulterado).
    group: computeDuoGroup(
      data.competitorOne?.category ?? 'Aberta',
      data.competitorTwo?.category ?? 'Aberta'
    ),
    status: data.status ?? 'pending',
    createdAt: timestampToISO(data.createdAt),
    confirmedAt: timestampToISOOrUndefined(data.confirmedAt),
    confirmedBy: data.confirmedBy ?? undefined,
  };
}

export async function createDuoRegistration(
  competitionId: string,
  createdBy: string,
  competitorOne: RegistrationRider,
  competitorTwo: RegistrationRider
): Promise<DuoRegistration> {
  // Evita inscrições duplicadas do mesmo usuário na mesma prova (double-submit,
  // múltiplas abas/dispositivos). Uma inscrição recusada pode ser refeita.
  const existing = await getUserRegistration(createdBy, competitionId);
  if (existing && existing.status !== 'rejected') {
    throw new Error('Você já tem uma inscrição nesta prova.');
  }

  // Defesa em profundidade (espelha a validação da tela Participar): não criar
  // inscrições que a confirmação depois recusaria e que ficariam presas.
  if (!canPair(competitorOne.category, competitorTwo.category)) {
    throw new Error('Combinação de categorias inválida para esta dupla.');
  }
  if (normalizeName(competitorOne.name) === normalizeName(competitorTwo.name)) {
    throw new Error('O parceiro deve ser diferente de você.');
  }

  const group = computeDuoGroup(competitorOne.category, competitorTwo.category);
  const payload = {
    competitionId,
    createdBy,
    competitorOne,
    competitorTwo,
    group,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return toRegistration(ref.id, { ...payload, createdAt: new Date().toISOString() });
}

/** Inscrições de uma prova — visão do gerente (aba "Duplas pendentes"). */
export async function listRegistrationsByCompetition(
  competitionId: string
): Promise<DuoRegistration[]> {
  const q = query(
    collection(db, COLLECTION),
    where('competitionId', '==', competitionId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toRegistration(d.id, d.data()))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Inscrições feitas pelo usuário logado — visão do competidor (aba "Inscrito"). */
export async function listRegistrationsByUser(
  userId: string
): Promise<DuoRegistration[]> {
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toRegistration(d.id, d.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Inscrição do usuário numa prova específica (para evitar duplicidade). */
export async function getUserRegistration(
  userId: string,
  competitionId: string
): Promise<DuoRegistration | null> {
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', userId),
    where('competitionId', '==', competitionId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const regs = snap.docs.map((d) => toRegistration(d.id, d.data()));
  // Havendo duplicatas (double-submit em abas/dispositivos), retorna a mais
  // relevante — confirmed > pending > rejected — para o guard de duplicidade
  // não liberar nova inscrição por causa de um doc recusado.
  const priority: Record<string, number> = { confirmed: 0, pending: 1, rejected: 2 };
  regs.sort((a, b) => (priority[a.status] ?? 3) - (priority[b.status] ?? 3));
  return regs[0];
}

// Reutiliza um competidor existente na prova (por nome normalizado) ou cria um novo.
function resolveCompetitorId(
  existing: Competitor[],
  rider: RegistrationRider,
  numRounds: number
): { competitor: Competitor; isNew: boolean } {
  const normalized = normalizeName(rider.name);
  // Casa por nome E categoria: um mesmo nome com categoria diferente é tratado
  // como outra entrada, para não descartar silenciosamente a categoria inscrita
  // (o que mudaria o grupo 1D/2D da dupla).
  const match = existing.find(
    (c) => normalizeName(c.name) === normalized && c.category === rider.category
  );
  if (match) return { competitor: match, isNew: false };
  return {
    competitor: {
      id: crypto.randomUUID(),
      name: rider.name.trim(),
      category: rider.category,
      passes: numRounds,
    },
    isNew: true,
  };
}

/**
 * Confirma uma inscrição: injeta os dois competidores em competitors[] e cria
 * a dupla em duos[] da prova, e marca a inscrição como 'confirmed'.
 * Feito numa transação para manter prova e inscrição consistentes.
 */
export async function confirmDuoRegistration(
  registrationId: string,
  confirmedBy: string
): Promise<void> {
  const regRef = doc(db, COLLECTION, registrationId);

  await runTransaction(db, async (tx) => {
    const regSnap = await tx.get(regRef);
    if (!regSnap.exists()) throw new Error('Inscrição não encontrada.');
    const reg = regSnap.data();
    if (reg.status === 'confirmed') return; // idempotente
    if (reg.status !== 'pending') {
      // Ex.: 'rejected' — não pode ser confirmada, para não deixar o estado ambíguo.
      throw new Error('Só é possível confirmar inscrições pendentes.');
    }
    // Valida o shape antes de usar (protege contra docs legados/adulterados que
    // fariam resolveCompetitorId quebrar ao acessar .name).
    const r1 = reg.competitorOne;
    const r2 = reg.competitorTwo;
    if (
      !r1 || !r2 ||
      typeof r1.name !== 'string' || !r1.name.trim() || !r1.category ||
      typeof r2.name !== 'string' || !r2.name.trim() || !r2.category
    ) {
      throw new Error('Inscrição com dados incompletos. Não é possível confirmar.');
    }
    // Defesa contra docs adulterados: nunca injetar uma dupla com combinação
    // inválida de categorias (ex.: Aberta+Aberta), mesmo que a UI já valide.
    if (!canPair(r1.category, r2.category)) {
      throw new Error('Combinação de categorias inválida para esta dupla.');
    }

    const compRef = doc(db, 'competitions', reg.competitionId);
    const compSnap = await tx.get(compRef);
    if (!compSnap.exists()) throw new Error('Prova não encontrada.');
    const comp = compSnap.data();

    const numRounds = comp.numRounds ?? 1;
    const competitors: Competitor[] = [...(comp.competitors ?? [])];

    const one = resolveCompetitorId(competitors, reg.competitorOne, numRounds);
    if (one.isNew) competitors.push(one.competitor);
    const two = resolveCompetitorId(competitors, reg.competitorTwo, numRounds);
    // Nomes que normalizam igual resolveriam para o mesmo competidor, gerando uma
    // dupla inválida (riderOneId === riderTwoId). Bloqueia a confirmação nesse caso.
    if (one.competitor.id === two.competitor.id) {
      throw new Error('Os dois competidores da dupla não podem ser a mesma pessoa.');
    }
    if (two.isNew) competitors.push(two.competitor);

    const duos: Duo[] = [...(comp.duos ?? [])];
    const duoId = duoKeyFromRiders(one.competitor.id, two.competitor.id);
    if (!duos.some((d) => d.id === duoId)) {
      const group = computeDuoGroup(one.competitor.category, two.competitor.category);
      duos.push({
        id: duoId,
        riderOneId: one.competitor.id,
        riderTwoId: two.competitor.id,
        group,
        doublePrincipiante: isDoublePrincipiante(
          one.competitor.category,
          two.competitor.category
        ),
        label: `${one.competitor.name} & ${two.competitor.name}`,
      });
    }

    tx.update(compRef, { competitors, duos, updatedAt: serverTimestamp() });
    tx.update(regRef, {
      status: 'confirmed',
      confirmedAt: serverTimestamp(),
      confirmedBy,
    });
  });
}

export async function rejectDuoRegistration(registrationId: string): Promise<void> {
  const regRef = doc(db, COLLECTION, registrationId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(regRef);
    if (!snap.exists()) return;
    // Só inscrições pendentes podem ser recusadas. Uma dupla já confirmada foi
    // injetada em competitors[]/duos[] — recusá-la deixaria a prova inconsistente.
    // Recusas repetidas são no-op (idempotente).
    if (snap.data().status !== 'pending') return;
    tx.update(regRef, { status: 'rejected' });
  });
}
