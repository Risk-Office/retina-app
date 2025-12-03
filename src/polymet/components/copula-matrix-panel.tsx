import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  InfoIcon,
  AlertCircleIcon,
  FlaskConicalIcon,
  CheckCircle2Icon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ScenarioVar } from "@/polymet/data/scenario-engine";

export interface CopulaMatrixConfig {
  k: number;
  matrix: number[][]; // k×k symmetric matrix
  useNearestPD: boolean;
}

interface CopulaMatrixPanelProps {
  scenarioVars: ScenarioVar[];
  onConfigChange: (config: CopulaMatrixConfig | undefined) => void;
  achievedMatrix?: number[][];
  frobeniusError?: number;
  onAuditEvent: (eventType: string, payload: any) => void;
  runs: number;
  onToast?: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

export function CopulaMatrixPanel({
  scenarioVars,
  onConfigChange,
  achievedMatrix,
  frobeniusError,
  onAuditEvent,
  runs,
  onToast,
}: CopulaMatrixPanelProps) {
  const k = scenarioVars.length;
  const [matrix, setMatrix] = useState<number[][]>(() =>
    createIdentityMatrix(k)
  );
  const [useNearestPD, setUseNearestPD] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPSD, setIsPSD] = useState(true);

  // Create identity matrix
  function createIdentityMatrix(size: number): number[][] {
    const m: number[][] = [];
    for (let i = 0; i < size; i++) {
      m[i] = [];
      for (let j = 0; j < size; j++) {
        m[i][j] = i === j ? 1.0 : 0.0;
      }
    }
    return m;
  }

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = "retina:copula:config";
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.k === k) {
          setMatrix(config.matrix);
          setUseNearestPD(config.useNearestPD ?? false);
          setIsEnabled(true);
        }
      } catch (error) {
        console.error("Failed to load copula config:", error);
      }
    }
  }, [k]);

  // Reset matrix when k changes (auto-resize and clear off-diagonals)
  useEffect(() => {
    const newMatrix = createIdentityMatrix(k);
    setMatrix(newMatrix);
    setIsEnabled(false);
    setIsPSD(true);

    // Clear localStorage if k changed
    const storageKey = "retina:copula:config";
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.k !== k) {
          localStorage.removeItem(storageKey);
          onConfigChange(undefined);
        }
      } catch (error) {
        console.error("Failed to check copula config:", error);
      }
    }
  }, [k, onConfigChange]);

  // Check if runs are sufficient
  const hasInsufficientRuns = runs < 500;

  // Check if matrix is positive semi-definite (simplified check)
  const checkPSD = (m: number[][]): boolean => {
    // For a correlation matrix, check if all eigenvalues are non-negative
    // Simplified: check if diagonal is 1 and off-diagonal values are in [-1, 1]
    // A more robust check would compute eigenvalues, but this is a heuristic
    for (let i = 0; i < m.length; i++) {
      if (Math.abs(m[i][i] - 1.0) > 0.01) return false;
      for (let j = 0; j < m.length; j++) {
        if (i !== j && Math.abs(m[i][j]) > 0.99) return false;
      }
    }
    // Additional check: for 2x2, det >= 0
    if (m.length === 2) {
      const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
      return det >= -0.001;
    }
    return true; // Assume PSD for larger matrices (will be checked in simulation)
  };

  // Update PSD status when matrix changes
  useEffect(() => {
    setIsPSD(checkPSD(matrix));
  }, [matrix]);

  // Update cell value (upper triangle only, mirror to lower)
  const updateCell = (i: number, j: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    // Clamp to [-0.90, 0.90]
    const clamped = Math.max(-0.9, Math.min(0.9, numValue));

    const newMatrix = matrix.map((row) => [...row]);
    newMatrix[i][j] = clamped;
    newMatrix[j][i] = clamped; // Mirror to lower triangle
    setMatrix(newMatrix);
  };

  // Handle impose dependence
  const handleImposeDependence = () => {
    if (hasInsufficientRuns) {
      if (onToast) {
        onToast({
          title: "Insufficient runs",
          description: "Increase runs to ≥ 500 for stable ranks",
          variant: "destructive",
        });
      }
      return;
    }

    setIsEnabled(true);

    // Count edited pairs (non-zero off-diagonal)
    let editedPairs = 0;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        if (Math.abs(matrix[i][j]) > 0.01) {
          editedPairs++;
        }
      }
    }

    // Save to localStorage
    const config: CopulaMatrixConfig = {
      k,
      matrix,
      useNearestPD,
    };
    localStorage.setItem("retina:copula:config", JSON.stringify(config));
    onConfigChange(config);

    // Add audit event
    onAuditEvent("copula.matrix.updated", {
      k,
      editedPairs,
      nearestPD: useNearestPD,
    });

    if (onToast) {
      onToast({
        title: "Copula matrix imposed",
        description: `${k}×${k} matrix with ${editedPairs} edited pair(s)${useNearestPD ? " (nearest PD enabled)" : ""}`,
      });
    }
  };

  // Handle clear
  const handleClear = () => {
    setMatrix(createIdentityMatrix(k));
    setIsEnabled(false);
    localStorage.removeItem("retina:copula:config");
    onConfigChange(undefined);

    if (onToast) {
      onToast({
        title: "Copula matrix cleared",
        description: "Reset to identity matrix",
      });
    }
  };

  // Get color for correlation value
  const getCorrelationColor = (value: number): string => {
    if (value > 0.4) {
      return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
    } else if (value < -0.4) {
      return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
    } else if (Math.abs(value) > 0.1) {
      return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
    } else {
      return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConicalIcon className="w-4 h-4 text-primary" />
          Copula Matrix (beta)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          Full k×k rank correlation matrix with Iman-Conover reordering. Edit
          upper triangle; diagonal locked to 1.00.
        </div>

        {/* Insufficient runs warning */}
        {hasInsufficientRuns && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />

            <div className="text-xs text-amber-700 dark:text-amber-400">
              <div className="font-medium">Insufficient runs for copula</div>
              <div>At least 500 runs required (current: {runs})</div>
            </div>
          </div>
        )}

        {/* Non-PSD blocking banner */}
        {!isPSD && !useNearestPD && !hasInsufficientRuns && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />

            <div className="text-xs text-red-700 dark:text-red-400">
              <div className="font-medium">
                Matrix not positive semi-definite
              </div>
              <div>Fix matrix values or enable "Nearest PD" to proceed</div>
            </div>
          </div>
        )}

        {/* Readouts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Variables</div>
            <Badge variant="outline" className="font-mono">
              k = {k}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Target</div>
            <Badge variant="outline" className="text-xs">
              Spearman ρ
            </Badge>
          </div>
        </div>

        {/* Nearest PD toggle */}
        <div className="flex items-center justify-between p-3 border border-border rounded-md">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Nearest PD</Label>
            <div className="text-xs text-muted-foreground">
              Project to nearest positive semi-definite matrix if Cholesky fails
            </div>
          </div>
          <Switch
            checked={useNearestPD}
            onCheckedChange={setUseNearestPD}
            disabled={hasInsufficientRuns}
          />
        </div>

        {/* Matrix Grid Editor */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Correlation Matrix ({k}×{k})
          </Label>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `auto repeat(${k}, 1fr)` }}
              >
                {/* Header row */}
                <div className="h-8" />

                {scenarioVars.map((v, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground truncate px-1">
                          {v.name.substring(0, 8)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{v.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}

                {/* Matrix rows */}
                {scenarioVars.map((rowVar, i) => (
                  <React.Fragment key={i}>
                    {/* Row label */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-8 flex items-center justify-end text-xs font-medium text-muted-foreground pr-2 truncate">
                            {rowVar.name.substring(0, 8)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{rowVar.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Matrix cells */}
                    {scenarioVars.map((colVar, j) => {
                      const isDiagonal = i === j;
                      const isUpperTriangle = i < j;
                      const value = matrix[i][j];

                      if (isDiagonal) {
                        // Diagonal: locked to 1.00
                        return (
                          <div
                            key={j}
                            className="h-8 flex items-center justify-center bg-primary/10 border border-primary/30 rounded text-xs font-mono font-semibold"
                          >
                            1.00
                          </div>
                        );
                      } else if (isUpperTriangle) {
                        // Upper triangle: editable (only if vars exist)
                        return (
                          <TooltipProvider key={j}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="-0.9"
                                  max="0.9"
                                  value={value.toFixed(2)}
                                  onChange={(e) =>
                                    updateCell(i, j, e.target.value)
                                  }
                                  disabled={
                                    hasInsufficientRuns ||
                                    i >= scenarioVars.length ||
                                    j >= scenarioVars.length
                                  }
                                  className="h-8 text-xs font-mono text-center p-0"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {rowVar.name} ↔ {colVar.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Target: {value.toFixed(2)}
                                  {achievedMatrix && (
                                    <>
                                      {" "}
                                      | Achieved:{" "}
                                      {achievedMatrix[i][j].toFixed(2)}
                                    </>
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      } else {
                        // Lower triangle: mirrored (read-only)
                        return (
                          <TooltipProvider key={j}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-8 flex items-center justify-center bg-muted/50 border border-border rounded text-xs font-mono text-muted-foreground">
                                  {value.toFixed(2)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {rowVar.name} ↔ {colVar.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Mirrored from upper triangle
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      }
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleImposeDependence}
            disabled={hasInsufficientRuns || k < 2 || (!isPSD && !useNearestPD)}
            className="flex-1"
          >
            {isEnabled ? (
              <>
                <CheckCircle2Icon className="w-4 h-4 mr-2" />
                Update Dependence
              </>
            ) : (
              "Impose Dependence"
            )}
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        </div>

        {/* Achieved results */}
        {isEnabled && achievedMatrix && frobeniusError !== undefined && (
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Achieved ρₛ error (Frobenius)
              </span>
              <Badge
                variant={frobeniusError < 0.2 ? "default" : "secondary"}
                className="font-mono"
              >
                {frobeniusError.toFixed(3)}
              </Badge>
            </div>

            {/* Achieved Matrix Heatmap */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Achieved Spearman Matrix
              </Label>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `auto repeat(${k}, 1fr)` }}
                  >
                    {/* Header row */}
                    <div className="h-8" />

                    {scenarioVars.map((v, idx) => (
                      <div
                        key={idx}
                        className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground truncate px-1"
                      >
                        {v.name.substring(0, 8)}
                      </div>
                    ))}

                    {/* Matrix rows */}
                    {scenarioVars.map((rowVar, i) => (
                      <React.Fragment key={i}>
                        {/* Row label */}
                        <div className="h-8 flex items-center justify-end text-xs font-medium text-muted-foreground pr-2 truncate">
                          {rowVar.name.substring(0, 8)}
                        </div>

                        {/* Matrix cells */}
                        {scenarioVars.map((colVar, j) => {
                          const achievedValue = achievedMatrix[i][j];
                          const targetValue = matrix[i][j];
                          const isDiagonal = i === j;

                          return (
                            <TooltipProvider key={j}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`h-8 flex items-center justify-center text-xs font-mono font-semibold rounded border ${
                                      isDiagonal
                                        ? "bg-primary/10 border-primary/30"
                                        : getCorrelationColor(achievedValue)
                                    }`}
                                  >
                                    {achievedValue.toFixed(2)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {rowVar.name} ↔ {colVar.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Target: {targetValue.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Achieved: {achievedValue.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Error:{" "}
                                    {Math.abs(
                                      achievedValue - targetValue
                                    ).toFixed(3)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
