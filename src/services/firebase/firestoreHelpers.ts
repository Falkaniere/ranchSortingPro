import { Timestamp } from 'firebase/firestore';

/** Converts a Firestore Timestamp (or already-ISO string) to an ISO date string. */
export function timestampToISO(value: Timestamp | string | undefined): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return value ?? new Date().toISOString();
}

/** Same as timestampToISO, but leaves the field undefined when absent instead of defaulting to now. */
export function timestampToISOOrUndefined(
  value: Timestamp | string | undefined
): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return value ?? undefined;
}
