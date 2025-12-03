import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileTextIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DecisionPortfolio } from "@/polymet/data/decision-portfolios";

interface TopDriver {
  paramName: string;
  impact: number; // Absolute impact on key metric
  direction: "positive" | "negative";
}

interface PortfolioSummaryData {
  portfolio: DecisionPortfolio;
  topDrivers: TopDriver[];
  diversificationLabel: "High" | "Medium" | "Low";
  antifragilityTrend: "up" | "down" | "stable";
  previousAntifragility?: number; // For trend comparison
}

interface PortfolioSummaryCardProps {
  data: PortfolioSummaryData;
  onGenerateBrief: (portfolioId: string) => void;
  isGenerating?: boolean;
}

export function PortfolioSummaryCard({
  data,
  onGenerateBrief,
  isGenerating = false,
}: PortfolioSummaryCardProps) {
  const { portfolio, topDrivers, diversificationLabel, antifragilityTrend } =
    data;

  // Get diversification color and icon
  const getDiversificationStyle = () => {
    switch (diversificationLabel) {
      case "High":
        return {
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          borderColor: "border-green-300 dark:border-green-700",
        };
      case "Medium":
        return {
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          borderColor: "border-yellow-300 dark:border-yellow-700",
        };
      case "Low":
        return {
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          borderColor: "border-red-300 dark:border-red-700",
        };
    }
  };

  // Get antifragility trend icon and color
  const getAntifragilityTrendStyle = () => {
    switch (antifragilityTrend) {
      case "up":
        return {
          icon: ArrowUpIcon,
          color: "text-green-600 dark:text-green-400",
          label: "Improving",
          tooltip:
            "Learning signal is improving - portfolio is getting stronger",
        };
      case "down":
        return {
          icon: ArrowDownIcon,
          color: "text-red-600 dark:text-red-400",
          label: "Declining",
          tooltip:
            "Learning signal is declining - review portfolio composition",
        };
      case "stable":
        return {
          icon: MinusIcon,
          color: "text-muted-foreground",
          label: "Stable",
          tooltip: "Learning signal is stable - no significant change",
        };
    }
  };

  const diversificationStyle = getDiversificationStyle();
  const antifragilityStyle = getAntifragilityTrendStyle();
  const TrendIcon = antifragilityStyle.icon;

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">
              {portfolio.portfolio_name}
            </CardTitle>
            <CardDescription className="text-xs">
              Quick take for the Board
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => onGenerateBrief(portfolio.id)}
            disabled={isGenerating || !portfolio.metrics}
            className="ml-2"
          >
            <FileTextIcon className="w-4 h-4 mr-2" />

            {isGenerating ? "Generating..." : "Generate Brief"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top 3 Drivers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Top 3 Drivers
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangleIcon className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Combined sensitivity factors from all decisions in this
                    portfolio. These parameters have the biggest impact on
                    outcomes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {topDrivers.length === 0 ? (
            <div className="text-xs text-muted-foreground italic p-3 bg-muted/50 rounded border border-dashed border-border">
              No sensitivity data available. Run tornado analysis on portfolio
              decisions.
            </div>
          ) : (
            <div className="space-y-2">
              {topDrivers.slice(0, 3).map((driver, index) => (
                <div
                  key={driver.paramName}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="text-sm font-medium">
                      {driver.paramName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {driver.direction === "positive" ? (
                      <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <div className="text-xs font-semibold text-muted-foreground">
                      {Math.abs(driver.impact).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diversification Index & Antifragility Trend */}
        <div className="grid grid-cols-2 gap-3">
          {/* Diversification Index */}
          <div
            className={`p-3 rounded-lg border ${diversificationStyle.borderColor} ${diversificationStyle.bgColor}`}
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Diversification
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${diversificationStyle.color} border-current text-sm font-bold`}
              >
                {diversificationLabel}
              </Badge>
              {portfolio.metrics && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-xs text-muted-foreground">
                        {(
                          portfolio.metrics.diversification_index * 100
                        ).toFixed(0)}
                        %
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Diversification Index: measures how spread-out the
                        portfolio is. Higher values indicate better
                        diversification.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Antifragility Trend */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Antifragility
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1">
                      <TrendIcon
                        className={`w-4 h-4 ${antifragilityStyle.color}`}
                      />

                      <span
                        className={`text-sm font-semibold ${antifragilityStyle.color}`}
                      >
                        {antifragilityStyle.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{antifragilityStyle.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {portfolio.metrics && (
                <div className="text-xs text-muted-foreground">
                  {portfolio.metrics.antifragility_score.toFixed(0)}/100
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Metrics Summary */}
        {portfolio.metrics && (
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-1">Aggregate EV</div>
                <div className="font-semibold">
                  ${portfolio.metrics.aggregate_expected_value.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">
                  Portfolio VaR95
                </div>
                <div className="font-semibold">
                  ${portfolio.metrics.aggregate_var95.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Decisions</div>
                <div className="font-semibold">
                  {portfolio.decision_ids.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {!portfolio.metrics && (
          <div className="text-xs text-muted-foreground italic text-center p-3 bg-muted/50 rounded border border-dashed border-border">
            Compute portfolio metrics to see summary data
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Helper function to compute diversification label from index
 */
export function getDiversificationLabel(
  diversificationIndex: number
): "High" | "Medium" | "Low" {
  if (diversificationIndex >= 0.7) return "High";
  if (diversificationIndex >= 0.4) return "Medium";
  return "Low";
}

/**
 * Helper function to compute antifragility trend from historical data
 */
export function getAntifragilityTrend(
  currentScore: number,
  metricsHistory?: Array<{
    timestamp: number;
    metrics: { antifragility_score: number };
  }>
): "up" | "down" | "stable" {
  // If no history, return stable
  if (!metricsHistory || metricsHistory.length === 0) return "stable";

  // Get the most recent historical score
  const previousScore =
    metricsHistory[metricsHistory.length - 1].metrics.antifragility_score;

  const delta = currentScore - previousScore;
  const threshold = 5; // 5 point change is significant

  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "stable";
}

/**
 * Helper function to aggregate top drivers from multiple decisions
 * This would typically come from tornado analysis results
 */
export function aggregateTopDrivers(
  decisionDrivers: Array<{
    decisionId: string;
    drivers: Array<{ paramName: string; impact: number }>;
  }>
): TopDriver[] {
  // Aggregate impacts by parameter name
  const driverMap = new Map<string, { totalImpact: number; count: number }>();

  decisionDrivers.forEach(({ drivers }) => {
    drivers.forEach(({ paramName, impact }) => {
      const existing = driverMap.get(paramName) || { totalImpact: 0, count: 0 };
      driverMap.set(paramName, {
        totalImpact: existing.totalImpact + Math.abs(impact),
        count: existing.count + 1,
      });
    });
  });

  // Convert to array and compute average impact
  const aggregated: TopDriver[] = Array.from(driverMap.entries()).map(
    ([paramName, { totalImpact, count }]) => ({
      paramName,
      impact: totalImpact / count,
      direction: totalImpact > 0 ? "positive" : "negative",
    })
  );

  // Sort by absolute impact (descending)
  aggregated.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return aggregated;
}
