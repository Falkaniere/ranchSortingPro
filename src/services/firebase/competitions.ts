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
  orderBy,
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

function toCompetition(id: string, data: any): Competition {
  return {
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
  const q = query(
    collection(db, 'competitions'),
    where('ownerId', '==', ownerId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toCompetition(d.id, d.data()));
}

export async function getCompetition(id: string): Promise<Competition | null> {
  const snap = await getDoc(doc(db, 'competitions', id));
  if (!snap.exists()) return null;
  return toCompetition(snap.id, snap.data());
}
