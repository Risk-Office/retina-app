import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShieldCheckIcon,
  TrendingUpIcon,
  ZapIcon,
  AlertTriangleIcon,
  ActivityIcon,
  InfoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

export interface ResilienceMetrics {
  stability_ratio: number; // 0-100, higher is better
  learning_rate: number; // 0-100, higher is better
  shock_absorption: number; // 0-100, higher is better
  guardrail_breach_rate: number; // 0-100, lower is better
  antifragility_index: number; // 0-100, composite score
}

interface ResilienceMetricsCardProps {
  metrics: ResilienceMetrics;
  className?: string;
}

interface MetricItemProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  higherIsBetter: boolean;
  format?: "percentage" | "decimal";
}

function MetricItem({
  label,
  value,
  icon: Icon,
  description,
  higherIsBetter,
  format = "decimal",
}: MetricItemProps) {
  // Determine color based on value and direction (value is now 0-100)
  const getColorClass = () => {
    const threshold = higherIsBetter ? 70 : 30;
    const isGood = higherIsBetter ? value >= threshold : value <= threshold;
    const isWarning = higherIsBetter
      ? value >= 40 && value < threshold
      : value > threshold && value <= 60;

    if (isGood) return "text-green-600 dark:text-green-400";
    if (isWarning) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColorClass = () => {
    const threshold = higherIsBetter ? 70 : 30;
    const isGood = higherIsBetter ? value >= threshold : value <= threshold;
    const isWarning = higherIsBetter
      ? value >= 40 && value < threshold
      : value > threshold && value <= 60;

    if (isGood) return "bg-green-500/20";
    if (isWarning) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const getProgressColorClass = () => {
    const threshold = higherIsBetter ? 70 : 30;
    const isGood = higherIsBetter ? value >= threshold : value <= threshold;
    const isWarning = higherIsBetter
      ? value >= 40 && value < threshold
      : value > threshold && value <= 60;

    if (isGood) return "bg-green-500";
    if (isWarning) return "bg-yellow-500";
    return "bg-red-500";
  };

  const displayValue = value.toFixed(1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              getBgColorClass()
            )}
          >
            <Icon className={cn("w-4 h-4", getColorClass())} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <span className={cn("text-lg font-bold", getColorClass())}>
          {displayValue}
        </span>
      </div>
      <div className="relative">
        <Progress
          value={value}
          className="h-2 bg-muted"
          indicatorClassName={getProgressColorClass()}
        />
      </div>
    </div>
  );
}

export function ResilienceMetricsCard({
  metrics,
  className,
}: ResilienceMetricsCardProps) {
  // Use the pre-calculated antifragility index as overall score
  const overallScore = metrics.antifragility_index;

  const getOverallRating = () => {
    if (overallScore >= 80)
      return {
        label: "Excellent",
        color: "text-green-600 dark:text-green-400",
      };
    if (overallScore >= 60)
      return { label: "Good", color: "text-green-600 dark:text-green-400" };
    if (overallScore >= 40)
      return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400" };
    return {
      label: "Needs Attention",
      color: "text-red-600 dark:text-red-400",
    };
  };

  const rating = getOverallRating();

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              Resilience Metrics
            </CardTitle>
            <CardDescription>
              System stability and adaptive capacity indicators
            </CardDescription>
          </div>
          <div className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-2xl font-bold text-foreground">
                      {overallScore.toFixed(1)}
                    </div>
                    <div className={cn("text-sm font-medium", rating.color)}>
                      {rating.label}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs font-semibold mb-1">
                    Antifragility Index (AI)
                  </p>
                  <p className="text-xs">
                    Blends steadiness, adaptability, and recovery into one
                    score.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MetricItem
          label="Stability Ratio"
          value={metrics.stability_ratio}
          icon={ShieldCheckIcon}
          description="Computed as std_dev(before)/std_dev(after), inverted if <1. Measures consistency of decision outcomes over time."
          higherIsBetter={true}
          format="decimal"
        />

        <MetricItem
          label="Learning Rate"
          value={metrics.learning_rate}
          icon={TrendingUpIcon}
          description="Mean change in utility over time × 100. Shows how quickly the system adapts and improves from feedback."
          higherIsBetter={true}
          format="decimal"
        />

        <MetricItem
          label="Shock Absorption"
          value={metrics.shock_absorption}
          icon={ZapIcon}
          description="(Recovered value / Lost value) × 100. Measures ability to recover from unexpected shocks and incidents."
          higherIsBetter={true}
          format="decimal"
        />

        <MetricItem
          label="Guardrail Breach Rate"
          value={metrics.guardrail_breach_rate}
          icon={AlertTriangleIcon}
          description="(#breaches / #periods) × 100. Lower values indicate better risk management and compliance."
          higherIsBetter={false}
          format="decimal"
        />

        <MetricItem
          label="Antifragility Index"
          value={metrics.antifragility_index}
          icon={ActivityIcon}
          description="Blends steadiness, adaptability, and recovery into one score. Weighted combination: 30% stability + 30% learning + 20% shock absorption - 20% breach rate."
          higherIsBetter={true}
          format="decimal"
        />
      </CardContent>
    </Card>
  );
}

