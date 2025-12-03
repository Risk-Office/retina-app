import type { ThemeLevel } from "@/polymet/data/theme-tokens";

/**
 * Decision Workflow Layers
 *
 * Maps the 8-layer decision framework to interface complexity levels.
 * Each layer represents a stage in the decision-making process with
 * appropriate UI complexity.
 */
export type DecisionLayer =
  | "goals-kpis" // Layer 1: Goals/KPIs Wizard
  | "options-tradeoffs" // Layer 2: Options & Trade-off framing
  | "risk-mapping" // Layer 3: Risk mapping
  | "scenario-modeling" // Layer 4: Scenario modeling/simulation
  | "game-bayesian" // Layer 5: Game theory/Bayesian
  | "copula-dependence" // Layer 6: Copula/Dependence
  | "portfolio" // Layer 7: Portfolio management
  | "close-report"; // Layer 8: Close/Report

/**
 * Layer Theme Mapping
 *
 * Defines which interface level should be used for each decision layer:
 * - Basic: Simple, guided workflows (Layers 1-2)
 * - Intermediate: Moderate complexity (Layers 3-4, 8)
 * - Advanced: Expert features (Layers 5-7)
 */
export const LAYER_THEME_MAP: Record<DecisionLayer, ThemeLevel> = {
  "goals-kpis": "basic", // Layer 1
  "options-tradeoffs": "basic", // Layer 2
  "risk-mapping": "intermediate", // Layer 3
  "scenario-modeling": "intermediate", // Layer 4
  "game-bayesian": "advanced", // Layer 5
  "copula-dependence": "advanced", // Layer 6
  portfolio: "advanced", // Layer 7
  "close-report": "intermediate", // Layer 8
};

/**
 * Route-to-Layer Mapping
 *
 * Maps application routes to decision layers for automatic theme switching.
 */
export const ROUTE_LAYER_MAP: Record<string, DecisionLayer> = {
  // Goals & Objectives routes
  "/retina/goals": "goals-kpis",
  "/retina/goals/new": "goals-kpis",
  "/retina/goals/map": "goals-kpis",
  "/retina/goals/matrix": "goals-kpis",
  "/retina/stakeholders": "goals-kpis",

  // i-Decide module routes (mapped to layers)
  "/retina/modules/i-decide": "options-tradeoffs", // Default to Layer 2

  // Portfolio routes
  "/retina/portfolios": "portfolio",

  // Dashboard and other routes (default to intermediate)
  "/retina": "options-tradeoffs",
  "/retina/dashboard": "options-tradeoffs",
  "/retina/modules": "options-tradeoffs",
};

/**
 * Panel-to-Layer Mapping
 *
 * Maps UI panels/sections within i-Decide to specific layers.
 * Used for dynamic theme switching within a single page.
 */
export const PANEL_LAYER_MAP: Record<string, DecisionLayer> = {
  // Layer 1: Goals/KPIs
  "goal-selector": "goals-kpis",
  "goal-wizard": "goals-kpis",
  "kpi-dashboard": "goals-kpis",

  // Layer 2: Options & Trade-offs
  "options-section": "options-tradeoffs",
  "option-financials": "options-tradeoffs",
  "option-partners": "options-tradeoffs",
  "option-summary": "options-tradeoffs",
  "templates-drawer": "options-tradeoffs",

  // Layer 3: Risk mapping
  "risk-assessment": "risk-mapping",
  "assumptions-panel": "risk-mapping",
  "guardrails-drawer": "risk-mapping",
  "sensitivity-tornado": "risk-mapping",

  // Layer 4: Scenario modeling/simulation
  "scenario-builder": "scenario-modeling",
  "scenario-templates": "scenario-modeling",
  "simulation-results": "scenario-modeling",
  "metrics-section": "scenario-modeling",
  "stress-test-panel": "scenario-modeling",

  // Layer 5: Game theory/Bayesian
  "game-interaction": "game-bayesian",
  "bayesian-prior": "game-bayesian",
  "utility-management": "game-bayesian",

  // Layer 6: Copula/Dependence
  "copula-matrix": "copula-dependence",
  "dependence-panel": "copula-dependence",

  // Layer 7: Portfolio
  "portfolio-manager": "portfolio",
  "portfolio-optimizer": "portfolio",
  "portfolio-brief": "portfolio",

  // Layer 8: Close/Report
  "decision-close": "close-report",
  "board-summary": "close-report",
  "outcome-logger": "close-report",
  "feedback-loop": "close-report",
};

/**
 * Tenant Layer Override
 *
 * Allows tenants to override the default layer-to-theme mapping.
 * Stored in localStorage per tenant.
 */
export interface TenantLayerOverride {
  tenantId: string;
  overrides: Partial<Record<DecisionLayer, ThemeLevel>>;
}

/**
 * Get tenant layer overrides from localStorage
 */
