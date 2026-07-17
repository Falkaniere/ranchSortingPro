import { RiderCategory } from './Competidor';
import { DuoGroup } from './Duo';

export type DuoRegistrationStatus = 'pending' | 'confirmed' | 'rejected';

/** Um competidor dentro de uma inscrição de dupla (nome + categoria). */
export interface RegistrationRider {
  name: string;
  category: RiderCategory;
}

/**
 * Inscrição de uma dupla feita pelo próprio competidor numa prova.
 * Fica em coleção top-level separada porque competidores não têm permissão
 * de escrita no doc da prova (owner-only). Ao ser confirmada pelo gerente,
 * a dupla é injetada em competitors[]/duos[] da prova.
 */
export interface DuoRegistration {
  id: string;
  competitionId: string;
  /** uid do usuário competidor que criou a inscrição. */
  createdBy: string;
  competitorOne: RegistrationRider;
  competitorTwo: RegistrationRider;
  group: DuoGroup;
  status: DuoRegistrationStatus;
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}
