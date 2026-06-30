import { useAuth } from '../context/AuthContext';
import { PLAN_LIMITS } from '../core/constants';

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
