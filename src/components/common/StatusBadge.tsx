import React from 'react';
import { EventStatus, GovernanceStatus } from '../../types/nexus';

const pill = 'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';

export const StatusBadge: React.FC<{
  status: EventStatus | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'HALTED' | 'DELAYED' | null;
  label?: string;
}> = ({ status, label }) => {
  if (!status) {
    return (
      <span className={`${pill} border-line bg-paper font-mono text-muted`}>null</span>
    );
  }

  const normalized = status.toLowerCase();
  let tone = 'border-line bg-paper text-muted';
  let dot = 'bg-muted';

  if (normalized === 'completed') {
    tone = 'border-emerald-200 bg-emerald-50 text-emerald-800';
    dot = 'bg-emerald-500';
  } else if (normalized === 'in_progress' || normalized === 'started' || normalized === 'resumed') {
    tone = 'border-sky-200 bg-sky-50 text-sky-800';
    dot = 'bg-sky-500';
  } else if (normalized === 'interrupted' || normalized === 'halted') {
    tone = 'border-rose-200 bg-rose-50 text-rose-800';
    dot = 'bg-rose-500';
  } else if (normalized === 'delayed') {
    tone = 'border-amber-200 bg-amber-50 text-amber-900';
    dot = 'bg-amber-500';
  }

  return (
    <span className={`${pill} ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label || status.replace(/_/g, ' ')}
    </span>
  );
};

export const GovernanceBadge: React.FC<{ status: GovernanceStatus }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return (
        <span className={`${pill} border-emerald-200 bg-emerald-50 text-emerald-800`}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Verified
        </span>
      );
    case 'CORRECTED':
      return (
        <span className={`${pill} border-sky-200 bg-sky-50 text-sky-800`}>
          <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
          Corrected
        </span>
      );
    case 'PENDING_REVIEW':
      return (
        <span className={`${pill} border-amber-200 bg-amber-50 text-amber-950`}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600" />
          In review
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`${pill} border-rose-200 bg-rose-50 text-rose-800`}>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Rejected
        </span>
      );
    case 'NEEDS_CLARIFICATION':
      return (
        <span className={`${pill} border-orange-200 bg-orange-50 text-orange-900`}>
          <span className="h-1.5 w-1.5 rounded-full bg-ember" />
          Clarify
        </span>
      );
    default:
      return null;
  }
};
