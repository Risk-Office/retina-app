import React from "react";
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { cn } from "@/lib/utils";

export interface DensityBoxProps {
  children: React.ReactNode;
  /**
   * Force compact mode regardless of theme level
   */
  compact?: boolean;
  /**
   * Spacing variant
   */
  spacing?: "tight" | "normal" | "relaxed";
  /**
   * Additional className
   */
  className?: string;
  /**
   * HTML element to render
   */
  as?: "div" | "section" | "article";
}

/**
 * DensityBox
 *
 * Adaptive spacing container that adjusts based on interface level:
 * - Basic: Relaxed spacing, larger touch targets
 * - Intermediate: Balanced spacing
 * - Advanced: Tight spacing, compact layout
 */
export function DensityBox({
  children,
  compact = false,
  spacing = "normal",
  className = "",
  as: Component = "div",
}: DensityBoxProps) {
  const level = useInterfaceLevel();

  // Determine density
  const isCompact = compact || level === "advanced";
  const isSpacious = !compact && level === "basic";

  // Get spacing classes based on level and spacing prop
  const getSpacing = () => {
    // Tight spacing
    if (spacing === "tight") {
      if (isCompact) return "space-y-1.5";
      if (isSpacious) return "space-y-3";
      return "space-y-2";
    }

    // Relaxed spacing
    if (spacing === "relaxed") {
      if (isCompact) return "space-y-4";
      if (isSpacious) return "space-y-8";
      return "space-y-6";
    }

    // Normal spacing (default)
    if (isCompact) return "space-y-2.5";
    if (isSpacious) return "space-y-5";
    return "space-y-4";
  };

  return (
    <Component className={cn(getSpacing(), className)}>{children}</Component>
  );
}

/**
 * DensityGrid
 *
 * Grid layout that adapts column count based on density
 */
export interface DensityGridProps {
  children: React.ReactNode;
  /**
   * Force compact mode
   */
  compact?: boolean;
  /**
   * Base number of columns (will adjust based on level)
   */
  columns?: 1 | 2 | 3 | 4;
  /**
   * Additional className
   */
  className?: string;
}

export function DensityGrid({
  children,
  compact = false,
  columns = 2,
  className = "",
}: DensityGridProps) {
  const level = useInterfaceLevel();

  const isCompact = compact || level === "advanced";
  const isSpacious = !compact && level === "basic";

  // Get grid columns based on level
  const getGridCols = () => {
    // In spacious mode, reduce columns for better readability
    if (isSpacious) {
      if (columns === 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      if (columns === 3) return "grid-cols-1 md:grid-cols-2";
      if (columns === 2) return "grid-cols-1 md:grid-cols-2";
      return "grid-cols-1";
    }

    // In compact mode, increase columns for density
    if (isCompact) {
      if (columns === 4) return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
      if (columns === 3) return "grid-cols-2 md:grid-cols-4";
      if (columns === 2) return "grid-cols-2 md:grid-cols-3";
      return "grid-cols-1 md:grid-cols-2";
    }

    // Normal mode
    if (columns === 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    if (columns === 3) return "grid-cols-1 md:grid-cols-3";
    if (columns === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1";
  };

  // Get gap based on level
  const getGap = () => {
    if (isCompact) return "gap-3";
    if (isSpacious) return "gap-6";
    return "gap-4";
  };

  return (
    <div className={cn("grid", getGridCols(), getGap(), className)}>
      {children}
    </div>
  );
}

/**
 * DensityStack
 *
 * Flex stack that adapts direction and spacing
 */
export interface DensityStackProps {
  children: React.ReactNode;
  /**
   * Force compact mode
   */
  compact?: boolean;
  /**
   * Stack direction
   */
  direction?: "horizontal" | "vertical";
  /**
   * Alignment
   */
  align?: "start" | "center" | "end" | "stretch";
  /**
   * Additional className
   */
  className?: string;
}

export function DensityStack({
  children,
  compact = false,
  direction = "vertical",
  align = "start",
  className = "",
}: DensityStackProps) {
  const level = useInterfaceLevel();

  const isCompact = compact || level === "advanced";
  const isSpacious = !compact && level === "basic";

  // Get gap based on level
  const getGap = () => {
    if (isCompact) return "gap-2";
    if (isSpacious) return "gap-5";
    return "gap-3";
  };

  // Get alignment classes
  const getAlign = () => {
    if (direction === "horizontal") {
      switch (align) {
        case "center":
          return "items-center";
        case "end":
          return "items-end";
        case "stretch":
          return "items-stretch";
        default:
          return "items-start";
      }
    } else {
      switch (align) {
        case "center":
          return "justify-center";
        case "end":
          return "justify-end";
        case "stretch":
          return "justify-stretch";
        default:
          return "justify-start";
      }
    }
  };

  const directionClass = direction === "horizontal" ? "flex-row" : "flex-col";

  return (
    <div
      className={cn("flex", directionClass, getGap(), getAlign(), className)}
    >
      {children}
    </div>
  );
}

export default DensityBox;
