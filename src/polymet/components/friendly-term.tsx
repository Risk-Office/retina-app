import React from "react";
import { getLabel, getHelp } from "@/polymet/data/terms";
import { usePlainLanguage } from "@/polymet/data/tenant-settings";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, HelpCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FriendlyProps {
  term: string;
  as?: "label" | "short";
  showTooltip?: boolean;
  className?: string;
}

export function Friendly({
  term,
  as = "label",
  showTooltip = true,
  className = "",
}: FriendlyProps) {
  // Try to get tenant context, but provide fallback if not available
  let tenantId = "default";
  let plainLanguageEnabled = true;

  try {
    const { tenant } = useTenant();
    tenantId = tenant.tenantId;
    const { enabled } = usePlainLanguage(tenantId);
    plainLanguageEnabled = enabled;
  } catch (error) {
    // Not in TenantProvider context, use defaults
  }
  const termInfo = getHelp(term);

  const label = getLabel(term, {
    plain: plainLanguageEnabled,
    short: as === "short",
  });

  if (!showTooltip || !termInfo) {
    return <span className={className}>{label}</span>;
  }

  const handleOpenGlossary = () => {
    window.dispatchEvent(
      new CustomEvent("open-glossary", {
        detail: { term },
      })
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 ${className}`}>
            {label}
            <InfoIcon className="w-3 h-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <div>
              <div className="font-semibold">{termInfo.label}</div>
              <div className="text-xs text-muted-foreground">
                ({termInfo.tech})
              </div>
            </div>
            {termInfo.help && <div className="text-sm">{termInfo.help}</div>}
            {termInfo.formula && (
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                <span className="font-medium">Formula:</span> {termInfo.formula}
              </div>
            )}
            <div className="border-t border-border pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenGlossary}
                className="w-full justify-start gap-2 h-7 text-xs"
                aria-label={`Open glossary for ${termInfo.label}`}
              >
                <HelpCircleIcon className="w-3 h-3" />
                View in Glossary
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FriendlyLabelProps {
  term: string;
  className?: string;
}

/**
 * Simple label without tooltip - for use in tight spaces
 */
export function FriendlyLabel({ term, className = "" }: FriendlyLabelProps) {
  // Try to get tenant context, but provide fallback if not available
  let plainLanguageEnabled = true;

  try {
    const { tenant } = useTenant();
    const { enabled } = usePlainLanguage(tenant.tenantId);
    plainLanguageEnabled = enabled;
  } catch (error) {
    // Not in TenantProvider context, use defaults
  }
  return (
    <span className={className}>
      {getLabel(term, { plain: plainLanguageEnabled })}
    </span>
  );
}

/**
 * Short label without tooltip - for use in very tight spaces
 */
export function FriendlyShort({ term, className = "" }: FriendlyLabelProps) {
  // Try to get tenant context, but provide fallback if not available
  let plainLanguageEnabled = true;

  try {
    const { tenant } = useTenant();
    const { enabled } = usePlainLanguage(tenant.tenantId);
    plainLanguageEnabled = enabled;
  } catch (error) {
    // Not in TenantProvider context, use defaults
  }
  return (
    <span className={className}>
      {getLabel(term, { plain: plainLanguageEnabled, short: true })}
    </span>
  );
}
