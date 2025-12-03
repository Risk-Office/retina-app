import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  InfoIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLearningTrace,
  type LearningTrace,
} from "@/polymet/data/auto-refresh-engine";
import { useTenant } from "@/polymet/data/tenant-context";

export interface ResilienceDecisionData {
  id: string;
  title: string;
  antifragilityIndex: number;
  expectedValue: number;
  var95: number;
  creditRiskScore: number;
  diversificationIndex: number;
  status?: "active" | "closed" | "pending";
  learningTrace?: LearningTrace;
}

interface ResilienceComparisonGridProps {
  decisions: ResilienceDecisionData[];
  onDecisionClick?: (decisionId: string) => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
  className?: string;
}

type SortColumn =
  | "title"
  | "antifragilityIndex"
  | "expectedValue"
  | "var95"
  | "creditRiskScore"
  | "diversificationIndex";
type SortDirection = "asc" | "desc" | null;

/**
 * Get color for value based on min/max range
 */
function getColorScale(
  value: number,
  min: number,
  max: number,
  higherIsBetter: boolean
): string {
  if (min === max) return "bg-muted";

  const normalized = (value - min) / (max - min);

  if (higherIsBetter) {
    // Green scale for higher is better
    if (normalized >= 0.8)
      return "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100";
    if (normalized >= 0.6)
      return "bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200";
    if (normalized >= 0.4)
      return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
    if (normalized >= 0.2)
      return "bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200";
    return "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200";
  } else {
    // Red scale for lower is better
    if (normalized >= 0.8)
      return "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200";
    if (normalized >= 0.6)
      return "bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200";
    if (normalized >= 0.4)
      return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
    if (normalized >= 0.2)
      return "bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200";
    return "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100";
  }
}

/**
 * Get antifragility badge color
 */
function getAntifragilityBadge(value: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (value >= 70) return { label: "Excellent", variant: "default" };
  if (value >= 50) return { label: "Good", variant: "secondary" };
  if (value >= 30) return { label: "Moderate", variant: "outline" };
  return { label: "Fragile", variant: "destructive" };
}

/**
 * Sparkline component for antifragility trend
 */
function AntifragilitySparkline({ trace }: { trace?: LearningTrace }) {
  if (!trace || trace.entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-8 text-xs text-muted-foreground">
        No data
      </div>
    );
  }

  // Get antifragility scores over time (use recovery ratios as proxy)
  const dataPoints = trace.entries.map((e) => ({
    timestamp: e.timestamp,
    value: e.recoveryRatio,
  }));

  // Normalize to 0-100 scale for visualization
  const minValue = Math.min(...dataPoints.map((d) => d.value));
  const maxValue = Math.max(...dataPoints.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const normalizedPoints = dataPoints.map((d) => ({
    ...d,
    normalized: ((d.value - minValue) / range) * 100,
  }));

  // Create SVG path
  const width = 120;
  const height = 32;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = normalizedPoints.map((point, index) => {
    const x = padding + (index / (normalizedPoints.length - 1)) * chartWidth;
    const y = padding + chartHeight - (point.normalized / 100) * chartHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;

  // Determine trend
  const firstValue = dataPoints[0].value;
  const lastValue = dataPoints[dataPoints.length - 1].value;
  const trend =
    lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "flat";
  const trendColor =
    trend === "up"
      ? "text-green-600 dark:text-green-400"
      : trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
          strokeDasharray="2,2"
        />

        {/* Sparkline */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn(
            trend === "up"
              ? "text-green-600 dark:text-green-400"
              : trend === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-blue-600 dark:text-blue-400"
          )}
        />

        {/* Data points */}
        {normalizedPoints.map((point, index) => {
          const x =
            padding + (index / (normalizedPoints.length - 1)) * chartWidth;
          const y =
            padding + chartHeight - (point.normalized / 100) * chartHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="currentColor"
              className={cn(
                trend === "up"
                  ? "text-green-600 dark:text-green-400"
                  : trend === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
              )}
            />
          );
        })}
      </svg>

      {/* Trend indicator */}
      <div className={cn("flex items-center", trendColor)}>
        {trend === "up" && <TrendingUpIcon className="h-4 w-4" />}
        {trend === "down" && <TrendingDownIcon className="h-4 w-4" />}
        {trend === "flat" && <MinusIcon className="h-4 w-4" />}
      </div>
    </div>
  );
}

