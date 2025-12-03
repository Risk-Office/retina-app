import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AntifragilityGauge } from "@/polymet/components/antifragility-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DecisionAntifragilityData {
  decisionId: string;
  decisionTitle: string;
  antifragilityIndex: number;
  status: "open" | "closed" | "draft";
  chosenOption?: string;
  trend?: {
    direction: "up" | "down" | "stable";
    change: number;
    previousValue: number;
  };
}

interface AntifragilityComparisonViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisions: DecisionAntifragilityData[];
  title?: string;
  description?: string;
}

/**
 * Get trend icon and color based on direction
 */
function getTrendIndicator(direction: "up" | "down" | "stable") {
  switch (direction) {
    case "up":
      return {
        icon: TrendingUpIcon,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-500/10",
      };
    case "down":
      return {
        icon: TrendingDownIcon,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
      };
    case "stable":
      return {
        icon: MinusIcon,
        color: "text-muted-foreground",
        bg: "bg-muted",
      };
  }
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "closed":
      return "default";
    case "open":
      return "secondary";
    default:
      return "outline";
  }
}

export function AntifragilityComparisonView({
  open,
  onOpenChange,
  decisions,
  title = "Antifragility Comparison",
  description = "Compare antifragility indices across decisions",
}: AntifragilityComparisonViewProps) {
  // Sort decisions by antifragility index (highest first)
  const sortedDecisions = [...decisions].sort(
    (a, b) => b.antifragilityIndex - a.antifragilityIndex
  );

  // Calculate statistics
  const avgIndex =
    decisions.reduce((sum, d) => sum + d.antifragilityIndex, 0) /
    decisions.length;
  const maxIndex = Math.max(...decisions.map((d) => d.antifragilityIndex));
  const minIndex = Math.min(...decisions.map((d) => d.antifragilityIndex));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Average</p>
            <p className="text-2xl font-bold">{avgIndex.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Highest</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {maxIndex.toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Lowest</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {minIndex.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDecisions.map((decision) => {
            const trend = decision.trend
              ? getTrendIndicator(decision.trend.direction)
              : null;

            return (
              <div
                key={decision.decisionId}
                className="border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {decision.decisionTitle}
                    </h3>
                    <Badge variant={getStatusVariant(decision.status)}>
                      {decision.status}
                    </Badge>
                  </div>
                  {decision.chosenOption && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {decision.chosenOption}
                    </p>
                  )}
                </div>

                {/* Gauge */}
                <div className="flex justify-center py-2">
                  <AntifragilityGauge
                    value={decision.antifragilityIndex}
                    size="sm"
                    variant="inline"
                  />
                </div>

                {/* Trend */}
                {trend && decision.trend && (
                  <div
                    className={cn(
                      "flex items-center justify-center gap-2 p-2 rounded-lg",
                      trend.bg
                    )}
                  >
                    <trend.icon className={cn("w-4 h-4", trend.color)} />

                    <span className={cn("text-sm font-medium", trend.color)}>
                      {decision.trend.direction === "up" ? "+" : ""}
                      {decision.trend.change.toFixed(1)} from{" "}
                      {decision.trend.previousValue.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {decisions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No decisions available for comparison
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
