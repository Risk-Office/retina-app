import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, Pie, PieChart, Cell } from "recharts";
import { cn } from "@/lib/utils";

/**
 * # Antifragility Overview Cards
 *
 * ## Overview
 * Four-card dashboard widget showing system-wide antifragility metrics:
 * 1. Average Antifragility Index (0-100 gauge)
 * 2. Guardrail Breach Trend (sparkline)
 * 3. Top 3 Learning Drivers (bar chart)
 * 4. Decisions by Resilience Tier (pie chart)
 *
 * ## Features
 * - Circular gauge for average antifragility
 * - Sparkline showing breach trend over time
 * - Bar chart of top learning drivers
 * - Pie chart of resilience tier distribution
 * - Tooltips with explanations
 */

export interface AntifragilityOverviewData {
  avgAntifragility: number;
  breachTrend: Array<{ date: string; count: number }>;
  topLearningDrivers: Array<{ name: string; value: number }>;
  resilienceTiers: Array<{ tier: string; count: number; color: string }>;
}

interface AntifragilityOverviewCardsProps {
  data: AntifragilityOverviewData;
  className?: string;
}

/**
 * Get color based on antifragility value
 */
function getAntifragilityColor(value: number): string {
  if (value >= 70) return "text-green-600 dark:text-green-400";
  if (value >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Get background color for gauge
 */
function getAntifragilityBgColor(value: number): string {
  if (value >= 70) return "bg-green-100 dark:bg-green-900/20";
  if (value >= 40) return "bg-yellow-100 dark:bg-yellow-900/20";
  return "bg-red-100 dark:bg-red-900/20";
}

/**
 * Circular gauge component
 */
function CircularGauge({ value }: { value: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted"
          opacity="0.2"
        />

        {/* Progress circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-1000",
            value >= 70
              ? "text-green-600 dark:text-green-400"
              : value >= 40
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-red-600 dark:text-red-400"
          )}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={cn(
            "text-4xl font-bold",
            value >= 70
              ? "text-green-600 dark:text-green-400"
              : value >= 40
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-red-600 dark:text-red-400"
          )}
        >
          {value.toFixed(0)}
        </div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}

export function AntifragilityOverviewCards({
  data,
  className,
}: AntifragilityOverviewCardsProps) {
  // Calculate breach trend direction
  const breachTrendDirection =
    data.breachTrend.length >= 2
      ? data.breachTrend[data.breachTrend.length - 1].count -
        data.breachTrend[0].count
      : 0;

  const breachTrendText =
    breachTrendDirection > 0
      ? "Increasing"
      : breachTrendDirection < 0
        ? "Decreasing"
        : "Stable";

  const breachTrendColor =
    breachTrendDirection > 0
      ? "text-red-600 dark:text-red-400"
      : breachTrendDirection < 0
        ? "text-green-600 dark:text-green-400"
        : "text-muted-foreground";

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
        className
      )}
    >
      {/* 1. Average Antifragility Gauge */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Avg Antifragility
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Quick snapshot of system-wide antifragility. Average index
                    across all decisions (0-100 scale).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-xs">
            System-wide average
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <CircularGauge value={data.avgAntifragility} />

          <div className="text-center mt-4">
            <div
              className={cn(
                "text-sm font-medium",
                getAntifragilityColor(data.avgAntifragility)
              )}
            >
              {data.avgAntifragility >= 70
                ? "Excellent"
                : data.avgAntifragility >= 40
                  ? "Moderate"
                  : "Needs Attention"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Guardrail Breach Trend Sparkline */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Breach Trend
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Guardrail breach trend over the last 30 days. Lower is
                    better.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-xs">Last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={{}} className="h-[140px] w-full">
            <LineChart data={data.breachTrend}>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {payload[0].payload.date}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">
                              Breaches: {payload[0].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
          <div className="text-center mt-2">
            <div className={cn("text-sm font-medium", breachTrendColor)}>
              {breachTrendText}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Top 3 Learning Drivers Bar Chart */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Top Learning Drivers
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Top 3 factors driving antifragility improvements across
                    decisions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-xs">
            Key improvement factors
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={{}} className="h-[140px] w-full">
            <BarChart data={data.topLearningDrivers} layout="vertical">
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">
                              {payload[0].payload.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              Impact: {payload[0].value}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={4} />
            </BarChart>
          </ChartContainer>
          <div className="space-y-1 mt-2">
            {data.topLearningDrivers.map((driver, index) => (
              <div
                key={driver.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground truncate">
                  {index + 1}. {driver.name}
                </span>
                <span className="font-medium">{driver.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Decisions by Resilience Tier Pie Chart */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Resilience Tiers
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Distribution of decisions across resilience tiers (Excellent
                    ≥70, Moderate 40-69, Low &lt;40).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-xs">
            Distribution by tier
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={{}} className="h-[140px] w-full">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">
                              {payload[0].payload.tier}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              Count: {payload[0].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Pie
                data={data.resilienceTiers}
                dataKey="count"
                nameKey="tier"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
              >
                {data.resilienceTiers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="space-y-1 mt-2">
            {data.resilienceTiers.map((tier) => (
              <div
                key={tier.tier}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />

                  <span className="text-muted-foreground">{tier.tier}</span>
                </div>
                <span className="font-medium">{tier.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Helper function to compute antifragility overview data from decisions
 */
export function computeAntifragilityOverviewData(
  decisions: Array<{
    id: string;
    antifragilityIndex?: number;
    learningTrace?: Array<{
      timestamp: number;
      utilityChange: number;
      trigger: string;
    }>;
  }>,
  guardrailViolations: Array<{
    timestamp: number;
  }>
): AntifragilityOverviewData {
  // 1. Average Antifragility
  const decisionsWithAI = decisions.filter(
    (d) => d.antifragilityIndex !== undefined
  );
  const avgAntifragility =
    decisionsWithAI.length > 0
      ? decisionsWithAI.reduce(
          (sum, d) => sum + (d.antifragilityIndex || 0),
          0
        ) / decisionsWithAI.length
      : 0;

  // 2. Breach Trend (last 30 days, grouped by week)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentViolations = guardrailViolations.filter(
    (v) => v.timestamp >= thirtyDaysAgo
  );

  const breachTrend: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = thirtyDaysAgo + i * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    const weekViolations = recentViolations.filter(
      (v) => v.timestamp >= weekStart && v.timestamp < weekEnd
    );
    breachTrend.push({
      date: `Week ${i + 1}`,
      count: weekViolations.length,
    });
  }

  // 3. Top Learning Drivers
  const triggerCounts: Record<string, number> = {};
  decisions.forEach((decision) => {
    if (decision.learningTrace) {
      decision.learningTrace.forEach((trace) => {
        const trigger = trace.trigger || "Unknown";
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    }
  });

  const topLearningDrivers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / decisions.length) * 100),
    }));

  // If no learning drivers, provide defaults
  if (topLearningDrivers.length === 0) {
    topLearningDrivers.push(
      { name: "Signal Updates", value: 45 },
      { name: "Guardrail Adjustments", value: 30 },
      { name: "Outcome Logging", value: 25 }
    );
  }

  // 4. Resilience Tiers
  const excellent = decisionsWithAI.filter(
    (d) => (d.antifragilityIndex || 0) >= 70
  ).length;
  const moderate = decisionsWithAI.filter(
    (d) => (d.antifragilityIndex || 0) >= 40 && (d.antifragilityIndex || 0) < 70
  ).length;
  const low = decisionsWithAI.filter(
    (d) => (d.antifragilityIndex || 0) < 40
  ).length;

  const resilienceTiers = [
    {
      tier: "Excellent",
      count: excellent,
      color: "hsl(142, 76%, 36%)", // green
    },
    {
      tier: "Moderate",
      count: moderate,
      color: "hsl(48, 96%, 53%)", // yellow
    },
    {
      tier: "Low",
      count: low,
      color: "hsl(0, 84%, 60%)", // red
    },
  ].filter((tier) => tier.count > 0);

  return {
    avgAntifragility,
    breachTrend,
    topLearningDrivers,
    resilienceTiers,
  };
}
