import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useRiskAlerts } from '../../hooks/useRiskAlerts';
import { ScreenHeader } from '../layout/ScreenHeader';

const severityStyles: Record<string, string> = {
  critical: 'border-rose-300 bg-rose-50 text-rose-950',
  high: 'border-orange-300 bg-orange-50 text-orange-950',
  medium: 'border-amber-300 bg-amber-50 text-amber-950',
  low: 'border-emerald-300 bg-emerald-50 text-emerald-950',
};

export const RiskAlertsScreen: React.FC = () => {
  const { alerts, isLoading, refreshAlerts, evaluateRisk, clearAlert } = useRiskAlerts();

  return (
    <div id="risk-alerts-screen" className="nexus-scroll flex h-full flex-col overflow-y-auto bg-paper">
      <ScreenHeader
        icon={ShieldAlert}
        eyebrow="Deterministic risk engine"
        title="Early warnings"
        description="Variance, completion, dependency, and blocker signals evaluated from governed schedule state."
        trailing={
          <button
            type="button"
            onClick={() => void evaluateRisk()}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:border-ember/40"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Evaluate
          </button>
        }
      />

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className="flex items-center justify-between rounded-xl border border-line bg-panel p-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Active signals</div>
            <div className="mt-0.5 font-mono text-2xl font-bold text-ink">{alerts.length}</div>
          </div>
          <button
            type="button"
            onClick={() => void refreshAlerts()}
            className="rounded-md border border-line bg-paper p-2 text-muted hover:text-ink"
            title="Refresh risk alerts"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-line bg-panel p-8 text-center text-xs text-muted">Evaluating schedule signals...</div>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-950">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <div className="mt-2 text-sm font-semibold">No active risk signals</div>
            <p className="mt-1 text-xs">The current governed schedule has no returned variance or completion alerts.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((alert) => (
              <article key={alert.id} className={`space-y-2 rounded-xl border p-3.5 ${severityStyles[alert.severity] || severityStyles.medium}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold">{alert.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed opacity-85">{alert.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-bold uppercase">{alert.severity}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-current/15 pt-2 font-mono text-[10px] opacity-75">
                  <span>{alert.eventNumber} · {alert.activityWbsCode || 'Unassigned activity'}</span>
                  <button type="button" onClick={() => clearAlert(alert.id)} className="font-sans font-semibold hover:underline">Dismiss view</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};