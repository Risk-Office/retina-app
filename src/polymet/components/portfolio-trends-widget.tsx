import React, { useState } from "react";
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
  BriefcaseIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  ArrowRightIcon,
  BarChart3Icon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  loadPortfolios,
  type DecisionPortfolio,
} from "@/polymet/data/decision-portfolios";
import {
  getPortfolioHistory,
  type AntifragilitySnapshot,
} from "@/polymet/data/antifragility-history";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

export interface PortfolioTrendsWidgetProps {
  /**
   * Optional className for the card wrapper
   */
  className?: string;
  /**
   * Show detailed view with charts
   */
  detailed?: boolean;
  /**
   * Callback when user clicks to view portfolio details
   */
  onViewPortfolio?: (portfolioId: string) => void;
}

interface PortfolioTrendData {
  portfolio: DecisionPortfolio;
  currentIndex: number;
  previousIndex: number | null;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  decisionCount: number;
  closedCount: number;
  openCount: number;
  history: AntifragilitySnapshot[];
}

/**
 * Calculate trend from history
 */
function calculateTrend(history: AntifragilitySnapshot[]): {
  current: number;
  previous: number | null;
  trend: "up" | "down" | "stable";
  percentage: number;
} {
  if (history.length === 0) {
    return { current: 0, previous: null, trend: "stable", percentage: 0 };
  }

  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
  const current = sortedHistory[0].value;
  const previous = sortedHistory.length > 1 ? sortedHistory[1].value : null;

  if (previous === null) {
    return { current, previous, trend: "stable", percentage: 0 };
  }

  const change = current - previous;
  const percentage = (change / previous) * 100;

  let trend: "up" | "down" | "stable" = "stable";
  if (Math.abs(percentage) > 2) {
    // 2% threshold for significant change
    trend = change > 0 ? "up" : "down";
  }

  return { current, previous, trend, percentage };
}

/**
 * Get rating label and color for antifragility index
 */
function getRating(value: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (value >= 80) {
    return {
      label: "Excellent",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    };
  }
  if (value >= 60) {
    return {
      label: "Good",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    };
  }
  if (value >= 40) {
    return {
      label: "Moderate",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
    };
  }
  return {
    label: "Needs Attention",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  };
}

