import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { RiderCategory } from '../../core/models/Competidor';
import { Competitor } from '../../core/models/Competidor';

export interface AthleteProfile {
  id: string;
  name: string;
  category: RiderCategory;
  createdAt: string;
}

function toAthleteProfile(id: string, data: any): AthleteProfile {
  return {
    id,
    name: data.name,
    category: data.category ?? 'Open',
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? new Date().toISOString(),
  };
}

export async function listAthletes(uid: string): Promise<AthleteProfile[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'athletes'));
  return snap.docs
    .map((d) => toAthleteProfile(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function saveAthlete(
  uid: string,
  profile: Omit<AthleteProfile, 'id' | 'createdAt'>
): Promise<AthleteProfile> {
  const ref = await addDoc(collection(db, 'users', uid, 'athletes'), {
    name: profile.name,
    category: profile.category,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...profile, createdAt: new Date().toISOString() };
}

export async function deleteAthlete(uid: string, athleteId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'athletes', athleteId));
}

export function importProfilesAsCompetitors(
  profiles: AthleteProfile[],
  passes: number
): Competitor[] {
  return profiles.map((p) => ({
    id: crypto.randomUUID(),
    name: p.name,
    category: p.category,
    passes,
  }));
}
