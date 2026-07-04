import { DuoGroup } from './Duo';

/**
 * Representa o resultado de uma passada (qualificatória ou final).
 */
export interface PassResult {
  /** Identificador único da passada */
  id: string;

  /** ID da dupla correspondente */
  duoId: string;

  /** Etapa da competição: qualificatória ou final */
  stage: 'Qualifier' | 'Final';

  /**
   * Qual final esta passada pertence (somente quando stage === 'Final').
   * Uma dupla 2D que também entra no top geral pode ter uma passada em
   * cada bracket ('1D' e '2D'), por isso o bracket não é sempre igual
   * ao group da dupla.
   */
  bracket?: DuoGroup;

  /** Número de bois passados corretamente */
  cattleCount: number;

  /** Tempo total em segundos */
  timeSeconds: number;

  /** Indica se foi Sem Aproveitamento Técnico (SAT) */
  isSAT?: boolean;

  /** Número do boi cantado (0–9), campo informativo */
  calledCattle?: number;

  /** Data/hora da criação (ISO) */
  createdAtISO?: string;

  /** Data/hora da última edição (ISO) */
  updatedAtISO?: string;
}

/**
 * Representa um placar consolidado de uma dupla.
 * Utilizado para ordenação e classificação.
 */
export interface DuoScore {
  duoId: string;
  group: DuoGroup;
  cattleCount: number;
  timeSeconds: number;
}

/**
 * Tempo padrão atribuído a passadas SAT (Sem Aproveitamento Técnico).
 */
export const SAT_TIME_SECONDS = 120;

/**
 * Normaliza passadas marcadas como SAT.
 * Força `cattleCount = 0` e `timeSeconds = 120`.
 */
export function normalizeSAT(result: PassResult): PassResult {
  if (!result.isSAT) return result;
  return { ...result, cattleCount: 0, timeSeconds: SAT_TIME_SECONDS };
}
