import React from "react";
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Badge Components
 *
 * Adaptive badges that provide consistent "at a glance" cues across all interface levels:
 * - Basic: Color + label only
 * - Intermediate: Label + metric
 * - Advanced: Label + metric + mini-sparkline
 *
 * Driven by theme tokens for consistent styling and graceful degradation.
 */

// ============================================================================
// Types
// ============================================================================

export type RiskLevel = "low" | "medium" | "high";
export type RecommendationBasis = "ce" | "raroc" | "tcor" | "utility";
export type PortfolioStatus =
  | "feasible"
  | "infeasible"
  | "optimal"
  | "suboptimal";

export interface RiskBadgeProps {
  level: RiskLevel;
  metric?: number;
  history?: number[];
  className?: string;
  showLabel?: boolean;
}

export interface RecommendationBadgeProps {
  basis: RecommendationBasis;
  metric?: number;
  history?: number[];
  className?: string;
  showLabel?: boolean;
}

export interface PortfolioBadgeProps {
  status: PortfolioStatus;
  metric?: number;
  history?: number[];
  className?: string;
  showLabel?: boolean;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Mini sparkline component (no external libs)
 */
const MiniSparkline: React.FC<{
  data: number[];
  width?: number;
  height?: number;
  color: string;
  className?: string;
}> = ({ data, width = 40, height = 16, color, className }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Get risk level configuration
 */
const getRiskConfig = (level: RiskLevel) => {
  const configs = {
    low: {
      label: "Low Risk",
      shortLabel: "Low",
      color: "text-green-700 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950",
      border: "border-green-300 dark:border-green-800",
      sparklineColor: "rgb(34, 197, 94)",
    },
    medium: {
      label: "Medium Risk",
      shortLabel: "Med",
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-950",
      border: "border-amber-300 dark:border-amber-800",
      sparklineColor: "rgb(245, 158, 11)",
    },
    high: {
      label: "High Risk",
      shortLabel: "High",
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-950",
      border: "border-red-300 dark:border-red-800",
      sparklineColor: "rgb(239, 68, 68)",
    },
  };
  return configs[level];
};

/**
 * Get recommendation basis configuration
 */
const getRecommendationConfig = (basis: RecommendationBasis) => {
  const configs = {
    ce: {
      label: "Certainty Equivalent",
      shortLabel: "CE",
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950",
      border: "border-blue-300 dark:border-blue-800",
      sparklineColor: "rgb(59, 130, 246)",
    },
    raroc: {
      label: "RAROC",
      shortLabel: "RAROC",
      color: "text-purple-700 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-950",
      border: "border-purple-300 dark:border-purple-800",
      sparklineColor: "rgb(168, 85, 247)",
    },
    tcor: {
      label: "TCOR",
      shortLabel: "TCOR",
      color: "text-indigo-700 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-950",
      border: "border-indigo-300 dark:border-indigo-800",
      sparklineColor: "rgb(99, 102, 241)",
    },
    utility: {
      label: "Utility",
      shortLabel: "Utility",
      color: "text-cyan-700 dark:text-cyan-400",
      bg: "bg-cyan-100 dark:bg-cyan-950",
      border: "border-cyan-300 dark:border-cyan-800",
      sparklineColor: "rgb(6, 182, 212)",
    },
  };
  return configs[basis];
};

/**
 * Get portfolio status configuration
 */
const getPortfolioConfig = (status: PortfolioStatus) => {
  const configs = {
    feasible: {
      label: "Feasible",
      shortLabel: "OK",
      color: "text-green-700 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950",
      border: "border-green-300 dark:border-green-800",
      sparklineColor: "rgb(34, 197, 94)",
    },
    infeasible: {
      label: "Infeasible",
      shortLabel: "X",
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-950",
      border: "border-red-300 dark:border-red-800",
      sparklineColor: "rgb(239, 68, 68)",
    },
    optimal: {
      label: "Optimal",
      shortLabel: "★",
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950",
      border: "border-emerald-300 dark:border-emerald-800",
      sparklineColor: "rgb(16, 185, 129)",
    },
    suboptimal: {
      label: "Suboptimal",
      shortLabel: "~",
      color: "text-orange-700 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-950",
      border: "border-orange-300 dark:border-orange-800",
      sparklineColor: "rgb(249, 115, 22)",
    },
  };
  return configs[status];
};

/**
 * Format metric value
 */
const formatMetric = (
  value: number,
  type: "percentage" | "decimal" | "currency" = "decimal"
): string => {
  if (type === "percentage") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (type === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return value.toFixed(2);
};

// ============================================================================
// Badge Components
// ============================================================================

/**
 * Risk Level Badge
 * Shows risk level with optional metric and sparkline
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  metric,
  history,
  className,
  showLabel = true,
}) => {
  const { interfaceLevel } = useInterfaceLevel();
  const config = getRiskConfig(level);
  const isBasic = interfaceLevel === "basic";
  const isIntermediate = interfaceLevel === "intermediate";
  const isAdvanced = interfaceLevel === "advanced";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        config.bg,
        config.border,
        config.color,
        isBasic && "px-2 py-0.5",
        isAdvanced && "px-2.5 py-1",
        className
      )}
      role="status"
      aria-label={`Risk level: ${config.label}${metric ? `, VaR95: ${formatMetric(metric, "percentage")}` : ""}`}
    >
      {/* Basic: Color + label only */}
      {isBasic && showLabel && <span>{config.shortLabel}</span>}

      {/* Intermediate: Label + metric */}
      {isIntermediate && (
        <>
          {showLabel && <span>{config.shortLabel}</span>}
          {metric !== undefined && (
            <span className="font-mono text-[10px]">
              {formatMetric(metric, "percentage")}
            </span>
          )}
        </>
      )}

      {/* Advanced: Label + metric + sparkline */}
      {isAdvanced && (
        <>
          {showLabel && <span>{config.label}</span>}
          {metric !== undefined && (
            <span className="font-mono text-[10px]">
              {formatMetric(metric, "percentage")}
            </span>
          )}
          {history && history.length >= 2 && (
            <MiniSparkline
              data={history}
              width={32}
              height={12}
              color={config.sparklineColor}
              className="ml-0.5"
            />
          )}
        </>
      )}
    </span>
  );
};

