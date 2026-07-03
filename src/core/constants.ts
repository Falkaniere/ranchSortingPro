import type { CompetitionStatus } from './models/CompetitionStatus';
import { RiderCategory } from './models/Competidor';

/** Rota (relativa à competição) para a qual navegar de acordo com o status atual. */
export const STATUS_ROUTES: Record<CompetitionStatus, string> = {
  draft: 'registration',
  qualifier: 'record',
  final: 'final',
  finished: 'final-results',
};

/** Rótulo em pt-BR exibido para cada status de competição. */
export const STATUS_LABELS: Record<CompetitionStatus, string> = {
  draft: 'Rascunho',
  qualifier: 'Qualificatória',
  final: 'Final',
  finished: 'Encerrada',
};

/** Categorias de competidor disponíveis no formulário de inscrição. */
export const CATEGORIES: { label: string; value: RiderCategory; hint: string }[] = [
  { label: 'Aberta', value: 'Aberta', hint: 'Combina com Amador 19, Light ou Principiante' },
  { label: 'Amador 19', value: '19', hint: 'Combina com Aberta, Amador 19 ou Light' },
  { label: 'Light', value: 'Light', hint: 'Combina com Aberta, Amador 19 ou Light' },
  { label: 'Principiante', value: 'Principiante', hint: 'Grupo 2D' },
];

/** Tempo máximo permitido por passada (segundos). */
export const MAX_PASS_TIME_SECONDS = 90;

/** Limites de uso por plano de assinatura. */
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
