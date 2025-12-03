import React, { useState } from "react";
import { Friendly, FriendlyLabel } from "@/polymet/components/friendly-term";
import { useTenant } from "@/polymet/data/tenant-context";
import { usePlainLanguage } from "@/polymet/data/tenant-settings";
import { getLabel } from "@/polymet/data/terms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RAROCBarChart } from "@/polymet/components/raroc-bar-chart";
import { OutcomeHistogram } from "@/polymet/components/outcome-histogram";
import { RecommendationEngine } from "@/polymet/components/recommendation-engine";
import { UtilityCurveChart } from "@/polymet/components/utility-curve-chart";
import { StressTestPanel } from "@/polymet/components/stress-test-panel";
import { SensitivityTornado } from "@/polymet/components/sensitivity-tornado";
import { BaselinePlanComparison } from "@/polymet/components/baseline-plan-comparison";
import { InfoIcon } from "lucide-react";
import type {
  SimulationResult,
  UtilityParams,
  ScenarioVar,
  TCORParams,
  GameInteractionConfig,
  OptionGameStrategy,
  DependenceConfig,
  BayesianPriorOverride,
  CopulaMatrixConfig,
} from "@/polymet/data/scenario-engine";
import type {
  RAROCThresholds,
  UtilitySettings,
} from "@/polymet/data/tenant-settings";
import { getRAROCBadgeColor } from "@/polymet/data/tenant-settings";

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

interface MetricsSectionProps {
  simulationResults: SimulationResult[];
  thresholds: RAROCThresholds;
  utilitySettings?: UtilitySettings;
  horizonMonths: number;
  onHorizonChange: (horizonMonths: number) => void;
  keyAssumptions?: any[];
  baselineComparison?: BaselineComparison;
  onApplyRecommendation?: (
    optionId: string,
    rationale: string,
    isOverride: boolean
  ) => void;
  onToast?: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
  // Stress test props
  options?: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
  }>;
  scenarioVars?: ScenarioVar[];
  seed?: number;
  runs?: number;
  runId?: string;
  tcorParams?: TCORParams;
  gameConfig?: GameInteractionConfig;
  optionStrategies?: OptionGameStrategy[];
  dependenceConfig?: DependenceConfig;
  bayesianOverride?: BayesianPriorOverride;
  copulaConfig?: CopulaMatrixConfig;
  onAuditEvent?: (eventType: string, payload: any) => void;
  onStressPresetChange?: (preset: string | null) => void;
  decisionId?: string;
  onTopFactorsChange?: (
    factors: Array<{ paramName: string; impact: number }>
  ) => void;
}

const HORIZON_OPTIONS = [3, 6, 12, 24];

