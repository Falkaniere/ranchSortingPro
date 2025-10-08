import { SAT_TIME_SECONDS } from 'core/constants';
import { PassResult } from 'core/models/PassResult';

export function normalizeSAT(result: PassResult): PassResult {
  if (!result.isSAT) return result;
  return {
    ...result,
    cattleCount: 0,
    timeSeconds: SAT_TIME_SECONDS,
  };
}
