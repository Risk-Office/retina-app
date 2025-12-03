import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";
import type {
  SimulationResult,
  UtilityParams,
} from "@/polymet/data/scenario-engine";
import {
  computeUtility,
  computeCertaintyEquivalent,
} from "@/polymet/data/scenario-engine";
import type { UtilityMode } from "@/polymet/data/tenant-settings";

interface UtilityComparisonReportProps {
  results: SimulationResult[];
  currentMode: UtilityMode;
  coefficient: number;
  scale: number;
}

interface ModeComparison {
  mode: UtilityMode;
  optionId: string;
  optionLabel: string;
  expectedUtility: number;
  certaintyEquivalent: number;
  riskPremium: number;
}

export function UtilityComparisonReport({
  results,
  currentMode,
  coefficient,
  scale,
}: UtilityComparisonReportProps) {
  const allModes: UtilityMode[] = [
    "CARA",
    "CRRA",
    "Exponential",
    "Quadratic",
    "Power",
  ];

  // Compute utility metrics for all modes
  const modeComparisons = useMemo(() => {
    const comparisons: ModeComparison[] = [];

    allModes.forEach((mode) => {
      results.forEach((result) => {
        const params: UtilityParams = { mode, a: coefficient, scale };

        // Compute expected utility
        const utilities = result.outcomes.map((outcome) =>
          computeUtility(outcome, params)
        );
        const expectedUtility =
          utilities.reduce((sum, u) => sum + u, 0) / utilities.length;

        // Compute certainty equivalent
        const certaintyEquivalent = computeCertaintyEquivalent(
          expectedUtility,
          params
        );

        // Risk premium = EV - CE
        const riskPremium = result.ev - certaintyEquivalent;

        comparisons.push({
          mode,
          optionId: result.optionId,
          optionLabel: result.optionLabel,
          expectedUtility,
          certaintyEquivalent,
          riskPremium,
        });
      });
    });

    return comparisons;
  }, [results, coefficient, scale]);

  // Group by mode
  const comparisonsByMode = useMemo(() => {
    const grouped: Record<UtilityMode, ModeComparison[]> = {
      CARA: [],
      CRRA: [],
      Exponential: [],
      Quadratic: [],
      Power: [],
    };

    modeComparisons.forEach((comp) => {
      grouped[comp.mode].push(comp);
    });

    return grouped;
  }, [modeComparisons]);

  // Prepare chart data comparing CE across modes
  const chartData = useMemo(() => {
    const data: any[] = [];

    results.forEach((result) => {
      const point: any = {
        option: result.optionLabel,
        EV: result.ev,
      };

      allModes.forEach((mode) => {
        const comp = modeComparisons.find(
          (c) => c.mode === mode && c.optionId === result.optionId
        );
        if (comp) {
          point[mode] = comp.certaintyEquivalent;
        }
      });

      data.push(point);
    });

    return data;
  }, [results, modeComparisons]);

  // Risk preference analysis
  const riskPreferenceAnalysis = useMemo(() => {
    const analysis: Record<
      UtilityMode,
      { avgRiskPremium: number; preference: string }
    > = {
      CARA: { avgRiskPremium: 0, preference: "" },
      CRRA: { avgRiskPremium: 0, preference: "" },
      Exponential: { avgRiskPremium: 0, preference: "" },
      Quadratic: { avgRiskPremium: 0, preference: "" },
      Power: { avgRiskPremium: 0, preference: "" },
    };

    allModes.forEach((mode) => {
      const comps = comparisonsByMode[mode];
      const avgRiskPremium =
        comps.reduce((sum, c) => sum + c.riskPremium, 0) / comps.length;

      let preference = "Neutral";
      if (avgRiskPremium > 100) {
        preference = "Highly Risk Averse";
      } else if (avgRiskPremium > 10) {
        preference = "Risk Averse";
      } else if (avgRiskPremium > -10) {
        preference = "Risk Neutral";
      } else if (avgRiskPremium > -100) {
        preference = "Risk Seeking";
      } else {
        preference = "Highly Risk Seeking";
      }

      analysis[mode] = { avgRiskPremium, preference };
    });

    return analysis;
  }, [comparisonsByMode]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Utility Function Comparison
          </CardTitle>
          <CardDescription>
            Compare risk preferences across different utility modes with
            coefficient a={coefficient.toExponential(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Detailed Comparison</TabsTrigger>
              <TabsTrigger value="chart">Visual Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allModes.map((mode) => {
                  const analysis = riskPreferenceAnalysis[mode];
                  const isCurrent = mode === currentMode;

                  return (
                    <Card
                      key={mode}
                      className={isCurrent ? "border-primary" : ""}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{mode}</CardTitle>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Risk Preference
                          </div>
                          <Badge
                            variant={
                              analysis.preference.includes("Averse")
                                ? "destructive"
                                : analysis.preference.includes("Neutral")
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {analysis.preference}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Avg Risk Premium
                          </div>
                          <div className="flex items-center gap-2">
                            {analysis.avgRiskPremium > 10 ? (
                              <TrendingUpIcon className="h-4 w-4 text-red-500" />
                            ) : analysis.avgRiskPremium < -10 ? (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <MinusIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-mono text-sm">
                              ${analysis.avgRiskPremium.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Understanding Risk Premium
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>
                    <strong>Risk Premium = EV - CE</strong>
                  </p>
                  <p>
                    • Positive premium: You require compensation for risk (risk
                    averse)
                  </p>
                  <p>• Zero premium: Indifferent to risk (risk neutral)</p>
                  <p>
                    • Negative premium: You prefer risky outcomes (risk seeking)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {allModes.map((mode) => (
                <Card key={mode}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {mode} Utility
                      </CardTitle>
                      {mode === currentMode && (
                        <Badge variant="default">Current Mode</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Option</TableHead>
                          <TableHead className="text-right">EV</TableHead>
                          <TableHead className="text-right">CE</TableHead>
                          <TableHead className="text-right">
                            Risk Premium
                          </TableHead>
                          <TableHead className="text-right">
                            Expected Utility
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonsByMode[mode].map((comp) => (
                          <TableRow key={comp.optionId}>
                            <TableCell className="font-medium">
                              {comp.optionLabel}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              $
                              {results
                                .find((r) => r.optionId === comp.optionId)
                                ?.ev.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              ${comp.certaintyEquivalent.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              <span
                                className={
                                  comp.riskPremium > 10
                                    ? "text-red-500"
                                    : comp.riskPremium < -10
                                      ? "text-green-500"
                                      : ""
                                }
                              >
                                ${comp.riskPremium.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {comp.expectedUtility.toFixed(6)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Certainty Equivalent Comparison
                  </CardTitle>
                  <CardDescription>
                    Compare how different utility modes value the same options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />

                        <XAxis
                          dataKey="option"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--foreground))" }}
                        />

                        <YAxis
                          className="text-xs"
                          tick={{ fill: "hsl(var(--foreground))" }}
                          label={{
                            value: "Value ($)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />

                        <ChartTooltip />

                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="EV"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Expected Value"
                        />

                        <Line
                          type="monotone"
                          dataKey="CARA"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          name="CARA"
                        />

                        <Line
                          type="monotone"
                          dataKey="CRRA"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          name="CRRA"
                        />

                        <Line
                          type="monotone"
                          dataKey="Exponential"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          name="Exponential"
                        />

                        <Line
                          type="monotone"
                          dataKey="Quadratic"
                          stroke="hsl(var(--chart-4))"
                          strokeWidth={2}
                          name="Quadratic"
                        />

                        <Line
                          type="monotone"
                          dataKey="Power"
                          stroke="hsl(var(--chart-5))"
                          strokeWidth={2}
                          name="Power"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
