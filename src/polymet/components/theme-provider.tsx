/**
 * Theme Provider
 *
 * Runtime theme switching system that:
 * - Reads user profile, decision mode, or page-level overrides
 * - Injects CSS variables from ThemeTokens to :root
 * - Provides SSR-safe defaults (basic level)
 * - Exposes hooks and HOCs for theme access
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import {
  type ThemeLevel,
  type ThemeTokens,
  getThemeTokens,
  basicTheme,
} from "@/polymet/data/theme-tokens";
import { useTenant } from "@/polymet/data/tenant-context";
import { resolveLayerTheme } from "@/polymet/data/layer-presets";

/**
 * Interface level source priority:
 * 1. Page-level override (highest)
 * 2. Decision mode
 * 3. Route-based layer mapping
 * 4. User profile preference
 * 5. Tenant default
 * 6. System default (basic)
 */
export type InterfaceLevelSource =
  | "page-override"
  | "decision-mode"
  | "route-layer"
  | "user-profile"
  | "tenant-default"
  | "system-default";

export interface InterfaceLevelConfig {
  level: ThemeLevel;
  source: InterfaceLevelSource;
}

export interface ThemeContextValue {
  interfaceLevel: ThemeLevel;
  tokens: ThemeTokens;
  source: InterfaceLevelSource;
  setInterfaceLevel: (level: ThemeLevel, source?: InterfaceLevelSource) => void;
  applyTheme: (level: ThemeLevel) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Get user's preferred interface level from localStorage
 */
function getUserInterfaceLevel(): ThemeLevel | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("retina:interfaceLevel");
    if (
      stored === "basic" ||
      stored === "intermediate" ||
      stored === "advanced"
    ) {
      return stored;
    }
  } catch (error) {
    console.warn("Failed to read interface level from localStorage:", error);
  }

  return null;
}

/**
 * Save user's preferred interface level to localStorage
 */
function saveUserInterfaceLevel(level: ThemeLevel): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("retina:interfaceLevel", level);
  } catch (error) {
    console.warn("Failed to save interface level to localStorage:", error);
  }
}

/**
 * Get tenant's default interface level
 */
function getTenantInterfaceLevel(tenantId: string | null): ThemeLevel | null {
  if (!tenantId || typeof window === "undefined") return null;

  try {
    const key = `retina:tenant:${tenantId}:interfaceLevel`;
    const stored = localStorage.getItem(key);
    if (
      stored === "basic" ||
      stored === "intermediate" ||
      stored === "advanced"
    ) {
      return stored;
    }
  } catch (error) {
    console.warn("Failed to read tenant interface level:", error);
  }

  return null;
}

/**
 * Apply theme tokens as CSS variables to :root
 */