/**
 * Calculate resilience metrics from decision data with stored traces
 * All metrics are scaled 0-100
 */
export function calculateResilienceMetrics(
  decisions: any[]
): ResilienceMetrics {
  if (decisions.length === 0) {
    return {
      stability_ratio: 0,
      learning_rate: 0,
      shock_absorption: 0,
      guardrail_breach_rate: 0,
      antifragility_index: 0,
    };
  }

  // Extract RAROC values for stability calculation
  const rarocValues = decisions
    .filter((d) => d.metrics?.raroc !== undefined)
    .map((d) => d.metrics.raroc);

  // 1. Stability Ratio: std_dev(before)/std_dev(after) → invert if <1
  let stability_ratio = 50; // Default neutral
  if (rarocValues.length > 4) {
    const midpoint = Math.floor(rarocValues.length / 2);
    const before = rarocValues.slice(0, midpoint);
    const after = rarocValues.slice(midpoint);

    const stdDev = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      return Math.sqrt(variance);
    };

    const stdBefore = stdDev(before);
    const stdAfter = stdDev(after);

    if (stdAfter > 0) {
      let ratio = stdBefore / stdAfter;
      // Invert if <1 (getting more volatile is bad)
      if (ratio < 1) {
        ratio = 1 / ratio;
        // Convert to 0-100 scale (higher is better, capped at 100)
        stability_ratio = Math.min(100, ratio * 50);
      } else {
        // Getting more stable is good
        stability_ratio = Math.min(100, ratio * 50);
      }
    }
  }

  // 2. Learning Rate: mean(ΔUtility over time) × 100
  let learning_rate = 0;
  if (rarocValues.length >= 2) {
    const deltas: number[] = [];
    for (let i = 1; i < rarocValues.length; i++) {
      deltas.push(rarocValues[i] - rarocValues[i - 1]);
    }
    const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    // Scale to 0-100 (assuming utility changes are typically small)
    learning_rate = Math.max(0, Math.min(100, 50 + meanDelta * 100));
  }

  // 3. Shock Absorption: (recovered_value / lost_value) × 100
  let shock_absorption = 70; // Default if no incidents
  const decisionsWithIncidents = decisions.filter(
    (d) => d.incidentImpacts && d.incidentImpacts.length > 0
  );
  if (decisionsWithIncidents.length > 0) {
    let totalLost = 0;
    let totalRecovered = 0;

    decisionsWithIncidents.forEach((d) => {
      d.incidentImpacts.forEach((impact: any) => {
        const evDelta = Math.abs(impact.evDelta || 0);
        totalLost += evDelta;
        // Assume recovery if subsequent RAROC improved
        const decisionIndex = decisions.findIndex((dec) => dec.id === d.id);
        if (decisionIndex >= 0 && decisionIndex < decisions.length - 1) {
          const nextDecision = decisions[decisionIndex + 1];
          if (nextDecision.metrics?.raroc > d.metrics?.raroc) {
            totalRecovered += evDelta * 0.8; // Partial recovery
          }
        }
      });
    });

    if (totalLost > 0) {
      shock_absorption = Math.min(100, (totalRecovered / totalLost) * 100);
    }
  }

  // 4. Guardrail Breach Rate: (#breaches / #periods) × 100
  const decisionsWithGuardrails = decisions.filter(
    (d) => d.guardrailViolations !== undefined
  );
  const breachCount = decisionsWithGuardrails.reduce(
    (sum, d) => sum + (d.guardrailViolations || 0),
    0
  );
  const periods = decisionsWithGuardrails.length || 1;
  const guardrail_breach_rate = Math.min(100, (breachCount / periods) * 100);

  // 5. Antifragility Index (AI): Weighted combination
  // AI = 0.3×stability + 0.3×learning + 0.2×shock_absorption - 0.2×breach_rate
  // Clamp 0-100
  const antifragility_index = Math.max(
    0,
    Math.min(
      100,
      0.3 * stability_ratio +
        0.3 * learning_rate +
        0.2 * shock_absorption -
        0.2 * guardrail_breach_rate
    )
  );

  return {
    stability_ratio,
    learning_rate,
    shock_absorption,
    guardrail_breach_rate,
    antifragility_index,
  };
}
