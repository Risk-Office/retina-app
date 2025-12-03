import React, { useState, useRef, useEffect } from "react";
import { GripVerticalIcon } from "lucide-react";

export interface SplitPaneProps {
  /**
   * Split direction
   */
  direction?: "horizontal" | "vertical";
  /**
   * Initial split percentage (0-100)
   */
  initialSplit?: number;
  /**
   * Minimum pane size in pixels
   */
  minSize?: number;
  /**
   * Left/Top pane content
   */
  leftPane: React.ReactNode;
  /**
   * Right/Bottom pane content
   */
  rightPane: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Callback when split changes
   */
  onSplitChange?: (splitPercent: number) => void;
}

/**
 * Split pane container with draggable resizer
 * Supports horizontal and vertical splits for expert workbench
 */
export function SplitPaneContainer({
  direction = "horizontal",
  initialSplit = 50,
  minSize = 200,
  leftPane,
  rightPane,
  className = "",
  onSplitChange,
}: SplitPaneProps) {
  const [splitPercent, setSplitPercent] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let newSplit: number;
      if (direction === "horizontal") {
        const mouseX = e.clientX - rect.left;
        newSplit = (mouseX / rect.width) * 100;
      } else {
        const mouseY = e.clientY - rect.top;
        newSplit = (mouseY / rect.height) * 100;
      }

      // Apply min/max constraints
      const minPercent =
        (minSize / (direction === "horizontal" ? rect.width : rect.height)) *
        100;
      const maxPercent = 100 - minPercent;

      newSplit = Math.max(minPercent, Math.min(maxPercent, newSplit));
      setSplitPercent(newSplit);
      onSplitChange?.(newSplit);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, minSize, onSplitChange]);

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? "flex-row" : "flex-col"} w-full h-full ${className}`}
      style={{ userSelect: isDragging ? "none" : "auto" }}
    >
      {/* Left/Top Pane */}
      <div
        className="overflow-auto"
        style={{
          [isHorizontal ? "width" : "height"]: `${splitPercent}%`,
          minWidth: isHorizontal ? minSize : undefined,
          minHeight: !isHorizontal ? minSize : undefined,
        }}
      >
        {leftPane}
      </div>

      {/* Resizer */}
      <div
        className={`
          flex items-center justify-center shrink-0
          ${isHorizontal ? "w-2 cursor-col-resize hover:bg-primary/10" : "h-2 cursor-row-resize hover:bg-primary/10"}
          ${isDragging ? "bg-primary/20" : "bg-border"}
          transition-colors
        `}
        onMouseDown={handleMouseDown}
      >
        <GripVerticalIcon
          className={`w-4 h-4 text-muted-foreground ${isHorizontal ? "" : "rotate-90"}`}
        />
      </div>

      {/* Right/Bottom Pane */}
      <div
        className="overflow-auto flex-1"
        style={{
          minWidth: isHorizontal ? minSize : undefined,
          minHeight: !isHorizontal ? minSize : undefined,
        }}
      >
        {rightPane}
      </div>
    </div>
  );
}

/**
 * Triple split pane container (3 panes)
 */
export interface TripleSplitPaneProps {
  /**
   * Split direction
   */
  direction?: "horizontal" | "vertical";
  /**
   * Initial split percentages [first, second] (0-100)
   */
  initialSplits?: [number, number];
  /**
   * Minimum pane size in pixels
   */
  minSize?: number;
  /**
   * First pane content
   */
  firstPane: React.ReactNode;
  /**
   * Second pane content
   */
  secondPane: React.ReactNode;
  /**
   * Third pane content
   */
  thirdPane: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
}

export function TripleSplitPaneContainer({
  direction = "horizontal",
  initialSplits = [33, 33],
  minSize = 200,
  firstPane,
  secondPane,
  thirdPane,
  className = "",
}: TripleSplitPaneProps) {
  return (
    <SplitPaneContainer
      direction={direction}
      initialSplit={initialSplits[0]}
      minSize={minSize}
      leftPane={firstPane}
      rightPane={
        <SplitPaneContainer
          direction={direction}
          initialSplit={(initialSplits[1] / (100 - initialSplits[0])) * 100}
          minSize={minSize}
          leftPane={secondPane}
          rightPane={thirdPane}
        />
      }
      className={className}
    />
  );
}
