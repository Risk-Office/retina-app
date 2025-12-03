/**
 * # Incident Impact Panel
 *
 * ## Overview
 * Displays incident impacts for a decision with plain-language descriptions.
 *
 * ## Plain-Language Label
 * "What real problems touched this decision?"
 *
 * ## Tooltip
 * "Helps trace which shocks hit which choices."
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  ZapIcon,
  ShieldAlertIcon,
  TruckIcon,
  ActivityIcon,
  FileTextIcon,
  HelpCircleIcon,
} from "lucide-react";
import type { IncidentImpact } from "@/polymet/data/retina-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IncidentImpactPanelProps {
  impacts: IncidentImpact[];
  className?: string;
  compact?: boolean;
}

export function IncidentImpactPanel({
  impacts,
  className,
  compact = false,
}: IncidentImpactPanelProps) {
  if (impacts.length === 0) {
    return null;
  }

  const severityColors = {
    low: "bg-blue-500 dark:bg-blue-600",
    medium: "bg-yellow-500 dark:bg-yellow-600",
    high: "bg-orange-500 dark:bg-orange-600",
    critical: "bg-red-500 dark:bg-red-600",
  };

  const statusIcons = {
    ongoing: <ClockIcon className="w-4 h-4" />,

    mitigated: <AlertTriangleIcon className="w-4 h-4" />,

    resolved: <CheckCircleIcon className="w-4 h-4" />,
  };

  const statusColors = {
    ongoing: "text-orange-600 dark:text-orange-400",
    mitigated: "text-yellow-600 dark:text-yellow-400",
    resolved: "text-green-600 dark:text-green-400",
  };

  const typeIcons = {
    supply_failure: <TruckIcon className="w-4 h-4" />,

    cyber_event: <ShieldAlertIcon className="w-4 h-4" />,

    market_shock: <ActivityIcon className="w-4 h-4" />,

    regulatory_change: <FileTextIcon className="w-4 h-4" />,

    operational_disruption: <ZapIcon className="w-4 h-4" />,

    other: <HelpCircleIcon className="w-4 h-4" />,
  };

  // Sort by timestamp (most recent first)
  const sortedImpacts = [...impacts].sort(
    (a, b) => b.impact_timestamp - a.impact_timestamp
  );

  if (compact) {
    return (
      <Card className={cn("rounded-lg", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />

              <CardTitle className="text-base">
                What real problems touched this decision?
              </CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircleIcon className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Helps trace which shocks hit which choices.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            {impacts.length} incident{impacts.length !== 1 ? "s" : ""} affected
            this decision via linked signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedImpacts.map((impact, idx) => (
              <div
                key={`${impact.incident_id}-${idx}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0">
                  {typeIcons[impact.incident_type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {impact.incident_title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(impact.impact_timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${severityColors[impact.severity]} text-white text-xs`}
                  >
                    {impact.severity}
                  </Badge>
                  <div className={statusColors[impact.resolution_status]}>
                    {statusIcons[impact.resolution_status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("rounded-lg", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />

            <CardTitle>What real problems touched this decision?</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircleIcon className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Helps trace which shocks hit which choices.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          {impacts.length} incident{impacts.length !== 1 ? "s" : ""} affected
          this decision via linked signals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedImpacts.map((impact, idx) => (
            <div
              key={`${impact.incident_id}-${idx}`}
              className="p-4 border border-border rounded-lg space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {typeIcons[impact.incident_type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">
                      {impact.incident_title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(impact.impact_timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${severityColors[impact.severity]} text-white`}
                  >
                    {impact.severity}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div className="text-sm text-muted-foreground">
                {impact.impact_description}
              </div>

              {/* Affected Signals */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">
                  Affected signals:
                </span>
                {impact.affected_signals.map((signalId) => (
                  <Badge key={signalId} variant="outline" className="text-xs">
                    {signalId}
                  </Badge>
                ))}
              </div>

              {/* Estimated Effect */}
              {impact.estimated_effect && (
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  {impact.estimated_effect.change_percent < 0 ? (
                    <TrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className="text-sm">
                    Estimated impact on{" "}
                    <span className="font-medium">
                      {impact.estimated_effect.metric}
                    </span>
                    :{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        impact.estimated_effect.change_percent < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      )}
                    >
                      {impact.estimated_effect.change_percent > 0 ? "+" : ""}
                      {impact.estimated_effect.change_percent.toFixed(1)}%
                    </span>
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1",
                    statusColors[impact.resolution_status]
                  )}
                >
                  {statusIcons[impact.resolution_status]}
                  <span className="text-sm font-medium capitalize">
                    {impact.resolution_status}
                  </span>
                </div>
                {impact.resolution_date && (
                  <span className="text-xs text-muted-foreground">
                    • Resolved{" "}
                    {new Date(impact.resolution_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Notes */}
              {impact.notes && (
                <div className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                  {impact.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
