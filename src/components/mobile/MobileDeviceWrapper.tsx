import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileDeviceWrapperProps {
  children: React.ReactNode;
  isMobileFrame: boolean;
}

export const MobileDeviceWrapper: React.FC<MobileDeviceWrapperProps> = ({
  children,
  isMobileFrame,
}) => {
  if (!isMobileFrame) {
    return <div className="w-full h-full flex flex-col">{children}</div>;
  }

  return (
    <div className="flex-1 w-full bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Smartphone Chassis */}
      <div
        id="mobile-device-simulator-chassis"
        className="w-full max-w-[410px] h-[820px] max-h-[96vh] bg-slate-900 rounded-[44px] p-2.5 shadow-2xl border-[3px] border-slate-700 relative flex flex-col overflow-hidden ring-1 ring-white/10"
      >
        {/* Dynamic Island in Status Bar Area */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-950 rounded-full z-50 flex items-center justify-center pointer-events-none border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2 border border-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-950" />
        </div>

        {/* Status Bar */}
        <div className="h-8 px-6 flex items-center justify-between text-white text-[11px] font-semibold select-none z-40 bg-slate-900 shrink-0">
          <span className="font-mono text-[11px]">15:02</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3 h-3" />
            <span className="text-[10px] font-bold font-mono">5G</span>
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Screen Viewport Container */}
        <div className="flex-1 bg-slate-50 rounded-[28px] overflow-hidden flex flex-col relative shadow-inner">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="h-4 flex items-center justify-center shrink-0 bg-slate-900 pt-0.5">
          <div className="w-28 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
