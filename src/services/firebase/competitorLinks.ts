import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { CompetitorLink } from '../../core/models/CompetitorProfile';

function toLink(id: string, data: any): CompetitorLink {
  return {
    id,
    profileId: data.profileId,
    competitionId: data.competitionId,
    competitorId: data.competitorId,
    matchType: data.matchType,
    confidence: data.confidence ?? 1.0,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? new Date().toISOString(),
    createdBy: data.createdBy,
  };
}

export async function createCompetitorLink(
  link: Omit<CompetitorLink, 'id' | 'createdAt'>
): Promise<CompetitorLink> {
  const ref = await addDoc(collection(db, 'competitorLinks'), {
    ...link,
    createdAt: serverTimestamp(),
  });
  return toLink(ref.id, { ...link, createdAt: new Date().toISOString() });
}

export async function getLinksByProfileId(profileId: string): Promise<CompetitorLink[]> {
  const q = query(
    collection(db, 'competitorLinks'),
    where('profileId', '==', profileId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toLink(d.id, d.data()));
}

export async function getLinkForCompetitor(
  competitionId: string,
  competitorId: string
): Promise<CompetitorLink | null> {
  const q = query(
    collection(db, 'competitorLinks'),
    where('competitionId', '==', competitionId),
    where('competitorId', '==', competitorId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toLink(snap.docs[0].id, snap.docs[0].data());
}
