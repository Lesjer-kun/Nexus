import React from 'react';
import { NAV_ITEMS, type ActiveTabType } from '../layout/NavItems';

interface NavRailProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  pendingReviewCount: number;
}

export const NavRail: React.FC<NavRailProps> = ({ activeTab, setActiveTab, pendingReviewCount }) => {
  return (
    <aside className="hidden h-full w-[232px] shrink-0 flex-col border-r border-line bg-panel md:flex">
      <div className="border-b border-line px-4 py-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Workspace</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">Execution layer</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
        {NAV_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge = tab.id === 'REVIEW' && pendingReviewCount > 0 ? pendingReviewCount : null;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                isActive
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-ink-2 hover:bg-line/60'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-ember' : 'text-muted'}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold leading-none">{tab.label}</span>
                <span className={`mt-1 block text-[11px] leading-none ${isActive ? 'text-paper/65' : 'text-muted'}`}>
                  {tab.hint}
                </span>
              </span>
              {badge !== null && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive ? 'bg-ember text-white' : 'bg-ember text-white'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-muted">
        AI interprets. Rules govern. No model writes project truth.
      </div>
    </aside>
  );
};
