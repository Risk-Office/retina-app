import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  MinusIcon,
} from "lucide-react";
import type { SimulationResult } from "@/polymet/data/scenario-engine";
import type { SimulationSnapshot } from "@/polymet/data/retina-store";

interface SimulationComparisonProps {
  currentResults: SimulationResult[];
  previousSnapshot: SimulationSnapshot;
  currentSeed: number;
  currentRuns: number;
  currentSpearman?: number;
  previousSpearman?: number;
  currentHorizonMonths?: number;
  currentCopulaFroErr?: number;
  currentCopulaTargetSet?: boolean;
  lastSensitivityRunId?: string;
  onViewSensitivity?: () => void;
}

interface MetricDelta {
  optionId: string;
  optionLabel: string;
  deltas: {
    ev: { absolute: number; percent: number };
    raroc: { absolute: number; percent: number };
    economicCapital: { absolute: number; percent: number };
    var95: { absolute: number; percent: number };
    cvar95: { absolute: number; percent: number };
    tcor?: { absolute: number; percent: number };
  };
}

function calculateDeltas(
  current: SimulationResult[],
  previous: SimulationSnapshot
): MetricDelta[] {
  return current.map((result) => {
    const prevMetrics = previous.metricsByOption[result.optionId];

    if (!prevMetrics) {
      // No previous data for this option
      return {
        optionId: result.optionId,
        optionLabel: result.optionLabel,
        deltas: {
          ev: { absolute: 0, percent: 0 },
          raroc: { absolute: 0, percent: 0 },
          economicCapital: { absolute: 0, percent: 0 },
          var95: { absolute: 0, percent: 0 },
          cvar95: { absolute: 0, percent: 0 },
          tcor:
            result.tcor !== undefined ? { absolute: 0, percent: 0 } : undefined,
        },
      };
    }

    const calculateDelta = (current: number, previous: number) => {
      const absolute = current - previous;
      const percent =
        previous !== 0 ? (absolute / Math.abs(previous)) * 100 : 0;
      return { absolute, percent };
    };

    const deltas: MetricDelta["deltas"] = {
      ev: calculateDelta(result.ev, prevMetrics.ev),
      raroc: calculateDelta(result.raroc, prevMetrics.raroc),
      economicCapital: calculateDelta(
        result.economicCapital,
        prevMetrics.economicCapital
      ),
      var95: calculateDelta(result.var95, prevMetrics.var95),
      cvar95: calculateDelta(result.cvar95, prevMetrics.cvar95),
    };

    // Add TCOR delta if available
    if (result.tcor !== undefined && prevMetrics.tcor !== undefined) {
      deltas.tcor = calculateDelta(result.tcor, prevMetrics.tcor);
    }

    return {
      optionId: result.optionId,
      optionLabel: result.optionLabel,
      deltas,
    };
  });
}

function DeltaBadge({
  delta,
  isPositiveGood = true,
}: {
  delta: { absolute: number; percent: number };
  isPositiveGood?: boolean;
}) {
  const isPositive = delta.absolute > 0;
  const isNegative = delta.absolute < 0;
  const isZero = Math.abs(delta.absolute) < 0.0001;

  if (isZero) {
    return (
      <Badge variant="outline" className="gap-1">
        <MinusIcon className="w-3 h-3" />

        <span>No change</span>
      </Badge>
    );
  }

  const isGood = isPositiveGood ? isPositive : isNegative;
  const colorClass = isGood
    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
    : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";

  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Badge variant="outline" className={`gap-1 ${colorClass}`}>
      <Icon className="w-3 h-3" />

      <span>
        {isPositive ? "+" : ""}
        {delta.percent.toFixed(1)}%
      </span>
    </Badge>
  );
}

