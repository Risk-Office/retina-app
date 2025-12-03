import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  InfoIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/polymet/data/tenant-context";
import { loadViolations } from "@/polymet/data/guardrail-violations";

export interface PostDecisionMetrics {
  decisionId: string;
  decisionTitle: string;
  chosenOptionLabel: string;
  closedAt: number;

  // Baseline metrics (from simulation at close)
  baselineEV: number;
  baselineRAROC: number;
  baselineVaR95: number;

  // Actual metrics (from real-world outcomes)
  actualEV?: number;
  actualRAROC?: number;
  actualVaR95?: number;

  // Utility score
  baselineUtility: number;
  actualUtility?: number;

  // Narrative summary
  narrativeSummary?: string;
}

interface PostDecisionSnapshotProps {
  metrics: PostDecisionMetrics;
  className?: string;
}

export function PostDecisionSnapshot({
  metrics,
  className,
}: PostDecisionSnapshotProps) {
  const { tenant } = useTenant();

  // Check if 30 days have passed since decision close
  const daysSinceClose = Math.floor(
    (Date.now() - metrics.closedAt) / (1000 * 60 * 60 * 24)
  );
  const isVisible = daysSinceClose >= 30;

  // Don't render if not yet 30 days
  if (!isVisible) {
    return null;
  }

  // Load guardrail violations for this decision
  const violations = loadViolations(metrics.decisionId).filter(
    (v) => new Date(v.violatedAt).getTime() >= metrics.closedAt
  );

  // Calculate deltas
  const evDelta =
    metrics.actualEV !== undefined
      ? ((metrics.actualEV - metrics.baselineEV) /
          Math.abs(metrics.baselineEV)) *
        100
      : null;

  const rarocDelta =
    metrics.actualRAROC !== undefined
      ? ((metrics.actualRAROC - metrics.baselineRAROC) /
          Math.abs(metrics.baselineRAROC)) *
        100
      : null;

  const var95Delta =
    metrics.actualVaR95 !== undefined
      ? ((metrics.actualVaR95 - metrics.baselineVaR95) /
          Math.abs(metrics.baselineVaR95)) *
        100
      : null;

  const utilityDelta =
    metrics.actualUtility !== undefined
      ? ((metrics.actualUtility - metrics.baselineUtility) /
          Math.abs(metrics.baselineUtility)) *
        100
      : null;

  // Generate auto-narrative if none provided
  const narrative =
    metrics.narrativeSummary ||
    generateAutoNarrative({
      evDelta,
      rarocDelta,
      var95Delta,
      utilityDelta,
      violations: violations.length,
      daysSinceClose,
      chosenOptionLabel: metrics.chosenOptionLabel,
    });

  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm border-2 border-primary/20",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">
                What We Learned So Far
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Shows how the real world compared to what we expected.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              {metrics.decisionTitle} • {metrics.chosenOptionLabel} •{" "}
              {daysSinceClose} days post-decision
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20"
          >
            30-Day Snapshot
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics vs Baseline */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Key Metrics vs Baseline
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Expected Value */}
            <MetricComparisonCard
              label="Expected Value"
              baseline={metrics.baselineEV}
              actual={metrics.actualEV}
              delta={evDelta}
              format="currency"
              higherIsBetter={true}
            />

            {/* RAROC */}
            <MetricComparisonCard
              label="RAROC"
              baseline={metrics.baselineRAROC}
              actual={metrics.actualRAROC}
              delta={rarocDelta}
              format="decimal"
              higherIsBetter={true}
            />

            {/* VaR95 */}
            <MetricComparisonCard
              label="VaR95"
              baseline={metrics.baselineVaR95}
              actual={metrics.actualVaR95}
              delta={var95Delta}
              format="currency"
              higherIsBetter={false}
            />
          </div>
        </div>

        {/* Guardrail Breaches */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Guardrail Performance
          </h4>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            {violations.length === 0 ? (
              <>
                <CheckCircle2Icon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />

                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    No Breaches Detected
                  </div>
                  <div className="text-xs text-muted-foreground">
                    All guardrails remained within acceptable thresholds
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />

                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {violations.length}{" "}
                    {violations.length === 1 ? "Breach" : "Breaches"} Detected
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {
                      violations.filter((v) => v.alertLevel === "critical")
                        .length
                    }{" "}
                    critical,{" "}
                    {
                      violations.filter((v) => v.alertLevel === "caution")
                        .length
                    }{" "}
                    caution,{" "}
                    {violations.filter((v) => v.alertLevel === "info").length}{" "}
                    info
                  </div>
                </div>
                <Badge variant="destructive" className="flex-shrink-0">
                  {violations.length}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Updated Utility Score */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Updated Utility Score
          </h4>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex-1 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {metrics.actualUtility !== undefined
                    ? metrics.actualUtility.toFixed(2)
                    : metrics.baselineUtility.toFixed(2)}
                </span>
                {utilityDelta !== null && (
                  <span
                    className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      utilityDelta >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {utilityDelta >= 0 ? (
                      <TrendingUpIcon className="w-3 h-3" />
                    ) : (
                      <TrendingDownIcon className="w-3 h-3" />
                    )}
                    {Math.abs(utilityDelta).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Baseline: {metrics.baselineUtility.toFixed(2)}
                {metrics.actualUtility === undefined &&
                  " (actual data pending)"}
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Narrative Summary
          </h4>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground leading-relaxed">
              {narrative}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricComparisonCardProps {
  label: string;
  baseline: number;
  actual?: number;
  delta: number | null;
  format: "currency" | "decimal" | "percentage";
  higherIsBetter: boolean;
}

function MetricComparisonCard({
  label,
  baseline,
  actual,
  delta,
  format,
  higherIsBetter,
}: MetricComparisonCardProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case "currency":
        return `$${value.toFixed(0)}K`;
      case "decimal":
        return value.toFixed(4);
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toFixed(2);
    }
  };

  const isPositiveChange = delta !== null && delta >= 0;
  const isGoodChange = higherIsBetter ? isPositiveChange : !isPositiveChange;

  return (
    <div className="p-3 rounded-lg border border-border bg-background space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">
            {actual !== undefined ? formatValue(actual) : "Pending"}
          </span>
          {delta !== null && (
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-0.5",
                isGoodChange
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {isPositiveChange ? (
                <TrendingUpIcon className="w-3 h-3" />
              ) : (
                <TrendingDownIcon className="w-3 h-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Baseline: {formatValue(baseline)}
        </div>
      </div>
    </div>
  );
}

interface AutoNarrativeParams {
  evDelta: number | null;
  rarocDelta: number | null;
  var95Delta: number | null;
  utilityDelta: number | null;
  violations: number;
  daysSinceClose: number;
  chosenOptionLabel: string;
}

function generateAutoNarrative(params: AutoNarrativeParams): string {
  const {
    evDelta,
    rarocDelta,
    var95Delta,
    utilityDelta,
    violations,
    daysSinceClose,
    chosenOptionLabel,
  } = params;

  const parts: string[] = [];

  // Opening
  parts.push(
    `After ${daysSinceClose} days of monitoring "${chosenOptionLabel}",`
  );

  // Performance assessment
  if (evDelta !== null && rarocDelta !== null) {
    if (evDelta > 5 && rarocDelta > 5) {
      parts.push("the decision is performing better than expected.");
    } else if (evDelta < -5 || rarocDelta < -5) {
      parts.push(
        "the decision is underperforming against baseline expectations."
      );
    } else {
      parts.push("the decision is tracking close to baseline expectations.");
    }
  } else {
    parts.push("we are still collecting actual outcome data.");
  }

  // Specific metrics
  if (evDelta !== null) {
    if (Math.abs(evDelta) > 10) {
      parts.push(
        `Expected Value has ${evDelta > 0 ? "exceeded" : "fallen short of"} projections by ${Math.abs(evDelta).toFixed(1)}%.`
      );
    }
  }

  if (rarocDelta !== null) {
    if (Math.abs(rarocDelta) > 10) {
      parts.push(
        `Risk-adjusted returns are ${rarocDelta > 0 ? "outperforming" : "underperforming"} by ${Math.abs(rarocDelta).toFixed(1)}%.`
      );
    }
  }

  // Guardrails
  if (violations === 0) {
    parts.push(
      "All guardrails have remained within acceptable thresholds, indicating stable risk management."
    );
  } else if (violations <= 2) {
    parts.push(
      `${violations} guardrail ${violations === 1 ? "breach has" : "breaches have"} been detected, suggesting minor deviations from expected risk parameters.`
    );
  } else {
    parts.push(
      `${violations} guardrail breaches have been detected, indicating significant deviations that warrant attention.`
    );
  }

  // Utility assessment
  if (utilityDelta !== null) {
    if (utilityDelta > 5) {
      parts.push(
        "Overall utility score has improved, reflecting better-than-expected value delivery."
      );
    } else if (utilityDelta < -5) {
      parts.push(
        "Overall utility score has declined, suggesting the need for corrective action or strategy adjustment."
      );
    }
  }

  // Closing
  if (evDelta === null && rarocDelta === null) {
    parts.push("Continue monitoring as actual data becomes available.");
  } else if (
    (evDelta || 0) < -10 ||
    (rarocDelta || 0) < -10 ||
    violations > 2
  ) {
    parts.push("Recommend review and potential intervention.");
  } else {
    parts.push("Continue monitoring and maintain current course.");
  }

  return parts.join(" ");
}

// Helper function to create mock post-decision metrics for testing
export function createMockPostDecisionMetrics(
  decisionId: string,
  decisionTitle: string,
  chosenOptionLabel: string,
  closedAt: number,
  scenario:
    | "outperforming"
    | "underperforming"
    | "tracking"
    | "pending" = "tracking"
): PostDecisionMetrics {
  const baseMetrics = {
    decisionId,
    decisionTitle,
    chosenOptionLabel,
    closedAt,
    baselineEV: 1500,
    baselineRAROC: 0.085,
    baselineVaR95: -450,
    baselineUtility: 1250,
  };

  switch (scenario) {
    case "outperforming":
      return {
        ...baseMetrics,
        actualEV: 1725,
        actualRAROC: 0.0935,
        actualVaR95: -420,
        actualUtility: 1380,
      };

    case "underperforming":
      return {
        ...baseMetrics,
        actualEV: 1280,
        actualRAROC: 0.072,
        actualVaR95: -510,
        actualUtility: 1090,
      };

    case "tracking":
      return {
        ...baseMetrics,
        actualEV: 1520,
        actualRAROC: 0.0865,
        actualVaR95: -455,
        actualUtility: 1270,
      };

    case "pending":
    default:
      return baseMetrics;
  }
}
