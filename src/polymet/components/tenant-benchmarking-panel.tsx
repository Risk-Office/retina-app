import React, { useState } from "react";
import {
  generateBenchmarkData,
  calculateDistributions,
  generateBenchmarkInsights,
  getIndustryBenchmarks,
  getSizeBenchmarks,
  type TenantBenchmark,
  type BenchmarkDistribution,
  type BenchmarkInsight,
} from "@/polymet/data/tenant-benchmarking";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  InfoIcon,
  AwardIcon,
  TargetIcon,
  MinusIcon,
} from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
} from "recharts";

export interface TenantBenchmarkingPanelProps {
  tenantId: string;
  currentMetrics: {
    antifragilityIndex: number;
    learningRate: number;
    stabilityRatio: number;
    shockAbsorption: number;
    guardrailBreachRate: number;
    decisionCount: number;
  };
  industry?: string;
  size?: "small" | "medium" | "large";
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function TenantBenchmarkingPanel({
  tenantId,
  currentMetrics,
  industry,
  size,
  onAuditEvent,
}: TenantBenchmarkingPanelProps) {
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "industry" | "size">(
    "all"
  );
  const [selectedMetric, setSelectedMetric] =
    useState<string>("antifragilityIndex");

  // Generate benchmark data
  const allBenchmarks = generateBenchmarkData(tenantId, currentMetrics);

  // Apply filters
  let filteredBenchmarks = allBenchmarks;
  if (filterType === "industry" && industry) {
    filteredBenchmarks = getIndustryBenchmarks(allBenchmarks, industry);
  } else if (filterType === "size" && size) {
    filteredBenchmarks = getSizeBenchmarks(allBenchmarks, size);
  }

  const distributions = calculateDistributions(filteredBenchmarks, tenantId);
  const insights = generateBenchmarkInsights(distributions);

  // Get overall percentile (average of all metrics)
  const overallPercentile = Math.round(
    distributions.reduce((sum, d) => sum + d.yourPercentile, 0) /
      distributions.length
  );

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && onAuditEvent) {
      onAuditEvent("benchmarking_viewed", {
        tenantId,
        filterType,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3Icon className="h-4 w-4" />
          Benchmark Performance
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Helps each tenant see how they stack up in learning speed and
                  resilience.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3Icon className="h-5 w-5" />
            Tenant Benchmarking
          </DialogTitle>
          <DialogDescription>
            Anonymized comparison of your antifragility metrics against peer
            organizations. All peer data is anonymized to protect
            confidentiality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Performance Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Overall Performance</span>
                <Badge
                  variant={
                    overallPercentile >= 75
                      ? "default"
                      : overallPercentile >= 50
                        ? "secondary"
                        : "outline"
                  }
                  className="text-lg px-3 py-1"
                >
                  {overallPercentile}th Percentile
                </Badge>
              </CardTitle>
              <CardDescription>
                Compared to {filteredBenchmarks.length - 1} anonymized peer
                organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {currentMetrics.antifragilityIndex.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Antifragility Index
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(currentMetrics.learningRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Learning Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(currentMetrics.stabilityRatio * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stability Ratio
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Comparison Group
              </label>
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Peers ({allBenchmarks.length - 1})
                  </SelectItem>
                  {industry && (
                    <SelectItem value="industry">
                      Same Industry (
                      {getIndustryBenchmarks(allBenchmarks, industry).length -
                        1}
                      )
                    </SelectItem>
                  )}
                  {size && (
                    <SelectItem value="size">
                      Same Size (
                      {getSizeBenchmarks(allBenchmarks, size).length - 1})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Metric View
              </label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antifragilityIndex">
                    Antifragility Index
                  </SelectItem>
                  <SelectItem value="learningRate">Learning Rate</SelectItem>
                  <SelectItem value="stabilityRatio">
                    Stability Ratio
                  </SelectItem>
                  <SelectItem value="shockAbsorption">
                    Shock Absorption
                  </SelectItem>
                  <SelectItem value="guardrailBreachRate">
                    Guardrail Breach Rate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Peer Distribution</CardTitle>
              <CardDescription>
                See where you stand compared to anonymized peers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionChart
                benchmarks={filteredBenchmarks}
                selectedMetric={selectedMetric}
                tenantId={tenantId}
              />
            </CardContent>
          </Card>

          {/* Percentile Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Percentile Breakdown</CardTitle>
              <CardDescription>
                Your position across all key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {distributions.map((dist) => (
                  <PercentileBar key={dist.metric} distribution={dist} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                Strengths and opportunities based on peer comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DistributionChartProps {
  benchmarks: TenantBenchmark[];
  selectedMetric: string;
  tenantId: string;
}

function DistributionChart({
  benchmarks,
  selectedMetric,
  tenantId,
}: DistributionChartProps) {
  const metricLabels: Record<string, string> = {
    antifragilityIndex: "Antifragility Index",
    learningRate: "Learning Rate",
    stabilityRatio: "Stability Ratio",
    shockAbsorption: "Shock Absorption",
    guardrailBreachRate: "Guardrail Breach Rate",
  };

  // Create histogram data
  const values = benchmarks.map(
    (b) => b[selectedMetric as keyof TenantBenchmark] as number
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = 10;
  const binSize = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const binMin = min + i * binSize;
    const binMax = binMin + binSize;
    const count = values.filter((v) => v >= binMin && v < binMax).length;
    const isYourBin = benchmarks.find(
      (b) =>
        b.tenantId === tenantId &&
        (b[selectedMetric as keyof TenantBenchmark] as number) >= binMin &&
        (b[selectedMetric as keyof TenantBenchmark] as number) < binMax
    );

    return {
      range: `${binMin.toFixed(1)}-${binMax.toFixed(1)}`,
      count,
      isYou: !!isYourBin,
    };
  });

  return (
    <div className="h-64">
      <ChartContainer config={{}} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins}>
            <XAxis
              dataKey="range"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />

            <YAxis fontSize={12} />

            <ChartTooltip />

            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {bins.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.isYou ? "hsl(var(--primary))" : "hsl(var(--muted))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <p className="text-xs text-center text-muted-foreground mt-2">
        <span className="inline-block w-3 h-3 bg-primary rounded mr-1" />
        Your position highlighted in blue
      </p>
    </div>
  );
}

interface PercentileBarProps {
  distribution: BenchmarkDistribution;
}

function PercentileBar({ distribution }: PercentileBarProps) {
  const isInverse = distribution.metric === "Guardrail Breach Rate";
  const percentile = distribution.yourPercentile;

  let color = "bg-gray-500";
  if (isInverse) {
    if (percentile >= 75) color = "bg-green-500";
    else if (percentile <= 25) color = "bg-red-500";
  } else {
    if (percentile >= 75) color = "bg-green-500";
    else if (percentile <= 25) color = "bg-red-500";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{distribution.metric}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {distribution.yourValue.toFixed(2)}
          </span>
          <Badge variant="outline" className="text-xs">
            P{percentile}
          </Badge>
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${color} transition-all`}
          style={{ width: `${percentile}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>P25: {distribution.percentile25.toFixed(2)}</span>
        <span>P50: {distribution.percentile50.toFixed(2)}</span>
        <span>P75: {distribution.percentile75.toFixed(2)}</span>
        <span>P90: {distribution.percentile90.toFixed(2)}</span>
      </div>
    </div>
  );
}

interface InsightCardProps {
  insight: BenchmarkInsight;
}

function InsightCard({ insight }: InsightCardProps) {
  const icons = {
    strength: AwardIcon,
    opportunity: TargetIcon,
    neutral: MinusIcon,
  };

  const colors = {
    strength:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950",
    opportunity:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950",
    neutral: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950",
  };

  const Icon = icons[insight.category];

  return (
    <div className={`p-4 rounded-lg border ${colors[insight.category]}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />

        <div className="flex-1 space-y-2">
          <div className="font-medium">{insight.title}</div>
          <p className="text-sm opacity-90">{insight.description}</p>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="opacity-70">You:</span>{" "}
              <span className="font-medium">
                {insight.yourValue.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="opacity-70">Peer Avg:</span>{" "}
              <span className="font-medium">
                {insight.peerAverage.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="opacity-70">Top 10%:</span>{" "}
              <span className="font-medium">
                {insight.topPerformer.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
