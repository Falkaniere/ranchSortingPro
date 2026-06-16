import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { CompetitorProfile } from '../../core/models/CompetitorProfile';
import { normalizeName, nameSimilarity } from '../../utils/nameNormalization';

function toProfile(id: string, data: any): CompetitorProfile {
  return {
    id,
    displayName: data.displayName ?? '',
    aliases: data.aliases ?? [],
    normalizedName: data.normalizedName ?? '',
    userId: data.userId ?? undefined,
    email: data.email ?? undefined,
    status: data.status ?? 'unclaimed',
    mergedIntoProfileId: data.mergedIntoProfileId ?? undefined,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? new Date().toISOString(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt ?? new Date().toISOString(),
    claimedAt:
      data.claimedAt instanceof Timestamp
        ? data.claimedAt.toDate().toISOString()
        : data.claimedAt ?? undefined,
  };
}

export async function getCompetitorProfile(id: string): Promise<CompetitorProfile | null> {
  const snap = await getDoc(doc(db, 'competitorProfiles', id));
  if (!snap.exists()) return null;
  return toProfile(snap.id, snap.data());
}

export async function getProfileByUserId(userId: string): Promise<CompetitorProfile | null> {
  const q = query(
    collection(db, 'competitorProfiles'),
    where('userId', '==', userId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toProfile(snap.docs[0].id, snap.docs[0].data());
}

// Exact match by normalizedName — used for auto-linking (cheap, no fuzzy)
export async function searchProfilesByNormalizedName(name: string): Promise<CompetitorProfile[]> {
  const normalized = normalizeName(name);
  const q = query(
    collection(db, 'competitorProfiles'),
    where('normalizedName', '==', normalized)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProfile(d.id, d.data()));
}

// Prefix + client-side fuzzy — used for user-facing search
export async function searchProfilesForUser(
  queryStr: string
): Promise<Array<{ profile: CompetitorProfile; score: number }>> {
  if (!queryStr.trim()) return [];
  const normalized = normalizeName(queryStr);

  const q = query(
    collection(db, 'competitorProfiles'),
    where('normalizedName', '>=', normalized),
    where('normalizedName', '<=', normalized + '\uf8ff'),
    limit(50)
  );
  const snap = await getDocs(q);
  const profiles = snap.docs.map((d) => toProfile(d.id, d.data()));

  return profiles
    .filter((p) => p.status !== 'merged')
    .map((p) => {
      const score = Math.max(
        nameSimilarity(queryStr, p.displayName),
        ...p.aliases.map((a) => nameSimilarity(queryStr, a)),
        0
      );
      return { profile: p, score };
    })
    .filter((r) => r.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

export async function createCompetitorProfile(
  name: string,
  userId?: string,
  email?: string
): Promise<CompetitorProfile> {
  const normalized = normalizeName(name);
  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    displayName: name,
    aliases: [],
    normalizedName: normalized,
    status: userId ? 'claimed' : 'unclaimed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (userId) {
    payload.userId = userId;
    payload.claimedAt = serverTimestamp();
  }
  if (email) payload.email = email;

  const ref = await addDoc(collection(db, 'competitorProfiles'), payload);
  return {
    id: ref.id,
    displayName: name,
    aliases: [],
    normalizedName: normalized,
    userId,
    email,
    status: userId ? 'claimed' : 'unclaimed',
    createdAt: now,
    updatedAt: now,
    claimedAt: userId ? now : undefined,
  };
}

// Atomically claims a profile: verifies it is still unclaimed, then updates
// both the profile and the user doc in a single transaction to prevent races.
export async function claimCompetitorProfile(
  profileId: string,
  userId: string,
  email: string
): Promise<void> {
  const profileRef = doc(db, 'competitorProfiles', profileId);
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (tx) => {
    const profileSnap = await tx.get(profileRef);
    if (!profileSnap.exists()) throw new Error('Perfil não encontrado.');

    const data = profileSnap.data();
    if (data.status === 'claimed' && data.userId !== userId) {
      throw new Error('Este perfil já foi reivindicado por outro usuário.');
    }

    tx.update(profileRef, {
      userId,
      email,
      status: 'claimed',
      claimedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(userRef, { competitorProfileId: profileId });
  });
}
