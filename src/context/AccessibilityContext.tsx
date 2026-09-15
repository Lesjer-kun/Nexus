/**
 * Accessibility Context
 * 
 * Provides accessibility features including:
 * - ARIA live region announcement queue (polite/assertive)
 * - Focus trap stack management for modals/drawers
 * - Focus restoration utilities
 * - Announcement deduplication (ignore duplicates within 1s)
 * 
 * Requirements: 3.7, 3.8, 3.17, 15.13
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// Types
interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

interface FocusTrap {
  id: string;
  container: HTMLElement;
  restoreElement: HTMLElement | null;
}

interface AccessibilityContextValue {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  trapFocus: (id: string, container: HTMLElement) => void;
  releaseFocus: (id: string) => void;
  restoreFocus: () => void;
}

// Context
const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

// Props
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * AccessibilityProvider Component
 * 
 * Manages ARIA live regions and focus trap stack
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [focusTraps, setFocusTraps] = useState<FocusTrap[]>([]);
  
  const politeRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);
  const lastAnnouncementsRef = useRef<Map<string, number>>(new Map());

  /**
   * Announces a message to screen readers via ARIA live regions
   * Implements deduplication (ignores duplicate messages within 1s)
   * 
   * @param message - The message to announce
   * @param priority - 'polite' (default) or 'assertive'
   */
  const announceToScreenReader = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (!message) return;

    const now = Date.now();
    const lastTimestamp = lastAnnouncementsRef.current.get(message);
    
    // Check for duplicate recent announcement (within 1 second)
    if (lastTimestamp && (now - lastTimestamp) < 1000) {
      return; // Ignore duplicate
    }

    // Update last announcement timestamp
    lastAnnouncementsRef.current.set(message, now);

    // Create announcement
    const announcement: Announcement = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      priority,
      timestamp: now,
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Remove announcement after 1 second to allow same message to be announced again
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 1000);
  }, []);

  /**
   * Traps focus within a container (for modals, drawers, etc.)
   * Stores the currently focused element to restore later
   * 
   * @param id - Unique identifier for this focus trap
   * @param container - The container element to trap focus within
   */
  const trapFocus = useCallback((id: string, container: HTMLElement) => {
    // Store the currently focused element
    const restoreElement = document.activeElement as HTMLElement;

    const trap: FocusTrap = {
      id,
      container,
      restoreElement,
    };

    setFocusTraps(prev => [...prev, trap]);

    // Focus first focusable element in container
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  /**
   * Releases a specific focus trap by ID
   * Restores focus to the element that was focused before the trap
   * 
   * @param id - The ID of the focus trap to release
   */
  const releaseFocus = useCallback((id: string) => {
    setFocusTraps(prev => {
      const trap = prev.find(t => t.id === id);
      if (trap && trap.restoreElement && trap.restoreElement.focus) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          trap.restoreElement?.focus();
        }, 0);
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  /**
   * Restores focus to the last trapped element
   * Used when closing modals/drawers without a specific ID
   */
  const restoreFocus = useCallback(() => {
    setFocusTraps(prev => {
      if (prev.length === 0) return prev;
      
      const lastTrap = prev[prev.length - 1];
      if (lastTrap.restoreElement && lastTrap.restoreElement.focus) {
        setTimeout(() => {
          lastTrap.restoreElement?.focus();
        }, 0);
      }
      
      return prev.slice(0, -1);
    });
  }, []);

  // Update live regions with current announcements
  useEffect(() => {
    const politeAnnouncements = announcements.filter(a => a.priority === 'polite');
    const assertiveAnnouncements = announcements.filter(a => a.priority === 'assertive');

    if (politeRegionRef.current && politeAnnouncements.length > 0) {
      const latest = politeAnnouncements[politeAnnouncements.length - 1];
      politeRegionRef.current.textContent = latest.message;
    }

    if (assertiveRegionRef.current && assertiveAnnouncements.length > 0) {
      const latest = assertiveAnnouncements[assertiveAnnouncements.length - 1];
      assertiveRegionRef.current.textContent = latest.message;
    }
  }, [announcements]);

  // Handle keyboard navigation for focus traps
  useEffect(() => {
    if (focusTraps.length === 0) return;

    const currentTrap = focusTraps[focusTraps.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(currentTrap.container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift+Tab: Move focus backward
      if (event.shiftKey) {
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab: Move focus forward
      else {
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusTraps]);

  const value: AccessibilityContextValue = {
    announceToScreenReader,
    trapFocus,
    releaseFocus,
    restoreFocus,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Hidden ARIA live regions */}
      <div
        ref={politeRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
      <div
        ref={assertiveRegionRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to access accessibility context
 * 
 * @throws Error if used outside AccessibilityProvider
 */
export const useAccessibility = (): AccessibilityContextValue => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

/**
 * Utility function to get all focusable elements within a container
 * 
 * @param container - The container element to search within
 * @returns Array of focusable HTML elements
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Default export
 */
export default AccessibilityProvider;
