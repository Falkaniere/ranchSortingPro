import { DuoGroup } from './Duo';

export interface PassResult {
  duoId: string;
  stage: 'Qualifier' | 'Final';
  cattleCount: number;
  timeSeconds: number;
  isSAT: boolean;
  createdAtISO: string;
}

export interface DuoScore {
  duoId: string;
  group: DuoGroup;
  cattleCount: number;
  timeSeconds: number;
}

export const SAT_TIME_SECONDS = 120;

export function normalizeSAT(result: PassResult): PassResult {
  return result.isSAT
    ? { ...result, cattleCount: 0, timeSeconds: SAT_TIME_SECONDS }
    : result;
}
