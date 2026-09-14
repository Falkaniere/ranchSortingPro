import React from 'react';
import { TimeToBeat } from 'core/logic/finals';
import { formatTime } from 'utils/formatTime';

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
 * A classificação vale só pela passada da final (todos começam zerados), então
 * há dois casos:
 *  - ainda não há líder → basta completar a passada para liderar;
 *  - já há líder → mostra o alvo: igualar os bois do líder em menos tempo (ou
 *    pegar mais bois que ele).
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

  const { cattleToBeat, targetTimeSeconds, leaderCattle, leaderTimeSeconds } = timeToBeat;

  // O alvo é um limite estrito ("< X"). Trunca para baixo no centésimo em vez
  // de deixar o toFixed(2) arredondar para cima — arredondar exibiria um tempo
  // que na verdade empata/perde por centésimos (ex.: 22.995s viraria "< 23.00s").
  const targetDisplay = Math.floor(targetTimeSeconds * 100) / 100;

  return (
    <div className={wrapper}>
      <p className={label}>Tempo a bater — Final {bracket}</p>
      <p className={bigValue}>&lt; {formatTime(targetDisplay)}</p>
      <p className={note}>
        Iguale {cattleToBeat} {cattleToBeat === 1 ? 'boi' : 'bois'} em menos tempo — ou
        pegue mais bois que {leaderLabel ?? 'o líder'} ({leaderCattle}b /{' '}
        {formatTime(leaderTimeSeconds)} na final).
      </p>
    </div>
  );
}
