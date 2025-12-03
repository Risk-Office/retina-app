import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SparklesIcon,
  InfoIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  AlertCircleIcon,
} from "lucide-react";
import type { SimulationResult } from "@/polymet/data/scenario-engine";
import type {
  RAROCThresholds,
  UtilitySettings,
} from "@/polymet/data/tenant-settings";
import { getRAROCBadgeColor } from "@/polymet/data/tenant-settings";
import type { Assumption } from "@/polymet/data/assumptions-store";
import { getConfidenceLabel } from "@/polymet/data/assumptions-store";
import { Friendly } from "@/polymet/components/friendly-term";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";

interface BaselineComparison {
  baselineRunId: string;
  planRunId?: string;
  deltas: {
    optionId: string;
    optionLabel: string;
    deltaEV: number;
    deltaRAROC: number;
    deltaCE: number;
    deltaTCOR: number;
    deltaHorizon?: number;
  }[];
}

interface RecommendationEngineProps {
  simulationResults: SimulationResult[];
  thresholds: RAROCThresholds;
  utilitySettings?: UtilitySettings;
  keyAssumptions?: Assumption[];
  baselineComparison?: BaselineComparison;
  onApplyRecommendation: (
    optionId: string,
    rationale: string,
    isOverride: boolean
  ) => void;
  onToast: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

interface RecommendedOption {
  result: SimulationResult;
  isSafe: boolean;
  reasoning: {
    rarocRank: number;
    evRank: number;
    capitalRank: number;
    ceRank?: number;
    utilityRank?: number;
    tieBreakersUsed: string[];
    usedUtility: boolean;
  };
}

// Helper to get top 3 key assumptions (critical or recently updated)
function getKeyAssumptions(assumptions: Assumption[]): Assumption[] {
  // Sort by: critical first, then by updatedAt (most recent)
  const sorted = [...assumptions].sort((a, b) => {
    if (a.critical && !b.critical) return -1;
    if (!a.critical && b.critical) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return sorted.slice(0, 3);
}

export function RecommendationEngine({
  simulationResults,
  thresholds,
  utilitySettings,
  keyAssumptions = [],
  baselineComparison,
  onApplyRecommendation,
  onToast,
}: RecommendationEngineProps) {
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [rationale, setRationale] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [recommendedOption, setRecommendedOption] =
    useState<RecommendedOption | null>(null);

  // Compute recommended option
  const computeRecommendation = (): RecommendedOption | null => {
    if (!simulationResults || simulationResults.length === 0) return null;

    const useUtility =
      utilitySettings?.useForRecommendation &&
      simulationResults.every((r) => r.certaintyEquivalent !== undefined);

    let recommended: SimulationResult;
    const tieBreakersUsed: string[] = [];

    if (useUtility) {
      // Use Certainty Equivalent for recommendation
      const sortedByCE = [...simulationResults].sort(
        (a, b) => (b.certaintyEquivalent ?? 0) - (a.certaintyEquivalent ?? 0)
      );

      const highestCE = sortedByCE[0].certaintyEquivalent ?? 0;
      const topCEOptions = sortedByCE.filter(
        (r) => Math.abs((r.certaintyEquivalent ?? 0) - highestCE) < 0.01
      );

      if (topCEOptions.length === 1) {
        recommended = topCEOptions[0];
      } else {
        // Tie-breaker: Higher Expected Utility
        const sortedByUtility = [...topCEOptions].sort(
          (a, b) => (b.expectedUtility ?? 0) - (a.expectedUtility ?? 0)
        );
        recommended = sortedByUtility[0];
        tieBreakersUsed.push("Expected Utility");
      }
    } else {
      // Use RAROC for recommendation (original logic)
      const sortedByRAROC = [...simulationResults].sort(
        (a, b) => b.raroc - a.raroc
      );

      const highestRAROC = sortedByRAROC[0].raroc;
      const topRAROCOptions = sortedByRAROC.filter(
        (r) => Math.abs(r.raroc - highestRAROC) < 0.0001
      );

      if (topRAROCOptions.length === 1) {
        recommended = topRAROCOptions[0];
      } else {
        // Tie-breaker #1: Higher EV
        const sortedByEV = [...topRAROCOptions].sort((a, b) => b.ev - a.ev);
        const highestEV = sortedByEV[0].ev;
        const topEVOptions = sortedByEV.filter(
          (r) => Math.abs(r.ev - highestEV) < 0.01
        );

        if (topEVOptions.length === 1) {
          recommended = topEVOptions[0];
          tieBreakersUsed.push("EV");
        } else {
          // Tie-breaker #2: Lower economic capital
          const sortedByCapital = [...topEVOptions].sort(
            (a, b) => a.economicCapital - b.economicCapital
          );
          recommended = sortedByCapital[0];
          tieBreakersUsed.push("EV", "Economic Capital");
        }
      }
    }

    // Check if recommended option is safe (above red threshold)
    const isSafe = recommended.raroc >= thresholds.red;

    // Compute rankings for explanation
    const sortedByRAROC = [...simulationResults].sort(
      (a, b) => b.raroc - a.raroc
    );
    const rarocRank =
      sortedByRAROC.findIndex((r) => r.optionId === recommended.optionId) + 1;

    const sortedByEV = [...simulationResults].sort((a, b) => b.ev - a.ev);
    const evRank =
      sortedByEV.findIndex((r) => r.optionId === recommended.optionId) + 1;

    const sortedByCapital = [...simulationResults].sort(
      (a, b) => a.economicCapital - b.economicCapital
    );
    const capitalRank =
      sortedByCapital.findIndex((r) => r.optionId === recommended.optionId) + 1;

    let ceRank: number | undefined;
    let utilityRank: number | undefined;

    if (useUtility) {
      const sortedByCE = [...simulationResults].sort(
        (a, b) => (b.certaintyEquivalent ?? 0) - (a.certaintyEquivalent ?? 0)
      );
      ceRank =
        sortedByCE.findIndex((r) => r.optionId === recommended.optionId) + 1;

      const sortedByUtility = [...simulationResults].sort(
        (a, b) => (b.expectedUtility ?? 0) - (a.expectedUtility ?? 0)
      );
      utilityRank =
        sortedByUtility.findIndex((r) => r.optionId === recommended.optionId) +
        1;
    }

    return {
      result: recommended,
      isSafe,
      reasoning: {
        rarocRank,
        evRank,
        capitalRank,
        ceRank,
        utilityRank,
        tieBreakersUsed,
        usedUtility: useUtility ?? false,
      },
    };
  };

  // Handle recommend button click
  const handleRecommend = () => {
    if (!simulationResults || simulationResults.length === 0) {
      onToast({
        title: "Run a simulation first",
        description: "No simulation results available",
        variant: "destructive",
      });
      return;
    }

    const recommendation = computeRecommendation();
    if (!recommendation) {
      onToast({
        title: "Unable to compute recommendation",
        description: "Please check simulation results",
        variant: "destructive",
      });
      return;
    }

    setRecommendedOption(recommendation);
    setShowRecommendation(true);

    // Generate auto-filled rationale
    const autoRationale = generateRationale(recommendation);
    setRationale(autoRationale);
  };

  // Generate rationale text
  const generateRationale = (recommendation: RecommendedOption): string => {
    const { result, reasoning, isSafe } = recommendation;
    const tieBreakers =
      reasoning.tieBreakersUsed.length > 0
        ? ` with tie-breakers: ${reasoning.tieBreakersUsed.join(", ")}`
        : "";

    if (reasoning.usedUtility) {
      return `Selected ${result.optionLabel} based on highest Certainty Equivalent (${(result.certaintyEquivalent ?? 0).toFixed(2)}) using ${utilitySettings?.mode} utility function${tieBreakers}. Expected Utility: ${(result.expectedUtility ?? 0).toFixed(3)}, RAROC: ${result.raroc.toFixed(4)}. Thresholds: red < ${thresholds.red}, amber < ${thresholds.amber}.${!isSafe ? " Note: This option falls below the red threshold and requires override approval." : ""}`;
    } else {
      return `Selected ${result.optionLabel} based on highest RAROC (${result.raroc.toFixed(4)}), EV (${result.ev.toFixed(2)}), and capital efficiency (${result.economicCapital.toFixed(2)})${tieBreakers}. Thresholds: red < ${thresholds.red}, amber < ${thresholds.amber}.${!isSafe ? " Note: This option falls below the red threshold and requires override approval." : ""}`;
    }
  };

  // Handle apply recommendation
  const handleApply = () => {
    if (!recommendedOption) return;

    if (!recommendedOption.isSafe && !overrideReason.trim()) {
      onToast({
        title: "Override reason required",
        description:
          "Please provide a reason for overriding the safety threshold",
        variant: "destructive",
      });
      return;
    }

    const finalRationale = recommendedOption.isSafe
      ? rationale
      : `${rationale}\n\nOverride Reason: ${overrideReason}`;

    onApplyRecommendation(
      recommendedOption.result.optionId,
      finalRationale,
      !recommendedOption.isSafe
    );

    // Reset state
    setShowRecommendation(false);
    setShowConfirmDialog(false);
    setRationale("");
    setOverrideReason("");
    setRecommendedOption(null);
  };

  return (
    <>
      {/* Recommend Button */}
      <Button
        onClick={handleRecommend}
        variant="outline"
        className="w-full"
        disabled={simulationResults.length === 0}
      >
        <SparklesIcon className="w-4 h-4 mr-2" />
        Recommend an option
      </Button>

      {/* Recommendation Callout */}
      {showRecommendation && recommendedOption && (
        <Alert
          className={
            recommendedOption.isSafe
              ? "border-primary bg-primary/5"
              : "border-destructive bg-destructive/5"
          }
        >
          {recommendedOption.isSafe ? (
            <CheckCircle2Icon className="h-5 w-5 text-primary" />
          ) : (
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
          )}
          <AlertTitle className="flex items-center gap-2 mb-3">
            {recommendedOption.isSafe ? (
              <>
                Recommended: {recommendedOption.result.optionLabel}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-transparent"
                    >
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="start">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          Why this recommendation?
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {recommendedOption.reasoning.usedUtility
                            ? "Chosen for highest certainty-equivalent (risk-adjusted value), balancing EV and capital."
                            : "Chosen for highest return per unit of capital at risk; CE shown for reference."}
                        </p>
                      </div>

                      {/* Basis */}
                      <div className="text-xs">
                        <span className="font-medium">Basis:</span>
                        <span className="ml-2 text-muted-foreground">
                          {recommendedOption.reasoning.usedUtility
                            ? "CE (Certainty Equivalent)"
                            : "RAROC"}
                        </span>
                      </div>

                      {/* Selected Option Values */}
                      <div className="text-xs">
                        <span className="font-medium mb-2 block">
                          Selected Option Values:
                        </span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground">
                          <div>
                            <span className="font-medium">RAROC:</span>{" "}
                            {recommendedOption.result.raroc.toFixed(4)}
                          </div>
                          <div>
                            <span className="font-medium">EV:</span>{" "}
                            {recommendedOption.result.ev.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">EconCap:</span>{" "}
                            {recommendedOption.result.economicCapital.toFixed(
                              2
                            )}
                          </div>
                          <div>
                            <span className="font-medium">CE:</span>{" "}
                            {(
                              recommendedOption.result.certaintyEquivalent ?? 0
                            ).toFixed(2)}
                          </div>
                          {recommendedOption.result.tcor !== undefined && (
                            <div className="col-span-2">
                              <span className="font-medium">TCOR:</span>{" "}
                              {recommendedOption.result.tcor.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tenant Thresholds */}
                      <div className="text-xs">
                        <span className="font-medium mb-2 block">
                          Tenant Thresholds (RAROC):
                        </span>
                        <div className="space-y-1 text-muted-foreground">
                          <div>
                            <span className="text-red-500 font-medium">
                              Red:
                            </span>{" "}
                            {"<"} {thresholds.red}
                          </div>
                          <div>
                            <span className="text-amber-500 font-medium">
                              Amber:
                            </span>{" "}
                            {thresholds.red} - {thresholds.amber}
                          </div>
                          <div>
                            <span className="text-green-500 font-medium">
                              Green:
                            </span>{" "}
                            ≥ {thresholds.amber}
                          </div>
                        </div>
                      </div>

                      {/* Utility Parameters */}
                      <div className="text-xs">
                        <span className="font-medium mb-2 block">
                          Utility Parameters:
                        </span>
                        <div className="space-y-1 text-muted-foreground">
                          <div>
                            <span className="font-medium">Mode:</span>{" "}
                            {utilitySettings?.mode ?? "CARA"}
                          </div>
                          <div>
                            <span className="font-medium">
                              a (risk aversion):
                            </span>{" "}
                            {utilitySettings?.a ?? 0.000005}
                          </div>
                          <div>
                            <span className="font-medium">scale:</span>{" "}
                            {utilitySettings?.scale ?? 100000}
                          </div>
                        </div>
                      </div>

                      {/* Baseline Comparison */}
                      {baselineComparison &&
                        baselineComparison.deltas.length > 0 &&
                        (() => {
                          const recommendedDelta =
                            baselineComparison.deltas.find(
                              (d) =>
                                d.optionId === recommendedOption.result.optionId
                            );

                          if (!recommendedDelta) return null;

                          const formatDelta = (
                            value: number,
                            isImprovement: boolean
                          ) => {
                            const color = isImprovement
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400";
                            const Icon = isImprovement
                              ? TrendingUpIcon
                              : TrendingDownIcon;
                            const sign = value > 0 ? "+" : "";
                            return (
                              <span className={color}>
                                <Icon className="w-3 h-3 inline mr-0.5" />

                                {sign}
                                {value.toFixed(4)}
                              </span>
                            );
                          };

                          const rarocImproved = recommendedDelta.deltaRAROC > 0;
                          const ceImproved = recommendedDelta.deltaCE > 0;
                          const tcorImproved = recommendedDelta.deltaTCOR < 0; // Lower TCOR is better

                          return (
                            <div className="text-xs border-t border-border pt-4 mt-4">
                              <span className="font-medium mb-2 block">
                                Compared to your Baseline:
                              </span>

                              {/* Plan vs Baseline chip */}
                              {baselineComparison.planRunId && (
                                <div className="mb-3">
                                  <Badge variant="outline" className="text-xs">
                                    Plan vs Baseline
                                  </Badge>
                                </div>
                              )}

                              {/* Delta values */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground mb-3">
                                <div>
                                  <Friendly
                                    term="raroc"
                                    as="short"
                                    showTooltip={false}
                                    className="font-medium"
                                  />
                                  :{" "}
                                  {formatDelta(
                                    recommendedDelta.deltaRAROC,
                                    rarocImproved
                                  )}
                                </div>
                                <div>
                                  <Friendly
                                    term="ce"
                                    as="short"
                                    showTooltip={false}
                                    className="font-medium"
                                  />
                                  :{" "}
                                  {formatDelta(
                                    recommendedDelta.deltaCE,
                                    ceImproved
                                  )}
                                </div>
                                <div className="col-span-2">
                                  <Friendly
                                    term="tcor"
                                    as="short"
                                    showTooltip={false}
                                    className="font-medium"
                                  />
                                  :{" "}
                                  {formatDelta(
                                    recommendedDelta.deltaTCOR,
                                    tcorImproved
                                  )}
                                </div>
                              </div>

                              {/* One-liner summary */}
                              <div className="p-2 bg-muted/50 rounded text-xs leading-relaxed">
                                This choice{" "}
                                {rarocImproved ? "improves" : "decreases"}{" "}
                                <Friendly
                                  term="raroc"
                                  as="label"
                                  showTooltip={false}
                                />{" "}
                                by{" "}
                                <strong>
                                  {Math.abs(
                                    recommendedDelta.deltaRAROC
                                  ).toFixed(4)}
                                </strong>{" "}
                                and {tcorImproved ? "lowers" : "increases"}{" "}
                                <Friendly
                                  term="tcor"
                                  as="label"
                                  showTooltip={false}
                                />{" "}
                                by{" "}
                                <strong>
                                  {Math.abs(recommendedDelta.deltaTCOR).toFixed(
                                    2
                                  )}
                                </strong>{" "}
                                compared to your Baseline.
                              </div>
                            </div>
                          );
                        })()}

                      {/* Key Assumptions */}
                      {keyAssumptions.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium mb-2 block">
                            Key Assumptions:
                          </span>
                          <div className="space-y-2">
                            {keyAssumptions.slice(0, 3).map((assumption) => (
                              <div
                                key={assumption.id}
                                className="p-2 bg-muted/50 rounded border border-border"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-foreground mb-0.5">
                                      {assumption.statement}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Badge
                                        variant="outline"
                                        className="text-xs h-4 px-1"
                                      >
                                        {assumption.scope}
                                      </Badge>
                                      <span>
                                        {getConfidenceLabel(
                                          assumption.confidence
                                        )}
                                      </span>
                                      {assumption.critical && (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs h-4 px-1"
                                        >
                                          Critical
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Warning for critical/invalidated assumptions */}
                          {keyAssumptions.some(
                            (a) =>
                              (a.critical && a.status === "open") ||
                              a.status === "invalidated"
                          ) && (
                            <div className="mt-2 flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                              <AlertCircleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />

                              <div className="text-amber-700 dark:text-amber-300">
                                <div className="font-medium">
                                  Review Required
                                </div>
                                <div className="text-xs mt-0.5">
                                  Critical assumptions are open or invalidated.
                                  Please review before finalizing.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              "No safe recommendation"
            )}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            {recommendedOption.isSafe ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {recommendedOption.reasoning.usedUtility ? (
                    <>
                      <Badge variant="outline" className="bg-primary/10">
                        CE:{" "}
                        {(
                          recommendedOption.result.certaintyEquivalent ?? 0
                        ).toFixed(2)}
                      </Badge>
                      <Badge variant="outline">
                        EU:{" "}
                        {(
                          recommendedOption.result.expectedUtility ?? 0
                        ).toFixed(3)}
                      </Badge>
                      <Badge
                        className={getRAROCBadgeColor(
                          recommendedOption.result.raroc,
                          thresholds
                        )}
                      >
                        RAROC: {recommendedOption.result.raroc.toFixed(4)}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge
                        className={getRAROCBadgeColor(
                          recommendedOption.result.raroc,
                          thresholds
                        )}
                      >
                        RAROC: {recommendedOption.result.raroc.toFixed(4)}
                      </Badge>
                      <Badge variant="outline">
                        EV: {recommendedOption.result.ev.toFixed(2)}
                      </Badge>
                      <Badge variant="outline">
                        Capital:{" "}
                        {recommendedOption.result.economicCapital.toFixed(2)}
                      </Badge>
                    </>
                  )}
                </div>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  size="sm"
                  className="mt-2"
                >
                  Apply recommendation
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm">
                  All options fall below tenant RAROC threshold (red {"<"}{" "}
                  {thresholds.red}). Consider revising options or provide an
                  override rationale.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    className={getRAROCBadgeColor(
                      recommendedOption.result.raroc,
                      thresholds
                    )}
                  >
                    Best RAROC: {recommendedOption.result.raroc.toFixed(4)}
                  </Badge>
                  <Badge variant="outline">
                    {recommendedOption.result.optionLabel}
                  </Badge>
                </div>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  size="sm"
                  variant="destructive"
                  className="mt-2"
                >
                  Override & choose
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {recommendedOption?.isSafe
                ? "Apply Recommendation"
                : "Override Safety Threshold"}
            </DialogTitle>
            <DialogDescription>
              {recommendedOption?.isSafe
                ? `Confirm applying recommendation: ${recommendedOption.result.optionLabel}`
                : `This option falls below the safety threshold. Please provide an override reason.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rationale">Rationale (editable)</Label>
              <Textarea
                id="rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            {recommendedOption && !recommendedOption.isSafe && (
              <div className="space-y-2">
                <Label htmlFor="override-reason" className="text-destructive">
                  Override Reason (required) *
                </Label>
                <Textarea
                  id="override-reason"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why you're overriding the safety threshold..."
                  className="border-destructive"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setOverrideReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApply}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
