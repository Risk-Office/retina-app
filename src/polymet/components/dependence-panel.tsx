import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, AlertCircleIcon } from "lucide-react";
import type {
  ScenarioVar,
  DependenceConfig,
} from "@/polymet/data/scenario-engine";

interface DependencePanelProps {
  scenarioVars: ScenarioVar[];
  onConfigChange: (config: DependenceConfig | undefined) => void;
  achievedSpearman?: number;
  onAuditEvent: (eventType: string, payload: any) => void;
  runs: number;
  onToast?: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

export function DependencePanel({
  scenarioVars,
  onConfigChange,
  achievedSpearman,
  onAuditEvent,
  runs,
  onToast,
}: DependencePanelProps) {
  const [varAId, setVarAId] = useState<string>("");
  const [varBId, setVarBId] = useState<string>("");
  const [targetRho, setTargetRho] = useState<number>(0.4);

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = "retina:dependence:config";
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setVarAId(config.varAId || "");
        setVarBId(config.varBId || "");
        setTargetRho(config.targetRho ?? 0.4);
      } catch (error) {
        console.error("Failed to load dependence config:", error);
      }
    }
  }, []);

  // Check if runs are sufficient
  const hasInsufficientRuns = runs < 50;
  const hasSameVarSelected = varAId && varBId && varAId === varBId;

  // Save to localStorage and notify parent
  useEffect(() => {
    const storageKey = "retina:dependence:config";

    // Guardrail: Disable if runs < 50
    if (hasInsufficientRuns && varAId && varBId && varAId !== varBId) {
      if (onToast) {
        onToast({
          title: "Increase runs to enable dependence",
          description: `At least 50 runs required for dependence linking (current: ${runs})`,
          variant: "destructive",
        });
      }
      localStorage.removeItem(storageKey);
      onConfigChange(undefined);
      return;
    }

    if (varAId && varBId && varAId !== varBId && !hasInsufficientRuns) {
      const config: DependenceConfig = {
        varAId,
        varBId,
        targetRho,
      };

      localStorage.setItem(storageKey, JSON.stringify(config));
      onConfigChange(config);

      // Add audit event
      onAuditEvent("dependence.updated", {
        varA: scenarioVars.find((v) => v.id === varAId)?.name,
        varB: scenarioVars.find((v) => v.id === varBId)?.name,
        rhoTarget: targetRho,
        rhoAchieved: achievedSpearman,
      });
    } else {
      localStorage.removeItem(storageKey);
      onConfigChange(undefined);
    }
  }, [
    varAId,
    varBId,
    targetRho,
    scenarioVars,
    onConfigChange,
    onAuditEvent,
    achievedSpearman,
  ]);

  // Get available variables for Var B (exclude Var A)
  const availableVarsForB = scenarioVars.filter((v) => v.id !== varAId);

  // Reset Var B if it becomes invalid
  useEffect(() => {
    if (varBId && varBId === varAId) {
      setVarBId("");
    }
  }, [varAId, varBId]);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <InfoIcon className="w-4 h-4 text-primary" />
          Dependence (Rank Correlation)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          Lightweight dependence via rank reordering (approximate Spearman ρ).
        </div>

        {/* Inline error for same variable selected */}
        {hasSameVarSelected && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 text-destructive mt-0.5 shrink-0" />

            <div className="text-xs text-destructive">
              <div className="font-medium">Cannot link same variable</div>
              <div>Variable A and Variable B must be different</div>
            </div>
          </div>
        )}

        {/* Inline warning for insufficient runs */}
        {hasInsufficientRuns && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />

            <div className="text-xs text-amber-700 dark:text-amber-400">
              <div className="font-medium">
                Insufficient runs for dependence
              </div>
              <div>At least 50 runs required (current: {runs})</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Variable A</Label>
            <Select
              value={varAId || undefined}
              onValueChange={(value) => setVarAId(value)}
              disabled={hasInsufficientRuns}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Var A" />
              </SelectTrigger>
              <SelectContent>
                {scenarioVars.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Variable B</Label>
            <Select
              value={varBId || undefined}
              onValueChange={(value) => setVarBId(value)}
              disabled={
                !varAId || availableVarsForB.length === 0 || hasInsufficientRuns
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Var B" />
              </SelectTrigger>
              <SelectContent>
                {availableVarsForB.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Target rank correlation (ρ)
            </Label>
            <Badge variant="outline" className="font-mono text-xs">
              {targetRho.toFixed(2)}
            </Badge>
          </div>
          <Slider
            value={[targetRho]}
            onValueChange={(values) => setTargetRho(values[0])}
            min={-0.9}
            max={0.9}
            step={0.1}
            disabled={
              !varAId || !varBId || hasInsufficientRuns || hasSameVarSelected
            }
            className="py-2"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-0.9</span>
            <span>0</span>
            <span>0.9</span>
          </div>
        </div>

        {achievedSpearman !== undefined && varAId && varBId && (
          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Achieved ρₛ</span>
              <Badge
                variant={
                  Math.abs(achievedSpearman - targetRho) < 0.15
                    ? "default"
                    : "secondary"
                }
                className="font-mono"
              >
                ≈ {achievedSpearman.toFixed(2)}
              </Badge>
            </div>

            {/* Heatmap Widget */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground text-center">
                Approx Spearman rank correlation
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {/* Header row */}
                <div className="h-8 flex items-center justify-center font-medium text-muted-foreground"></div>
                <div className="h-8 flex items-center justify-center font-medium text-muted-foreground">
                  {scenarioVars.find((v) => v.id === varBId)?.name || "Var B"}
                </div>
                <div className="h-8"></div>

                {/* Data row */}
                <div className="h-8 flex items-center justify-center font-medium text-muted-foreground">
                  {scenarioVars.find((v) => v.id === varAId)?.name || "Var A"}
                </div>
                <div
                  className={`h-8 flex items-center justify-center font-mono font-semibold rounded border border-border ${
                    achievedSpearman > 0.4
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : achievedSpearman < -0.4
                        ? "bg-red-500/20 text-red-700 dark:text-red-400"
                        : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {achievedSpearman.toFixed(2)}
                </div>
                <div className="h-8"></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
