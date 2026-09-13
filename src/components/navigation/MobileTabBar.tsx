import React from 'react';
import { Mic, CheckSquare, Calendar, Sparkles, ShieldAlert } from 'lucide-react';

export type ActiveTabType = 'CAPTURE' | 'REVIEW' | 'SCHEDULE' | 'MEMORY' | 'AUDIT';

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
  const tabs = [
    {
      id: 'CAPTURE' as ActiveTabType,
      label: 'Capture',
      icon: Mic,
      badge: null,
    },
    {
      id: 'REVIEW' as ActiveTabType,
      label: 'Review',
      icon: CheckSquare,
      badge: pendingReviewCount > 0 ? pendingReviewCount : null,
    },
    {
      id: 'SCHEDULE' as ActiveTabType,
      label: 'Schedule',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'MEMORY' as ActiveTabType,
      label: 'Memory',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'AUDIT' as ActiveTabType,
      label: 'Audit',
      icon: ShieldAlert,
      badge: null,
    },
  ];

  return (
    <nav
      id="nexus-bottom-tab-bar"
      className="bg-white border-t border-slate-200 py-1 px-1 flex items-center justify-between shrink-0 z-30 shadow-md w-full"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`tab-button-${tab.id.toLowerCase()}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors relative min-w-0 max-w-[80px] ${
              isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              {tab.badge !== null && (
                <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] mt-0.5 truncate w-full text-center leading-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
