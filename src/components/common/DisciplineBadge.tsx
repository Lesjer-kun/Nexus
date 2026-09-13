import React from 'react';
import { DisciplineType } from '../../types/nexus';

interface DisciplineBadgeProps {
  discipline: DisciplineType;
  size?: 'sm' | 'md';
}

export const DisciplineBadge: React.FC<DisciplineBadgeProps> = ({ discipline, size = 'sm' }) => {
  const styles: Record<DisciplineType, { bg: string; text: string; border: string }> = {
    Piping: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    Civil: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    'Mechanical / Rotating': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    Electrical: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    Instrumentation: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-800',
      border: 'border-cyan-200',
    },
    HSE: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
  };

  const current = styles[discipline] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const sizeCls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      id={`discipline-badge-${discipline.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className={`inline-flex items-center font-medium rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeCls} whitespace-nowrap`}
    >
      {discipline}
    </span>
  );
};
