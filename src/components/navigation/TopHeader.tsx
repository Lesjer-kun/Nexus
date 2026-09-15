import React from 'react';
import { ProjectInfo } from '../../types/nexus';
import { HardHat, Monitor, Radio, Shield, Smartphone } from 'lucide-react';

interface TopHeaderProps {
  project: ProjectInfo | null;
  activeRole: 'SUPERVISOR' | 'PLANNER';
  setActiveRole: (role: 'SUPERVISOR' | 'PLANNER') => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  pendingReviewCount: number;
  backendOnline: boolean | null;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  project,
  activeRole,
  setActiveRole,
  isMobileFrame,
  setIsMobileFrame,
  pendingReviewCount,
  backendOnline,
}) => {
  return (
    <header
      id="nexus-top-header"
      className="z-40 shrink-0 border-b border-ink-3 bg-ink px-3 py-2.5 text-paper sm:px-5"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ember font-mono text-[13px] font-bold tracking-wider text-white">
              NX
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[15px] font-semibold tracking-tight text-paper">NEXUS</h1>
                <span className="rounded border border-ember/40 bg-ember/15 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-orange-200 sm:text-[10px]">
                  SIH26122 · OIL
                </span>
              </div>
              <p className="mt-0.5 max-w-[240px] truncate font-mono text-[11px] text-paper/55 sm:max-w-md">
                {project ? `${project.code} — ${project.name}` : 'Pipeline & Booster Station'}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:hidden ${backendOnline === false ? 'border-amber-800/70 bg-amber-950/50 text-amber-300' : 'border-emerald-800/70 bg-emerald-950/50 text-emerald-300'}`}>
            <Radio className="h-2.5 w-2.5" />
            <span>{backendOnline === false ? 'Demo fallback' : 'Live'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex ${backendOnline === false ? 'border-amber-800/70 bg-amber-950/40 text-amber-300' : 'border-emerald-800/70 bg-emerald-950/40 text-emerald-300'}`}>
            <Radio className="h-3 w-3" />
            <span>{backendOnline === false ? 'Demo fallback' : 'Backend connected'}</span>
          </div>

          <div className="flex items-center rounded-lg border border-ink-3 bg-ink-2 p-0.5 text-xs">
            <button
              id="role-btn-supervisor"
              type="button"
              onClick={() => setActiveRole('SUPERVISOR')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:text-xs ${
                activeRole === 'SUPERVISOR' ? 'bg-ember text-white' : 'text-paper/55 hover:text-paper'
              }`}
            >
              <HardHat className="h-3.5 w-3.5" />
              <span>Supervisor</span>
            </button>
            <button
              id="role-btn-planner"
              type="button"
              onClick={() => setActiveRole('PLANNER')}
              className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:text-xs ${
                activeRole === 'PLANNER' ? 'bg-ember text-white' : 'text-paper/55 hover:text-paper'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Planner</span>
              {pendingReviewCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-paper px-1 font-mono text-[10px] font-bold text-ink">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          </div>

          <button
            id="toggle-mobile-frame-btn"
            type="button"
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            title={isMobileFrame ? 'Switch to Full Screen View' : 'Simulate Mobile Frame'}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-ink-3 bg-ink-2 px-2.5 py-1.5 text-[11px] text-paper/80 transition-colors hover:bg-ink-3 sm:text-xs"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="h-3.5 w-3.5 text-orange-200" />
                <span>Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="h-3.5 w-3.5 text-orange-200" />
                <span>Field phone</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
