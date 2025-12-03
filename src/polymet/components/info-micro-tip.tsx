import React from "react";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface InfoMicroTipProps {
  /**
   * Tooltip content text
   */
  content: string;
  /**
   * Optional icon size
   */
  size?: "sm" | "md";
  /**
   * Optional className for the trigger button
   */
  className?: string;
  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string;
}

/**
 * InfoMicroTip Component
 *
 * Inline info icon with accessible tooltip for contextual help.
 * Follows Carbon Design System accessibility patterns.
 */
export function InfoMicroTip({
  content,
  size = "sm",
  className = "",
  ariaLabel = "More information",
}: InfoMicroTipProps) {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger
          asChild
          aria-label={ariaLabel}
          className={`inline-flex items-center justify-center ${className}`}
        >
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            tabIndex={0}
          >
            <InfoIcon
              className={`${iconSize} text-muted-foreground hover:text-foreground transition-colors`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs text-xs"
          role="tooltip"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