/**
 * Recommendation Basis Badge
 * Shows which metric drove the recommendation
 */
export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  basis,
  metric,
  history,
  className,
  showLabel = true,
}) => {
  const { interfaceLevel } = useInterfaceLevel();
  const config = getRecommendationConfig(basis);
  const isBasic = interfaceLevel === "basic";
  const isIntermediate = interfaceLevel === "intermediate";
  const isAdvanced = interfaceLevel === "advanced";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        config.bg,
        config.border,
        config.color,
        isBasic && "px-2 py-0.5",
        isAdvanced && "px-2.5 py-1",
        className
      )}
      role="status"
      aria-label={`Recommended by: ${config.label}${metric ? `, value: ${formatMetric(metric)}` : ""}`}
    >
      {/* Basic: Color + label only */}
      {isBasic && showLabel && <span>{config.shortLabel}</span>}

      {/* Intermediate: Label + metric */}
      {isIntermediate && (
        <>
          {showLabel && <span>{config.shortLabel}</span>}
          {metric !== undefined && (
            <span className="font-mono text-[10px]">
              {formatMetric(metric)}
            </span>
          )}
        </>
      )}

      {/* Advanced: Label + metric + sparkline */}
      {isAdvanced && (
        <>
          {showLabel && <span>{config.label}</span>}
          {metric !== undefined && (
            <span className="font-mono text-[10px]">
              {formatMetric(metric)}
            </span>
          )}
          {history && history.length >= 2 && (
            <MiniSparkline
              data={history}
              width={32}
              height={12}
              color={config.sparklineColor}
              className="ml-0.5"
            />
          )}
        </>
      )}
    </span>
  );
};

/**
 * Portfolio Status Badge
 * Shows portfolio feasibility and optimization status
 */
export const PortfolioBadge: React.FC<PortfolioBadgeProps> = ({
  status,
  metric,
  history,
  className,
  showLabel = true,
}) => {
  const { interfaceLevel } = useInterfaceLevel();
  const config = getPortfolioConfig(status);
  const isBasic = interfaceLevel === "basic";
  const isIntermediate = interfaceLevel === "intermediate";
  const isAdvanced = interfaceLevel === "advanced";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        config.bg,
        config.border,
        config.color,
        isBasic && "px-2 py-0.5",
        isAdvanced && "px-2.5 py-1",
        className
      )}
      role="status"
      aria-label={`Portfolio status: ${config.label}${metric ? `, utility: ${formatMetric(metric)}` : ""}`}
    >
      {/* Basic: Color + label only */}
      {isBasic && showLabel && <span>{config.shortLabel}</span>}

      {/* Intermediate: Label + metric */}
      {isIntermediate && (
        <>
          {showLabel && <span>{config.shortLabel}</span>}
          {metric !== undefined && (
            <span className="font-mono text-[10px]">
              {formatMetric(metric)}
            </span>
          )}
        </>
      )}

      {/* Advanced: Label + metric + sparkline */}
      {isAdvanced && (
        <>
          {showLabel && <span>{config.label}</span>}
          {metric !== undefined && (
            <span className="font-mono text-[10px]">
              {formatMetric(metric)}
            </span>
          )}
          {history && history.length >= 2 && (
            <MiniSparkline
              data={history}
              width={32}
              height={12}
              color={config.sparklineColor}
              className="ml-0.5"
            />
          )}
        </>
      )}
    </span>
  );
};

// ============================================================================
// Compound Badge (for combining multiple badges)
// ============================================================================

export interface CompoundBadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Compound Badge Container
 * Groups multiple badges with consistent spacing
 */
export const CompoundBadge: React.FC<CompoundBadgeProps> = ({
  children,
  className,
}) => {
  const { interfaceLevel } = useInterfaceLevel();
  const isBasic = interfaceLevel === "basic";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 flex-wrap",
        isBasic && "gap-1",
        className
      )}
    >
      {children}
    </div>
  );
};
