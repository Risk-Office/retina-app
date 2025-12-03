import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, AlertTriangleIcon } from "lucide-react";
import type { ScenarioVar } from "@/polymet/data/scenario-engine";

export interface BayesianPriorConfig {
  targetVarId: string;
  priorMean: number;
  priorSd: number;
  evidenceMean: number;
  evidenceN: number;
  likelihoodSd: number;
  applyPosterior: boolean;
  posteriorMean: number;
  posteriorSd: number;
}

interface BayesianPriorPanelProps {
  scenarioVars: ScenarioVar[];
  onConfigChange: (config: BayesianPriorConfig | undefined) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
  onToast?: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

export function BayesianPriorPanel({
  scenarioVars,
  onConfigChange,
  onAuditEvent,
  onToast,
}: BayesianPriorPanelProps) {
  const [targetVarId, setTargetVarId] = useState<string>("");
  const [priorMean, setPriorMean] = useState<number>(0.0);
  const [priorSd, setPriorSd] = useState<number>(0.2);
  const [evidenceMean, setEvidenceMean] = useState<number>(0.0);
  const [evidenceN, setEvidenceN] = useState<number>(20);
  const [likelihoodSd, setLikelihoodSd] = useState<number>(0.25);
  const [applyPosterior, setApplyPosterior] = useState<boolean>(false);

  // Filter variables that support Bayesian prior (normal or lognormal)
  const supportedVars = scenarioVars.filter(
    (v) => v.dist === "normal" || v.dist === "lognormal"
  );

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = "retina:bayesian:config";
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setTargetVarId(config.targetVarId || "");
        setPriorMean(config.priorMean ?? 0.0);
        setPriorSd(config.priorSd ?? 0.2);
        setEvidenceMean(config.evidenceMean ?? 0.0);
        setEvidenceN(config.evidenceN ?? 20);
        setLikelihoodSd(config.likelihoodSd ?? 0.25);
        setApplyPosterior(config.applyPosterior ?? false);
      } catch (error) {
        console.error("Failed to load Bayesian config:", error);
      }
    }
  }, []);

  // Compute posterior using conjugate Normal-Normal
  const computePosterior = () => {
    // Prior variance
    const tau0Sq = priorSd * priorSd;

    // Likelihood variance
    const sigmaLSq = likelihoodSd * likelihoodSd;

    // Posterior variance: τn² = 1 / (1/τ0² + n/σL²)
    const posteriorVariance = 1 / (1 / tau0Sq + evidenceN / sigmaLSq);

    // Posterior mean: μn = τn² * (μ0/τ0² + n*x̄/σL²)
    const posteriorMean =
      posteriorVariance *
      (priorMean / tau0Sq + (evidenceN * evidenceMean) / sigmaLSq);

    // Posterior standard deviation
    const posteriorSd = Math.sqrt(posteriorVariance);

    return { posteriorMean, posteriorSd };
  };

  const { posteriorMean, posteriorSd } = computePosterior();

  // Save to localStorage and notify parent
  useEffect(() => {
    const storageKey = "retina:bayesian:config";

    if (targetVarId && applyPosterior) {
      const targetVar = scenarioVars.find((v) => v.id === targetVarId);

      // Guardrail: Check if variable is normal or lognormal
      if (
        targetVar &&
        targetVar.dist !== "normal" &&
        targetVar.dist !== "lognormal"
      ) {
        if (onToast) {
          onToast({
            title: "Bayesian prior not applicable",
            description: `Variable "${targetVar.name}" is ${targetVar.dist}. Bayesian prior only works with normal or lognormal distributions.`,
            variant: "destructive",
          });
        }
        // Ignore the apply request (no-op)
        onConfigChange(undefined);
        return;
      }

      const config: BayesianPriorConfig = {
        targetVarId,
        priorMean,
        priorSd,
        evidenceMean,
        evidenceN,
        likelihoodSd,
        applyPosterior,
        posteriorMean,
        posteriorSd,
      };

      localStorage.setItem(storageKey, JSON.stringify(config));
      onConfigChange(config);

      // Add audit event when applied
      onAuditEvent("bayes.prior.applied", {
        varKey: targetVar?.name,
        dist: targetVar?.dist,
        mu0: priorMean,
        sigma0: priorSd,
        xbar: evidenceMean,
        n: evidenceN,
        sigmaL: likelihoodSd,
        muN: posteriorMean,
        sigmaN: posteriorSd,
      });
    } else {
      if (targetVarId) {
        // Save config even if not applied
        const config: BayesianPriorConfig = {
          targetVarId,
          priorMean,
          priorSd,
          evidenceMean,
          evidenceN,
          likelihoodSd,
          applyPosterior,
          posteriorMean,
          posteriorSd,
        };
        localStorage.setItem(storageKey, JSON.stringify(config));
      } else {
        localStorage.removeItem(storageKey);
      }
      onConfigChange(undefined);
    }
  }, [
    targetVarId,
    priorMean,
    priorSd,
    evidenceMean,
    evidenceN,
    likelihoodSd,
    applyPosterior,
    posteriorMean,
    posteriorSd,
    scenarioVars,
    onConfigChange,
    onAuditEvent,
  ]);

  const targetVar = scenarioVars.find((v) => v.id === targetVarId);
  const isLogspace = targetVar?.dist === "lognormal";

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <InfoIcon className="w-4 h-4 text-primary" />
          Bayesian Prior (Conjugate Normal)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          Conjugate Normal–Normal updating. Works with normal or lognormal
          distributions{isLogspace && " (log-space)"}.
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Target Variable
          </Label>
          <Select
            value={targetVarId || undefined}
            onValueChange={(value) => setTargetVarId(value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent>
              {supportedVars.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">
                  No normal/lognormal variables
                </div>
              ) : (
                supportedVars.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.dist})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {targetVarId && (
          <>
            {/* Warning if selected variable is not normal/lognormal */}
            {(() => {
              const targetVar = scenarioVars.find((v) => v.id === targetVarId);
              const isUnsupported =
                targetVar &&
                targetVar.dist !== "normal" &&
                targetVar.dist !== "lognormal";

              if (isUnsupported && applyPosterior) {
                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
                    <AlertTriangleIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />

                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      <div className="font-medium">
                        Bayesian prior not applicable
                      </div>
                      <div>
                        Variable "{targetVar.name}" is {targetVar.dist}.
                        Bayesian prior only works with normal or lognormal
                        distributions.
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Prior mean μ₀{isLogspace && " (log)"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priorMean}
                  onChange={(e) =>
                    setPriorMean(parseFloat(e.target.value) || 0)
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Prior sd σ₀{isLogspace && " (log)"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={priorSd}
                  onChange={(e) =>
                    setPriorSd(
                      Math.max(0.01, parseFloat(e.target.value) || 0.2)
                    )
                  }
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Evidence mean x̄{isLogspace && " (log)"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={evidenceMean}
                  onChange={(e) =>
                    setEvidenceMean(parseFloat(e.target.value) || 0)
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Evidence n
                </Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={evidenceN}
                  onChange={(e) =>
                    setEvidenceN(Math.max(1, parseInt(e.target.value) || 20))
                  }
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Likelihood sd σₗ{isLogspace && " (log)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={likelihoodSd}
                onChange={(e) =>
                  setLikelihoodSd(
                    Math.max(0.01, parseFloat(e.target.value) || 0.25)
                  )
                }
                className="h-9"
              />
            </div>

            <div className="pt-3 border-t border-border space-y-3">
              <div className="bg-primary/5 p-3 rounded-md space-y-1">
                <div className="text-xs font-medium text-primary">
                  Posterior Distribution:
                </div>
                <div className="text-sm font-mono">
                  μₙ = {posteriorMean.toFixed(4)}
                  {isLogspace && " (log)"}
                </div>
                <div className="text-sm font-mono">
                  σₙ = {posteriorSd.toFixed(4)}
                  {isLogspace && " (log)"}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-posterior"
                  checked={applyPosterior}
                  onCheckedChange={(checked) =>
                    setApplyPosterior(checked === true)
                  }
                />

                <Label
                  htmlFor="apply-posterior"
                  className="text-sm font-medium cursor-pointer"
                >
                  Apply posterior to simulation
                </Label>
              </div>

              {applyPosterior && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Posterior parameters will be used in simulation
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
