import React from 'react';
import { RiderCategory } from '../../core/models/Competidor';
import { CompetitionStatus } from '../../services/firebase/competitions';

type DuoGroup = '1D' | '2D';

interface CategoryBadgeProps {
  category: RiderCategory;
  size?: 'sm' | 'md';
}

const categoryConfig: Record<RiderCategory, { label: string; className: string }> = {
  Open: {
    label: 'Aberta',
    className: 'bg-hay-200 text-rope-700 border border-hay-400',
  },
  Amateur19: {
    label: 'Amador',
    className: 'bg-pasture-100 text-pasture-800 border border-pasture-400',
  },
  AmateurLight: {
    label: 'Amador Light',
    className: 'bg-saddle-100 text-saddle-700 border border-saddle-400',
  },
  Beginner: {
    label: 'Principiante',
    className: 'bg-dust-200 text-rope-500 border border-dust-400',
  },
};

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className,
      ].join(' ')}
    >
      {config.label}
    </span>
  );
}

interface GroupBadgeProps {
  group: DuoGroup;
  size?: 'sm' | 'md';
}

export function GroupBadge({ group, size = 'sm' }: GroupBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center font-bold rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        group === '1D'
          ? 'bg-saddle-600 text-white'
          : 'bg-pasture-600 text-white',
      ].join(' ')}
    >
      {group}
    </span>
  );
}

interface StatusBadgeProps {
  status: CompetitionStatus;
}

const statusConfig: Record<CompetitionStatus, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-dust-200 text-rope-500 border border-dust-400' },
  qualifier: { label: 'Qualificatória', className: 'bg-hay-200 text-hay-700 border border-hay-400' },
  final: { label: 'Final', className: 'bg-saddle-100 text-saddle-700 border border-saddle-400' },
  finished: { label: 'Encerrada', className: 'bg-pasture-100 text-pasture-800 border border-pasture-400' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full px-2.5 py-0.5 text-xs',
        config.className,
      ].join(' ')}
    >
      {config.label}
    </span>
  );
}
