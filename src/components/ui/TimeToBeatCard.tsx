import React from 'react';
import { TimeToBeat } from '../../core/logic/finals';
import { formatTime } from '../../utils/formatTime';

type Props = {
  /** Bracket da final (1D/2D), apenas rótulo. */
  bracket: string;
  /** Resultado do cálculo, ou null quando ainda não há líder. */
  timeToBeat: TimeToBeat | null;
  /** Rótulo do líder atual, para dar contexto ao número. */
  leaderLabel?: string;
  /** Tamanho: `hero` para o telão do locutor, `compact` para o placar do scorer. */
  variant?: 'hero' | 'compact';
};

/**
 * Mostra o "tempo a ser batido" pela próxima dupla da final: quanto tempo ela
 * precisa fazer na passada para assumir a liderança do bracket.
 *
 * A classificação é pelo total (qualificatória + final), então há três casos:
 *  - ainda não há líder → basta completar a passada para liderar;
 *  - dá para vencer no tempo → mostra o alvo (< X, pegando N bois);
 *  - empatar os bois não basta → precisa pegar mais bois que o líder.
 */
export function TimeToBeatCard({ bracket, timeToBeat, leaderLabel, variant = 'compact' }: Props) {
  const isHero = variant === 'hero';

  const wrapper = isHero
    ? 'rounded-2xl bg-hay-500 text-white p-4 sm:p-6 border border-hay-600 shadow-lg'
    : 'rounded-lg bg-hay-500 text-white p-3 border border-hay-600';
  const label = isHero
    ? 'text-hay-100 text-xs uppercase tracking-widest mb-2'
    : 'text-hay-100 text-[11px] uppercase tracking-wide font-medium mb-1';
  const bigValue = isHero
    ? 'text-4xl sm:text-6xl font-bold font-serif leading-none'
    : 'text-2xl font-bold font-serif leading-none';
  const note = isHero ? 'text-sm text-hay-100 mt-2' : 'text-[11px] text-hay-100 mt-1';

  // Ainda ninguém correu a final: quem entrar assume a ponta ao completar.
  if (!timeToBeat) {
    return (
      <div className={wrapper}>
        <p className={label}>Tempo a bater — Final {bracket}</p>
        <p className={bigValue}>—</p>
        <p className={note}>Primeira passada da final: complete para assumir a liderança.</p>
      </div>
    );
  }

  const { cattleToTie, targetFinalTimeSeconds, leaderTotalCattle, leaderTotalTimeSeconds } = timeToBeat;

  // A nota de qualificatória já garante a ponta em bois, independente da final.
  if (cattleToTie <= 0) {
    return (
      <div className={wrapper}>
        <p className={label}>Tempo a bater — Final {bracket}</p>
        <p className={bigValue}>Já lidera em bois</p>
        <p className={note}>
          A qualificatória já supera o líder em bois — basta completar a passada.
        </p>
      </div>
    );
  }

  // Empatar os bois não é suficiente: precisa pegar mais bois que o líder.
  if (targetFinalTimeSeconds <= 0) {
    return (
      <div className={wrapper}>
        <p className={label}>Tempo a bater — Final {bracket}</p>
        <p className={bigValue}>+ bois</p>
        <p className={note}>
          Empatar {cattleToTie} bois não basta — é preciso pegar mais bois que o líder
          {leaderLabel ? ` (${leaderLabel})` : ''}.
        </p>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <p className={label}>Tempo a bater — Final {bracket}</p>
      <p className={bigValue}>&lt; {formatTime(targetFinalTimeSeconds)}</p>
      <p className={note}>
        Pegando {cattleToTie} {cattleToTie === 1 ? 'boi' : 'bois'} para ultrapassar
        {leaderLabel ? ` ${leaderLabel}` : ' o líder'} (
        {leaderTotalCattle}b / {formatTime(leaderTotalTimeSeconds)} no total).
      </p>
    </div>
  );
}
