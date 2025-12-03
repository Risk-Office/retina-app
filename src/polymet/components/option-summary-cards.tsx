import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, AlertTriangleIcon } from "lucide-react";
import type { Partner } from "@/polymet/components/option-partners-section";
import {
  computeCreditRiskScore,
  getCreditRiskBadgeColor,
} from "@/polymet/data/credit-risk-utils";
import { getLabel } from "@/polymet/data/terms";
import { GuardrailsDrawer } from "@/polymet/components/guardrails-drawer";
import { OutcomeLogger } from "@/polymet/components/outcome-logger";

interface OptionSummaryCardsProps {
  options: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
    horizonMonths?: number;
    partners?: Partner[];
  }>;
  plainLanguage?: boolean;
  decisionId?: string;
  simulationResults?: Array<{
    optionId: string;
    var95: number;
    raroc: number;
    ev: number;
  }>;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function OptionSummaryCards({
  options,
  plainLanguage = true,
  decisionId,
  simulationResults,
  onAuditEvent,
}: OptionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {options.map((option) => {
        const creditRisk = computeCreditRiskScore(option.partners, options);
        const hasPartners = option.partners && option.partners.length > 0;

        return (
          <Card key={option.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{option.label}</CardTitle>
                {hasPartners && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={`${getCreditRiskBadgeColor(creditRisk.level)} shrink-0`}
                        >
                          {creditRisk.level}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          <div className="font-semibold">
                            {getLabel("creditRiskScore", {
                              plain: plainLanguage,
                            })}
                          </div>
                          <div className="text-xs space-y-1">
                            <div>
                              Risk Score:{" "}
                              <strong>{creditRisk.score}/100</strong>
                            </div>
                            <div>
                              Total Exposure:{" "}
                              <strong>
                                ${creditRisk.totalExposure.toLocaleString()}
                              </strong>
                            </div>
                            <div>
                              Avg Dependency:{" "}
                              <strong>
                                {creditRisk.averageDependency.toFixed(2)}
                              </strong>
                            </div>
                            <div className="pt-1 border-t border-border">
                              {option.partners?.length || 0} partner
                              {option.partners?.length !== 1 ? "s" : ""} linked
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Financial Metrics */}
              <div className="space-y-2 text-sm">
                {option.expectedReturn !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Expected Return:
                    </span>
                    <span className="font-medium">
                      ${option.expectedReturn.toLocaleString()}
                    </span>
                  </div>
                )}
                {option.cost !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium">
                      ${option.cost.toLocaleString()}
                    </span>
                  </div>
                )}
                {option.mitigationCost !== undefined &&
                  option.mitigationCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Mitigation Cost:
                      </span>
                      <span className="font-medium">
                        ${option.mitigationCost.toLocaleString()}
                      </span>
                    </div>
                  )}
                {option.horizonMonths !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Window:</span>
                    <span className="font-medium">
                      {option.horizonMonths} months
                    </span>
                  </div>
                )}
              </div>

              {/* Partner Summary */}
              {hasPartners && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <InfoIcon className="w-3 h-3" />

                    <span>
                      {option.partners?.length || 0} partner
                      {option.partners?.length !== 1 ? "s" : ""} linked
                    </span>
                  </div>
                  {creditRisk.level === "High" && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 mt-2">
                      <AlertTriangleIcon className="w-3 h-3" />

                      <span>High credit link risk</span>
                    </div>
                  )}
                </div>
              )}

              {/* Guardrails and Outcome Logger */}
              {decisionId && onAuditEvent && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex gap-2">
                    <GuardrailsDrawer
                      decisionId={decisionId}
                      optionId={option.id}
                      optionLabel={option.label}
                      currentMetrics={{
                        var95: simulationResults?.find(
                          (r) => r.optionId === option.id
                        )?.var95,
                        raroc: simulationResults?.find(
                          (r) => r.optionId === option.id
                        )?.raroc,
                        ev: simulationResults?.find(
                          (r) => r.optionId === option.id
                        )?.ev,
                        creditRiskScore: creditRisk.score,
                      }}
                      onAuditEvent={onAuditEvent}
                    />

                    <OutcomeLogger
                      decisionId={decisionId}
                      optionId={option.id}
                      optionLabel={option.label}
                      onAuditEvent={onAuditEvent}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
