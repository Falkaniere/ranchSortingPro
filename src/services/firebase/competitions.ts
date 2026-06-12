import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Competitor } from '../../core/models/Competidor';
import { Duo } from '../../core/models/Duo';
import { PassResult } from '../../core/models/PassResult';

export type CompetitionStatus = 'draft' | 'qualifier' | 'final' | 'finished';

export interface Competition {
  id: string;
  ownerId: string;
  name: string;
  location?: string;
  eventDate?: string;
  createdAt: string;
  updatedAt: string;
  status: CompetitionStatus;
  numRounds: number;
  competitors: Competitor[];
  duos: Duo[];
  qualifierResults: PassResult[];
  finalResults: PassResult[];
}

type CompetitionPayload = Omit<Competition, 'id' | 'createdAt' | 'updatedAt'>;

// Migrates legacy duo IDs that used '🤝' as separator to '_'
function normalizeDuoIds(competition: Competition): Competition {
  const remap = new Map<string, string>();
  const duos = (competition.duos ?? []).map((d) => {
    if (!d.id.includes('🤝')) return d;
    const newId = d.id.replace(/🤝/g, '_');
    remap.set(d.id, newId);
    return { ...d, id: newId };
  });
  const fix = (id: string) => remap.get(id) ?? id;
  const qualifierResults = (competition.qualifierResults ?? []).map((r) =>
    remap.has(r.duoId) ? { ...r, duoId: fix(r.duoId) } : r
  );
  const finalResults = (competition.finalResults ?? []).map((r) =>
    remap.has(r.duoId) ? { ...r, duoId: fix(r.duoId) } : r
  );
  return { ...competition, duos, qualifierResults, finalResults };
}

function toCompetition(id: string, data: any): Competition {
  const raw: Competition = {
    id,
    ownerId: data.ownerId,
    name: data.name,
    location: data.location ?? '',
    eventDate: data.eventDate ?? '',
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? new Date().toISOString(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt ?? new Date().toISOString(),
    status: data.status ?? 'draft',
    numRounds: data.numRounds ?? 1,
    competitors: data.competitors ?? [],
    duos: data.duos ?? [],
    qualifierResults: data.qualifierResults ?? [],
    finalResults: data.finalResults ?? [],
  };
  return normalizeDuoIds(raw);
}

export async function createCompetition(
  ownerId: string,
  name: string,
  location?: string,
  eventDate?: string
): Promise<Competition> {
  const payload = {
    ownerId,
    name,
    location: location ?? '',
    eventDate: eventDate ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'draft' as CompetitionStatus,
    numRounds: 1,
    competitors: [],
    duos: [],
    qualifierResults: [],
    finalResults: [],
  };
  const ref = await addDoc(collection(db, 'competitions'), payload);
  return toCompetition(ref.id, { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}

export async function updateCompetition(
  id: string,
  partial: Partial<CompetitionPayload>
): Promise<void> {
  await updateDoc(doc(db, 'competitions', id), {
    ...partial,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCompetition(id: string): Promise<void> {
  await deleteDoc(doc(db, 'competitions', id));
}

export async function listCompetitions(ownerId: string): Promise<Competition[]> {
  // Single-field where clause avoids composite index requirement; sort client-side.
  const q = query(
    collection(db, 'competitions'),
    where('ownerId', '==', ownerId)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => toCompetition(d.id, d.data()));
  return results.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getCompetition(id: string): Promise<Competition | null> {
  const snap = await getDoc(doc(db, 'competitions', id));
  if (!snap.exists()) return null;
  return toCompetition(snap.id, snap.data());
}
