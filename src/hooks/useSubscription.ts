import { useAuth } from '../context/AuthContext';

export const PLAN_LIMITS = {
  basic: {
    maxCompetitors: 15,
    maxActiveCompetitions: 1,
    canExport: false,
  },
  pro: {
    maxCompetitors: null,
    maxActiveCompetitions: null,
    canExport: true,
  },
} as const;

export function useSubscription() {
  const { role } = useAuth();
  const isPro = role === 'pro';
  return {
    role,
    isPro,
    isBasic: !isPro,
    limits: PLAN_LIMITS[role],
  };
}
