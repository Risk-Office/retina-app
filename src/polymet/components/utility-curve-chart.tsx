import React, { useMemo } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  SimulationResult,
  UtilityParams,
} from "@/polymet/data/scenario-engine";
import { computeUtility } from "@/polymet/data/scenario-engine";

interface UtilityCurveChartProps {
  results: SimulationResult[];
  utilityParams: UtilityParams;
  selectedOptionId?: string;
  onCurveClick?: (optionId: string) => void;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function UtilityCurveChart({
  results,
  utilityParams,
  selectedOptionId,
  onCurveClick,
}: UtilityCurveChartProps) {
  // Generate utility curves
  const chartData = useMemo(() => {
    if (results.length === 0) return [];

    // Find min and max outcomes across all options
    let minOutcome = Infinity;
    let maxOutcome = -Infinity;

    results.forEach((result) => {
      const min = Math.min(...result.outcomes);
      const max = Math.max(...result.outcomes);
      minOutcome = Math.min(minOutcome, min);
      maxOutcome = Math.max(maxOutcome, max);
    });

    // Add some padding
    const range = maxOutcome - minOutcome;
    const padding = range * 0.1;
    minOutcome -= padding;
    maxOutcome += padding;

    // Generate 100 points along the outcome range
    const numPoints = 100;
    const step = (maxOutcome - minOutcome) / (numPoints - 1);

    const data: Array<Record<string, any>> = [];

    for (let i = 0; i < numPoints; i++) {
      const outcome = minOutcome + i * step;
      const point: Record<string, any> = { outcome };

      results.forEach((result) => {
        const utility = computeUtility(outcome, utilityParams);
        point[result.optionId] = utility;
      });

      data.push(point);
    }

    return data;
  }, [results, utilityParams]);

  // Format utility mode name
  const utilityModeName = useMemo(() => {
    switch (utilityParams.mode) {
      case "CARA":
        return "CARA (Constant Absolute Risk Aversion)";
      case "CRRA":
        return "CRRA (Constant Relative Risk Aversion)";
      case "Exponential":
        return "Exponential Utility";
      default:
        return utilityParams.mode;
    }
  }, [utilityParams.mode]);

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Utility Curves</CardTitle>
          <CardDescription>No simulation results available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Utility Curves</CardTitle>
            <CardDescription>
              Utility function comparison across outcome ranges
            </CardDescription>
          </div>
          <Badge variant="outline">{utilityModeName}</Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <div>Risk aversion (a): {utilityParams.a}</div>
          <div>Outcome scale: {utilityParams.scale.toLocaleString()}</div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

            <XAxis
              dataKey="outcome"
              label={{
                value: "Outcome",
                position: "insideBottom",
                offset: -5,
              }}
              tickFormatter={(value) => value.toFixed(0)}
              className="text-xs"
            />

            <YAxis
              label={{
                value: "Utility",
                angle: -90,
                position: "insideLeft",
              }}
              tickFormatter={(value) => value.toFixed(3)}
              className="text-xs"
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;

                const outcome = payload[0].payload.outcome;

                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <div className="text-sm font-semibold mb-2">
                      Outcome: {outcome.toFixed(2)}
                    </div>
                    <div className="space-y-1">
                      {payload.map((entry, index) => {
                        const result = results.find(
                          (r) => r.optionId === entry.dataKey
                        );
                        if (!result) return null;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />

                              <span>{result.optionLabel}</span>
                            </div>
                            <span className="font-mono">
                              {(entry.value as number).toFixed(6)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              content={({ payload }) => {
                if (!payload) return null;

                return (
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    {payload.map((entry, index) => {
                      const result = results.find(
                        (r) => r.optionId === entry.dataKey
                      );
                      if (!result) return null;

                      const isSelected = selectedOptionId === result.optionId;

                      return (
                        <button
                          key={index}
                          onClick={() => onCurveClick?.(result.optionId)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                            isSelected
                              ? "bg-primary/10 border border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />

                          <span className="text-sm font-medium">
                            {result.optionLabel}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            EU: {(result.expectedUtility ?? 0).toFixed(3)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />

            {results.map((result, index) => (
              <Line
                key={result.optionId}
                type="monotone"
                dataKey={result.optionId}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={selectedOptionId === result.optionId ? 3 : 2}
                dot={false}
                opacity={
                  selectedOptionId
                    ? selectedOptionId === result.optionId
                      ? 1
                      : 0.3
                    : 1
                }
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result, index) => (
            <div
              key={result.optionId}
              className={`p-4 border rounded-lg transition-colors ${
                selectedOptionId === result.optionId
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />

                <div className="font-semibold text-sm">
                  {result.optionLabel}
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Expected Utility:</span>
                  <span className="font-mono">
                    {(result.expectedUtility ?? 0).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Certainty Equivalent:</span>
                  <span className="font-mono">
                    {(result.certaintyEquivalent ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Value:</span>
                  <span className="font-mono">{result.ev.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
