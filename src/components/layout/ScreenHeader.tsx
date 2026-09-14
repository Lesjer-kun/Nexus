import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ScreenHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  trailing?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  trailing,
}) => {
  return (
    <header className="shrink-0 border-b border-line bg-panel/90 px-4 py-3.5 backdrop-blur-sm sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-signal">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-signal-soft text-signal">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-[11px]">
              {eyebrow}
            </span>
          </div>
          <h2 className="mt-1.5 text-[17px] font-semibold tracking-tight text-ink sm:text-lg">{title}</h2>
          {description && (
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted sm:text-[13px]">{description}</p>
          )}
        </div>
        {trailing && <div className="shrink-0 pt-0.5">{trailing}</div>}
      </div>
    </header>
  );
};
