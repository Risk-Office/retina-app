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
import { Progress } from "@/components/ui/progress";
import {
  ShieldAlertIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  TargetIcon,
  ActivityIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

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

interface RiskFactor {
  id: string;
  name: string;
  description: string;
  score: number; // 0-100
  trend: "increasing" | "decreasing" | "stable";
  weight: number; // 0-1
  mitigationActions?: string[];
}

interface RiskAssessment {
  overallRiskScore: number; // 0-100
  riskLevel: "critical" | "high" | "medium" | "low";
  adjustmentLikelihood: number; // 0-100
  timeToNextAdjustment: {
    min: number;
    max: number;
    mostLikely: number;
  };
  factors: RiskFactor[];
  recommendations: string[];
}

interface RiskAssessmentPanelProps {
  decisionId: string;
  decisionTitle: string;
  timelineEvents: TimelineEvent[];
  currentVariance: number;
  thresholds?: {
    critical: number;
    high: number;
    medium: number;
  };
  onApplyMitigation?: (action: string) => void;
}

export function RiskAssessmentPanel({
  decisionId,
  decisionTitle,
  timelineEvents,
  currentVariance,
  thresholds = { critical: 80, high: 60, medium: 40 },
  onApplyMitigation,
}: RiskAssessmentPanelProps) {
  // Calculate risk assessment
  const calculateRiskAssessment = (): RiskAssessment => {
    const adjustments = timelineEvents.filter((e) => e.type === "adjustment");
    const outcomes = timelineEvents.filter((e) => e.type === "outcome");

    // Factor 1: Variance Magnitude
    const varianceMagnitude = Math.min(Math.abs(currentVariance) * 5, 100);
    const varianceTrend = currentVariance > 0 ? "increasing" : "decreasing";

    // Factor 2: Adjustment Frequency
    const timeSpan =
      timelineEvents.length > 0
        ? (Date.now() - timelineEvents[0].date) / (30 * 24 * 60 * 60 * 1000)
        : 1;
    const adjustmentFrequency = adjustments.length / Math.max(timeSpan, 1);
    const frequencyScore = Math.min(adjustmentFrequency * 50, 100);

    // Factor 3: Variance Volatility
    const variances = outcomes
      .map((e) => e.metrics?.variance)
      .filter((v): v is number => v !== undefined);
    const varianceStdDev =
      variances.length > 1
        ? Math.sqrt(
            variances.reduce(
              (sum, v) =>
                sum +
                Math.pow(
                  v - variances.reduce((s, vv) => s + vv, 0) / variances.length,
                  2
                ),
              0
            ) / variances.length
          )
        : 0;
    const volatilityScore = Math.min(varianceStdDev * 10, 100);

    // Factor 4: Time Since Last Adjustment
    const lastAdjustment = adjustments.sort((a, b) => b.date - a.date)[0];
    const daysSinceAdjustment = lastAdjustment
      ? (Date.now() - lastAdjustment.date) / (24 * 60 * 60 * 1000)
      : 999;
    const avgDaysBetweenAdjustments =
      adjustments.length > 1
        ? adjustments
            .sort((a, b) => a.date - b.date)
            .slice(1)
            .reduce(
              (sum, adj, i) =>
                sum + (adj.date - adjustments[i].date) / (24 * 60 * 60 * 1000),
              0
            ) /
          (adjustments.length - 1)
        : 30;
    const timingScore =
      avgDaysBetweenAdjustments > 0
        ? Math.min((daysSinceAdjustment / avgDaysBetweenAdjustments) * 100, 100)
        : 0;

    // Factor 5: Trend Consistency
    const recentVariances = variances.slice(-3);
    const trendConsistency =
      recentVariances.length >= 2
        ? recentVariances.every((v, i, arr) =>
            i === 0 ? true : v > 0 === arr[i - 1] > 0
          )
        : false;
    const consistencyScore = trendConsistency ? 75 : 25;

    const factors: RiskFactor[] = [
      {
        id: "variance-magnitude",
        name: "Variance Magnitude",
        description: `Current variance is ${Math.abs(currentVariance).toFixed(1)}%`,
        score: varianceMagnitude,
        trend: varianceTrend,
        weight: 0.3,
        mitigationActions: [
          "Tighten VaR95 threshold",
          "Review baseline assumptions",
        ],
      },
      {
        id: "adjustment-frequency",
        name: "Adjustment Frequency",
        description: `${adjustments.length} adjustments in ${timeSpan.toFixed(1)} months`,
        score: frequencyScore,
        trend: adjustmentFrequency > 0.5 ? "increasing" : "stable",
        weight: 0.25,
        mitigationActions: [
          "Implement more conservative initial parameters",
          "Increase monitoring frequency",
        ],
      },
      {
        id: "variance-volatility",
        name: "Variance Volatility",
        description: `Standard deviation: ${varianceStdDev.toFixed(2)}`,
        score: volatilityScore,
        trend: varianceStdDev > 5 ? "increasing" : "stable",
        weight: 0.2,
        mitigationActions: [
          "Add volatility buffers to guardrails",
          "Consider scenario stress testing",
        ],
      },
      {
        id: "timing-risk",
        name: "Timing Risk",
        description: `${daysSinceAdjustment.toFixed(0)} days since last adjustment`,
        score: timingScore,
        trend:
          daysSinceAdjustment > avgDaysBetweenAdjustments
            ? "increasing"
            : "stable",
        weight: 0.15,
        mitigationActions: [
          "Schedule proactive review",
          "Monitor key metrics daily",
        ],
      },
      {
        id: "trend-consistency",
        name: "Trend Consistency",
        description: trendConsistency
          ? "Consistent trend direction"
          : "Inconsistent variance pattern",
        score: consistencyScore,
        trend: trendConsistency ? "stable" : "increasing",
        weight: 0.1,
        mitigationActions: [
          "Investigate root causes of inconsistency",
          "Review external factors",
        ],
      },
    ];

    // Calculate overall risk score
    const overallRiskScore = factors.reduce(
      (sum, factor) => sum + factor.score * factor.weight,
      0
    );

    // Determine risk level
    let riskLevel: RiskAssessment["riskLevel"];
    if (overallRiskScore >= thresholds.critical) riskLevel = "critical";
    else if (overallRiskScore >= thresholds.high) riskLevel = "high";
    else if (overallRiskScore >= thresholds.medium) riskLevel = "medium";
    else riskLevel = "low";

    // Calculate adjustment likelihood
    const adjustmentLikelihood = Math.min(
      (varianceMagnitude * 0.4 +
        frequencyScore * 0.3 +
        volatilityScore * 0.2 +
        timingScore * 0.1) *
        1.2,
      100
    );

    // Estimate time to next adjustment
    const timeToNextAdjustment = {
      min: Math.max(avgDaysBetweenAdjustments * 0.5, 3),
      max: avgDaysBetweenAdjustments * 1.5,
      mostLikely: avgDaysBetweenAdjustments,
    };

    // Generate recommendations
    const recommendations: string[] = [];
    if (overallRiskScore >= thresholds.high) {
      recommendations.push(
        "Immediate action recommended: Schedule review within 48 hours"
      );
    }
    if (varianceMagnitude > 70) {
      recommendations.push(
        "High variance detected: Consider tightening guardrails by 10-15%"
      );
    }
    if (frequencyScore > 60) {
      recommendations.push(
        "Frequent adjustments indicate baseline assumptions may need revision"
      );
    }
    if (volatilityScore > 50) {
      recommendations.push(
        "High volatility: Implement wider confidence intervals"
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        "Risk levels are acceptable. Continue standard monitoring."
      );
    }

    return {
      overallRiskScore,
      riskLevel,
      adjustmentLikelihood,
      timeToNextAdjustment,
      factors,
      recommendations,
    };
  };

  const assessment = calculateRiskAssessment();

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return {
          text: "text-red-600 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-900/30",
          border: "border-red-300 dark:border-red-700",
        };
      case "high":
        return {
          text: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-100 dark:bg-orange-900/30",
          border: "border-orange-300 dark:border-orange-700",
        };
      case "medium":
        return {
          text: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          border: "border-yellow-300 dark:border-yellow-700",
        };
      case "low":
        return {
          text: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/30",
          border: "border-green-300 dark:border-green-700",
        };
      default:
        return {
          text: "text-muted-foreground",
          bg: "bg-muted",
          border: "border-border",
        };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return TrendingUpIcon;
      case "decreasing":
        return TrendingDownIcon;
      default:
        return MinusIcon;
    }
  };

  const riskColors = getRiskLevelColor(assessment.riskLevel);

  // Prepare radar chart data
  const radarData = assessment.factors.map((factor) => ({
    factor: factor.name.split(" ")[0], // Shortened name for chart
    score: factor.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldAlertIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Risk Assessment
          </h3>
          <p className="text-sm text-muted-foreground">
            Predictive analysis for {decisionTitle}
          </p>
        </div>
      </div>

      {/* Overall Risk Score */}
      <Card className={cn("border-2", riskColors.border)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Overall Risk Score</CardTitle>
              <CardDescription className="text-xs mt-1">
                Composite risk assessment across all factors
              </CardDescription>
            </div>
            <Badge
              className={cn(
                riskColors.bg,
                riskColors.text,
                "text-lg px-4 py-2"
              )}
            >
              {assessment.riskLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-foreground">
              {assessment.overallRiskScore.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Progress
            value={assessment.overallRiskScore}
            className={cn("h-3", riskColors.bg)}
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Adjustment Likelihood
              </div>
              <div className={cn("text-2xl font-bold", riskColors.text)}>
                {assessment.adjustmentLikelihood.toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Est. Time to Adjustment
              </div>
              <div className="text-2xl font-bold text-foreground">
                {assessment.timeToNextAdjustment.mostLikely.toFixed(0)}d
              </div>
              <div className="text-xs text-muted-foreground">
                ({assessment.timeToNextAdjustment.min.toFixed(0)}-
                {assessment.timeToNextAdjustment.max.toFixed(0)} days)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-primary" />
            Risk Factor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border" />

                <PolarAngleAxis
                  dataKey="factor"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />

                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />

                <Radar
                  name="Risk Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />

                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Factors Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessment.factors.map((factor) => {
            const TrendIcon = getTrendIcon(factor.trend);
            const factorColor =
              factor.score >= 70
                ? "text-red-600 dark:text-red-400"
                : factor.score >= 40
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-green-600 dark:text-green-400";

            return (
              <div
                key={factor.id}
                className="p-4 border border-border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {factor.name}
                      </span>
                      <TrendIcon
                        className={cn(
                          "w-4 h-4",
                          factor.trend === "increasing"
                            ? "text-red-600 dark:text-red-400"
                            : factor.trend === "decreasing"
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                        )}
                      />

                      <Badge variant="outline" className="text-xs">
                        Weight: {(factor.weight * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {factor.description}
                    </p>
                  </div>
                  <span className={cn("text-xl font-bold ml-4", factorColor)}>
                    {factor.score.toFixed(0)}
                  </span>
                </div>

                <Progress value={factor.score} className="h-2" />

                {factor.mitigationActions && factor.score >= 50 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <div className="text-xs font-medium text-foreground">
                      Mitigation Actions:
                    </div>
                    {factor.mitigationActions.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <TargetIcon className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />

                        <span className="text-muted-foreground flex-1">
                          {action}
                        </span>
                        {onApplyMitigation && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => onApplyMitigation(action)}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {assessment.riskLevel === "critical" ||
            assessment.riskLevel === "high" ? (
              <AlertTriangleIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            ) : (
              <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessment.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-muted rounded-lg"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">
                  {idx + 1}
                </span>
              </div>
              <p className="text-sm text-foreground flex-1">{rec}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Model Information */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ShieldAlertIcon className="w-5 h-5 text-muted-foreground mt-0.5" />

            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Risk Model:</strong>{" "}
                Multi-factor risk assessment using weighted scoring across
                variance magnitude, adjustment frequency, volatility, timing,
                and trend consistency. Predictions use historical patterns and
                statistical analysis to estimate adjustment likelihood and
                timing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
