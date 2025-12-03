import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircleIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  XIcon,
  PlusIcon,
  BarChart3Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface DecisionSummary {
  id: string;
  title: string;
  chosenOption: string;
  decisionDate: number;
  outcomeLogged: boolean;
  adjustmentCount: number;
  avgVariance: number;
  status: "outperforming" | "tracking" | "underperforming" | "pending";
}

interface ComparisonMetrics {
  decisionId: string;
  month: string;
  expected: number;
  actual: number;
  variance: number;
}

interface MultiDecisionComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDecisions: DecisionSummary[];
  onDecisionSelect?: (decisionId: string) => void;
}

export function MultiDecisionComparison({
  open,
  onOpenChange,
  availableDecisions,
  onDecisionSelect,
}: MultiDecisionComparisonProps) {
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([]);
  const [comparisonView, setComparisonView] = useState<"grid" | "chart">(
    "grid"
  );

  const handleAddDecision = (decisionId: string) => {
    if (
      !selectedDecisions.includes(decisionId) &&
      selectedDecisions.length < 4
    ) {
      setSelectedDecisions([...selectedDecisions, decisionId]);
    }
  };

  const handleRemoveDecision = (decisionId: string) => {
    setSelectedDecisions(selectedDecisions.filter((id) => id !== decisionId));
  };

  const getDecisionById = (id: string) =>
    availableDecisions.find((d) => d.id === id);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (
    status: DecisionSummary["status"]
  ): {
    text: string;
    bg: string;
    border: string;
  } => {
    switch (status) {
      case "outperforming":
        return {
          text: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/30",
          border: "border-green-300 dark:border-green-700",
        };
      case "tracking":
        return {
          text: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
          border: "border-blue-300 dark:border-blue-700",
        };
      case "underperforming":
        return {
          text: "text-red-600 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-900/30",
          border: "border-red-300 dark:border-red-700",
        };
      default:
        return {
          text: "text-muted-foreground",
          bg: "bg-muted",
          border: "border-border",
        };
    }
  };

  // Generate mock comparison data
  const generateComparisonData = (): ComparisonMetrics[] => {
    const data: ComparisonMetrics[] = [];
    const months = ["M1", "M2", "M3", "M4", "M5", "M6"];

    selectedDecisions.forEach((decisionId) => {
      const decision = getDecisionById(decisionId);
      if (!decision) return;

      months.forEach((month, index) => {
        const baseExpected = 100 + index * 5;
        const variance =
          decision.status === "outperforming"
            ? 5 + Math.random() * 5
            : decision.status === "underperforming"
              ? -5 - Math.random() * 5
              : -2 + Math.random() * 4;

        data.push({
          decisionId,
          month,
          expected: baseExpected,
          actual: baseExpected + variance,
          variance,
        });
      });
    });

    return data;
  };

  const comparisonData = generateComparisonData();

  // Group data by month for chart
  const chartData = ["M1", "M2", "M3", "M4", "M5", "M6"].map((month) => {
    const monthData: any = { month };
    selectedDecisions.forEach((decisionId) => {
      const decision = getDecisionById(decisionId);
      const dataPoint = comparisonData.find(
        (d) => d.decisionId === decisionId && d.month === month
      );
      if (dataPoint && decision) {
        monthData[`${decision.title.substring(0, 15)}...`] = dataPoint.variance;
      }
    });
    return monthData;
  });

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3Icon className="w-5 h-5 text-primary" />
            Multi-Decision Comparison
          </DialogTitle>
          <DialogDescription>
            Compare feedback loops across multiple decisions side-by-side
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Decision Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Decisions</CardTitle>
              <CardDescription>
                Choose up to 4 decisions to compare ({selectedDecisions.length}
                /4 selected)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                onValueChange={handleAddDecision}
                disabled={selectedDecisions.length >= 4}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add a decision to compare..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDecisions
                    .filter((d) => !selectedDecisions.includes(d.id))
                    .map((decision) => (
                      <SelectItem key={decision.id} value={decision.id}>
                        {decision.title} - {formatDate(decision.decisionDate)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedDecisions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDecisions.map((decisionId) => {
                    const decision = getDecisionById(decisionId);
                    if (!decision) return null;

                    return (
                      <Badge
                        key={decisionId}
                        variant="secondary"
                        className="pl-3 pr-1 py-1"
                      >
                        <span className="mr-2">{decision.title}</span>
                        <button
                          onClick={() => handleRemoveDecision(decisionId)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedDecisions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <PlusIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

                <p className="text-sm text-muted-foreground">
                  Select decisions above to start comparing
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* View Toggle */}
              <div className="flex justify-end gap-2">
                <Button
                  variant={comparisonView === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComparisonView("grid")}
                >
                  Grid View
                </Button>
                <Button
                  variant={comparisonView === "chart" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComparisonView("chart")}
                >
                  Chart View
                </Button>
              </div>

              {comparisonView === "grid" ? (
                /* Grid Comparison View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedDecisions.map((decisionId, index) => {
                    const decision = getDecisionById(decisionId);
                    if (!decision) return null;

                    const statusColors = getStatusColor(decision.status);

                    return (
                      <Card
                        key={decisionId}
                        className={cn("border-2", statusColors.border)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base mb-2">
                                {decision.title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {decision.chosenOption}
                              </CardDescription>
                            </div>
                            <Badge
                              className={cn(statusColors.bg, statusColors.text)}
                            >
                              {decision.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Decision Date */}
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />

                            <span className="text-muted-foreground">
                              Decided:
                            </span>
                            <span className="font-medium">
                              {formatDate(decision.decisionDate)}
                            </span>
                          </div>

                          {/* Outcome Status */}
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />

                            <span className="text-muted-foreground">
                              Outcome:
                            </span>
                            <span className="font-medium">
                              {decision.outcomeLogged ? "Logged" : "Pending"}
                            </span>
                          </div>

                          {/* Adjustments */}
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCwIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />

                            <span className="text-muted-foreground">
                              Adjustments:
                            </span>
                            <span className="font-medium">
                              {decision.adjustmentCount}
                            </span>
                          </div>

                          {/* Average Variance */}
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">
                              Avg Variance
                            </div>
                            <div
                              className={cn(
                                "text-2xl font-bold",
                                decision.avgVariance >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {decision.avgVariance > 0 ? "+" : ""}
                              {decision.avgVariance.toFixed(1)}%
                            </div>
                          </div>

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => onDecisionSelect?.(decisionId)}
                          >
                            View Details
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Chart Comparison View */
                <Card>
                  <CardHeader>
                    <CardTitle>Variance Comparison Over Time</CardTitle>
                    <CardDescription>
                      Performance variance trends across selected decisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                          />

                          <XAxis
                            dataKey="month"
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />

                          <YAxis
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />

                          <ChartTooltip />

                          <Legend />

                          {selectedDecisions.map((decisionId, index) => {
                            const decision = getDecisionById(decisionId);
                            if (!decision) return null;

                            return (
                              <Line
                                key={decisionId}
                                type="monotone"
                                dataKey={`${decision.title.substring(0, 15)}...`}
                                stroke={colors[index]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Comparison Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Comparison Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Best Performer
                      </div>
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {(() => {
                          const best = selectedDecisions
                            .map((id) => getDecisionById(id))
                            .filter(
                              (d): d is DecisionSummary => d !== undefined
                            )
                            .sort((a, b) => b.avgVariance - a.avgVariance)[0];
                          return best
                            ? best.title.substring(0, 20) + "..."
                            : "N/A";
                        })()}
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Most Adjustments
                      </div>
                      <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {(() => {
                          const most = selectedDecisions
                            .map((id) => getDecisionById(id))
                            .filter(
                              (d): d is DecisionSummary => d !== undefined
                            )
                            .sort(
                              (a, b) => b.adjustmentCount - a.adjustmentCount
                            )[0];
                          return most ? most.adjustmentCount : 0;
                        })()}{" "}
                        times
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Avg Variance
                      </div>
                      <div
                        className={cn(
                          "text-sm font-bold",
                          (() => {
                            const decisions = selectedDecisions
                              .map((id) => getDecisionById(id))
                              .filter(
                                (d): d is DecisionSummary => d !== undefined
                              );
                            const avg =
                              decisions.reduce(
                                (sum, d) => sum + d.avgVariance,
                                0
                              ) / decisions.length;
                            return avg >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400";
                          })()
                        )}
                      >
                        {(() => {
                          const decisions = selectedDecisions
                            .map((id) => getDecisionById(id))
                            .filter(
                              (d): d is DecisionSummary => d !== undefined
                            );
                          const avg =
                            decisions.reduce(
                              (sum, d) => sum + d.avgVariance,
                              0
                            ) / decisions.length;
                          return `${avg > 0 ? "+" : ""}${avg.toFixed(1)}%`;
                        })()}
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Outcomes Logged
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {
                          selectedDecisions
                            .map((id) => getDecisionById(id))
                            .filter((d) => d?.outcomeLogged).length
                        }
                        /{selectedDecisions.length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
