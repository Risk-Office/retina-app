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
  ShieldAlertIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Guardrail } from "@/polymet/data/decision-guardrails";
import type { GuardrailViolation } from "@/polymet/data/guardrail-violations";
import {
  loadAdjustmentRecords,
  type AutoAdjustmentRecord,
} from "@/polymet/data/guardrail-auto-adjust";

interface GuardrailsSummarySectionProps {
  guardrails: Guardrail[];
  violations: GuardrailViolation[];
  plainLanguage?: boolean;
  decisionId?: string;
}

export function GuardrailsSummarySection({
  guardrails,
  violations,
  plainLanguage = false,
  decisionId,
}: GuardrailsSummarySectionProps) {
  const activeViolations = violations.filter((v) => !v.resolvedAt);
  const criticalViolations = activeViolations.filter(
    (v) => v.alertLevel === "critical"
  );
  const cautionViolations = activeViolations.filter(
    (v) => v.alertLevel === "caution"
  );

  // Load auto-adjustment records
  const adjustments = decisionId ? loadAdjustmentRecords(decisionId) : [];
  const recentAdjustments = adjustments.slice(-3).reverse(); // Show last 3 adjustments

  // Group guardrails by option
  const guardrailsByOption = guardrails.reduce(
    (acc, g) => {
      if (!acc[g.optionId]) {
        acc[g.optionId] = [];
      }
      acc[g.optionId].push(g);
      return acc;
    },
    {} as Record<string, Guardrail[]>
  );

  // Group violations by option
  const violationsByOption = activeViolations.reduce(
    (acc, v) => {
      if (!acc[v.optionId]) {
        acc[v.optionId] = [];
      }
      acc[v.optionId].push(v);
      return acc;
    },
    {} as Record<string, GuardrailViolation[]>
  );

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "caution":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      case "caution":
        return "outline";
      case "info":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlertIcon className="w-5 h-5 text-primary" />

          <CardTitle className="text-base">
            {plainLanguage ? "Risk Limits & Alerts" : "Guardrails Summary"}
          </CardTitle>
        </div>
        <CardDescription>
          {guardrails.length > 0
            ? `${guardrails.length} guardrails configured | ${activeViolations.length} active violations`
            : "No guardrails configured"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Violations Overview */}
        {activeViolations.length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
            <div className="flex items-center gap-2 font-semibold text-destructive">
              <AlertTriangleIcon className="w-5 h-5" />
              {activeViolations.length} Active Violation
              {activeViolations.length > 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  Critical
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {criticalViolations.length}
                </div>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  Caution
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {cautionViolations.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Violations */}
        {guardrails.length > 0 && activeViolations.length === 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircleIcon className="w-5 h-5" />

              <span className="font-semibold">
                All guardrails within acceptable ranges
              </span>
            </div>
          </div>
        )}

        {/* Guardrails by Option */}
        {Object.entries(guardrailsByOption).map(
          ([optionId, optionGuardrails]) => {
            const optionViolations = violationsByOption[optionId] || [];
            const optionLabel =
              optionViolations[0]?.optionLabel || `Option ${optionId}`;

            return (
              <div key={optionId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{optionLabel}</h4>
                  {optionViolations.length > 0 && (
                    <Badge variant="destructive">
                      {optionViolations.length} violation
                      {optionViolations.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {optionGuardrails.map((guardrail) => {
                    const violation = optionViolations.find(
                      (v) => v.guardrailId === guardrail.id
                    );
                    const isViolated = !!violation;

                    return (
                      <div
                        key={guardrail.id}
                        className={`p-3 border rounded-lg ${
                          isViolated
                            ? "border-destructive bg-destructive/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {guardrail.metricName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Must be {guardrail.direction}{" "}
                              <span className="font-medium">
                                {guardrail.thresholdValue.toLocaleString()}
                              </span>
                            </div>
                            {isViolated && violation && (
                              <div className="text-xs text-destructive font-medium mt-1">
                                ⚠ Current:{" "}
                                {violation.actualValue.toLocaleString()}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={
                              getAlertLevelBadge(guardrail.alertLevel) as any
                            }
                          >
                            {guardrail.alertLevel}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}

        {/* No Guardrails Message */}
        {guardrails.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <ShieldAlertIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No guardrails configured for this decision
            </p>
            <p className="text-xs text-muted-foreground">
              Consider setting up guardrails to monitor key risk metrics
            </p>
          </div>
        )}

        {/* Auto-Adjustments */}
        {adjustments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <TrendingUpIcon className="w-4 h-4" />

              {plainLanguage
                ? "Automatic Limit Adjustments"
                : "Auto-Adjustments"}
            </div>
            <div className="space-y-2">
              {recentAdjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-blue-900 dark:text-blue-100">
                        {adjustment.metricName}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Threshold: {adjustment.oldThreshold.toFixed(2)} →{" "}
                        {adjustment.newThreshold.toFixed(2)} (
                        {adjustment.adjustmentPercent}% tighter)
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {plainLanguage
                          ? "Learned from repeated problems and made limits stricter"
                          : adjustment.reason}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-blue-300 dark:border-blue-700"
                    >
                      Auto
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Narrative */}
        {guardrails.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {activeViolations.length > 0
                ? `We have ${activeViolations.length} active guardrail violation${activeViolations.length > 1 ? "s" : ""} that require attention. ${criticalViolations.length > 0 ? `${criticalViolations.length} critical violation${criticalViolations.length > 1 ? "s" : ""} require${criticalViolations.length === 1 ? "s" : ""} immediate action.` : ""} These violations indicate that certain metrics have crossed predefined thresholds and should be reviewed to ensure risk remains within acceptable levels.`
                : `All ${guardrails.length} configured guardrails are within acceptable ranges. This indicates that the decision's risk profile aligns with our predefined risk tolerance levels. We recommend continuing to monitor these metrics as the decision progresses.`}
              {adjustments.length > 0 &&
                ` The system has automatically adjusted ${adjustments.length} guardrail${adjustments.length > 1 ? "s" : ""} based on repeated breaches, tightening thresholds to better protect against future risks.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
