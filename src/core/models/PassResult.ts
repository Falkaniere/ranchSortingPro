import { DuoGroup } from './Duo';

/**
 * Campos comuns a qualquer passada (qualificatória ou final).
 */
interface BasePassResult {
  /** Identificador único da passada */
  id: string;

  /** ID da dupla correspondente */
  duoId: string;

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
 * Passada de qualificatória. Não pertence a um bracket de final — a categoria
 * relevante vem sempre do `group` da dupla.
 */
export interface QualifierPass extends BasePassResult {
  stage: 'Qualifier';
  /** Qualificatórias nunca têm bracket. */
  bracket?: never;
}

/**
 * Passada de final. O `bracket` é obrigatório e indica em qual final ('1D' ou
 * '2D') a passada foi corrida. Como as finais são classificadas de forma
 * independente, uma dupla 2D bem colocada pode ter uma passada em cada bracket
 * — por isso é o `bracket`, e não o `group` da dupla, que desambigua a passada.
 */
export interface FinalPass extends BasePassResult {
  stage: 'Final';
  bracket: DuoGroup;
}

/**
 * Representa o resultado de uma passada (qualificatória ou final).
 *
 * União discriminada por `stage`: passadas de final carregam `bracket`
 * obrigatório; qualificatórias nunca têm bracket.
 */
export type PassResult = QualifierPass | FinalPass;

/**
 * Representa um placar consolidado de uma dupla.
 * Utilizado para ordenação e classificação.
 */
export interface DuoScore {
  duoId: string;
  group: DuoGroup;
  /** Dupla Principiante+Principiante — elegível à final 2D como reserva mesmo tendo group '1D'. */
  doublePrincipiante?: boolean;
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
