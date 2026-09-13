import React from 'react';
import { ProjectInfo } from '../../types/nexus';
import { Smartphone, Monitor, Shield, Radio, HardHat } from 'lucide-react';

interface TopHeaderProps {
  project: ProjectInfo | null;
  activeRole: 'SUPERVISOR' | 'PLANNER';
  setActiveRole: (role: 'SUPERVISOR' | 'PLANNER') => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  pendingReviewCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  project,
  activeRole,
  setActiveRole,
  isMobileFrame,
  setIsMobileFrame,
  pendingReviewCount,
}) => {
  return (
    <header
      id="nexus-top-header"
      className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-2 sm:py-2.5 shadow-md shrink-0"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Logo and Project Branding */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm tracking-wider shadow-xs shrink-0">
              NX
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  NEXUS
                </h1>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60">
                  SIH26122 • OIL
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {project ? `${project.code} — ${project.name}` : 'Pipeline & Booster Station'}
              </p>
            </div>
          </div>

          {/* Sync Status Pill (Visible on small screens right aligned) */}
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full font-medium shrink-0 sm:hidden">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>Sync Active</span>
          </div>
        </div>

        {/* Action Controls: Role switch and Device Preview Switch */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Online Sync Pill (Desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full font-medium">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="text-[11px]">Sync Active</span>
          </div>

          {/* Role Switcher */}
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
            <button
              id="role-btn-supervisor"
              type="button"
              onClick={() => setActiveRole('SUPERVISOR')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium text-[11px] sm:text-xs transition-all ${
                activeRole === 'SUPERVISOR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardHat className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Supervisor</span>
            </button>
            <button
              id="role-btn-planner"
              type="button"
              onClick={() => setActiveRole('PLANNER')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium text-[11px] sm:text-xs transition-all relative ${
                activeRole === 'PLANNER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Planner</span>
              {pendingReviewCount > 0 && (
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-bold flex items-center justify-center">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Frame Simulation Toggle */}
          <button
            id="toggle-mobile-frame-btn"
            type="button"
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            title={isMobileFrame ? 'Switch to Full Screen View' : 'Simulate Mobile Frame'}
            className="flex items-center gap-1 text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shrink-0"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                <span>Full View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
                <span>Mobile Frame</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
