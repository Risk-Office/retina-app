import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  TrendingUpIcon,
  DollarSignIcon,
  PercentIcon,
  CheckCircleIcon,
} from "lucide-react";
import type {
  SimulationResult,
  UtilityParams,
} from "@/polymet/data/scenario-engine";
import {
  computeUtility,
  computeCertaintyEquivalent,
} from "@/polymet/data/scenario-engine";

interface PortfolioOptimizerProps {
  results: SimulationResult[];
  utilityParams: UtilityParams;
  totalBudget: number;
  onApplyAllocation?: (allocation: PortfolioAllocation[]) => void;
}

interface PortfolioAllocation {
  optionId: string;
  optionLabel: string;
  weight: number;
  amount: number;
}

interface OptimizationResult {
  allocation: PortfolioAllocation[];
  portfolioEV: number;
  portfolioVaR95: number;
  portfolioCE: number;
  portfolioUtility: number;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function PortfolioOptimizer({
  results,
  utilityParams,
  totalBudget,
  onApplyAllocation,
}: PortfolioOptimizerProps) {
  const [budget, setBudget] = useState(totalBudget);
  const [manualWeights, setManualWeights] = useState<Record<string, number>>(
    {}
  );
  const [optimizationMode, setOptimizationMode] = useState<
    "utility" | "manual"
  >("utility");
  const [optimized, setOptimized] = useState(false);

  // Optimize portfolio allocation based on utility maximization
  const optimizedAllocation = useMemo((): OptimizationResult | null => {
    if (results.length === 0) return null;

    // Simple optimization: allocate based on CE/cost ratio
    const allocations: PortfolioAllocation[] = results.map((result) => {
      const ce = result.certaintyEquivalent ?? result.ev;
      // Assume cost is proportional to expected return (simplified)
      const estimatedCost = Math.abs(result.ev) * 0.5;
      const efficiency = estimatedCost > 0 ? ce / estimatedCost : 0;

      return {
        optionId: result.optionId,
        optionLabel: result.optionLabel,
        weight: 0,
        amount: 0,
        efficiency,
      } as any;
    });

    // Sort by efficiency
    allocations.sort((a: any, b: any) => b.efficiency - a.efficiency);

    // Allocate budget proportionally to efficiency
    const totalEfficiency = allocations.reduce(
      (sum: number, a: any) => sum + a.efficiency,
      0
    );

    if (totalEfficiency > 0) {
      allocations.forEach((alloc: any) => {
        alloc.weight = alloc.efficiency / totalEfficiency;
        alloc.amount = alloc.weight * budget;
      });
    }

    // Calculate portfolio metrics
    const portfolioEV = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return sum + (result?.ev ?? 0) * alloc.weight;
    }, 0);

    const portfolioVaR95 = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return sum + (result?.var95 ?? 0) * alloc.weight;
    }, 0);

    const portfolioCE = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return (
        sum + (result?.certaintyEquivalent ?? result?.ev ?? 0) * alloc.weight
      );
    }, 0);

    // Compute portfolio utility (simplified as weighted average)
    const portfolioUtility = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return sum + (result?.expectedUtility ?? 0) * alloc.weight;
    }, 0);

    return {
      allocation: allocations.map(
        ({ optionId, optionLabel, weight, amount }) => ({
          optionId,
          optionLabel,
          weight,
          amount,
        })
      ),
      portfolioEV,
      portfolioVaR95,
      portfolioCE,
      portfolioUtility,
    };
  }, [results, budget, utilityParams]);

  // Manual allocation
  const manualAllocation = useMemo((): OptimizationResult | null => {
    if (results.length === 0) return null;

    const totalWeight = Object.values(manualWeights).reduce(
      (sum, w) => sum + w,
      0
    );

    if (totalWeight === 0) return null;

    const allocations: PortfolioAllocation[] = results.map((result) => {
      const weight = (manualWeights[result.optionId] ?? 0) / totalWeight;
      return {
        optionId: result.optionId,
        optionLabel: result.optionLabel,
        weight,
        amount: weight * budget,
      };
    });

    // Calculate portfolio metrics
    const portfolioEV = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return sum + (result?.ev ?? 0) * alloc.weight;
    }, 0);

    const portfolioVaR95 = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return sum + (result?.var95 ?? 0) * alloc.weight;
    }, 0);

    const portfolioCE = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return (
        sum + (result?.certaintyEquivalent ?? result?.ev ?? 0) * alloc.weight
      );
    }, 0);

    const portfolioUtility = allocations.reduce((sum, alloc) => {
      const result = results.find((r) => r.optionId === alloc.optionId);
      return sum + (result?.expectedUtility ?? 0) * alloc.weight;
    }, 0);

    return {
      allocation: allocations,
      portfolioEV,
      portfolioVaR95,
      portfolioCE,
      portfolioUtility,
    };
  }, [results, manualWeights, budget]);

  const currentAllocation =
    optimizationMode === "utility" ? optimizedAllocation : manualAllocation;

  const handleWeightChange = (optionId: string, value: number) => {
    setManualWeights((prev) => ({ ...prev, [optionId]: value }));
  };

  const handleOptimize = () => {
    setOptimizationMode("utility");
    setOptimized(true);
  };

  const handleApply = () => {
    if (currentAllocation && onApplyAllocation) {
      onApplyAllocation(currentAllocation.allocation);
    }
  };

  const pieChartData =
    currentAllocation?.allocation
      .filter((a) => a.weight > 0.01)
      .map((alloc) => ({
        name: alloc.optionLabel,
        value: alloc.weight * 100,
        amount: alloc.amount,
      })) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Portfolio Optimization
          </CardTitle>
          <CardDescription>
            Optimize allocation across options using utility-based optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Total Budget</Label>
            <div className="flex items-center gap-2">
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />

              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleOptimize}
              variant={optimizationMode === "utility" ? "default" : "outline"}
              className="flex-1"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Optimize by Utility
            </Button>
            <Button
              onClick={() => setOptimizationMode("manual")}
              variant={optimizationMode === "manual" ? "default" : "outline"}
              className="flex-1"
            >
              Manual Allocation
            </Button>
          </div>
        </CardContent>
      </Card>

      {optimizationMode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Manual Weight Allocation
            </CardTitle>
            <CardDescription>
              Adjust weights for each option (will be normalized)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result) => (
              <div key={result.optionId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{result.optionLabel}</Label>
                  <span className="text-sm font-mono">
                    {((manualWeights[result.optionId] ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[manualWeights[result.optionId] ?? 0]}
                  onValueChange={([value]) =>
                    handleWeightChange(result.optionId, value)
                  }
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {currentAllocation && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portfolio Metrics</CardTitle>
              <CardDescription>
                {optimizationMode === "utility" ? "Optimized" : "Manual"}{" "}
                allocation performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Expected Value
                  </div>
                  <div className="text-lg font-semibold">
                    ${currentAllocation.portfolioEV.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">VaR 95%</div>
                  <div className="text-lg font-semibold">
                    ${currentAllocation.portfolioVaR95.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Certainty Equivalent
                  </div>
                  <div className="text-lg font-semibold">
                    ${currentAllocation.portfolioCE.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Expected Utility
                  </div>
                  <div className="text-lg font-semibold">
                    {currentAllocation.portfolioUtility.toFixed(6)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Allocation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Option</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAllocation.allocation.map((alloc, index) => (
                      <TableRow key={alloc.optionId}>
                        <TableCell className="font-medium">
                          {alloc.optionLabel}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {(alloc.weight * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ${alloc.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Allocation Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${value.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [
                          `${value.toFixed(1)}% ($${props.payload.amount.toFixed(2)})`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {onApplyAllocation && (
            <Card>
              <CardContent className="pt-6">
                <Button onClick={handleApply} className="w-full" size="lg">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Apply Portfolio Allocation
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