export function ResilienceComparisonGrid({
  decisions,
  onDecisionClick,
  onAuditEvent,
  className,
}: ResilienceComparisonGridProps) {
  const { tenant } = useTenant();
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Load learning traces for all decisions
  const decisionsWithTraces = useMemo(() => {
    return decisions.map((decision) => {
      const trace = getLearningTrace(decision.id, tenant.tenantId);
      return {
        ...decision,
        learningTrace: trace || undefined,
      };
    });
  }, [decisions, tenant.tenantId]);

  // Calculate min/max for each metric
  const ranges = useMemo(() => {
    if (decisions.length === 0) {
      return {
        antifragilityIndex: { min: 0, max: 100 },
        expectedValue: { min: 0, max: 0 },
        var95: { min: 0, max: 0 },
        creditRiskScore: { min: 0, max: 100 },
        diversificationIndex: { min: 0, max: 100 },
      };
    }

    return {
      antifragilityIndex: {
        min: Math.min(...decisions.map((d) => d.antifragilityIndex)),
        max: Math.max(...decisions.map((d) => d.antifragilityIndex)),
      },
      expectedValue: {
        min: Math.min(...decisions.map((d) => d.expectedValue)),
        max: Math.max(...decisions.map((d) => d.expectedValue)),
      },
      var95: {
        min: Math.min(...decisions.map((d) => d.var95)),
        max: Math.max(...decisions.map((d) => d.var95)),
      },
      creditRiskScore: {
        min: Math.min(...decisions.map((d) => d.creditRiskScore)),
        max: Math.max(...decisions.map((d) => d.creditRiskScore)),
      },
      diversificationIndex: {
        min: Math.min(...decisions.map((d) => d.diversificationIndex)),
        max: Math.max(...decisions.map((d) => d.diversificationIndex)),
      },
    };
  }, [decisions]);

  // Sort decisions
  const sortedDecisions = useMemo(() => {
    if (!sortColumn || !sortDirection) return decisionsWithTraces;

    return [...decisionsWithTraces].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [decisionsWithTraces, sortColumn, sortDirection]);

  // Handle recalculation
  const handleRecalculate = () => {
    if (onAuditEvent) {
      onAuditEvent("resilience.scores_recalculated", {
        tenantId: tenant.tenantId,
        decisionCount: decisions.length,
        timestamp: Date.now(),
        message: "Resilience score recalculated.",
      });
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDownIcon className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUpIcon className="h-4 w-4 ml-1" />;
    }
    return <ArrowDownIcon className="h-4 w-4 ml-1" />;
  };

  if (decisions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            See which choices bounce back best
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Compare all decisions side-by-side by how robust or
                    antifragile they are.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Resilience comparison across all decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No decisions to compare yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          See which choices bounce back best
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Compare all decisions side-by-side by how robust or
                  antifragile they are.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Resilience comparison across {decisions.length} decision
          {decisions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center">
                    Decision
                    {getSortIcon("title")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort("antifragilityIndex")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end">
                          Antifragility Index
                          {getSortIcon("antifragilityIndex")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          How well the decision benefits from volatility and
                          stress
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort("expectedValue")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end">
                          Expected Value
                          {getSortIcon("expectedValue")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average expected outcome across all scenarios</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort("var95")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end">
                          VaR95
                          {getSortIcon("var95")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Value at Risk (95th percentile) - worst-case downside
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort("creditRiskScore")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end">
                          Credit Risk
                          {getSortIcon("creditRiskScore")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Counterparty and partner credit exposure risk</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort("diversificationIndex")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end">
                          Diversification
                          {getSortIcon("diversificationIndex")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          How well-diversified the decision's risk factors are
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          Trend Over Time
                          <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Shows if the decision is getting stronger or weaker
                          with experience.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDecisions.map((decision) => {
                const aiBadge = getAntifragilityBadge(
                  decision.antifragilityIndex
                );

                return (
                  <TableRow
                    key={decision.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      onDecisionClick && "cursor-pointer"
                    )}
                    onClick={() => onDecisionClick?.(decision.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{decision.title}</span>
                        {decision.status && (
                          <Badge variant="outline" className="w-fit text-xs">
                            {decision.status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-md font-medium",
                            getColorScale(
                              decision.antifragilityIndex,
                              ranges.antifragilityIndex.min,
                              ranges.antifragilityIndex.max,
                              true
                            )
                          )}
                        >
                          {decision.antifragilityIndex.toFixed(1)}
                        </span>
                        <Badge variant={aiBadge.variant} className="text-xs">
                          {aiBadge.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-md font-medium",
                          getColorScale(
                            decision.expectedValue,
                            ranges.expectedValue.min,
                            ranges.expectedValue.max,
                            true
                          )
                        )}
                      >
                        ${decision.expectedValue.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-md font-medium",
                          getColorScale(
                            decision.var95,
                            ranges.var95.min,
                            ranges.var95.max,
                            false
                          )
                        )}
                      >
                        ${Math.abs(decision.var95).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-md font-medium",
                          getColorScale(
                            decision.creditRiskScore,
                            ranges.creditRiskScore.min,
                            ranges.creditRiskScore.max,
                            false
                          )
                        )}
                      >
                        {decision.creditRiskScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-md font-medium",
                          getColorScale(
                            decision.diversificationIndex,
                            ranges.diversificationIndex.min,
                            ranges.diversificationIndex.max,
                            true
                          )
                        )}
                      >
                        {decision.diversificationIndex.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center">
                              <AntifragilitySparkline
                                trace={decision.learningTrace}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">Antifragility Trend</p>
                              {decision.learningTrace &&
                              decision.learningTrace.entries.length > 0 ? (
                                <>
                                  <p className="text-xs text-muted-foreground">
                                    {decision.learningTrace.entries.length} data
                                    points
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Last updated:{" "}
                                    {new Date(
                                      decision.learningTrace.lastUpdated
                                    ).toLocaleDateString()}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No learning trace data available
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950 border border-border" />

            <span>Better</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-50 dark:bg-yellow-900/30 border border-border" />

            <span>Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-900/30 border border-border" />

            <span>Worse</span>
          </div>
          <div className="ml-auto">Click column headers to sort</div>
        </div>
      </CardContent>
    </Card>
  );
}
