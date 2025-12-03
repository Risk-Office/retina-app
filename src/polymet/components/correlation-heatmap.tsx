import React, { useState } from "react";
import { advancedTheme } from "@/polymet/data/theme-tokens";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CorrelationHeatmapProps {
  /**
   * Variable labels
   */
  labels: string[];
  /**
   * Correlation matrix (k×k)
   */
  matrix: number[][];
  /**
   * Show values in cells
   */
  showValues?: boolean;
  /**
   * Cell size in pixels
   */
  cellSize?: number;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Callback when cell is clicked
   */
  onCellClick?: (row: number, col: number, value: number) => void;
}

/**
 * Get color for correlation value
 * Uses diverging color scale: negative (red) -> zero (white) -> positive (blue)
 */
function getCorrelationColor(value: number): string {
  // Clamp value to [-1, 1]
  const clamped = Math.max(-1, Math.min(1, value));

  if (clamped === 1) {
    return "hsl(210, 90%, 45%)"; // Strong positive (blue)
  } else if (clamped > 0) {
    // Positive correlation: white -> blue
    const intensity = clamped;
    const lightness = 95 - intensity * 50; // 95% -> 45%
    return `hsl(210, 90%, ${lightness}%)`;
  } else if (clamped === 0) {
    return "hsl(0, 0%, 95%)"; // Zero (light gray)
  } else if (clamped < 0) {
    // Negative correlation: white -> red
    const intensity = Math.abs(clamped);
    const lightness = 95 - intensity * 43; // 95% -> 52%
    return `hsl(0, 70%, ${lightness}%)`;
  } else {
    return "hsl(0, 70%, 52%)"; // Strong negative (red)
  }
}

/**
 * Get text color for correlation value (for contrast)
 */
function getTextColor(value: number): string {
  const absValue = Math.abs(value);
  return absValue > 0.5 ? "white" : "hsl(210, 15%, 12%)";
}

/**
 * Correlation heatmap with interactive cells
 */
export function CorrelationHeatmap({
  labels,
  matrix,
  showValues = true,
  cellSize = 60,
  className = "",
  onCellClick,
}: CorrelationHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const k = labels.length;

  return (
    <div className={`overflow-auto ${className}`}>
      <TooltipProvider>
        <div
          className="inline-block"
          style={{
            fontSize: advancedTheme.typography.fontSize.xs,
          }}
        >
          {/* Header row with labels */}
          <div className="flex">
            {/* Top-left corner (empty) */}
            <div
              style={{
                width: cellSize,
                height: cellSize,
              }}
            />

            {/* Column labels */}
            {labels.map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-center font-semibold text-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  padding: advancedTheme.spacing.xs,
                  fontSize: advancedTheme.typography.fontSize.xs,
                  lineHeight: advancedTheme.typography.lineHeight.tight,
                }}
              >
                <span className="truncate" title={label}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {matrix.map((row, i) => (
            <div key={i} className="flex">
              {/* Row label */}
              <div
                className="flex items-center justify-end font-semibold pr-2"
                style={{
                  width: cellSize,
                  height: cellSize,
                  padding: advancedTheme.spacing.xs,
                  fontSize: advancedTheme.typography.fontSize.xs,
                  lineHeight: advancedTheme.typography.lineHeight.tight,
                }}
              >
                <span className="truncate" title={labels[i]}>
                  {labels[i]}
                </span>
              </div>

              {/* Cells */}
              {row.map((value, j) => {
                const isHovered =
                  hoveredCell?.row === i && hoveredCell?.col === j;
                const isDiagonal = i === j;

                return (
                  <Tooltip key={j}>
                    <TooltipTrigger asChild>
                      <button
                        className={`
                          flex items-center justify-center border border-border/30
                          transition-all
                          ${onCellClick ? "cursor-pointer hover:ring-2 hover:ring-primary hover:z-10" : ""}
                          ${isHovered ? "ring-2 ring-primary z-10" : ""}
                          ${isDiagonal ? "border-primary/50" : ""}
                        `}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getCorrelationColor(value),
                          color: getTextColor(value),
                          fontSize: advancedTheme.typography.fontSize.xs,
                          fontWeight: isDiagonal ? 600 : 400,
                        }}
                        onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => onCellClick?.(i, j, value)}
                      >
                        {showValues && value.toFixed(2)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold">
                          {labels[i]} × {labels[j]}
                        </p>
                        <p>Correlation: {value.toFixed(3)}</p>
                        {isDiagonal && (
                          <p className="text-muted-foreground">(Diagonal)</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4">
            <span
              className="text-muted-foreground"
              style={{ fontSize: advancedTheme.typography.fontSize.xs }}
            >
              Correlation:
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-4 border border-border"
                style={{ backgroundColor: getCorrelationColor(-1) }}
              />

              <span
                className="text-muted-foreground"
                style={{ fontSize: advancedTheme.typography.fontSize.xs }}
              >
                -1.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-4 border border-border"
                style={{ backgroundColor: getCorrelationColor(0) }}
              />

              <span
                className="text-muted-foreground"
                style={{ fontSize: advancedTheme.typography.fontSize.xs }}
              >
                0.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-4 border border-border"
                style={{ backgroundColor: getCorrelationColor(1) }}
              />

              <span
                className="text-muted-foreground"
                style={{ fontSize: advancedTheme.typography.fontSize.xs }}
              >
                +1.0
              </span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
