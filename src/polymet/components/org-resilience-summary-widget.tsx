import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  AwardIcon,
  InfoIcon,
  RefreshCwIcon,
} from "lucide-react";
import {
  getOrComputeOrgResilienceSummary,
  computeOrgResilienceSummary,
  type OrgResilienceSummary,
  type DecisionResilienceData,
} from "@/polymet/data/org-resilience-summary";
import { useTenant } from "@/polymet/data/tenant-context";

export interface OrgResilienceSummaryWidgetProps {
  /**
   * Decision data to compute summary from
   */
  decisions: DecisionResilienceData[];
  /**
   * Show detailed view with all metrics
   */
  detailed?: boolean;
  /**
   * Optional className for the card wrapper
   */
  className?: string;
  /**
   * Callback when user clicks on top learning decision
   */
  onViewTopLearning?: (decisionId: string) => void;
  /**
   * Callback when user clicks on weakest decision
   */
  onViewWeakest?: (decisionId: string) => void;
  /**
   * Callback for audit events
   */
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function OrgResilienceSummaryWidget({
  decisions,
  detailed = false,
  className,
  onViewTopLearning,
  onViewWeakest,
  onAuditEvent,
}: OrgResilienceSummaryWidgetProps) {
  const { tenant } = useTenant();
  const [summary, setSummary] = useState<OrgResilienceSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load or compute summary on mount and when decisions change
  useEffect(() => {
    const loadedSummary = getOrComputeOrgResilienceSummary(
      tenant.tenantId,
      decisions
    );
    setSummary(loadedSummary);
  }, [tenant.tenantId, decisions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const freshSummary = computeOrgResilienceSummary(
      tenant.tenantId,
      decisions
    );
    setSummary(freshSummary);

    // Audit event
    if (onAuditEvent) {
      onAuditEvent("org_resilience.summary_refreshed", {
        tenantId: tenant.tenantId,
        decisionCount: decisions.length,
        avgAntifragilityIndex: freshSummary.avg_antifragility_index,
        timestamp: Date.now(),
      });
    }

    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!summary) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />

          <p>Loading organization resilience data...</p>
        </CardContent>
      </Card>
    );
  }

  const getBreachTrendIcon = () => {
    switch (summary.guardrail_breach_trend.direction) {
      case "improving":
        return <TrendingDownIcon className="h-4 w-4 text-green-600" />;

      case "worsening":
        return <TrendingUpIcon className="h-4 w-4 text-red-600" />;

      default:
        return <MinusIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBreachTrendColor = () => {
    switch (summary.guardrail_breach_trend.direction) {
      case "improving":
        return "text-green-600";
      case "worsening":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getAntifragilityColor = (index: number) => {
    if (index >= 70) return "text-green-600";
    if (index >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getAntifragilityBgColor = (index: number) => {
    if (index >= 70) return "bg-green-600";
    if (index >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-primary" />
                Organization Resilience Overview
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Summarizes how all decisions are learning and adapting
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Aggregated resilience metrics across {summary.decision_count}{" "}
              decisions
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Antifragility Index */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Average Antifragility Index
            </span>
            <span
              className={`text-2xl font-bold ${getAntifragilityColor(
                summary.avg_antifragility_index
              )}`}
            >
              {summary.avg_antifragility_index.toFixed(1)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getAntifragilityBgColor(
                summary.avg_antifragility_index
              )}`}
              style={{ width: `${summary.avg_antifragility_index}%` }}
            />
          </div>
        </div>

        {detailed && (
          <>
            {/* Top Learning Decision */}
            {summary.top_learning_decision && (
              <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AwardIcon className="h-4 w-4 text-green-600" />

                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Top Learning Decision
                    </span>
                  </div>
                  {onViewTopLearning && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onViewTopLearning(summary.top_learning_decision!.id)
                      }
                      className="h-7 text-xs"
                    >
                      View
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {summary.top_learning_decision.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      AI:{" "}
                      {summary.top_learning_decision.antifragility_index.toFixed(
                        1
                      )}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUpIcon className="h-3 w-3 mr-1" />+
                      {summary.top_learning_decision.growth_rate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Weakest Decision */}
            {summary.weakest_decision && (
              <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="h-4 w-4 text-red-600" />

                    <span className="text-sm font-medium text-red-900 dark:text-red-100">
                      Weakest Decision
                    </span>
                  </div>
                  {onViewWeakest && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onViewWeakest(summary.weakest_decision!.id)
                      }
                      className="h-7 text-xs"
                    >
                      View
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {summary.weakest_decision.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      AI:{" "}
                      {summary.weakest_decision.antifragility_index.toFixed(1)}
                    </span>
                    <Badge
                      variant={
                        summary.weakest_decision.trend === "declining"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {summary.weakest_decision.trend === "declining" && (
                        <TrendingDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {summary.weakest_decision.trend === "stable" && (
                        <MinusIcon className="h-3 w-3 mr-1" />
                      )}
                      {summary.weakest_decision.trend}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Guardrail Breach Trend */}
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Guardrail Breach Trend
            </span>
            <div className="flex items-center gap-2">
              {getBreachTrendIcon()}
              <span
                className={`text-sm font-semibold ${getBreachTrendColor()}`}
              >
                {summary.guardrail_breach_trend.direction}
              </span>
            </div>
          </div>
          {detailed && (
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground">Recent (30d)</p>
                <p className="text-lg font-semibold">
                  {summary.guardrail_breach_trend.recent_breach_count}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Previous (30d)</p>
                <p className="text-lg font-semibold">
                  {summary.guardrail_breach_trend.previous_breach_count}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Change</p>
                <p
                  className={`text-lg font-semibold ${
                    summary.guardrail_breach_trend.change_percent < 0
                      ? "text-green-600"
                      : summary.guardrail_breach_trend.change_percent > 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {summary.guardrail_breach_trend.change_percent > 0 ? "+" : ""}
                  {summary.guardrail_breach_trend.change_percent.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(summary.last_updated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
