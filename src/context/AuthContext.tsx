import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthChange } from '../services/firebase/auth';
import { db } from '../firebase';

export type UserRole = 'basic' | 'pro';
export type UserType = 'competitor' | 'organizer';

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  userType: UserType;
  competitorProfileId: string | null;
  isLoading: boolean;
  refreshUserDoc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('basic');
  const [userType, setUserType] = useState<UserType>('organizer');
  const [competitorProfileId, setCompetitorProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadUserDoc(u: User) {
    try {
      const snap = await getDoc(doc(db, 'users', u.uid));
      const data = snap.data();
      setRole((data?.role as UserRole) ?? 'basic');
      // Existing users without a persona are treated as organizers (backward compatible).
      setUserType((data?.userType as UserType) ?? 'organizer');
      setCompetitorProfileId(data?.competitorProfileId ?? null);
    } catch {
      setRole('basic');
      setUserType('organizer');
      setCompetitorProfileId(null);
    }
  }

  async function refreshUserDoc() {
    if (user) await loadUserDoc(user);
  }

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        await loadUserDoc(u);
      } else {
        setRole('basic');
        setUserType('organizer');
        setCompetitorProfileId(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, role, userType, competitorProfileId, isLoading, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
