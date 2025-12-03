import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SimulationResult } from "@/polymet/data/scenario-engine";
import type { RAROCThresholds } from "@/polymet/data/tenant-settings";
import type { Assumption } from "@/polymet/data/assumptions-store";
import { generateDecisionFinalizedEntry } from "@/polymet/data/auto-journal-generator";

interface DecisionCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string;
  decisionTitle: string;
  chosenOptionId: string;
  chosenOptionLabel: string;
  simulationResults: SimulationResult[];
  lastSimulationTime?: number;
  thresholds: RAROCThresholds;
  assumptions?: Assumption[];
  tenantId: string;
  onConfirm: (rationale: string, overrideReason?: string) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function DecisionCloseDialog({
  open,
  onOpenChange,
  decisionId,
  decisionTitle,
  chosenOptionId,
  chosenOptionLabel,
  simulationResults,
  lastSimulationTime,
  thresholds,
  assumptions = [],
  tenantId,
  onConfirm,
  onAuditEvent,
}: DecisionCloseDialogProps) {
  const [rationale, setRationale] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [confirmStaleRun, setConfirmStaleRun] = useState(false);
  const [confirmNegativeEV, setConfirmNegativeEV] = useState(false);

  // Find the chosen option's simulation result
  const chosenResult = simulationResults.find(
    (r) => r.optionId === chosenOptionId
  );

  // Check if simulation is stale (older than 30 minutes)
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const now = Date.now();
  const isStaleRun =
    !lastSimulationTime || now - lastSimulationTime > THIRTY_MINUTES;
  const timeSinceSimulation = lastSimulationTime
    ? Math.floor((now - lastSimulationTime) / 1000 / 60)
    : null;

  // Check if RAROC is below red threshold
  const isLowRaroc = chosenResult ? chosenResult.raroc < thresholds.red : false;

  // Check if EV is negative
  const isNegativeEV = chosenResult ? chosenResult.ev < 0 : false;

  // Check assumptions
  const criticalUnvalidatedAssumptions = assumptions.filter(
    (a) => a.critical && a.status !== "validated"
  );
  const invalidatedAssumptions = assumptions.filter(
    (a) => a.status === "invalidated"
  );
  const hasCriticalUnvalidated = criticalUnvalidatedAssumptions.length > 0;
  const hasInvalidated = invalidatedAssumptions.length > 0;

  // Determine if all required fields are satisfied
  const canConfirm =
    (!isStaleRun || confirmStaleRun) &&
    (!isLowRaroc || rationale.trim().length > 0) &&
    (!isNegativeEV || confirmNegativeEV) &&
    (!hasCriticalUnvalidated || overrideReason.trim().length > 0);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setRationale("");
      setOverrideReason("");
      setConfirmStaleRun(false);
      setConfirmNegativeEV(false);
    }
  }, [open]);

  const handleConfirm = () => {
    // Add audit event for guardrails
    onAuditEvent("decision.close.guardrails", {
      staleRun: isStaleRun,
      lowRaroc: isLowRaroc,
      negativeEV: isNegativeEV,
      chosenOptionId,
      raroc: chosenResult?.raroc,
      ev: chosenResult?.ev,
    });

    // Add audit event for assumptions check
    onAuditEvent("decision.close.assumptionsChecked", {
      criticalOpen: criticalUnvalidatedAssumptions.length,
      invalidated: invalidatedAssumptions.length,
    });

    // Generate automatic journal entry
    if (chosenResult) {
      generateDecisionFinalizedEntry(
        decisionId,
        decisionTitle,
        tenantId,
        chosenOptionId,
        chosenOptionLabel,
        chosenResult,
        rationale || overrideReason
      );
    }

    onConfirm(rationale, overrideReason);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Decision</DialogTitle>
          <DialogDescription>
            Review the decision details and address any warnings before
            confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Decision Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="text-sm font-medium">Decision Summary</div>
            <div className="text-sm text-muted-foreground">
              <strong>Title:</strong> {decisionTitle}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="w-4 h-4 text-green-600" />

              <span className="text-sm">
                <strong>Chosen Option:</strong> {chosenOptionLabel}
              </span>
            </div>
            {chosenResult && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border">
                <div className="text-xs">
                  <span className="text-muted-foreground">RAROC:</span>{" "}
                  <span className="font-mono">
                    {chosenResult.raroc.toFixed(4)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">EV:</span>{" "}
                  <span className="font-mono">
                    {chosenResult.ev.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">VaR95:</span>{" "}
                  <span className="font-mono">
                    {chosenResult.var95.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">CVaR95:</span>{" "}
                  <span className="font-mono">
                    {chosenResult.cvar95.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Guardrail Warnings */}
          <div className="space-y-3">
            {/* Stale Run Warning */}
            {isStaleRun && (
              <Alert
                variant="default"
                className="border-amber-500 bg-amber-50 dark:bg-amber-950"
              >
                <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />

                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Stale Simulation Run
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {lastSimulationTime ? (
                    <>
                      The last simulation was run{" "}
                      <strong>{timeSinceSimulation} minutes ago</strong>. It's
                      recommended to run a fresh simulation before closing this
                      decision.
                    </>
                  ) : (
                    <>
                      No simulation has been run for this decision. It's
                      recommended to run a simulation before closing.
                    </>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Checkbox
                      id="confirm-stale"
                      checked={confirmStaleRun}
                      onCheckedChange={(checked) =>
                        setConfirmStaleRun(checked as boolean)
                      }
                    />

                    <Label
                      htmlFor="confirm-stale"
                      className="text-sm font-medium cursor-pointer text-amber-900 dark:text-amber-100"
                    >
                      I confirm proceeding with a stale simulation run
                    </Label>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Low RAROC Warning */}
            {isLowRaroc && (
              <Alert
                variant="default"
                className="border-orange-500 bg-orange-50 dark:bg-orange-950"
              >
                <AlertTriangleIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />

                <AlertTitle className="text-orange-900 dark:text-orange-100">
                  RAROC Below Threshold
                </AlertTitle>
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  The chosen option has a RAROC of{" "}
                  <strong>{chosenResult?.raroc.toFixed(4)}</strong>, which is
                  below the red threshold of{" "}
                  <strong>{thresholds.red.toFixed(2)}</strong>. Please provide
                  additional rationale for this decision.
                </AlertDescription>
              </Alert>
            )}

            {/* Negative EV Danger */}
            {isNegativeEV && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />

                <AlertTitle>Negative Expected Value</AlertTitle>
                <AlertDescription>
                  The chosen option has a negative expected value of{" "}
                  <strong>{chosenResult?.ev.toFixed(2)}</strong>. This indicates
                  a potential loss. Please confirm you accept this risk.
                  <div className="flex items-center gap-2 mt-3">
                    <Checkbox
                      id="confirm-negative-ev"
                      checked={confirmNegativeEV}
                      onCheckedChange={(checked) =>
                        setConfirmNegativeEV(checked as boolean)
                      }
                    />

                    <Label
                      htmlFor="confirm-negative-ev"
                      className="text-sm font-medium cursor-pointer"
                    >
                      I acknowledge the negative EV and accept potential loss
                    </Label>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Critical Assumptions Not Validated - BLOCKING */}
            {hasCriticalUnvalidated && (
              <Alert variant="destructive">
                <ShieldAlertIcon className="h-4 w-4" />

                <AlertTitle>Critical Assumptions Not Validated</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      {criticalUnvalidatedAssumptions.length} critical{" "}
                      {criticalUnvalidatedAssumptions.length === 1
                        ? "assumption is"
                        : "assumptions are"}{" "}
                      not validated. You must provide an override reason to
                      proceed.
                    </p>
                    <div className="space-y-1 text-xs">
                      {criticalUnvalidatedAssumptions.map((assumption) => (
                        <div
                          key={assumption.id}
                          className="flex items-start gap-2"
                        >
                          <AlertCircleIcon className="w-3 h-3 mt-0.5 shrink-0" />

                          <span>{assumption.statement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Invalidated Assumptions - WARNING */}
            {hasInvalidated && (
              <Alert
                variant="default"
                className="border-amber-500 bg-amber-50 dark:bg-amber-950"
              >
                <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />

                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Assumptions Invalidated
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <div className="space-y-2">
                    <p>
                      {invalidatedAssumptions.length}{" "}
                      {invalidatedAssumptions.length === 1
                        ? "assumption has"
                        : "assumptions have"}{" "}
                      been invalidated. Please confirm your rationale.
                    </p>
                    <div className="space-y-1 text-xs">
                      {invalidatedAssumptions.map((assumption) => (
                        <div
                          key={assumption.id}
                          className="flex items-start gap-2"
                        >
                          <AlertCircleIcon className="w-3 h-3 mt-0.5 shrink-0" />

                          <span>{assumption.statement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Rationale Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rationale">
                {isLowRaroc ? "Override Rationale" : "Decision Rationale"}{" "}
                {isLowRaroc && (
                  <Badge variant="destructive" className="ml-2">
                    Required
                  </Badge>
                )}
              </Label>
              {rationale.trim().length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {rationale.trim().length} characters
                </span>
              )}
            </div>
            <Textarea
              id="rationale"
              placeholder={
                isLowRaroc
                  ? "Explain why you're proceeding despite low RAROC..."
                  : "Provide context for this decision (optional)..."
              }
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className={
                isLowRaroc && !rationale.trim() ? "border-orange-500" : ""
              }
            />

            {isLowRaroc && !rationale.trim() && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Rationale is required when RAROC is below threshold
              </p>
            )}
          </div>

          {/* Override Reason Field (for critical unvalidated assumptions) */}
          {hasCriticalUnvalidated && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="override-reason">
                  Override Reason{" "}
                  <Badge variant="destructive" className="ml-2">
                    Required
                  </Badge>
                </Label>
                {overrideReason.trim().length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {overrideReason.trim().length} characters
                  </span>
                )}
              </div>
              <Textarea
                id="override-reason"
                placeholder="Explain why you're proceeding with unvalidated critical assumptions..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                className={!overrideReason.trim() ? "border-red-500" : ""}
              />

              {!overrideReason.trim() && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Override reason is required when critical assumptions are not
                  validated
                </p>
              )}
            </div>
          )}

          {/* Validation Summary */}
          {(isStaleRun || isLowRaroc || isNegativeEV) && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="text-sm font-medium">Validation Checklist</div>
              <div className="space-y-1">
                {isStaleRun && (
                  <div className="flex items-center gap-2 text-xs">
                    {confirmStaleRun ? (
                      <CheckCircle2Icon className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircleIcon className="w-4 h-4 text-amber-600" />
                    )}
                    <span
                      className={
                        confirmStaleRun
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      Stale run acknowledged
                    </span>
                  </div>
                )}
                {isLowRaroc && (
                  <div className="flex items-center gap-2 text-xs">
                    {rationale.trim().length > 0 ? (
                      <CheckCircle2Icon className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircleIcon className="w-4 h-4 text-orange-600" />
                    )}
                    <span
                      className={
                        rationale.trim().length > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }
                    >
                      Override rationale provided
                    </span>
                  </div>
                )}
                {isNegativeEV && (
                  <div className="flex items-center gap-2 text-xs">
                    {confirmNegativeEV ? (
                      <CheckCircle2Icon className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircleIcon className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        confirmNegativeEV
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      Negative EV acknowledged
                    </span>
                  </div>
                )}
                {hasCriticalUnvalidated && (
                  <div className="flex items-center gap-2 text-xs">
                    {overrideReason.trim().length > 0 ? (
                      <CheckCircle2Icon className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircleIcon className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        overrideReason.trim().length > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      Critical assumptions override provided
                    </span>
                  </div>
                )}
                {hasInvalidated && (
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangleIcon className="w-4 h-4 text-amber-600" />

                    <span className="text-amber-600 dark:text-amber-400">
                      {invalidatedAssumptions.length} invalidated assumption
                      {invalidatedAssumptions.length === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            <CheckCircle2Icon className="w-4 h-4 mr-2" />
            Confirm Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
