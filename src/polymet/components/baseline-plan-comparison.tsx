import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Friendly } from "@/polymet/components/friendly-term";
import { exportBaselinePlanCSV } from "@/polymet/data/csv-export-utils";
import {
  PinIcon,
  TargetIcon,
  XIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  InfoIcon,
  AlertCircleIcon,
  DownloadIcon,
} from "lucide-react";
import { formatRunId } from "@/polymet/data/run-fingerprint";
import { SimulationResult } from "@/polymet/data/scenario-engine";
import { useTenant } from "@/polymet/data/tenant-context";

interface BaselinePlanComparison {
  baselineRunId: string;
  planRunId: string;
  deltas: {
    optionId: string;
    optionLabel: string;
    deltaEV: number;
    deltaRAROC: number;
    deltaCE: number;
    deltaTCOR: number;
    deltaHorizon?: number;
  }[];
  notes: string;
  timestamp: number;
}

interface BaselinePlanComparisonProps {
  decisionId: string;
  currentRunId?: string;
  currentResults: SimulationResult[];
  currentHorizonMonths: number;
  onAuditEvent: (eventType: string, payload: any) => void;
  onToast?: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

interface RunSnapshot {
  runId: string;
  results: SimulationResult[];
  horizonMonths: number;
  timestamp: number;
}

export function BaselinePlanComparison({
  decisionId,
  currentRunId,
  currentResults,
  currentHorizonMonths,
  onAuditEvent,
  onToast,
}: BaselinePlanComparisonProps) {
  const { tenant } = useTenant();
  const [baselineRunId, setBaselineRunId] = useState<string | null>(null);
  const [baselineResults, setBaselineResults] = useState<
    SimulationResult[] | null
  >(null);
  const [baselineHorizon, setBaselineHorizon] = useState<number | null>(null);
  const [planRunId, setPlanRunId] = useState<string | null>(null);
  const [planResults, setPlanResults] = useState<SimulationResult[] | null>(
    null
  );
  const [planHorizon, setPlanHorizon] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [comparisonRecord, setComparisonRecord] =
    useState<BaselinePlanComparison | null>(null);
  const [showBaselineSummary, setShowBaselineSummary] = useState(false);
  const [showPlanSummary, setShowPlanSummary] = useState(false);
  const [baselineSnapshot, setBaselineSnapshot] = useState<RunSnapshot | null>(
    null
  );
  const [planSnapshot, setPlanSnapshot] = useState<RunSnapshot | null>(null);

  // Load comparison from localStorage
  useEffect(() => {
    const storageKey = `retina:comparison:${decisionId}`;
    const savedComparison = localStorage.getItem(storageKey);
    if (savedComparison) {
      try {
        const comparison = JSON.parse(savedComparison);
        setComparisonRecord(comparison);
        setNotes(comparison.notes || "");

        // Load baseline data
        const baselineKey = `retina:snapshot:${comparison.baselineRunId}`;
        const baselineData = localStorage.getItem(baselineKey);
        if (baselineData) {
          const baseline = JSON.parse(baselineData);
          setBaselineRunId(comparison.baselineRunId);
          setBaselineResults(baseline.results);
          setBaselineHorizon(baseline.horizonMonths);
          setBaselineSnapshot(baseline);
        }

        // Load plan data
        const planKey = `retina:snapshot:${comparison.planRunId}`;
        const planData = localStorage.getItem(planKey);
        if (planData) {
          const plan = JSON.parse(planData);
          setPlanRunId(comparison.planRunId);
          setPlanResults(plan.results);
          setPlanHorizon(plan.horizonMonths);
          setPlanSnapshot(plan);
        }
      } catch (error) {
        console.error("Failed to load comparison:", error);
      }
    }
  }, [decisionId]);

  // Save comparison to localStorage
  const saveComparison = (comparison: BaselinePlanComparison) => {
    const storageKey = `retina:comparison:${decisionId}`;
    localStorage.setItem(storageKey, JSON.stringify(comparison));
    setComparisonRecord(comparison);
  };

  // Pin current run as baseline
  const handlePinBaseline = () => {
    if (!currentRunId || currentResults.length === 0) return;

    const snapshot: RunSnapshot = {
      runId: currentRunId,
      results: currentResults,
      horizonMonths: currentHorizonMonths,
      timestamp: Date.now(),
    };

    setBaselineRunId(currentRunId);
    setBaselineResults(currentResults);
    setBaselineHorizon(currentHorizonMonths);
    setBaselineSnapshot(snapshot);

    // Save snapshot
    const snapshotKey = `retina:snapshot:${currentRunId}`;
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot));

