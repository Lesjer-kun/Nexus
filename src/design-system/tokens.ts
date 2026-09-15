/**
 * Design Tokens Configuration
 * 
 * Centralized design tokens for NEXUS UI/UX redesign.
 * Defines colors, typography, spacing, shadows, animations, and border radius values.
 * 
 * Requirements: 1.1, 2.1, 2.2, 2.6, 2.7, 4.5
 */

export interface DesignTokens {
  colors: {
    // Core palette
    ink: string;          // #12151a - Primary text
    ink2: string;         // #1c222b - Secondary text
    ink3: string;         // #2a3340 - Tertiary elements
    paper: string;        // #f3efe6 - Primary background
    panel: string;        // #fbf8f2 - Secondary background
    line: string;         // #e4d9c8 - Borders
    muted: string;        // #6d6458 - Disabled/subtle text
    
    // Accent colors
    ember: string;        // #c45c26 - Primary action
    emberDark: string;    // #9a4318 - Primary action hover
    signal: string;       // #1a6b6b - Success/info
    signalSoft: string;   // #d7eceb - Success/info background
    
    // Semantic colors
    success: string;      // #059669 - Success states
    successBg: string;    // #d1fae5 - Success backgrounds
    warning: string;      // #d97706 - Warning states
    warningBg: string;    // #fef3c7 - Warning backgrounds
    error: string;        // #dc2626 - Error states
    errorBg: string;      // #fee2e2 - Error backgrounds
    info: string;         // #0284c7 - Info states
    infoBg: string;       // #e0f2fe - Info backgrounds
  };
  
  typography: {
    fontFamily: {
      sans: string;       // IBM Plex Sans
      mono: string;       // IBM Plex Mono
    };
    fontSize: {
      xs: string;         // 0.75rem (12px)
      sm: string;         // 0.875rem (14px)
      base: string;       // 1rem (16px)
      lg: string;         // 1.125rem (18px)
      xl: string;         // 1.25rem (20px)
      '2xl': string;      // 1.5rem (24px)
      '3xl': string;      // 1.875rem (30px)
    };
    fontWeight: {
      normal: number;     // 400
      medium: number;     // 500
      semibold: number;   // 600
      bold: number;       // 700
    };
    lineHeight: {
      tight: number;      // 1.25
      normal: number;     // 1.5
      relaxed: number;    // 1.75
    };
  };
  
  spacing: {
    xs: string;           // 0.25rem (4px)
    sm: string;           // 0.5rem (8px)
    md: string;           // 1rem (16px)
    lg: string;           // 1.5rem (24px)
    xl: string;           // 2rem (32px)
    '2xl': string;        // 3rem (48px)
    '3xl': string;        // 4rem (64px)
  };
  
  shadows: {
    sm: string;           // Subtle elevation
    md: string;           // Card elevation
    lg: string;           // Modal elevation
    xl: string;           // Popover elevation
    glow: string;         // Accent glow effect
  };
  
  animations: {
    duration: {
      fast: string;       // 150ms
      base: string;       // 300ms
      slow: string;       // 500ms
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      spring: string;     // cubic-bezier for spring effect
    };
  };
  
  borderRadius: {
    sm: string;           // 0.25rem (4px)
    md: string;           // 0.5rem (8px)
    lg: string;           // 0.75rem (12px)
    xl: string;           // 1rem (16px)
    full: string;         // 9999px
  };
  
  breakpoints: {
    sm: string;           // 640px
    md: string;           // 768px
    lg: string;           // 1024px
    xl: string;           // 1280px
  };
}

/**
 * Default design tokens instance
 * Exported as a typed object for use throughout the application
 */
