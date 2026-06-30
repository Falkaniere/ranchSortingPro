export function formatTime(seconds: number, isSAT?: boolean): string {
  if (isSAT) return 'SAT';
  return `${seconds.toFixed(2)}s`;
}
