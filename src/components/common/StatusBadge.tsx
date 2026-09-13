import React from 'react';
import { EventStatus, GovernanceStatus } from '../../types/nexus';

export const StatusBadge: React.FC<{
  status: EventStatus | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'HALTED' | 'DELAYED' | null;
  label?: string;
}> = ({ status, label }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
        null (unspecified)
      </span>
    );
  }

  const normalized = status.toLowerCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (normalized === 'completed') {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (normalized === 'in_progress' || normalized === 'started' || normalized === 'resumed') {
    bg = 'bg-sky-50 text-sky-800 border-sky-200';
    dotColor = 'bg-sky-500';
  } else if (normalized === 'interrupted' || normalized === 'halted') {
    bg = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (normalized === 'delayed') {
    bg = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'not_started') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  }

  const displayText = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${bg} uppercase tracking-wider`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {displayText}
    </span>
  );
};

export const GovernanceBadge: React.FC<{ status: GovernanceStatus }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Verified & Linked
        </span>
      );
    case 'CORRECTED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Planner Corrected
        </span>
      );
    case 'PENDING_REVIEW':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
          Pending Governance
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Rejected
        </span>
      );
    case 'NEEDS_CLARIFICATION':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
          Needs Clarification
        </span>
      );
    default:
      return null;
  }
};
