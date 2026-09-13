import React from 'react';

interface ConfidenceGaugeProps {
  score: number; // 0.0 to 1.0
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  score,
  label = 'Mapping Confidence',
  size = 'md',
  showDetails = false,
}) => {
  const pct = Math.round(score * 100);

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let category = 'High Confidence';

  if (score < 0.7) {
    barColor = 'bg-rose-500';
    textColor = 'text-rose-700';
    badgeBg = 'bg-rose-50 text-rose-800 border-rose-200';
    category = 'Low / Needs Review';
  } else if (score < 0.88) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
    category = 'Medium Confidence';
  }

  return (
    <div className="flex flex-col gap-1 w-full" id={`confidence-gauge-${pct}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded border text-[11px] font-semibold ${badgeBg}`}>
            {category}
          </span>
          <span className={`font-mono font-bold ${textColor}`}>
            {score.toFixed(2)} ({pct}%)
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      {showDetails && (
        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
          * Indicates interpretation match confidence, distinct from physical evidence completeness.
        </p>
      )}
    </div>
  );
};