export function applyTheme(level: ThemeLevel): void {
  const tokens = getThemeTokens(level);

  if (typeof window === "undefined" || !document.documentElement) {
    console.warn("applyTheme called in non-browser environment");
    return;
  }

  const root = document.documentElement;

  // Color tokens
  root.style.setProperty("--theme-primary", tokens.color.primary);
  root.style.setProperty("--theme-primary-hover", tokens.color.primaryHover);
  root.style.setProperty("--theme-primary-active", tokens.color.primaryActive);
  root.style.setProperty("--theme-secondary", tokens.color.secondary);
  root.style.setProperty(
    "--theme-secondary-hover",
    tokens.color.secondaryHover
  );
  root.style.setProperty("--theme-background", tokens.color.background);
  root.style.setProperty(
    "--theme-background-elevated",
    tokens.color.backgroundElevated
  );
  root.style.setProperty("--theme-foreground", tokens.color.foreground);
  root.style.setProperty(
    "--theme-foreground-muted",
    tokens.color.foregroundMuted
  );
  root.style.setProperty("--theme-border", tokens.color.border);
  root.style.setProperty("--theme-border-subtle", tokens.color.borderSubtle);
  root.style.setProperty("--theme-success", tokens.color.success);
  root.style.setProperty("--theme-warning", tokens.color.warning);
  root.style.setProperty("--theme-error", tokens.color.error);
  root.style.setProperty("--theme-info", tokens.color.info);

  // Chart colors
  root.style.setProperty("--theme-chart-1", tokens.color.chart.primary);
  root.style.setProperty("--theme-chart-2", tokens.color.chart.secondary);
  root.style.setProperty("--theme-chart-3", tokens.color.chart.tertiary);
  root.style.setProperty("--theme-chart-4", tokens.color.chart.quaternary);
  root.style.setProperty("--theme-chart-5", tokens.color.chart.quinary);

  // Typography tokens
  root.style.setProperty("--theme-font-family", tokens.typography.fontFamily);
  root.style.setProperty("--theme-font-size-xs", tokens.typography.fontSize.xs);
  root.style.setProperty("--theme-font-size-sm", tokens.typography.fontSize.sm);
  root.style.setProperty(
    "--theme-font-size-base",
    tokens.typography.fontSize.base
  );
  root.style.setProperty("--theme-font-size-lg", tokens.typography.fontSize.lg);
  root.style.setProperty("--theme-font-size-xl", tokens.typography.fontSize.xl);
  root.style.setProperty(
    "--theme-font-size-2xl",
    tokens.typography.fontSize["2xl"]
  );
  root.style.setProperty(
    "--theme-font-size-3xl",
    tokens.typography.fontSize["3xl"]
  );
  root.style.setProperty(
    "--theme-font-weight-normal",
    String(tokens.typography.fontWeight.normal)
  );
  root.style.setProperty(
    "--theme-font-weight-medium",
    String(tokens.typography.fontWeight.medium)
  );
  root.style.setProperty(
    "--theme-font-weight-semibold",
    String(tokens.typography.fontWeight.semibold)
  );
  root.style.setProperty(
    "--theme-font-weight-bold",
    String(tokens.typography.fontWeight.bold)
  );
  root.style.setProperty(
    "--theme-line-height-tight",
    String(tokens.typography.lineHeight.tight)
  );
  root.style.setProperty(
    "--theme-line-height-normal",
    String(tokens.typography.lineHeight.normal)
  );
  root.style.setProperty(
    "--theme-line-height-relaxed",
    String(tokens.typography.lineHeight.relaxed)
  );
  root.style.setProperty(
    "--theme-letter-spacing-tight",
    tokens.typography.letterSpacing.tight
  );
  root.style.setProperty(
    "--theme-letter-spacing-normal",
    tokens.typography.letterSpacing.normal
  );
  root.style.setProperty(
    "--theme-letter-spacing-wide",
    tokens.typography.letterSpacing.wide
  );

  // Spacing tokens
  root.style.setProperty("--theme-spacing-xs", tokens.spacing.xs);
  root.style.setProperty("--theme-spacing-sm", tokens.spacing.sm);
  root.style.setProperty("--theme-spacing-md", tokens.spacing.md);
  root.style.setProperty("--theme-spacing-lg", tokens.spacing.lg);
  root.style.setProperty("--theme-spacing-xl", tokens.spacing.xl);
  root.style.setProperty("--theme-spacing-2xl", tokens.spacing["2xl"]);
  root.style.setProperty("--theme-spacing-3xl", tokens.spacing["3xl"]);

  // Radius tokens
  root.style.setProperty("--theme-radius-sm", tokens.radius.sm);
  root.style.setProperty("--theme-radius-md", tokens.radius.md);
  root.style.setProperty("--theme-radius-lg", tokens.radius.lg);
  root.style.setProperty("--theme-radius-xl", tokens.radius.xl);
  root.style.setProperty("--theme-radius-full", tokens.radius.full);

  // Elevation tokens
  root.style.setProperty("--theme-elevation-none", tokens.elevation.none);
  root.style.setProperty("--theme-elevation-sm", tokens.elevation.sm);
  root.style.setProperty("--theme-elevation-md", tokens.elevation.md);
  root.style.setProperty("--theme-elevation-lg", tokens.elevation.lg);
  root.style.setProperty("--theme-elevation-xl", tokens.elevation.xl);

  // Motion tokens
  root.style.setProperty("--theme-motion-fast", tokens.motion.fast);
  root.style.setProperty("--theme-motion-normal", tokens.motion.normal);
  root.style.setProperty("--theme-motion-slow", tokens.motion.slow);
  root.style.setProperty(
    "--theme-motion-easing-default",
    tokens.motion.easing.default
  );
  root.style.setProperty("--theme-motion-easing-in", tokens.motion.easing.in);
  root.style.setProperty("--theme-motion-easing-out", tokens.motion.easing.out);
  root.style.setProperty(
    "--theme-motion-easing-in-out",
    tokens.motion.easing.inOut
  );

  // Store current level as data attribute
  root.setAttribute("data-interface-level", level);

  console.log(`✅ Theme applied: ${level}`, {
    tokens: tokens.name,
    description: tokens.description,
    spacing: tokens.spacing.md,
    radius: tokens.radius.md,
    fontSize: tokens.typography.fontSize.base,
  });
}

