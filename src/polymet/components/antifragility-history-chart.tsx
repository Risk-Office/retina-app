import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AntifragilityHistoryPoint {
  timestamp: number;
  value: number;
  label?: string;
  event?: string;
}

interface AntifragilityHistoryChartProps {
  data: AntifragilityHistoryPoint[];
  title?: string;
  description?: string;
  showTrend?: boolean;
  showThresholds?: boolean;
  thresholds?: {
    excellent: number;
    moderate: number;
  };
  className?: string;
}

/**
 * Calculate trend from historical data
 */
function calculateTrend(data: AntifragilityHistoryPoint[]): {
  direction: "up" | "down" | "stable";
  change: number;
  percentage: number;
} {
  if (data.length < 2) {
    return { direction: "stable", change: 0, percentage: 0 };
  }

  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const change = lastValue - firstValue;
  const percentage = (change / firstValue) * 100;

  let direction: "up" | "down" | "stable" = "stable";
  if (Math.abs(change) > 2) {
    direction = change > 0 ? "up" : "down";
  }

  return { direction, change, percentage };
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 space-y-1">
      <p className="text-sm font-semibold">{formatTimestamp(data.timestamp)}</p>
      <p className="text-sm">
        <span className="text-muted-foreground">Index: </span>
        <span className="font-bold">{data.value.toFixed(1)}</span>
      </p>
      {data.label && (
        <p className="text-xs text-muted-foreground">{data.label}</p>
      )}
      {data.event && (
        <p className="text-xs text-primary font-medium">Event: {data.event}</p>
      )}
    </div>
  );
}

export function AntifragilityHistoryChart({
  data,
  title = "Antifragility History",
  description = "Track how antifragility index changes over time",
  showTrend = true,
  showThresholds = true,
  thresholds = { excellent: 70, moderate: 40 },
  className,
}: AntifragilityHistoryChartProps) {
  const trend = calculateTrend(data);

  // Format data for chart
  const chartData = data.map((point) => ({
    ...point,
    date: formatTimestamp(point.timestamp),
  }));

  // Get trend indicator
  const getTrendIcon = () => {
    switch (trend.direction) {
      case "up":
        return TrendingUpIcon;
      case "down":
        return TrendingDownIcon;
      default:
        return MinusIcon;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showTrend && data.length >= 2 && (
            <div className="flex items-center gap-2">
              <TrendIcon className={cn("w-5 h-5", getTrendColor())} />

              <div className="text-right">
                <p className={cn("text-lg font-bold", getTrendColor())}>
                  {trend.change > 0 ? "+" : ""}
                  {trend.change.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trend.percentage > 0 ? "+" : ""}
                  {trend.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No historical data available
            </p>
          </div>
        ) : data.length === 1 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Need at least 2 data points to show trend
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />

              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend />

              {/* Threshold lines */}
              {showThresholds && (
                <>
                  <ReferenceLine
                    y={thresholds.excellent}
                    stroke="hsl(var(--chart-1))"
                    strokeDasharray="3 3"
                    label={{
                      value: "Excellent",
                      position: "right",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                  />

                  <ReferenceLine
                    y={thresholds.moderate}
                    stroke="hsl(var(--chart-4))"
                    strokeDasharray="3 3"
                    label={{
                      value: "Moderate",
                      position: "right",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                  />
                </>
              )}

              {/* Area fill */}
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />

                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="url(#colorValue)"
                fillOpacity={1}
              />

              {/* Main line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{
                  fill: "hsl(var(--primary))",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{ r: 6 }}
                name="Antifragility Index"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* Summary Statistics */}
        {data.length >= 2 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="text-lg font-bold">
                {data[data.length - 1].value.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Average</p>
              <p className="text-lg font-bold">
                {(
                  data.reduce((sum, d) => sum + d.value, 0) / data.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Peak</p>
              <p className="text-lg font-bold">
                {Math.max(...data.map((d) => d.value)).toFixed(1)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
