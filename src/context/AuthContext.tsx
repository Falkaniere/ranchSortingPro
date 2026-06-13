import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthChange } from '../services/firebase/auth';
import { db } from '../firebase';

export type UserRole = 'basic' | 'pro';

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  competitorProfileId: string | null;
  isLoading: boolean;
  refreshUserDoc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('basic');
  const [competitorProfileId, setCompetitorProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadUserDoc(u: User) {
    try {
      const snap = await getDoc(doc(db, 'users', u.uid));
      const data = snap.data();
      setRole((data?.role as UserRole) ?? 'basic');
      setCompetitorProfileId(data?.competitorProfileId ?? null);
    } catch {
      setRole('basic');
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
        setCompetitorProfileId(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, role, competitorProfileId, isLoading, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
