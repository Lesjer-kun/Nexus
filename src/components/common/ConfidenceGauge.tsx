import React from 'react';

interface ConfidenceGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  score,
  label = 'Mapping Confidence',
  showDetails = false,
}) => {
  const pct = Math.round(score * 100);

  let bar = 'bg-emerald-600';
  let text = 'text-emerald-800';
  let badge = 'border-emerald-200 bg-emerald-50 text-emerald-800';
  let category = 'High';

  if (score < 0.7) {
    bar = 'bg-rose-600';
    text = 'text-rose-800';
    badge = 'border-rose-200 bg-rose-50 text-rose-800';
    category = 'Needs review';
  } else if (score < 0.88) {
    bar = 'bg-amber-500';
    text = 'text-amber-900';
    badge = 'border-amber-200 bg-amber-50 text-amber-900';
    category = 'Medium';
  }

  return (
    <div className="flex w-full flex-col gap-1.5" id={`confidence-gauge-${pct}`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-ink">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge}`}>{category}</span>
          <span className={`font-mono text-[12px] font-bold ${text}`}>{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      {showDetails && (
        <p className="text-[10px] leading-relaxed text-muted">
          Interpretation match only — separate from evidence completeness.
        </p>
      )}
    </div>
  );
};