export const designTokens: DesignTokens = {
  colors: {
    // Core palette
    ink: '#12151a',
    ink2: '#1c222b',
    ink3: '#2a3340',
    paper: '#f3efe6',
    panel: '#fbf8f2',
    line: '#e4d9c8',
    muted: '#6d6458',
    
    // Accent colors
    ember: '#c45c26',
    emberDark: '#9a4318',
    signal: '#1a6b6b',
    signalSoft: '#d7eceb',
    
    // Semantic colors
    success: '#059669',
    successBg: '#d1fae5',
    warning: '#d97706',
    warningBg: '#fef3c7',
    error: '#dc2626',
    errorBg: '#fee2e2',
    info: '#0284c7',
    infoBg: '#e0f2fe',
  },
  
  typography: {
    fontFamily: {
      sans: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"IBM Plex Mono", "Fira Code", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(18, 21, 26, 0.05)',
    md: '0 4px 6px -1px rgba(18, 21, 26, 0.1), 0 2px 4px -1px rgba(18, 21, 26, 0.06)',
    lg: '0 10px 15px -3px rgba(18, 21, 26, 0.1), 0 4px 6px -2px rgba(18, 21, 26, 0.05)',
    xl: '0 20px 25px -5px rgba(18, 21, 26, 0.1), 0 10px 10px -5px rgba(18, 21, 26, 0.04)',
    glow: '0 0 20px rgba(196, 92, 38, 0.3)',
  },
  
  animations: {
    duration: {
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring effect with overshoot
    },
  },
  
  borderRadius: {
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    full: '9999px',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

/**
 * Helper function to create CSS custom properties from design tokens
 * Can be used to inject tokens into the document root
 */
export const createCSSVariables = (tokens: DesignTokens): Record<string, string> => {
  return {
    // Colors
    '--color-ink': tokens.colors.ink,
    '--color-ink-2': tokens.colors.ink2,
    '--color-ink-3': tokens.colors.ink3,
    '--color-paper': tokens.colors.paper,
    '--color-panel': tokens.colors.panel,
    '--color-line': tokens.colors.line,
    '--color-muted': tokens.colors.muted,
    '--color-ember': tokens.colors.ember,
    '--color-ember-dark': tokens.colors.emberDark,
    '--color-signal': tokens.colors.signal,
    '--color-signal-soft': tokens.colors.signalSoft,
    '--color-success': tokens.colors.success,
    '--color-success-bg': tokens.colors.successBg,
    '--color-warning': tokens.colors.warning,
    '--color-warning-bg': tokens.colors.warningBg,
    '--color-error': tokens.colors.error,
    '--color-error-bg': tokens.colors.errorBg,
    '--color-info': tokens.colors.info,
    '--color-info-bg': tokens.colors.infoBg,
    
    // Typography
    '--font-sans': tokens.typography.fontFamily.sans,
    '--font-mono': tokens.typography.fontFamily.mono,
    
    // Spacing
    '--spacing-xs': tokens.spacing.xs,
    '--spacing-sm': tokens.spacing.sm,
    '--spacing-md': tokens.spacing.md,
    '--spacing-lg': tokens.spacing.lg,
    '--spacing-xl': tokens.spacing.xl,
    '--spacing-2xl': tokens.spacing['2xl'],
    '--spacing-3xl': tokens.spacing['3xl'],
    
    // Shadows
    '--shadow-sm': tokens.shadows.sm,
    '--shadow-md': tokens.shadows.md,
    '--shadow-lg': tokens.shadows.lg,
    '--shadow-xl': tokens.shadows.xl,
    '--shadow-glow': tokens.shadows.glow,
    
    // Border Radius
    '--radius-sm': tokens.borderRadius.sm,
    '--radius-md': tokens.borderRadius.md,
    '--radius-lg': tokens.borderRadius.lg,
    '--radius-xl': tokens.borderRadius.xl,
    '--radius-full': tokens.borderRadius.full,
    
    // Animation Durations
    '--duration-fast': tokens.animations.duration.fast,
    '--duration-base': tokens.animations.duration.base,
    '--duration-slow': tokens.animations.duration.slow,
    
    // Animation Easings
    '--easing-linear': tokens.animations.easing.linear,
    '--easing-ease-in': tokens.animations.easing.easeIn,
    '--easing-ease-out': tokens.animations.easing.easeOut,
    '--easing-ease-in-out': tokens.animations.easing.easeInOut,
    '--easing-spring': tokens.animations.easing.spring,
  };
};

/**
 * Default export for convenience
 */
export default designTokens;
