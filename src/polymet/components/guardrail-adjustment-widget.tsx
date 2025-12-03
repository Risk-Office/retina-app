import { useState, useMemo } from "react";
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
  ShieldAlertIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SettingsIcon,
} from "lucide-react";
import {
  getAdjustmentStats,
  loadAutoAdjustConfig,
  type AdjustmentTrend,
} from "@/polymet/data/guardrail-auto-adjust";
import { useTenant } from "@/polymet/data/tenant-context";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface GuardrailAdjustmentWidgetProps {
  days?: number;
  onConfigureClick?: () => void;
}

export function GuardrailAdjustmentWidget({
  days = 30,
  onConfigureClick,
}: GuardrailAdjustmentWidgetProps) {
  const { tenant } = useTenant();
  const [timeRange, setTimeRange] = useState(days);

  const stats = useMemo(() => {
    return getAdjustmentStats(tenant.tenantId, timeRange);
  }, [tenant.tenantId, timeRange]);

  const config = loadAutoAdjustConfig(tenant.tenantId);

  // Calculate trend direction
  const recentTrend = useMemo(() => {
    if (stats.trends.length < 2) return "stable";

    const midpoint = Math.floor(stats.trends.length / 2);
    const firstHalf = stats.trends.slice(0, midpoint);
    const secondHalf = stats.trends.slice(midpoint);

    const firstHalfAvg =
      firstHalf.reduce((sum, t) => sum + t.count, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, t) => sum + t.count, 0) / secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.2) return "increasing";
    if (secondHalfAvg < firstHalfAvg * 0.8) return "decreasing";
    return "stable";
  }, [stats.trends]);

  // Get severity badge color
  const getSeverityColor = (severity: number) => {
    if (severity >= 30) return "text-red-600 dark:text-red-400";
    if (severity >= 15) return "text-orange-600 dark:text-orange-400";
    if (severity >= 5) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldAlertIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">
              Guardrail Auto-Adjustments
            </CardTitle>
            <CardDescription>
              Smart threshold adjustments based on breach patterns
            </CardDescription>
          </div>
        </div>
        {onConfigureClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigureClick}
            className="gap-2"
          >
            <SettingsIcon className="w-4 h-4" />
            Configure
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={timeRange === d ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(d)}
            >
              {d} days
            </Button>
          ))}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Adjustments */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">
              {stats.totalAdjustments}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Adjustments
            </div>
            <div className="flex items-center gap-1">
              {recentTrend === "increasing" && (
                <>
                  <TrendingUpIcon className="w-3 h-3 text-red-600 dark:text-red-400" />

                  <span className="text-xs text-red-600 dark:text-red-400">
                    Increasing
                  </span>
                </>
              )}
              {recentTrend === "decreasing" && (
                <>
                  <TrendingDownIcon className="w-3 h-3 text-green-600 dark:text-green-400" />

                  <span className="text-xs text-green-600 dark:text-green-400">
                    Decreasing
                  </span>
                </>
              )}
              {recentTrend === "stable" && (
                <>
                  <CheckCircleIcon className="w-3 h-3 text-muted-foreground" />

                  <span className="text-xs text-muted-foreground">Stable</span>
                </>
              )}
            </div>
          </div>

          {/* Average Severity */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div
              className={cn(
                "text-2xl font-bold",
                getSeverityColor(stats.avgSeverity)
              )}
            >
              {stats.avgSeverity.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Avg Breach Severity
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangleIcon
                className={cn("w-3 h-3", getSeverityColor(stats.avgSeverity))}
              />

              <span
                className={cn("text-xs", getSeverityColor(stats.avgSeverity))}
              >
                {stats.avgSeverity >= 30
                  ? "Critical"
                  : stats.avgSeverity >= 15
                    ? "Severe"
                    : stats.avgSeverity >= 5
                      ? "Moderate"
                      : "Minor"}
              </span>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">
              {config.breachThresholdCount}
            </div>
            <div className="text-xs text-muted-foreground">
              Breach Threshold
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {config.breachWindowDays}d window
              </span>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        {stats.trends.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              Adjustment Trend
            </div>
            <ChartContainer
              config={{}}
              className="h-[200px] w-full aspect-[none]"
            >
              <LineChart data={stats.trends}>
                <ChartTooltip content={<ChartTooltipContent />} />

                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />

                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}

        {/* Top Metrics */}
        {stats.topMetrics.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">
              Most Adjusted Metrics
            </div>
            <div className="space-y-2">
              {stats.topMetrics.map((metric) => (
                <div
                  key={metric.metric}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium text-foreground">
                    {metric.metric}
                  </span>
                  <Badge variant="outline">{metric.count} adjustments</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Summary */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="text-sm font-medium text-foreground">
            Current Configuration
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Breach Window:</span>{" "}
              <span className="font-medium text-foreground">
                {config.breachWindowDays} days
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Breach Count:</span>{" "}
              <span className="font-medium text-foreground">
                {config.breachThresholdCount}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Base Tightening:</span>{" "}
              <span className="font-medium text-foreground">
                {(config.tighteningPercent * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Smart Adjust:</span>{" "}
              <span className="font-medium text-foreground">
                {config.severityBasedAdjustment ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Email Alerts:</span>{" "}
              <span className="font-medium text-foreground">
                {config.emailNotifications ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Recipients:</span>{" "}
              <span className="font-medium text-foreground">
                {config.emailRecipients.length}
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {stats.totalAdjustments === 0 && (
          <div className="py-8 text-center space-y-2">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-muted-foreground" />

            <p className="text-sm font-medium text-foreground">
              No Auto-Adjustments Yet
            </p>
            <p className="text-xs text-muted-foreground">
              Guardrails will automatically adjust when breach patterns are
              detected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
