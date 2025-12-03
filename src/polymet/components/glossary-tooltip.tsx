import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircleIcon } from "lucide-react";
import { getTermDefinition } from "@/polymet/data/terms";

export interface GlossaryTooltipProps {
  /**
   * The technical term to explain
   */
  term: string;
  /**
   * Children to wrap with tooltip (optional)
   * If not provided, shows a help icon
   */
  children?: React.ReactNode;
  /**
   * Additional className for the trigger
   */
  className?: string;
}

/**
 * Glossary Tooltip Component
 * 
 * Provides contextual help by translating jargon to plain language.
 * Shows technical term, plain language explanation, and help text.
 */
export function GlossaryTooltip({
  term,
  children,
  className = "",
}: GlossaryTooltipProps) {
  const definition = getTermDefinition(term);

  if (!definition) {
    // If term not found, just render children without tooltip
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children ? (
            <span className={`cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-4 ${className}`}>
              {children}
            </span>
          ) : (
            <button
              type="button"
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-accent transition-colors ${className}`}
            >
              <HelpCircleIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                Technical Term
              </div>
              <div className="font-medium">{definition.technical}</div>
            </div>
            {definition.plain && (
              <div>
                <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Plain Language
                </div>
                <div className="text-sm">{definition.plain}</div>
              </div>
            )}
            {definition.helpText && (
              <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                {definition.helpText}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Helper function to get term definition from terms data
 */
function getTermDefinition(term: string) {
  // Import terms data
  const { TERMS } = require("@/polymet/data/terms");
  
  // Find term (case-insensitive)
  const termKey = Object.keys(TERMS).find(
    (key) => key.toLowerCase() === term.toLowerCase()
  );
  
  if (!termKey) return null;
  
  return TERMS[termKey];
}