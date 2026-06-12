import { Competitor } from 'core/models/Competidor';
import { duoKeyFromRiders } from 'core/models/Duo';

export const getDuoKey = (duo: Competitor[]): string =>
  duo.map((p: Competitor) => p.name).join(' & ');

export { duoKeyFromRiders };
