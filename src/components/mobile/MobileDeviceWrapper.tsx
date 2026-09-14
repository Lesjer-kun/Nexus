import React from 'react';
import { Battery, Signal, Wifi } from 'lucide-react';

interface MobileDeviceWrapperProps {
  children: React.ReactNode;
  isMobileFrame: boolean;
}

export const MobileDeviceWrapper: React.FC<MobileDeviceWrapperProps> = ({
  children,
  isMobileFrame,
}) => {
  if (!isMobileFrame) {
    return <div className="flex h-full w-full flex-col">{children}</div>;
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_#2a241c_0%,_#12151a_55%)] p-3 sm:p-6">
      <div
        id="mobile-device-simulator-chassis"
        className="relative flex h-[820px] max-h-[96vh] w-full max-w-[390px] flex-col overflow-hidden rounded-[2.35rem] border border-ink-3 bg-ink p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="pointer-events-none absolute top-3.5 left-1/2 z-50 h-5 w-24 -translate-x-1/2 rounded-full border border-ink-3 bg-black" />

        <div className="z-40 flex h-8 shrink-0 items-center justify-between px-6 text-[11px] font-semibold text-paper select-none">
          <span className="font-mono">15:02</span>
          <div className="flex items-center gap-1.5 text-paper/70">
            <Signal className="h-3 w-3" />
            <span className="font-mono text-[10px] font-bold">5G</span>
            <Wifi className="h-3 w-3" />
            <Battery className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-[1.7rem] bg-paper">
          {children}
        </div>

        <div className="flex h-4 shrink-0 items-center justify-center bg-ink pt-0.5">
          <div className="h-1 w-28 rounded-full bg-ink-3" />
        </div>
      </div>
    </div>
  );
};
