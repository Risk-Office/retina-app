import React from "react";
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
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BrainIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface TimelineEvent {
  id: string;
  type: "decision" | "outcome" | "adjustment" | "review";
  date: number;
  title: string;
  description: string;
  metrics?: {
    expectedValue?: number;
    actualValue?: number;
    variance?: number;
  };
}

interface PredictionData {
  month: string;
  historical?: number;
  predicted: number;
  confidenceLower: number;
  confidenceUpper: number;
  isPrediction: boolean;
}

interface AdjustmentPrediction {
  likelihood: number; // 0-100
  timeframe: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  suggestedAction?: string;
}

interface PredictiveAnalyticsPanelProps {
  decisionId: string;
  decisionTitle: string;
  timelineEvents: TimelineEvent[];
  currentVariance: number;
  onApplyPrediction?: (prediction: AdjustmentPrediction) => void;
}

export function PredictiveAnalyticsPanel({
  decisionId,
  decisionTitle,
  timelineEvents,
  currentVariance,
  onApplyPrediction,
}: PredictiveAnalyticsPanelProps) {
  // Analyze patterns from timeline events
  const analyzePatterns = (): {
    adjustmentFrequency: number;
    varianceTrend: "increasing" | "decreasing" | "stable";
    avgTimeBetweenAdjustments: number;
  } => {
    const adjustments = timelineEvents.filter((e) => e.type === "adjustment");
    const outcomes = timelineEvents.filter((e) => e.type === "outcome");

    // Calculate adjustment frequency (per month)
    const timeSpan =
      timelineEvents.length > 0
        ? (Date.now() - timelineEvents[0].date) / (30 * 24 * 60 * 60 * 1000)
        : 1;
    const adjustmentFrequency = adjustments.length / Math.max(timeSpan, 1);

    // Analyze variance trend
    const variances = outcomes
      .map((e) => e.metrics?.variance)
      .filter((v): v is number => v !== undefined);

    let varianceTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (variances.length >= 2) {
      const firstHalf = variances.slice(0, Math.floor(variances.length / 2));
      const secondHalf = variances.slice(Math.floor(variances.length / 2));
      const firstAvg =
        firstHalf.reduce((sum, v) => sum + Math.abs(v), 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, v) => sum + Math.abs(v), 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.2) varianceTrend = "increasing";
      else if (secondAvg < firstAvg * 0.8) varianceTrend = "decreasing";
    }

    // Calculate average time between adjustments
    let avgTimeBetweenAdjustments = 0;
    if (adjustments.length > 1) {
      const sortedAdjustments = [...adjustments].sort(
        (a, b) => a.date - b.date
      );
      const intervals = sortedAdjustments
        .slice(1)
        .map((adj, i) => adj.date - sortedAdjustments[i].date);
      avgTimeBetweenAdjustments =
        intervals.reduce((sum, interval) => sum + interval, 0) /
        intervals.length /
        (24 * 60 * 60 * 1000); // Convert to days
    }

    return {
      adjustmentFrequency,
      varianceTrend,
      avgTimeBetweenAdjustments,
    };
  };

  const patterns = analyzePatterns();

  // Generate predictions based on patterns
  const generatePredictions = (): AdjustmentPrediction[] => {
    const predictions: AdjustmentPrediction[] = [];

    // Prediction 1: Based on variance trend
    if (patterns.varianceTrend === "increasing") {
      predictions.push({
        likelihood: 75,
        timeframe: "Next 7-14 days",
        reason:
          "Variance trend is increasing, suggesting performance deviation",
        confidence: "high",
        suggestedAction: "Tighten VaR95 threshold by 5-10%",
      });
    } else if (Math.abs(currentVariance) > 10) {
      predictions.push({
        likelihood: 60,
        timeframe: "Next 14-21 days",
        reason: "Current variance exceeds 10% threshold",
        confidence: "medium",
        suggestedAction: "Review and adjust risk parameters",
      });
    }

    // Prediction 2: Based on adjustment frequency
    if (patterns.adjustmentFrequency > 0.5) {
      // More than 0.5 adjustments per month
      predictions.push({
        likelihood: 65,
        timeframe: `Next ${Math.round(patterns.avgTimeBetweenAdjustments)} days`,
        reason: "Historical pattern shows frequent adjustments",
        confidence: "medium",
        suggestedAction: "Prepare for parameter recalibration",
      });
    }

    // Prediction 3: Based on time since last adjustment
    const lastAdjustment = timelineEvents
      .filter((e) => e.type === "adjustment")
      .sort((a, b) => b.date - a.date)[0];

    if (lastAdjustment) {
      const daysSinceAdjustment =
        (Date.now() - lastAdjustment.date) / (24 * 60 * 60 * 1000);
      if (
        patterns.avgTimeBetweenAdjustments > 0 &&
        daysSinceAdjustment > patterns.avgTimeBetweenAdjustments * 0.8
      ) {
        predictions.push({
          likelihood: 55,
          timeframe: "Next 7-10 days",
          reason: "Approaching typical adjustment interval",
          confidence: "low",
          suggestedAction: "Monitor key metrics closely",
        });
      }
    }

    // If no predictions, add a default one
    if (predictions.length === 0) {
      predictions.push({
        likelihood: 30,
        timeframe: "Next 30 days",
        reason: "Performance is stable with no significant patterns detected",
        confidence: "low",
        suggestedAction: "Continue monitoring",
      });
    }

    return predictions.sort((a, b) => b.likelihood - a.likelihood);
  };

  const predictions = generatePredictions();

  // Generate forecast data for chart
  const generateForecastData = (): PredictionData[] => {
    const data: PredictionData[] = [];

    // Historical data (last 6 months)
    const outcomes = timelineEvents
      .filter((e) => e.type === "outcome" && e.metrics?.variance !== undefined)
      .sort((a, b) => a.date - b.date);

    for (let i = 0; i < 6; i++) {
      const outcome = outcomes[i];
      data.push({
        month: `M${i + 1}`,
        historical: outcome?.metrics?.variance || 0,
        predicted: outcome?.metrics?.variance || 0,
        confidenceLower: (outcome?.metrics?.variance || 0) - 2,
        confidenceUpper: (outcome?.metrics?.variance || 0) + 2,
        isPrediction: false,
      });
    }

    // Predicted data (next 3 months)
    const lastVariance = data[data.length - 1]?.historical || 0;
    const trend =
      patterns.varianceTrend === "increasing"
        ? 1.5
        : patterns.varianceTrend === "decreasing"
          ? -1.5
          : 0;

    for (let i = 0; i < 3; i++) {
      const predicted = lastVariance + trend * (i + 1);
      data.push({
        month: `M${6 + i + 1}`,
        predicted,
        confidenceLower: predicted - 3 - i,
        confidenceUpper: predicted + 3 + i,
        isPrediction: true,
      });
    }

    return data;
  };

  const forecastData = generateForecastData();

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      case "low":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getLikelihoodColor = (likelihood: number) => {
    if (likelihood >= 70)
      return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
    if (likelihood >= 50)
      return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30";
    return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BrainIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Predictive Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered forecasting for {decisionTitle}
          </p>
        </div>
      </div>

      {/* Pattern Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                Adjustment Frequency
              </div>
              <div className="text-lg font-bold text-foreground">
                {patterns.adjustmentFrequency.toFixed(2)}/mo
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                Variance Trend
              </div>
              <div className="flex items-center gap-1">
                {patterns.varianceTrend === "increasing" ? (
                  <TrendingUpIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : patterns.varianceTrend === "decreasing" ? (
                  <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400 rotate-180" />
                ) : (
                  <ArrowRightIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-sm font-bold text-foreground capitalize">
                  {patterns.varianceTrend}
                </span>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                Avg Days Between
              </div>
              <div className="text-lg font-bold text-foreground">
                {patterns.avgTimeBetweenAdjustments > 0
                  ? Math.round(patterns.avgTimeBetweenAdjustments)
                  : "N/A"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variance Forecast</CardTitle>
          <CardDescription>
            Historical data and 3-month prediction with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData}>
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

                {/* Confidence interval */}
                <Area
                  type="monotone"
                  dataKey="confidenceUpper"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />

                <Area
                  type="monotone"
                  dataKey="confidenceLower"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />

                {/* Historical line */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Historical"
                />

                {/* Predicted line */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  name="Predicted"
                />

                {/* Reference line at 0 */}
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Adjustment Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adjustment Predictions</CardTitle>
          <CardDescription>
            Likelihood of future guardrail adjustments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {predictions.map((prediction, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      className={getLikelihoodColor(prediction.likelihood)}
                    >
                      {prediction.likelihood}% Likelihood
                    </Badge>
                    <Badge
                      className={getConfidenceColor(prediction.confidence)}
                    >
                      {prediction.confidence} confidence
                    </Badge>
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1">
                    {prediction.timeframe}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {prediction.reason}
                  </p>
                </div>
                {prediction.likelihood >= 60 && (
                  <AlertTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                )}
              </div>

              {prediction.suggestedAction && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />

                    <div className="flex-1">
                      <div className="text-xs font-medium text-foreground mb-1">
                        Suggested Action
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {prediction.suggestedAction}
                      </p>
                    </div>
                  </div>
                  {onApplyPrediction && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => onApplyPrediction(prediction)}
                    >
                      Apply Recommendation
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Model Information */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <BrainIcon className="w-5 h-5 text-muted-foreground mt-0.5" />

            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Model:</strong> Time-series
                analysis with pattern recognition. Predictions are based on
                historical variance trends, adjustment frequency, and temporal
                patterns. Confidence intervals widen for longer-term forecasts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
