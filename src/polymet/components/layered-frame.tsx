import React from "react";
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface LayeredFrameProps {
  children: React.ReactNode;
  /**
   * Section title displayed at the top
   */
  sectionTitle?: string;
  /**
   * Help text tooltip shown next to title
   */
  helpTip?: string;
  /**
   * Force compact mode regardless of theme level
   */
  compact?: boolean;
  /**
   * Additional className for the wrapper
   */
  className?: string;
  /**
   * Variant style
   */
  variant?: "default" | "ghost" | "bordered";
}

/**
 * LayeredFrame
 *
 * Adaptive container that changes visual density based on interface level:
 * - Basic: Larger padding, helper text, spacious layout
 * - Intermediate: Balanced padding, optional helpers
 * - Advanced: Compact padding, dense layout, inline controls
 */
export function LayeredFrame({
  children,
  sectionTitle,
  helpTip,
  compact = false,
  className = "",
  variant = "default",
}: LayeredFrameProps) {
  const { interfaceLevel } = useInterfaceLevel();

  // Determine density based on level and compact prop
  const isCompact = compact || interfaceLevel === "advanced";
  const isSpacious = !compact && interfaceLevel === "basic";

  // Get padding based on level
  const getPadding = () => {
    if (isCompact) return "p-3";
    if (isSpacious) return "p-8";
    return "p-6"; // intermediate
  };

  // Get gap between elements
  const getGap = () => {
    if (isCompact) return "space-y-3";
    if (isSpacious) return "space-y-6";
    return "space-y-4"; // intermediate
  };

  // Get title size
  const getTitleSize = () => {
    if (isCompact) return "text-base";
    if (isSpacious) return "text-2xl";
    return "text-xl"; // intermediate
  };

  // Get card variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "ghost":
        return "bg-transparent border-0 shadow-none";
      case "bordered":
        return "bg-background border-2 border-border";
      default:
        return "bg-card border border-border";
    }
  };

  // Show helper text in basic mode
  const showHelpers = interfaceLevel === "basic" && helpTip;

  return (
    <Card className={`${getVariantStyles()} ${className}`}>
      <div className={`${getPadding()} ${getGap()}`}>
        {/* Header Section */}
        {(sectionTitle || helpTip) && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {sectionTitle && (
                <h3
                  className={`${getTitleSize()} font-semibold text-foreground`}
                >
                  {sectionTitle}
                </h3>
              )}
              {helpTip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon
                        className={`${isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} text-muted-foreground cursor-help`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm">{helpTip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}

        {/* Helper Text for Basic Mode */}
        {showHelpers && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {helpTip}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className={getGap()}>{children}</div>
      </div>
    </Card>
  );
}

export default LayeredFrame;