export function SimulationComparison({
  currentResults,
  previousSnapshot,
  currentSeed,
  currentRuns,
  currentSpearman,
  previousSpearman,
  currentHorizonMonths,
  currentCopulaFroErr,
  currentCopulaTargetSet,
  lastSensitivityRunId,
  onViewSensitivity,
}: SimulationComparisonProps) {
  const deltas = calculateDeltas(currentResults, previousSnapshot);

  // Calculate Spearman correlation delta
  const spearmanDelta =
    currentSpearman !== undefined && previousSpearman !== undefined
      ? currentSpearman - previousSpearman
      : undefined;

  // Calculate horizon delta
  const horizonDelta =
    currentHorizonMonths !== undefined &&
    previousSnapshot.horizonMonths !== undefined
      ? currentHorizonMonths - previousSnapshot.horizonMonths
      : undefined;

  // Check if copula dependence changed significantly
  const copulaChanged =
    currentCopulaTargetSet &&
    previousSnapshot.copula?.targetSet &&
    currentCopulaFroErr !== undefined &&
    previousSnapshot.copula?.froErr !== undefined &&
    Math.abs(currentCopulaFroErr - previousSnapshot.copula.froErr) > 0.05;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-primary" />
              What Changed?
            </CardTitle>
            <CardDescription>
              Compared to previous run (seed {previousSnapshot.seed}, runs{" "}
              {previousSnapshot.runs}, runId{" "}
              {previousSnapshot.runId.slice(0, 8)}...)
            </CardDescription>
          </div>
          <Badge variant="outline">
            Current: seed {currentSeed}, runs {currentRuns}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Horizon Delta */}
          {horizonDelta !== undefined && horizonDelta !== 0 && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Horizon Change (ΔHorizon)
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`font-mono ${
                      Math.abs(horizonDelta) >= 3
                        ? horizonDelta > 0
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                          : "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
                        : ""
                    }`}
                  >
                    {horizonDelta > 0 ? "+" : ""}
                    {horizonDelta} months
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {previousSnapshot.horizonMonths} → {currentHorizonMonths}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Copula Dependence Changed */}
          {copulaChanged && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-400">
                  Dependence Changed
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                  >
                    ΔFrobenius:{" "}
                    {Math.abs(
                      currentCopulaFroErr! - previousSnapshot.copula!.froErr!
                    ).toFixed(3)}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {previousSnapshot.copula!.froErr!.toFixed(3)} →{" "}
                    {currentCopulaFroErr!.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Last Sensitivity Results Link */}
          {lastSensitivityRunId && onViewSensitivity && (
            <div
              className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg cursor-pointer hover:bg-amber-500/20 transition-colors"
              onClick={onViewSensitivity}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  View Last Sensitivity Results
                </div>
                <Badge
                  variant="outline"
                  className="font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                >
                  Run ID: {lastSensitivityRunId.slice(0, 8)}...
                </Badge>
              </div>
            </div>
          )}

          {/* Spearman Correlation Delta */}
          {spearmanDelta !== undefined && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Correlation Change (Δρₛ)
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      Math.abs(spearmanDelta) < 0.05 ? "outline" : "default"
                    }
                    className={`font-mono ${
                      Math.abs(spearmanDelta) >= 0.1
                        ? spearmanDelta > 0
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        : ""
                    }`}
                  >
                    {spearmanDelta > 0 ? "+" : ""}
                    {spearmanDelta.toFixed(2)}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {previousSpearman?.toFixed(2)} →{" "}
                    {currentSpearman?.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {deltas.map((delta) => (
            <div
              key={delta.optionId}
              className="p-4 bg-background border border-border rounded-lg space-y-3"
            >
              <div className="font-semibold text-sm">{delta.optionLabel}</div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* RAROC Delta */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    RAROC
                  </div>
                  <DeltaBadge
                    delta={delta.deltas.raroc}
                    isPositiveGood={true}
                  />

                  <div className="text-xs text-muted-foreground">
                    {delta.deltas.raroc.absolute > 0 ? "+" : ""}
                    {delta.deltas.raroc.absolute.toFixed(4)}
                  </div>
                </div>

                {/* EV Delta */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Expected Value
                  </div>
                  <DeltaBadge delta={delta.deltas.ev} isPositiveGood={true} />

                  <div className="text-xs text-muted-foreground">
                    {delta.deltas.ev.absolute > 0 ? "+" : ""}
                    {delta.deltas.ev.absolute.toFixed(2)}
                  </div>
                </div>

                {/* Economic Capital Delta */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Economic Capital
                  </div>
                  <DeltaBadge
                    delta={delta.deltas.economicCapital}
                    isPositiveGood={false}
                  />

                  <div className="text-xs text-muted-foreground">
                    {delta.deltas.economicCapital.absolute > 0 ? "+" : ""}
                    {delta.deltas.economicCapital.absolute.toFixed(2)}
                  </div>
                </div>

                {/* VaR95 Delta */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    VaR95
                  </div>
                  <DeltaBadge
                    delta={delta.deltas.var95}
                    isPositiveGood={true}
                  />

                  <div className="text-xs text-muted-foreground">
                    {delta.deltas.var95.absolute > 0 ? "+" : ""}
                    {delta.deltas.var95.absolute.toFixed(2)}
                  </div>
                </div>

                {/* CVaR95 Delta */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    CVaR95
                  </div>
                  <DeltaBadge
                    delta={delta.deltas.cvar95}
                    isPositiveGood={true}
                  />

                  <div className="text-xs text-muted-foreground">
                    {delta.deltas.cvar95.absolute > 0 ? "+" : ""}
                    {delta.deltas.cvar95.absolute.toFixed(2)}
                  </div>
                </div>

                {/* TCOR Delta */}
                {delta.deltas.tcor && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">
                      TCOR
                    </div>
                    <DeltaBadge
                      delta={delta.deltas.tcor}
                      isPositiveGood={false}
                    />

                    <div className="text-xs text-muted-foreground">
                      {delta.deltas.tcor.absolute > 0 ? "+" : ""}
                      {delta.deltas.tcor.absolute.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