export function PortfolioTrendsWidget({
  className,
  detailed = false,
  onViewPortfolio,
}: PortfolioTrendsWidgetProps) {
  const { tenant } = useTenant();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null
  );

  // Get all portfolios for tenant
  const portfolios = loadPortfolios(tenant.tenantId);

  // Calculate trend data for each portfolio
  const portfolioTrends: PortfolioTrendData[] = portfolios.map((portfolio) => {
    const historyData = getPortfolioHistory(tenant.tenantId, portfolio.id);
    const history = historyData?.snapshots || [];
    const { current, previous, trend, percentage } = calculateTrend(history);

    return {
      portfolio,
      currentIndex: current,
      previousIndex: previous,
      trend,
      trendPercentage: percentage,
      decisionCount: portfolio.decision_ids?.length || 0,
      closedCount: 0, // Would be calculated from actual decision data
      openCount: portfolio.decision_ids?.length || 0, // Would be calculated from actual decision data
      history,
    };
  });

  // Calculate aggregate metrics
  const totalPortfolios = portfolios.length;
  const totalDecisions = portfolioTrends.reduce(
    (sum, p) => sum + p.decisionCount,
    0
  );
  const avgAntifragility =
    portfolioTrends.length > 0
      ? portfolioTrends.reduce((sum, p) => sum + p.currentIndex, 0) /
        portfolioTrends.length
      : 0;

  const improvingCount = portfolioTrends.filter((p) => p.trend === "up").length;
  const decliningCount = portfolioTrends.filter(
    (p) => p.trend === "down"
  ).length;

  if (portfolios.length === 0) {
    return (
      <Card className={cn("rounded-2xl shadow-sm", className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BriefcaseIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                Portfolio Trends
              </CardTitle>
              <CardDescription>
                Track antifragility across portfolios
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No portfolios created yet
            </p>
            <Link to="/retina/portfolios">
              <Button>
                <BriefcaseIcon className="w-4 h-4 mr-2" />
                Create Portfolio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedTrend = selectedPortfolioId
    ? portfolioTrends.find((p) => p.portfolio.id === selectedPortfolioId)
    : null;

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BriefcaseIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                Portfolio Trends
              </CardTitle>
              <CardDescription>
                Antifragility metrics across {totalPortfolios} portfolio
                {totalPortfolios !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
          <Link to="/retina/portfolios">
            <Button variant="outline" size="sm">
              View All
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aggregate Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Avg Antifragility
            </div>
            <div className="text-2xl font-bold text-foreground">
              {avgAntifragility.toFixed(1)}
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs", getRating(avgAntifragility).color)}
            >
              {getRating(avgAntifragility).label}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Decisions</div>
            <div className="text-2xl font-bold text-foreground">
              {totalDecisions}
            </div>
            <div className="text-xs text-muted-foreground">
              across all portfolios
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Trend Status</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUpIcon className="w-4 h-4" />

                <span className="text-sm font-medium">{improvingCount}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDownIcon className="w-4 h-4" />

                <span className="text-sm font-medium">{decliningCount}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              improving / declining
            </div>
          </div>
        </div>

        {/* Portfolio List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Portfolio Performance
            </h3>
            {detailed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPortfolioId(null)}
              >
                <BarChart3Icon className="w-4 h-4 mr-2" />

                {selectedPortfolioId ? "Show All" : "View Charts"}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {portfolioTrends.slice(0, detailed ? undefined : 5).map((trend) => {
              const rating = getRating(trend.currentIndex);
              const isSelected = selectedPortfolioId === trend.portfolio.id;

              return (
                <div
                  key={trend.portfolio.id}
                  className={cn(
                    "p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer",
                    isSelected && "bg-muted/50 border-primary"
                  )}
                  onClick={() => {
                    if (detailed) {
                      setSelectedPortfolioId(
                        isSelected ? null : trend.portfolio.id
                      );
                    } else if (onViewPortfolio) {
                      onViewPortfolio(trend.portfolio.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {trend.portfolio.portfolio_name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {trend.decisionCount} decisions
                        </Badge>
                      </div>
                      {trend.portfolio.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {trend.portfolio.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            Index:
                          </span>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              rating.color
                            )}
                          >
                            {trend.currentIndex.toFixed(1)}
                          </span>
                        </div>
                        {trend.previousIndex !== null && (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs font-medium",
                              trend.trend === "up" &&
                                "text-green-600 dark:text-green-400",
                              trend.trend === "down" &&
                                "text-red-600 dark:text-red-400",
                              trend.trend === "stable" &&
                                "text-muted-foreground"
                            )}
                          >
                            {trend.trend === "up" && (
                              <TrendingUpIcon className="w-3 h-3" />
                            )}
                            {trend.trend === "down" && (
                              <TrendingDownIcon className="w-3 h-3" />
                            )}
                            {trend.trend === "stable" && (
                              <MinusIcon className="w-3 h-3" />
                            )}
                            <span>
                              {Math.abs(trend.trendPercentage).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mini Chart */}
                    {trend.history.length > 1 && (
                      <div className="w-24 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={trend.history
                              .slice(-7)
                              .sort((a, b) => a.timestamp - b.timestamp)}
                          >
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={
                                trend.trend === "up"
                                  ? "hsl(var(--chart-2))"
                                  : trend.trend === "down"
                                    ? "hsl(var(--chart-1))"
                                    : "hsl(var(--muted-foreground))"
                              }
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Expanded Chart View */}
                  {detailed && isSelected && trend.history.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="h-48">
                        <ChartContainer
                          config={{}}
                          className="w-full h-full aspect-[none]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={trend.history.sort(
                                (a, b) => a.timestamp - b.timestamp
                              )}
                            >
                              <XAxis
                                dataKey="timestamp"
                                tickFormatter={(ts) =>
                                  new Date(ts).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                                }
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                              />

                              <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                domain={[0, 100]}
                              />

                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {trend.history.length} data point
                          {trend.history.length !== 1 ? "s" : ""}
                        </span>
                        <span>
                          Last updated:{" "}
                          {new Date(
                            Math.max(...trend.history.map((h) => h.timestamp))
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!detailed && portfolioTrends.length > 5 && (
            <Link to="/retina/portfolios">
              <Button variant="outline" className="w-full" size="sm">
                View All {portfolioTrends.length} Portfolios
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {/* Health Indicators */}
        {detailed && (
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Health Indicators
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />

                <div>
                  <div className="text-sm font-medium text-foreground">
                    {improvingCount} Improving
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Portfolios showing positive trends
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10">
                <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />

                <div>
                  <div className="text-sm font-medium text-foreground">
                    {decliningCount} Declining
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Portfolios needing attention
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