/**
 * Remove theme CSS variables from :root
 */
function removeTheme(): void {
  if (typeof window === "undefined" || !document.documentElement) return;

  const root = document.documentElement;
  const themeVars = Array.from(root.style).filter((prop) =>
    prop.startsWith("--theme-")
  );

  themeVars.forEach((prop) => {
    root.style.removeProperty(prop);
  });

  root.removeAttribute("data-interface-level");
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultLevel?: ThemeLevel;
  pageOverride?: ThemeLevel;
  decisionMode?: ThemeLevel;
  enableRouteThemes?: boolean; // Enable automatic route-based theme switching
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultLevel = "basic",
  pageOverride,
  decisionMode,
  enableRouteThemes = true,
}: ThemeProviderProps) {
  const { tenantId } = useTenant();
  const location = useLocation();

  // Determine initial interface level with priority
  const getInitialLevel = useCallback((): InterfaceLevelConfig => {
    // 1. Page-level override (highest priority)
    if (pageOverride) {
      return { level: pageOverride, source: "page-override" };
    }

    // 2. Decision mode
    if (decisionMode) {
      return { level: decisionMode, source: "decision-mode" };
    }

    // 3. Route-based layer mapping (if enabled)
    if (enableRouteThemes && location?.pathname) {
      const routeTheme = resolveLayerTheme(location.pathname, tenantId);
      return { level: routeTheme, source: "route-layer" };
    }

    // 4. User profile preference
    const userLevel = getUserInterfaceLevel();
    if (userLevel) {
      return { level: userLevel, source: "user-profile" };
    }

    // 5. Tenant default
    const tenantLevel = getTenantInterfaceLevel(tenantId);
    if (tenantLevel) {
      return { level: tenantLevel, source: "tenant-default" };
    }

    // 6. System default
    return { level: defaultLevel, source: "system-default" };
  }, [
    pageOverride,
    decisionMode,
    enableRouteThemes,
    location?.pathname,
    tenantId,
    defaultLevel,
  ]);

  const [config, setConfig] = useState<InterfaceLevelConfig>(getInitialLevel);

  // Apply theme on mount and when level changes
  useEffect(() => {
    applyTheme(config.level);

    return () => {
      // Cleanup on unmount
      removeTheme();
    };
  }, [config.level]);

  // Update when props or route changes
  useEffect(() => {
    const newConfig = getInitialLevel();
    if (
      newConfig.level !== config.level ||
      newConfig.source !== config.source
    ) {
      setConfig(newConfig);
      console.log(
        `🎨 Theme auto-switched: ${newConfig.level} (source: ${newConfig.source}, route: ${location?.pathname})`
      );
    }
  }, [
    pageOverride,
    decisionMode,
    tenantId,
    location?.pathname,
    enableRouteThemes,
    getInitialLevel,
    config.level,
    config.source,
  ]);

  const tokens = useMemo(() => getThemeTokens(config.level), [config.level]);

  const setInterfaceLevel = useCallback(
    (level: ThemeLevel, source: InterfaceLevelSource = "user-profile") => {
      setConfig({ level, source });

      // Save to localStorage if it's a user preference
      if (source === "user-profile") {
        saveUserInterfaceLevel(level);
      }

      console.log(`🎨 Interface level changed: ${level} (source: ${source})`);
    },
    []
  );

  const applyThemeCallback = useCallback((level: ThemeLevel) => {
    applyTheme(level);
    setConfig({ level, source: "user-profile" });
    saveUserInterfaceLevel(level);
  }, []);

  const resetTheme = useCallback(() => {
    const defaultConfig = getInitialLevel();
    setConfig(defaultConfig);
    applyTheme(defaultConfig.level);
    console.log(
      `🔄 Theme reset to: ${defaultConfig.level} (source: ${defaultConfig.source})`
    );
  }, [getInitialLevel]);

  const value: ThemeContextValue = useMemo(
    () => ({
      interfaceLevel: config.level,
      tokens,
      source: config.source,
      setInterfaceLevel,
      applyTheme: applyThemeCallback,
      resetTheme,
    }),
    [
      config.level,
      config.source,
      tokens,
      setInterfaceLevel,
      applyThemeCallback,
      resetTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access interface level and theme tokens
 */
export function useInterfaceLevel(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    // SSR-safe fallback
    console.warn(
      "useInterfaceLevel called outside ThemeProvider, returning basic theme"
    );
    return {
      interfaceLevel: "basic",
      tokens: basicTheme,
      source: "system-default",
      setInterfaceLevel: () => {
        console.warn("setInterfaceLevel called outside ThemeProvider");
      },
      applyTheme: () => {
        console.warn("applyTheme called outside ThemeProvider");
      },
      resetTheme: () => {
        console.warn("resetTheme called outside ThemeProvider");
      },
    };
  }

  return context;
}

/**
 * HOC to inject theme props into a component
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ThemeContextValue }>
): React.FC<P> {
  const WithThemeComponent: React.FC<P> = (props) => {
    const theme = useInterfaceLevel();
    return <Component {...props} theme={theme} />;
  };

  WithThemeComponent.displayName = `withTheme(${
    Component.displayName || Component.name || "Component"
  })`;

  return WithThemeComponent;
}

/**
 * Hook to get current theme tokens
 */
export function useThemeTokens(): ThemeTokens {
  const { tokens } = useInterfaceLevel();
  return tokens;
}

/**
 * Hook to check if a specific interface level is active
 */
export function useIsInterfaceLevel(level: ThemeLevel): boolean {
  const { interfaceLevel } = useInterfaceLevel();
  return interfaceLevel === level;
}

/**
 * Hook to apply panel-based theme
 *
 * Use this hook in components that represent specific decision layers
 * to automatically switch the theme based on the panel ID.
 *
 * @param panelId - Panel identifier (e.g., "scenario-builder")
 * @param enabled - Whether to apply the panel theme (default: true)
 *
 * @example
 * ```tsx
 * function ScenarioBuilder() {
 *   usePanelTheme("scenario-builder");
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePanelTheme(panelId: string, enabled: boolean = true): void {
  const { setInterfaceLevel } = useInterfaceLevel();
  const { tenantId } = useTenant();

  useEffect(() => {
    if (!enabled) return;

    const panelTheme = resolveLayerTheme(panelId, tenantId);
    setInterfaceLevel(panelTheme, "decision-mode");

    console.log(`🎭 Panel theme applied: ${panelTheme} (panel: ${panelId})`);
  }, [panelId, enabled, tenantId, setInterfaceLevel]);
}

/**
 * Hook to get theme level for a route or panel without applying it
 *
 * @param identifier - Route path or panel ID
 * @returns Theme level for the identifier
 */
export function useResolveTheme(identifier: string): ThemeLevel {
  const { tenantId } = useTenant();
  return useMemo(
    () => resolveLayerTheme(identifier, tenantId),
    [identifier, tenantId]
  );
}
