import React, { createContext, useContext, useState, useEffect } from 'react';

interface MobileViewContextType {
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  isMobileView: boolean; // true if mobile frame simulator is ON or screen width < 768px
}

const MobileViewContext = createContext<MobileViewContextType>({
  isMobileFrame: false,
  setIsMobileFrame: () => {},
  isMobileView: false,
});

export const MobileViewProvider: React.FC<{
  children: React.ReactNode;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
}> = ({ children, isMobileFrame, setIsMobileFrame }) => {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Considered mobile view if simulator mode is active OR actual browser is mobile-sized (< 768px)
  const isMobileView = isMobileFrame || windowWidth < 768;

  return (
    <MobileViewContext.Provider value={{ isMobileFrame, setIsMobileFrame, isMobileView }}>
      {children}
    </MobileViewContext.Provider>
  );
};

export const useMobileView = () => useContext(MobileViewContext);
