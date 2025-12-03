/**
 * Theme Tokens
 *
 * Three-level token system for adaptive UI complexity:
 * - Basic: HIG + Material (SMB quick, friendly, accessible)
 * - Intermediate: Fluent + Carbon (advisor, data emphasis)
 * - Advanced: Clarity + Spectrum + Ant + Atlassian (expert, analytical)
 */

export type ThemeLevel = "basic" | "intermediate" | "advanced";

/**
 * Color tokens
 */
export interface ColorTokens {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryHover: string;
  background: string;
  backgroundElevated: string;
  foreground: string;
  foregroundMuted: string;
  border: string;
  borderSubtle: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  // Chart-specific colors
  chart: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    quinary: string;
  };
}

/**
 * Typography tokens
 */
export interface TypographyTokens {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

/**
 * Spacing tokens
 */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
}

/**
 * Radius tokens
 */
export interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Elevation tokens (box-shadow)
 */
export interface ElevationTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Motion tokens (animation duration)
 */
export interface MotionTokens {
  fast: string;
  normal: string;
  slow: string;
  easing: {
    default: string;
    in: string;
    out: string;
    inOut: string;
  };
}

/**
 * Complete theme tokens
 */
export interface ThemeTokens {
  level: ThemeLevel;
  name: string;
  description: string;
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  elevation: ElevationTokens;
  motion: MotionTokens;
}

/**
 * Basic Theme (HIG + Material)
 * Target: SMB users, quick decisions, friendly interface
 * Characteristics: Larger spacing, soft shadows, accessible contrast, pastel charts
 */
export const basicTheme: ThemeTokens = {
  level: "basic",
  name: "Basic",
  description:
    "Friendly, accessible interface for SMB quick decisions (HIG + Material inspired)",

  color: {
    primary: "hsl(210, 100%, 50%)",
    primaryHover: "hsl(210, 100%, 45%)",
    primaryActive: "hsl(210, 100%, 40%)",
    secondary: "hsl(210, 20%, 90%)",
    secondaryHover: "hsl(210, 20%, 85%)",
    background: "hsl(0, 0%, 100%)",
    backgroundElevated: "hsl(0, 0%, 98%)",
    foreground: "hsl(210, 10%, 20%)",
    foregroundMuted: "hsl(210, 10%, 50%)",
    border: "hsl(210, 20%, 85%)",
    borderSubtle: "hsl(210, 20%, 92%)",
    success: "hsl(140, 60%, 50%)",
    warning: "hsl(40, 95%, 55%)",
    error: "hsl(0, 80%, 60%)",
    info: "hsl(200, 90%, 55%)",
    chart: {
      primary: "hsl(210, 70%, 65%)",
      secondary: "hsl(140, 55%, 60%)",
      tertiary: "hsl(280, 60%, 65%)",
      quaternary: "hsl(30, 75%, 65%)",
      quinary: "hsl(340, 65%, 65%)",
    },
  },

  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
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
    letterSpacing: {
      tight: "-0.01em",
      normal: "0",
      wide: "0.02em",
    },
  },

  spacing: {
    xs: "0.5rem", // 8px
    sm: "0.75rem", // 12px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },

  radius: {
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.25rem", // 20px
    full: "9999px",
  },

  elevation: {
    none: "none",
    sm: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
  },

  motion: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms",
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
};

/**
 * Intermediate Theme (Fluent + Carbon)
 * Target: Advisors, data-driven decisions, professional interface
 * Characteristics: Tighter spacing, medium shadows, data emphasis, neutral charts
 */
export const intermediateTheme: ThemeTokens = {
  level: "intermediate",
  name: "Intermediate",
  description:
    "Professional, data-driven interface for advisors (Fluent + Carbon inspired)",

  color: {
    primary: "hsl(210, 100%, 45%)",
    primaryHover: "hsl(210, 100%, 40%)",
    primaryActive: "hsl(210, 100%, 35%)",
    secondary: "hsl(210, 15%, 88%)",
    secondaryHover: "hsl(210, 15%, 83%)",
    background: "hsl(0, 0%, 100%)",
    backgroundElevated: "hsl(0, 0%, 97%)",
    foreground: "hsl(210, 12%, 16%)",
    foregroundMuted: "hsl(210, 10%, 45%)",
    border: "hsl(210, 15%, 82%)",
    borderSubtle: "hsl(210, 15%, 90%)",
    success: "hsl(140, 55%, 45%)",
    warning: "hsl(40, 90%, 50%)",
    error: "hsl(0, 75%, 55%)",
    info: "hsl(200, 85%, 50%)",
    chart: {
      primary: "hsl(210, 80%, 50%)",
      secondary: "hsl(180, 60%, 45%)",
      tertiary: "hsl(270, 55%, 55%)",
      quaternary: "hsl(30, 70%, 55%)",
      quinary: "hsl(330, 60%, 55%)",
    },
  },

  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: "0.6875rem", // 11px
      sm: "0.8125rem", // 13px
      base: "0.9375rem", // 15px
      lg: "1.0625rem", // 17px
      xl: "1.1875rem", // 19px
      "2xl": "1.375rem", // 22px
      "3xl": "1.75rem", // 28px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
    letterSpacing: {
      tight: "-0.015em",
      normal: "0",
      wide: "0.015em",
    },
  },

  spacing: {
    xs: "0.375rem", // 6px
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.5rem", // 24px
    "2xl": "2rem", // 32px
    "3xl": "3rem", // 48px
  },

  radius: {
    sm: "0.25rem", // 4px
    md: "0.5rem", // 8px
    lg: "0.625rem", // 10px
    xl: "0.75rem", // 12px
    full: "9999px",
  },

  elevation: {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(0, 0, 0, 0.06)",
    md: "0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 3px rgba(0, 0, 0, 0.06)",
    lg: "0 6px 10px rgba(0, 0, 0, 0.12), 0 3px 5px rgba(0, 0, 0, 0.08)",
    xl: "0 12px 20px rgba(0, 0, 0, 0.15), 0 6px 8px rgba(0, 0, 0, 0.1)",
  },

  motion: {
    fast: "120ms",
    normal: "200ms",
    slow: "300ms",
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
};

