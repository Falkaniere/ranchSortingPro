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
import { Competitor, normalizeCategory } from '../../core/models/Competidor';
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
  // Mitigação (não garantia) contra inscrições duplicadas do mesmo usuário na
  // mesma prova. É um read-then-write NÃO atômico: submissões concorrentes
  // (duas abas/dispositivos) ainda podem criar 2 docs — nesse caso raro o gerente
  // resolve rejeitando a inscrição extra. Uma inscrição recusada pode ser refeita.
  const existing = await getUserRegistration(createdBy, competitionId);
  if (existing && existing.status !== 'rejected') {
    throw new Error('Você já tem uma inscrição nesta prova.');
  }

  // Normaliza (trim) e valida nome antes de gravar, para não criar docs que a
  // confirmação depois recusaria (nomes em branco/longos demais).
  const one: RegistrationRider = { name: competitorOne.name.trim(), category: competitorOne.category };
  const two: RegistrationRider = { name: competitorTwo.name.trim(), category: competitorTwo.category };
  if (!one.name || !two.name) {
    throw new Error('Informe o nome dos dois competidores.');
  }
  if (one.name.length > 100 || two.name.length > 100) {
    throw new Error('Nome do competidor muito longo (máximo 100 caracteres).');
  }
  // Defesa em profundidade (espelha a validação da tela Participar): não criar
  // inscrições que a confirmação depois recusaria e que ficariam presas.
  if (!canPair(one.category, two.category)) {
    throw new Error('Combinação de categorias inválida para esta dupla.');
  }
  if (normalizeName(one.name) === normalizeName(two.name)) {
    throw new Error('O parceiro deve ser diferente de você.');
  }

  const group = computeDuoGroup(one.category, two.category);
  const payload = {
    competitionId,
    createdBy,
    competitorOne: one,
    competitorTwo: two,
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
    // Normaliza categorias (docs legados podem ter "Amador", "Amador 19" etc.) —
    // garante dedupe correto de competidores e grupo 1D/2D coerente.
    const rider1: RegistrationRider = { name: r1.name.trim(), category: normalizeCategory(r1.category) };
    const rider2: RegistrationRider = { name: r2.name.trim(), category: normalizeCategory(r2.category) };
    // Defesa contra docs adulterados: nunca injetar uma dupla com combinação
    // inválida de categorias (ex.: Aberta+Aberta), mesmo que a UI já valide.
    if (!canPair(rider1.category, rider2.category)) {
      throw new Error('Combinação de categorias inválida para esta dupla.');
    }
    // Doc legado/adulterado sem competitionId geraria um erro de path pouco claro
    // ao montar a referência — devolve um erro de domínio claro antes disso.
    if (typeof reg.competitionId !== 'string' || !reg.competitionId) {
      throw new Error('Inscrição sem prova associada. Não é possível confirmar.');
    }

    const compRef = doc(db, 'competitions', reg.competitionId);
    const compSnap = await tx.get(compRef);
    if (!compSnap.exists()) throw new Error('Prova não encontrada.');
    const comp = compSnap.data();

    const numRounds = comp.numRounds ?? 1;
    // comp.competitors vem cru do Firestore (não passou por toCompetition) —
    // normaliza categorias legadas antes de dedupar/parear.
    const competitors: Competitor[] = (comp.competitors ?? []).map((c: any) => ({
      ...c,
      category: normalizeCategory(c.category ?? 'Aberta'),
    }));

    const one = resolveCompetitorId(competitors, rider1, numRounds);
    if (one.isNew) competitors.push(one.competitor);
    const two = resolveCompetitorId(competitors, rider2, numRounds);
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
