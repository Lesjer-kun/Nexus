/**
 * ThemeContext - Theme Provider with Accessibility Preferences
 * 
 * Provides theme configuration including:
 * - Design tokens (colors, typography, spacing, etc.)
 * - Accessibility preferences (reduced motion, high contrast, font size)
 * - System preference detection (prefers-reduced-motion, prefers-contrast)
 * - Local storage persistence
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.13, 14.14, 4.1, 4.2, 4.3, 4.4
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { designTokens, DesignTokens, createCSSVariables } from '../design-system/tokens';

/**
 * Theme mode - currently supports light mode, dark mode ready for future
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Font size preference options
 */
export type FontSizePreference = 'default' | 'large' | 'x-large';

/**
 * Accessibility preferences configuration
 */
export interface AccessibilityPreferences {
  reducedMotion: boolean;      // User or system preference for reduced motion
  highContrast: boolean;        // User or system preference for high contrast
  fontSize: FontSizePreference; // User-selected font size
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  mode: ThemeMode;
  tokens: DesignTokens;
  preferences: AccessibilityPreferences;
}

/**
 * Theme context type with configuration and setters
 */
interface ThemeContextType {
  config: ThemeConfig;
  setThemeMode: (mode: ThemeMode) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: FontSizePreference) => void;
}

/**
 * Local storage keys for persisting preferences
 */
const STORAGE_KEYS = {
  THEME_MODE: 'nexus-theme-mode',
  REDUCED_MOTION: 'nexus-reduced-motion',
  HIGH_CONTRAST: 'nexus-high-contrast',
  FONT_SIZE: 'nexus-font-size',
} as const;

/**
 * Font size scale multipliers
 */
const FONT_SIZE_SCALES = {
  default: 1.0,
  large: 1.15,
  'x-large': 1.3,
} as const;

/**
 * Theme context with default values
 */
const ThemeContext = createContext<ThemeContextType>({
  config: {
    mode: 'light',
    tokens: designTokens,
    preferences: {
      reducedMotion: false,
      highContrast: false,
      fontSize: 'default',
    },
  },
  setThemeMode: () => {},
  setReducedMotion: () => {},
  setHighContrast: () => {},
  setFontSize: () => {},
});

/**
 * Detects system preference for reduced motion
 */
const detectReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Detects system preference for high contrast
 */
const detectHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Check for prefers-contrast media query
  const prefersMore = window.matchMedia('(prefers-contrast: more)').matches;
  const prefersHigh = window.matchMedia('(prefers-contrast: high)').matches;
  return prefersMore || prefersHigh;
};

/**
 * Loads preference from localStorage with fallback
 */
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Saves preference to localStorage
 */
const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

/**
 * ThemeProvider component
 * 
 * Manages theme configuration and accessibility preferences.
 * Detects system preferences and persists user settings to localStorage.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Detect system preferences on mount
  const systemReducedMotion = detectReducedMotion();
  const systemHighContrast = detectHighContrast();

  // Load saved preferences from localStorage
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    loadFromStorage(STORAGE_KEYS.THEME_MODE, 'light')
  );

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    // Check if user has explicitly set a preference
    const userPreference = loadFromStorage<boolean | null>(STORAGE_KEYS.REDUCED_MOTION, null);
    // If user hasn't set preference, use system preference
    return userPreference !== null ? userPreference : systemReducedMotion;
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    const userPreference = loadFromStorage<boolean | null>(STORAGE_KEYS.HIGH_CONTRAST, null);
    return userPreference !== null ? userPreference : systemHighContrast;
  });

  const [fontSize, setFontSizeState] = useState<FontSizePreference>(() =>
    loadFromStorage(STORAGE_KEYS.FONT_SIZE, 'default')
  );

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      const userPreference = loadFromStorage<boolean | null>(STORAGE_KEYS.REDUCED_MOTION, null);
      if (userPreference === null) {
        setReducedMotionState(e.matches);
      }
    };

    const highContrastQuery = window.matchMedia('(prefers-contrast: more), (prefers-contrast: high)');
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      const userPreference = loadFromStorage<boolean | null>(STORAGE_KEYS.HIGH_CONTRAST, null);
      if (userPreference === null) {
        setHighContrastState(e.matches);
      }
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // Apply CSS custom properties to document root
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const cssVars = createCSSVariables(designTokens);

    // Apply all CSS variables
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply font size scaling
    const scale = FONT_SIZE_SCALES[fontSize];
    root.style.setProperty('--font-size-scale', scale.toString());
    root.style.fontSize = `${scale * 100}%`;

    // Apply reduced motion class
    if (reducedMotion) {
      root.classList.add('reduce-motion');
      // Set all animation durations to 0ms
      root.style.setProperty('--duration-fast', '0ms');
      root.style.setProperty('--duration-base', '0ms');
      root.style.setProperty('--duration-slow', '0ms');
    } else {
      root.classList.remove('reduce-motion');
      // Restore normal animation durations
      root.style.setProperty('--duration-fast', designTokens.animations.duration.fast);
      root.style.setProperty('--duration-base', designTokens.animations.duration.base);
      root.style.setProperty('--duration-slow', designTokens.animations.duration.slow);
    }

    // Apply high contrast class
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply theme mode class
    root.classList.remove('light', 'dark');
    root.classList.add(themeMode);
  }, [fontSize, reducedMotion, highContrast, themeMode]);

  // Preference setters with localStorage persistence
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveToStorage(STORAGE_KEYS.THEME_MODE, mode);
  };

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
    saveToStorage(STORAGE_KEYS.REDUCED_MOTION, enabled);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    saveToStorage(STORAGE_KEYS.HIGH_CONTRAST, enabled);
  };

  const setFontSize = (size: FontSizePreference) => {
    setFontSizeState(size);
    saveToStorage(STORAGE_KEYS.FONT_SIZE, size);
  };

  // Memoize the theme configuration
  const config: ThemeConfig = useMemo(
    () => ({
      mode: themeMode,
      tokens: designTokens,
      preferences: {
        reducedMotion,
        highContrast,
        fontSize,
      },
    }),
    [themeMode, reducedMotion, highContrast, fontSize]
  );

  // Memoize the context value
  const contextValue: ThemeContextType = useMemo(
    () => ({
      config,
      setThemeMode,
      setReducedMotion,
      setHighContrast,
      setFontSize,
    }),
    [config]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access theme context
 * 
 * @returns Theme context with configuration and setters
 * @throws Error if used outside ThemeProvider
 * 
 * @example
 * const { config, setFontSize } = useTheme();
 * const { preferences } = config;
 * 
 * // Apply reduced motion check
 * const shouldAnimate = !preferences.reducedMotion;
 * 
 * // Update font size
 * setFontSize('large');
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

/**
 * Default export for convenience
 */
export default ThemeProvider;