export function MetricsSection({
  simulationResults,
  thresholds,
  utilitySettings,
  horizonMonths,
  onHorizonChange,
  keyAssumptions,
  baselineComparison,
  onApplyRecommendation,
  onToast,
  options,
  scenarioVars,
  seed,
  runs,
  runId,
  tcorParams,
  gameConfig,
  optionStrategies,
  dependenceConfig,
  bayesianOverride,
  copulaConfig,
  onAuditEvent,
  onStressPresetChange,
  decisionId,
  onTopFactorsChange,
}: MetricsSectionProps) {
  // Try to get tenant context, but provide fallback if not available
  let tenantId = "default";
  let plainLanguage = true;

  try {
    const { tenant } = useTenant();
    tenantId = tenant?.tenantId || "default";
    const { enabled } = usePlainLanguage(tenantId);
    plainLanguage = enabled ?? true;
  } catch (error) {
    // Not in TenantProvider context, use defaults
    console.debug(
      "MetricsSection: Not in TenantProvider context, using defaults"
    );
  }
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const selectedResult = simulationResults.find(
    (r) => r.optionId === selectedOptionId
  );

  // Check if utility metrics are available
  const hasUtilityMetrics = simulationResults.some(
    (r) =>
      r.expectedUtility !== undefined && r.certaintyEquivalent !== undefined
  );

  // Check if TCOR metrics are available
  const hasTCORMetrics = simulationResults.some((r) => r.tcor !== undefined);

  // Sort results
  const sortedResults = React.useMemo(() => {
    if (!sortColumn) return simulationResults;

    return [...simulationResults].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortColumn) {
        case "raroc":
          aVal = a.raroc;
          bVal = b.raroc;
          break;
        case "ev":
          aVal = a.ev;
          bVal = b.ev;
          break;
        case "var95":
          aVal = a.var95;
          bVal = b.var95;
          break;
        case "cvar95":
          aVal = a.cvar95;
          bVal = b.cvar95;
          break;
        case "economicCapital":
          aVal = a.economicCapital;
          bVal = b.economicCapital;
          break;
        case "ce":
          aVal = a.certaintyEquivalent ?? 0;
          bVal = b.certaintyEquivalent ?? 0;
          break;
        case "utility":
          aVal = a.expectedUtility ?? 0;
          bVal = b.expectedUtility ?? 0;
          break;
        case "tcor":
          aVal = a.tcor ?? 0;
          bVal = b.tcor ?? 0;
          break;
        default:
          return 0;
      }

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [simulationResults, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  if (simulationResults.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Recommendation Engine */}
      {onApplyRecommendation && onToast && (
        <RecommendationEngine
          simulationResults={simulationResults}
          thresholds={thresholds}
          utilitySettings={utilitySettings}
          keyAssumptions={keyAssumptions}
          baselineComparison={baselineComparison}
          onApplyRecommendation={onApplyRecommendation}
          onToast={onToast}
        />
      )}

      <Tabs defaultValue="table" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TabsList
              className={`${hasUtilityMetrics ? "grid-cols-3" : "grid-cols-2"}`}
            >
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              {hasUtilityMetrics && (
                <TabsTrigger value="utility">Utility</TabsTrigger>
              )}
            </TabsList>

            {/* Sensitivity Tornado Button */}
            {options &&
              scenarioVars &&
              seed !== undefined &&
              runs !== undefined &&
              onAuditEvent && (
                <SensitivityTornado
                  simulationResults={simulationResults}
                  options={options}
                  scenarioVars={scenarioVars}
                  seed={seed}
                  runs={runs}
                  utilityParams={
                    utilitySettings
                      ? {
                          mode: utilitySettings.mode,
                          a: utilitySettings.a,
                          scale: utilitySettings.scale,
                        }
                      : undefined
                  }
                  tcorParams={tcorParams}
                  gameConfig={gameConfig}
                  optionStrategies={optionStrategies}
                  dependenceConfig={dependenceConfig}
                  bayesianOverride={bayesianOverride}
                  copulaConfig={copulaConfig}
                  horizonMonths={horizonMonths}
                  onAuditEvent={onAuditEvent}
                  onTopFactorsChange={onTopFactorsChange}
                />
              )}
          </div>
          {/* Horizon Control */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                H: {horizonMonths}m
              </Badge>
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="horizon-slider"
                  className="text-sm whitespace-nowrap"
                >
                  Horizon (months)
                </Label>
                <div className="w-48">
                  <Slider
                    id="horizon-slider"
                    min={0}
                    max={3}
                    step={1}
                    value={[HORIZON_OPTIONS.indexOf(horizonMonths)]}
                    onValueChange={(value) => {
                      const newHorizon = HORIZON_OPTIONS[value[0]];
                      onHorizonChange(newHorizon);
                    }}
                    className="cursor-pointer"
                  />

                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    {HORIZON_OPTIONS.map((h) => (
                      <span key={h}>{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Short horizon + high aversion warning */}
            {horizonMonths < 6 &&
              utilitySettings &&
              utilitySettings.mode === "CARA" &&
              utilitySettings.a > 0.01 && (
                <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-700 dark:text-blue-400 max-w-md">
                  <InfoIcon className="w-3 h-3 mt-0.5 shrink-0" />

                  <span>
                    Short horizon ({horizonMonths}m) + high risk aversion (a=
                    {utilitySettings.a.toFixed(3)}) may bias CE low
                  </span>
                </div>
              )}
          </div>
        </div>

        <TabsContent value="table" className="space-y-4">
          {/* Baseline vs Plan Comparison */}
          {decisionId && runId && onAuditEvent && (
            <BaselinePlanComparison
              decisionId={decisionId}
              currentRunId={runId}
              currentResults={simulationResults}
              currentHorizonMonths={horizonMonths}
              onAuditEvent={onAuditEvent}
              onToast={onToast}
            />
          )}

          {/* Stress Test Panel */}
          {options &&
            scenarioVars &&
            seed !== undefined &&
            runs !== undefined &&
            runId &&
            onAuditEvent && (
              <StressTestPanel
                options={options}
                scenarioVars={scenarioVars}
                seed={seed}
                runs={runs}
                baseRunId={runId}
                utilityParams={
                  utilitySettings
                    ? {
                        mode: utilitySettings.mode,
                        a: utilitySettings.a,
                        scale: utilitySettings.scale,
                      }
                    : undefined
                }
                tcorParams={tcorParams}
                gameConfig={gameConfig}
                optionStrategies={optionStrategies}
                dependenceConfig={dependenceConfig}
                bayesianOverride={bayesianOverride}
                thresholds={thresholds}
                onAuditEvent={onAuditEvent}
                onStressPresetChange={onStressPresetChange}
              />
            )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {getLabel("monteCarlo", { plain: plainLanguage })} Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {getLabel("options", {
                        plain: plainLanguage,
                        short: true,
                      })}
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help border-b border-dotted border-muted-foreground">
                              {getLabel("horizon", {
                                plain: plainLanguage,
                                short: true,
                              })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">
                              Time window for this option (months)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("raroc")}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help border-b border-dotted border-muted-foreground">
                              {getLabel("raroc", {
                                plain: plainLanguage,
                                short: true,
                              })}{" "}
                              {sortColumn === "raroc" &&
                                (sortDirection === "asc" ? "↑" : "↓")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">
                              Return per risk capital (RAROC) scaled by this
                              option's Time window.
                              <br />
                              <br />
                              Scaling: EV×h, Cap×√h where h = horizonMonths/12
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("ev")}
                    >
                      {getLabel("ev", { plain: plainLanguage, short: true })}{" "}
                      {sortColumn === "ev" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("var95")}
                    >
                      {getLabel("var95", { plain: plainLanguage, short: true })}{" "}
                      {sortColumn === "var95" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("cvar95")}
                    >
                      {getLabel("cvar95", {
                        plain: plainLanguage,
                        short: true,
                      })}{" "}
                      {sortColumn === "cvar95" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("economicCapital")}
                    >
                      {getLabel("econCap", {
                        plain: plainLanguage,
                        short: true,
                      })}{" "}
                      {sortColumn === "economicCapital" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {hasTCORMetrics && (
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("tcor")}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dotted border-muted-foreground">
                                {getLabel("tcor", {
                                  plain: plainLanguage,
                                  short: true,
                                })}{" "}
                                {sortColumn === "tcor" &&
                                  (sortDirection === "asc" ? "↑" : "↓")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-xs">
                                Total Cost of Risk: Sum of expected loss,
                                insurance, contingency, and mitigation costs.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    )}
                    {hasUtilityMetrics && (
                      <>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("ce")}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dotted border-muted-foreground">
                                  {getLabel("ce", {
                                    plain: plainLanguage,
                                    short: true,
                                  })}{" "}
                                  {sortColumn === "ce" &&
                                    (sortDirection === "asc" ? "↑" : "↓")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-xs">
                                  Certainty Equivalent: The guaranteed amount
                                  that provides the same utility as the risky
                                  option.
                                  <br />
                                  <br />
                                  Formula: CE = (-1/a) × ln(1 - EU) × scale
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("utility")}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dotted border-muted-foreground">
                                  {getLabel("utility", {
                                    plain: plainLanguage,
                                    short: true,
                                  })}{" "}
                                  {sortColumn === "utility" &&
                                    (sortDirection === "asc" ? "↑" : "↓")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-xs">
                                  Expected Utility: Average utility across all
                                  outcomes using CARA function.
                                  <br />
                                  <br />
                                  Formula: U(x) = 1 - exp(-a × x/scale)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((result) => (
                    <TableRow
                      key={result.optionId}
                      className={`cursor-pointer transition-colors ${
                        selectedOptionId === result.optionId
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => setSelectedOptionId(result.optionId)}
                    >
                      <TableCell className="font-medium">
                        {result.optionLabel}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          H: {result.horizonMonths}m
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                className={getRAROCBadgeColor(
                                  result.raroc,
                                  thresholds
                                )}
                              >
                                {result.raroc.toFixed(4)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                RAROC thresholds (tenant):
                                <br />
                                Red {"<"} {thresholds.red}, Amber {"<"}{" "}
                                {thresholds.amber}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.ev.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.var95.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.cvar95.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.economicCapital.toFixed(2)}
                      </TableCell>
                      {hasTCORMetrics && (
                        <TableCell className="text-right font-mono text-sm">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {result.tcor !== undefined
                                    ? result.tcor.toFixed(2)
                                    : "-"}
                                </span>
                              </TooltipTrigger>
                              {result.tcorComponents && (
                                <TooltipContent>
                                  <div className="text-xs space-y-1">
                                    <div className="font-semibold">
                                      TCOR Breakdown:
                                    </div>
                                    <div>
                                      Expected Loss:{" "}
                                      {result.tcorComponents.expectedLoss.toFixed(
                                        2
                                      )}
                                    </div>
                                    <div>
                                      Insurance:{" "}
                                      {result.tcorComponents.insurance.toFixed(
                                        2
                                      )}
                                    </div>
                                    <div>
                                      Contingency:{" "}
                                      {result.tcorComponents.contingency.toFixed(
                                        2
                                      )}
                                    </div>
                                    <div>
                                      Mitigation:{" "}
                                      {result.tcorComponents.mitigation.toFixed(
                                        2
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      )}
                      {hasUtilityMetrics && (
                        <>
                          <TableCell className="text-right font-mono text-sm">
                            {result.certaintyEquivalent !== undefined
                              ? result.certaintyEquivalent.toFixed(0)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {result.expectedUtility !== undefined
                              ? result.expectedUtility.toFixed(3)
                              : "-"}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Histogram for selected option */}
          {selectedResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Outcome Distribution - {selectedResult.optionLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OutcomeHistogram result={selectedResult} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RAROC Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <RAROCBarChart
                results={simulationResults}
                thresholds={thresholds}
                onBarClick={setSelectedOptionId}
                selectedOptionId={selectedOptionId || undefined}
              />
            </CardContent>
          </Card>

          {/* Histogram for selected option */}
          {selectedResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Outcome Distribution - {selectedResult.optionLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OutcomeHistogram result={selectedResult} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {hasUtilityMetrics && utilitySettings && (
          <TabsContent value="utility" className="space-y-4">
            <UtilityCurveChart
              results={simulationResults}
              utilityParams={{
                mode: utilitySettings.mode,
                a: utilitySettings.a,
                scale: utilitySettings.scale,
              }}
              selectedOptionId={selectedOptionId || undefined}
              onCurveClick={setSelectedOptionId}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