    onAuditEvent("compare.baseline.pinned", {
      decisionId,
      runId: currentRunId,
      optionCount: currentResults.length,
    });

    onToast?.({
      title: "Baseline pinned",
      description: `Run ${formatRunId(currentRunId)} is now your baseline for comparison.`,
    });
  };

  // Set current run as plan
  const handleSetPlan = () => {
    if (!currentRunId || currentResults.length === 0) return;

    // Guardrail: Check if baseline exists
    if (!baselineRunId) {
      onToast?.({
        title: "Pin a Baseline first",
        description: "You need to pin a baseline before setting a plan.",
        variant: "destructive",
      });
      return;
    }

    const snapshot: RunSnapshot = {
      runId: currentRunId,
      results: currentResults,
      horizonMonths: currentHorizonMonths,
      timestamp: Date.now(),
    };

    setPlanRunId(currentRunId);
    setPlanResults(currentResults);
    setPlanHorizon(currentHorizonMonths);
    setPlanSnapshot(snapshot);

    // Save snapshot
    const snapshotKey = `retina:snapshot:${currentRunId}`;
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot));

    // Calculate deltas
    if (baselineResults) {
      const deltas = currentResults.map((planResult) => {
        const baselineResult = baselineResults.find(
          (r) => r.optionId === planResult.optionId
        );

        if (!baselineResult) {
          return {
            optionId: planResult.optionId,
            optionLabel: planResult.optionLabel,
            deltaEV: planResult.ev,
            deltaRAROC: planResult.raroc,
            deltaCE: planResult.certaintyEquivalent || 0,
            deltaTCOR: planResult.tcor || 0,
            deltaHorizon: 0,
          };
        }

        return {
          optionId: planResult.optionId,
          optionLabel: planResult.optionLabel,
          deltaEV: planResult.ev - baselineResult.ev,
          deltaRAROC: planResult.raroc - baselineResult.raroc,
          deltaCE:
            (planResult.certaintyEquivalent || 0) -
            (baselineResult.certaintyEquivalent || 0),
          deltaTCOR: (planResult.tcor || 0) - (baselineResult.tcor || 0),
          deltaHorizon:
            baselineHorizon !== null && planHorizon !== null
              ? currentHorizonMonths - baselineHorizon
              : undefined,
        };
      });

      const comparison: BaselinePlanComparison = {
        baselineRunId,
        planRunId: currentRunId,
        deltas,
        notes: "",
        timestamp: Date.now(),
      };

      saveComparison(comparison);

      // Find best option delta
      const bestDelta = deltas.reduce((best, current) => {
        return current.deltaRAROC > best.deltaRAROC ? current : best;
      }, deltas[0]);

      onAuditEvent("compare.baselinePlan", {
        decisionId,
        baselineRunId,
        planRunId: currentRunId,
        summary: {
          bestOptionDelta: {
            optionLabel: bestDelta.optionLabel,
            deltaRAROC: bestDelta.deltaRAROC,
            deltaEV: bestDelta.deltaEV,
          },
          totalOptions: deltas.length,
        },
      });

      onToast?.({
        title: "Plan set",
        description: `Comparing Plan ${formatRunId(currentRunId)} against Baseline ${formatRunId(baselineRunId)}.`,
      });
    }
  };

  // Clear comparison
  const handleClear = () => {
    setBaselineRunId(null);
    setBaselineResults(null);
    setBaselineHorizon(null);
    setBaselineSnapshot(null);
    setPlanRunId(null);
    setPlanResults(null);
    setPlanHorizon(null);
    setPlanSnapshot(null);
    setNotes("");
    setComparisonRecord(null);

    const storageKey = `retina:comparison:${decisionId}`;
    localStorage.removeItem(storageKey);

    onAuditEvent("compare.cleared", { decisionId });

    onToast?.({
      title: "Comparison cleared",
      description: "Baseline and plan have been removed.",
    });
  };

  // Save notes
  const handleSaveNotes = () => {
    if (!comparisonRecord) return;

    const updatedComparison = {
      ...comparisonRecord,
      notes,
      timestamp: Date.now(),
    };

    saveComparison(updatedComparison);

    onAuditEvent("compare.notes.saved", {
      decisionId,
      baselineRunId: comparisonRecord.baselineRunId,
      planRunId: comparisonRecord.planRunId,
    });

    onToast?.({
      title: "Notes saved",
      description: "Your comparison notes have been saved.",
    });
  };

  // Format delta with color
  const formatDelta = (value: number, isImprovement: boolean) => {
    const color = isImprovement
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
    const icon = isImprovement ? (
      <TrendingUpIcon className="w-3 h-3 inline" />
    ) : (
      <TrendingDownIcon className="w-3 h-3 inline" />
    );

    const sign = value > 0 ? "+" : "";
    return (
      <span className={color}>
        {icon} {sign}
        {value.toFixed(4)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePinBaseline}
          disabled={!currentRunId || currentResults.length === 0}
        >
          <PinIcon className="w-4 h-4 mr-2" />
          Pin as Baseline
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSetPlan}
          disabled={
            !currentRunId || !baselineRunId || currentResults.length === 0
          }
        >
          <TargetIcon className="w-4 h-4 mr-2" />
          Set as Plan
        </Button>
        {(baselineRunId || planRunId) && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <XIcon className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Badges */}
      {(baselineRunId || planRunId) && (
        <div className="flex items-center gap-2 flex-wrap">
          {baselineRunId && (
            <Badge
              variant="outline"
              className="font-mono cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setShowBaselineSummary(true)}
            >
              Baseline: {formatRunId(baselineRunId)}
            </Badge>
          )}
          {planRunId && (
            <Badge
              variant="outline"
              className="font-mono cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setShowPlanSummary(true)}
            >
              Plan: {formatRunId(planRunId)}
            </Badge>
          )}
        </div>
      )}

      {/* Empty State */}
      {!baselineRunId && !planRunId && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <InfoIcon className="w-8 h-8 mx-auto text-muted-foreground" />

              <p className="text-sm text-muted-foreground">
                Pin a Baseline and run again to set a Plan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Panel */}
      {comparisonRecord && comparisonRecord.deltas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Baseline vs Plan</CardTitle>
            <CardDescription>
              Comparing Plan ({formatRunId(comparisonRecord.planRunId)}) against
              Baseline ({formatRunId(comparisonRecord.baselineRunId)})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Delta Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option</TableHead>
                    <TableHead>
                      Δ
                      <Friendly term="ev" as="label" showTooltip={false} />
                    </TableHead>
                    <TableHead>
                      Δ
                      <Friendly term="raroc" as="label" showTooltip={false} />
                    </TableHead>
                    <TableHead>
                      Δ
                      <Friendly term="ce" as="label" showTooltip={false} />
                    </TableHead>
                    <TableHead>
                      Δ
                      <Friendly term="tcor" as="label" showTooltip={false} />
                    </TableHead>
                    {comparisonRecord.deltas.some(
                      (d) => d.deltaHorizon !== undefined
                    ) && (
                      <TableHead>
                        Δ
                        <Friendly
                          term="horizon"
                          as="label"
                          showTooltip={false}
                        />
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonRecord.deltas.map((delta) => (
                    <TableRow key={delta.optionId}>
                      <TableCell className="font-medium">
                        {delta.optionLabel}
                      </TableCell>
                      <TableCell>
                        {formatDelta(delta.deltaEV, delta.deltaEV > 0)}
                      </TableCell>
                      <TableCell>
                        {formatDelta(delta.deltaRAROC, delta.deltaRAROC > 0)}
                      </TableCell>
                      <TableCell>
                        {formatDelta(delta.deltaCE, delta.deltaCE > 0)}
                      </TableCell>
                      <TableCell>
                        {formatDelta(delta.deltaTCOR, delta.deltaTCOR < 0)}
                      </TableCell>
                      {delta.deltaHorizon !== undefined && (
                        <TableCell>
                          {delta.deltaHorizon !== 0 ? (
                            <span className="text-muted-foreground">
                              {delta.deltaHorizon > 0 ? "+" : ""}
                              {delta.deltaHorizon} months
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* What Changed? Notes */}
            <div className="space-y-2">
              <Label htmlFor="comparison-notes">What changed?</Label>
              <Textarea
                id="comparison-notes"
                placeholder="Describe what changed between baseline and plan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    exportBaselinePlanCSV(
                      decisionId,
                      comparisonRecord.baselineRunId,
                      comparisonRecord.planRunId,
                      comparisonRecord.deltas,
                      notes
                    );
                    onAuditEvent("compare.baselinePlan.exported", {
                      decisionId,
                      baselineRunId: comparisonRecord.baselineRunId,
                      planRunId: comparisonRecord.planRunId,
                      optionCount: comparisonRecord.deltas.length,
                    });
                    onToast?.({
                      title: "Export complete",
                      description:
                        "Baseline vs Plan comparison exported to CSV.",
                    });
                  }}
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Export Baseline vs Plan CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baseline Summary Dialog */}
      <Dialog open={showBaselineSummary} onOpenChange={setShowBaselineSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baseline Summary</DialogTitle>
            <DialogDescription>
              Run {baselineRunId && formatRunId(baselineRunId)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {baselineSnapshot && (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    <Friendly term="horizon" /> (months)
                  </div>
                  <div className="text-2xl font-bold">
                    {baselineSnapshot.horizonMonths}
                  </div>
                </div>
                <div className="space-y-3">
                  {baselineSnapshot.results.map((result) => (
                    <div
                      key={result.optionId}
                      className="p-3 border border-border rounded-lg space-y-2"
                    >
                      <div className="font-semibold">{result.optionLabel}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="ev" as="short" />:
                          </span>{" "}
                          {result.ev.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="raroc" as="short" />:
                          </span>{" "}
                          {result.raroc.toFixed(4)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="ce" as="short" />:
                          </span>{" "}
                          {(result.certaintyEquivalent || 0).toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="tcor" as="short" />:
                          </span>{" "}
                          {(result.tcor || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Summary Dialog */}
      <Dialog open={showPlanSummary} onOpenChange={setShowPlanSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Summary</DialogTitle>
            <DialogDescription>
              Run {planRunId && formatRunId(planRunId)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {planSnapshot && (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    <Friendly term="horizon" /> (months)
                  </div>
                  <div className="text-2xl font-bold">
                    {planSnapshot.horizonMonths}
                  </div>
                </div>
                <div className="space-y-3">
                  {planSnapshot.results.map((result) => (
                    <div
                      key={result.optionId}
                      className="p-3 border border-border rounded-lg space-y-2"
                    >
                      <div className="font-semibold">{result.optionLabel}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="ev" as="short" />:
                          </span>{" "}
                          {result.ev.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="raroc" as="short" />:
                          </span>{" "}
                          {result.raroc.toFixed(4)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="ce" as="short" />:
                          </span>{" "}
                          {(result.certaintyEquivalent || 0).toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            <Friendly term="tcor" as="short" />:
                          </span>{" "}
                          {(result.tcor || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
