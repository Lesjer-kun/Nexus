import React from 'react';
import { DisciplineType } from '../../types/nexus';

interface DisciplineBadgeProps {
  discipline: DisciplineType;
  size?: 'sm' | 'md';
}

export const DisciplineBadge: React.FC<DisciplineBadgeProps> = ({ discipline, size = 'sm' }) => {
  const styles: Record<DisciplineType, string> = {
    Piping: 'bg-sky-50 text-sky-800 border-sky-200',
    Civil: 'bg-amber-50 text-amber-900 border-amber-200',
    'Mechanical / Rotating': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Electrical: 'bg-orange-50 text-orange-900 border-orange-200',
    Instrumentation: 'bg-teal-50 text-teal-800 border-teal-200',
    HSE: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const sizeCls = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span
      id={`discipline-badge-${discipline.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className={`inline-flex items-center whitespace-nowrap rounded border font-medium ${styles[discipline] || 'border-line bg-paper text-ink'} ${sizeCls}`}
    >
      {discipline}
    </span>
  );
};
