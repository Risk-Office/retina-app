import React from "react";
import { Badge } from "@/components/ui/badge";
import { InterfaceLevelSelector } from "@/polymet/components/interface-level-selector";
import { type InterfaceLevel } from "@/polymet/data/tenant-settings";

export interface DecisionHeaderProps {
  /**
   * Decision title
   */
  title: string;
  /**
   * Tenant name to display
   */
  tenantName: string;
  /**
   * Optional description
   */
  description?: string;
  /**
   * Callback when interface level changes (for analytics)
   */
  onLevelChange?: (level: InterfaceLevel, isTemporary: boolean) => void;
  /**
   * Additional actions to render in the header
   */
  actions?: React.ReactNode;
  /**
   * Optional className
   */
  className?: string;
}

export function DecisionHeader({
  title,
  tenantName,
  description,
  onLevelChange,
  actions,
  className = "",
}: DecisionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-6 ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground truncate">
            {title}
          </h1>
          <Badge variant="secondary" className="text-sm shrink-0">
            {tenantName}
          </Badge>
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="flex items-start gap-4 shrink-0">
        {/* View Mode Selector */}
        <div className="w-64">
          <InterfaceLevelSelector
            variant="decision"
            onLevelChange={onLevelChange}
            showLabel={true}
          />
        </div>

        {/* Additional Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
