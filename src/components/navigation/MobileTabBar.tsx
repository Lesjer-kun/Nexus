import React from 'react';
import { NAV_ITEMS, type ActiveTabType } from '../layout/NavItems';

export type { ActiveTabType };

interface MobileTabBarProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  pendingReviewCount: number;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewCount,
}) => {
  return (
    <nav
      id="nexus-bottom-tab-bar"
      className="z-30 flex w-full shrink-0 items-stretch justify-between border-t border-line bg-panel/95 px-1 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      {NAV_ITEMS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'REVIEW' && pendingReviewCount > 0 ? pendingReviewCount : null;

        return (
          <button
            key={tab.id}
            id={`tab-button-${tab.id.toLowerCase()}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative min-w-0 max-w-[84px] flex-1 rounded-lg px-0.5 py-1.5 transition-colors ${
              isActive ? 'text-ember' : 'text-muted hover:text-ink'
            }`}
          >
            <div className="relative mx-auto flex h-6 w-6 items-center justify-center">
              {isActive && <span className="absolute inset-0 rounded-md bg-ember/12" />}
              <Icon className={`relative z-10 h-4 w-4 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.7px]'}`} />
              {badge !== null && (
                <span className="absolute -top-1.5 -right-2 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ember text-[9px] font-bold text-white shadow-sm">
                  {badge}
                </span>
              )}
            </div>
            <span className="mt-0.5 block w-full truncate text-center text-[10px] leading-tight sm:text-[11px]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