export function getTenantLayerOverrides(
  tenantId: string
): Partial<Record<DecisionLayer, ThemeLevel>> {
  try {
    const key = `retina_layer_overrides_${tenantId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored) as TenantLayerOverride;
      return data.overrides || {};
    }
  } catch (error) {
    console.error("Failed to load tenant layer overrides:", error);
  }
  return {};
}

/**
 * Save tenant layer overrides to localStorage
 */
export function saveTenantLayerOverrides(
  tenantId: string,
  overrides: Partial<Record<DecisionLayer, ThemeLevel>>
): void {
  try {
    const key = `retina_layer_overrides_${tenantId}`;
    const data: TenantLayerOverride = {
      tenantId,
      overrides,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save tenant layer overrides:", error);
  }
}

/**
 * Resolve theme level for a given route
 *
 * @param routeId - Route path (e.g., "/retina/goals")
 * @param tenantId - Optional tenant ID for overrides
 * @returns Theme level for the route
 */
export function resolveRouteTheme(
  routeId: string,
  tenantId?: string
): ThemeLevel {
  // Find matching route (exact match first, then prefix match)
  let layer: DecisionLayer | undefined;

  // Exact match
  if (ROUTE_LAYER_MAP[routeId]) {
    layer = ROUTE_LAYER_MAP[routeId];
  } else {
    // Prefix match (find longest matching prefix)
    const matchingRoutes = Object.keys(ROUTE_LAYER_MAP)
      .filter((route) => routeId.startsWith(route))
      .sort((a, b) => b.length - a.length); // Sort by length descending

    if (matchingRoutes.length > 0) {
      layer = ROUTE_LAYER_MAP[matchingRoutes[0]];
    }
  }

  // Default to basic if no match
  if (!layer) {
    return "basic";
  }

  // Apply tenant override if available
  if (tenantId) {
    const overrides = getTenantLayerOverrides(tenantId);
    if (overrides[layer]) {
      return overrides[layer]!;
    }
  }

  return LAYER_THEME_MAP[layer];
}

/**
 * Resolve theme level for a given panel
 *
 * @param panelId - Panel identifier (e.g., "scenario-builder")
 * @param tenantId - Optional tenant ID for overrides
 * @returns Theme level for the panel
 */
export function resolvePanelTheme(
  panelId: string,
  tenantId?: string
): ThemeLevel {
  const layer = PANEL_LAYER_MAP[panelId];

  // Default to basic if no match
  if (!layer) {
    return "basic";
  }

  // Apply tenant override if available
  if (tenantId) {
    const overrides = getTenantLayerOverrides(tenantId);
    if (overrides[layer]) {
      return overrides[layer]!;
    }
  }

  return LAYER_THEME_MAP[layer];
}

/**
 * Resolve theme level for route or panel
 *
 * Convenience function that handles both routes and panels.
 *
 * @param identifier - Route path or panel ID
 * @param tenantId - Optional tenant ID for overrides
 * @returns Theme level
 */
export function resolveLayerTheme(
  identifier: string,
  tenantId?: string
): ThemeLevel {
  // Check if it's a route (starts with /)
  if (identifier.startsWith("/")) {
    return resolveRouteTheme(identifier, tenantId);
  }

  // Otherwise treat as panel ID
  return resolvePanelTheme(identifier, tenantId);
}

/**
 * Get layer for route or panel
 *
 * Returns the decision layer for a given identifier.
 *
 * @param identifier - Route path or panel ID
 * @returns Decision layer or undefined
 */
export function getLayer(identifier: string): DecisionLayer | undefined {
  if (identifier.startsWith("/")) {
    // Route
    if (ROUTE_LAYER_MAP[identifier]) {
      return ROUTE_LAYER_MAP[identifier];
    }

    // Prefix match
    const matchingRoutes = Object.keys(ROUTE_LAYER_MAP)
      .filter((route) => identifier.startsWith(route))
      .sort((a, b) => b.length - a.length);

    if (matchingRoutes.length > 0) {
      return ROUTE_LAYER_MAP[matchingRoutes[0]];
    }
  } else {
    // Panel
    return PANEL_LAYER_MAP[identifier];
  }

  return undefined;
}

/**
 * Get all layers with their theme levels
 *
 * @param tenantId - Optional tenant ID for overrides
 * @returns Map of layers to theme levels
 */
export function getAllLayerThemes(
  tenantId?: string
): Record<DecisionLayer, ThemeLevel> {
  const baseMap = { ...LAYER_THEME_MAP };

  if (tenantId) {
    const overrides = getTenantLayerOverrides(tenantId);
    Object.entries(overrides).forEach(([layer, theme]) => {
      baseMap[layer as DecisionLayer] = theme;
    });
  }

  return baseMap;
}

/**
 * Layer metadata for documentation and UI
 */
export const LAYER_METADATA: Record<
  DecisionLayer,
  {
    name: string;
    description: string;
    order: number;
  }
> = {
  "goals-kpis": {
    name: "Goals & KPIs",
    description: "Define strategic goals and key performance indicators",
    order: 1,
  },
  "options-tradeoffs": {
    name: "Options & Trade-offs",
    description: "Frame decision options and identify trade-offs",
    order: 2,
  },
  "risk-mapping": {
    name: "Risk Mapping",
    description: "Map risks, assumptions, and guardrails",
    order: 3,
  },
  "scenario-modeling": {
    name: "Scenario Modeling",
    description: "Build scenarios and run Monte Carlo simulations",
    order: 4,
  },
  "game-bayesian": {
    name: "Game Theory & Bayesian",
    description: "Apply game theory and Bayesian priors",
    order: 5,
  },
  "copula-dependence": {
    name: "Copula & Dependence",
    description: "Model complex dependencies and correlations",
    order: 6,
  },
  portfolio: {
    name: "Portfolio Management",
    description: "Manage decision portfolios and optimization",
    order: 7,
  },
  "close-report": {
    name: "Close & Report",
    description: "Finalize decisions and generate reports",
    order: 8,
  },
};