/**
 * Advanced Theme (Clarity + Spectrum + Ant + Atlassian)
 * Target: Experts, analytical reporting, dense information
 * Characteristics: Dense spacing, crisp shadows, compact typography, analytical charts
 */
export const advancedTheme: ThemeTokens = {
  level: "advanced",
  name: "Advanced",
  description:
    "Dense, analytical interface for expert reporting (Clarity + Spectrum + Ant + Atlassian inspired)",

  color: {
    primary: "hsl(210, 100%, 42%)",
    primaryHover: "hsl(210, 100%, 37%)",
    primaryActive: "hsl(210, 100%, 32%)",
    secondary: "hsl(210, 12%, 86%)",
    secondaryHover: "hsl(210, 12%, 81%)",
    background: "hsl(0, 0%, 100%)",
    backgroundElevated: "hsl(0, 0%, 98%)",
    foreground: "hsl(210, 15%, 12%)",
    foregroundMuted: "hsl(210, 10%, 40%)",
    border: "hsl(210, 12%, 80%)",
    borderSubtle: "hsl(210, 12%, 88%)",
    success: "hsl(140, 50%, 42%)",
    warning: "hsl(40, 85%, 48%)",
    error: "hsl(0, 70%, 52%)",
    info: "hsl(200, 80%, 48%)",
    chart: {
      primary: "hsl(210, 90%, 45%)",
      secondary: "hsl(170, 65%, 40%)",
      tertiary: "hsl(260, 60%, 50%)",
      quaternary: "hsl(25, 75%, 50%)",
      quinary: "hsl(320, 65%, 50%)",
    },
  },

  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: "0.625rem", // 10px
      sm: "0.75rem", // 12px
      base: "0.875rem", // 14px
      lg: "1rem", // 16px
      xl: "1.125rem", // 18px
      "2xl": "1.25rem", // 20px
      "3xl": "1.625rem", // 26px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.15,
      normal: 1.35,
      relaxed: 1.5,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.01em",
    },
  },

  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    "3xl": "2rem", // 32px
  },

  radius: {
    sm: "0.125rem", // 2px
    md: "0.25rem", // 4px
    lg: "0.375rem", // 6px
    xl: "0.5rem", // 8px
    full: "9999px",
  },

  elevation: {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08)",
    md: "0 2px 4px rgba(0, 0, 0, 0.14), 0 1px 2px rgba(0, 0, 0, 0.1)",
    lg: "0 4px 8px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.12)",
    xl: "0 8px 16px rgba(0, 0, 0, 0.18), 0 4px 6px rgba(0, 0, 0, 0.14)",
  },

  motion: {
    fast: "100ms",
    normal: "180ms",
    slow: "250ms",
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
};

/**
 * Theme registry
 */
export const themeRegistry: Record<ThemeLevel, ThemeTokens> = {
  basic: basicTheme,
  intermediate: intermediateTheme,
  advanced: advancedTheme,
};

/**
 * Get theme tokens by level
 */
export function getThemeTokens(level: ThemeLevel): ThemeTokens {
  return themeRegistry[level];
}

/**
 * Get all available theme levels
 */
export function getThemeLevels(): ThemeLevel[] {
  return ["basic", "intermediate", "advanced"];
}

/**
 * Validate theme level
 */
export function isValidThemeLevel(level: string): level is ThemeLevel {
  return level === "basic" || level === "intermediate" || level === "advanced";
}

/**
 * Export for JSON serialization
 */
export const themeTokensJSON = {
  basic: basicTheme,
  intermediate: intermediateTheme,
  advanced: advancedTheme,
};
