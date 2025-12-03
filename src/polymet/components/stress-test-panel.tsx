import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2Icon, AlertTriangleIcon } from "lucide-react";
import {
  runSimulation,
  type SimulationResult,
  type ScenarioVar,
  type UtilityParams,
  type TCORParams,
  type GameInteractionConfig,
  type OptionGameStrategy,
  type DependenceConfig,
  type BayesianPriorOverride,
} from "@/polymet/data/scenario-engine";
import {
  type RAROCThresholds,
  getRAROCBadgeColor,
} from "@/polymet/data/tenant-settings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type StressPreset =
  | "Base"
  | "Cost Spike"
  | "Demand Slump"
  | "Volatility Up";

interface StressTestRun {
  preset: StressPreset;
  runId: string;
  results: SimulationResult[];
}

interface StressTestPanelProps {
  options: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
  }>;
  scenarioVars: ScenarioVar[];
  seed: number;
  runs: number;
  baseRunId: string;
  utilityParams?: UtilityParams;
  tcorParams?: TCORParams;
  gameConfig?: GameInteractionConfig;
  optionStrategies?: OptionGameStrategy[];
  dependenceConfig?: DependenceConfig;
  bayesianOverride?: BayesianPriorOverride;
  thresholds: RAROCThresholds;
  onAuditEvent: (eventType: string, payload: any) => void;
  onStressPresetChange?: (preset: StressPreset | null) => void;
}

export function StressTestPanel({
  options,
  scenarioVars,
  seed,
  runs,
  baseRunId,
  utilityParams,
  tcorParams,
  gameConfig,
  optionStrategies,
  dependenceConfig,
  bayesianOverride,
  thresholds,
  onAuditEvent,
  onStressPresetChange,
}: StressTestPanelProps) {
  const [stressRuns, setStressRuns] = useState<StressTestRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePreset, setActivePreset] = useState<StressPreset | null>(null);

  // Run stress test with a specific preset
  const runStressTest = async (preset: StressPreset) => {
    setIsRunning(true);
    setActivePreset(preset);

    // Notify parent about active stress preset
    if (onStressPresetChange) {
      onStressPresetChange(preset);
    }

    // Simulate async behavior
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      let stressResults: SimulationResult[];
      let runIdSuffix: string;

      switch (preset) {
        case "Base":
          // Run as-is (no modifications)
          stressResults = runSimulation(
            options,
            scenarioVars,
            runs,
            seed,
            utilityParams,
            tcorParams,
            gameConfig,
            optionStrategies,
            dependenceConfig,
            bayesianOverride
          );
          runIdSuffix = "";
          break;

        case "Cost Spike":
          // Multiply cost by 1.15 after scenario shocks
          stressResults = runSimulationWithCostSpike(
            options,
            scenarioVars,
            runs,
            seed,
            1.15,
            utilityParams,
            tcorParams,
            gameConfig,
            optionStrategies,
            dependenceConfig,
            bayesianOverride
          );
          runIdSuffix = "-CS";
          break;

        case "Demand Slump":
          // Add -0.25 shock to returns: ret = max(0, ret * (1 - 0.25))
          stressResults = runSimulationWithDemandSlump(
            options,
            scenarioVars,
            runs,
            seed,
            0.25,
            utilityParams,
            tcorParams,
            gameConfig,
            optionStrategies,
            dependenceConfig,
            bayesianOverride
          );
          runIdSuffix = "-DS";
          break;

        case "Volatility Up":
          // Multiply all ScenarioVar weights by 1.5
          const volatileVars = scenarioVars.map((v) => ({
            ...v,
            weight: (v.weight ?? 1) * 1.5,
          }));
          stressResults = runSimulation(
            options,
            volatileVars,
            runs,
            seed,
            utilityParams,
            tcorParams,
            gameConfig,
            optionStrategies,
            dependenceConfig,
            bayesianOverride
          );
          runIdSuffix = "-VU";
          break;

        default:
          stressResults = [];
          runIdSuffix = "";
      }

      const stressRunId = baseRunId + runIdSuffix;

      // Extract achieved Spearman correlation from first result
      let achievedSpearman: number | undefined;
      if (
        stressResults.length > 0 &&
        stressResults[0].achievedSpearman !== undefined
      ) {
        achievedSpearman = stressResults[0].achievedSpearman;
      }

      // Add to stress runs (replace if preset already exists)
      setStressRuns((prev) => {
        const filtered = prev.filter((r) => r.preset !== preset);
        return [
          ...filtered,
          {
            preset,
            runId: stressRunId,
            results: stressResults,
          },
        ];
      });

      // Add audit event with achievedSpearman and Bayesian summary
      onAuditEvent("stress.run", {
        preset,
        runId: stressRunId,
        seed,
        runs,
        achievedSpearman,
        bayes: bayesianOverride
          ? {
              varKey: bayesianOverride.targetVarId,
              muN: bayesianOverride.posteriorMean,
              sigmaN: bayesianOverride.posteriorSd,
              applied: true,
            }
          : { applied: false },
      });
    } catch (error) {
      console.error("Stress test failed:", error);
    } finally {
      setIsRunning(false);
      // Keep the preset active after running (don't reset to null)
      // setActivePreset(null);
    }
  };

  // Get best option for a metric across all runs
  const getBestOption = (
    metric: "ev" | "raroc" | "ce" | "tcor"
  ): { optionLabel: string; value: number; preset: StressPreset } | null => {
    if (stressRuns.length === 0) return null;

    let best: {
      optionLabel: string;
      value: number;
      preset: StressPreset;
    } | null = null;

    for (const run of stressRuns) {
      for (const result of run.results) {
        let value: number;
        switch (metric) {
          case "ev":
            value = result.ev;
            break;
          case "raroc":
            value = result.raroc;
            break;
          case "ce":
            value = result.certaintyEquivalent ?? 0;
            break;
          case "tcor":
            value = result.tcor ?? 0;
            break;
          default:
            continue;
        }

        if (
          !best ||
          (metric === "tcor" ? value < best.value : value > best.value)
        ) {
          best = {
            optionLabel: result.optionLabel,
            value,
            preset: run.preset,
          };
        }
      }
    }

    return best;
  };

  // Get all results for a specific option across all stress runs
  const getOptionResults = (optionId: string) => {
    return stressRuns.map((run) => ({
      preset: run.preset,
      result: run.results.find((r) => r.optionId === optionId),
    }));
  };

  // Get base run (non-stress)
  const baseRun = stressRuns.find((r) => r.preset === "Base");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-orange-500" />

              <CardTitle className="text-base">Stress Tests</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stress Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={
                stressRuns.some((r) => r.preset === "Base")
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => runStressTest("Base")}
              disabled={isRunning}
            >
              {isRunning && activePreset === "Base" && (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              )}
              Base
            </Button>
            <Button
              variant={
                stressRuns.some((r) => r.preset === "Cost Spike")
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => runStressTest("Cost Spike")}
              disabled={isRunning}
            >
              {isRunning && activePreset === "Cost Spike" && (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              )}
              Cost Spike
            </Button>
            <Button
              variant={
                stressRuns.some((r) => r.preset === "Demand Slump")
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => runStressTest("Demand Slump")}
              disabled={isRunning}
            >
              {isRunning && activePreset === "Demand Slump" && (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              )}
              Demand Slump
            </Button>
            <Button
              variant={
                stressRuns.some((r) => r.preset === "Volatility Up")
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => runStressTest("Volatility Up")}
              disabled={isRunning}
            >
              {isRunning && activePreset === "Volatility Up" && (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              )}
              Volatility Up
            </Button>
          </div>

          {/* Summary Chips */}
          {stressRuns.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Best Across Runs:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["ev", "raroc", "ce", "tcor"].map((metric) => {
                  const best = getBestOption(metric as any);
                  if (!best) return null;

                  return (
                    <TooltipProvider key={metric}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-2 border border-border rounded-lg bg-muted/50 cursor-help">
                            <div className="text-xs text-muted-foreground uppercase">
                              {metric === "ce"
                                ? "CE"
                                : metric === "tcor"
                                  ? "TCOR"
                                  : metric.toUpperCase()}
                            </div>
                            <div className="text-sm font-semibold">
                              {best.optionLabel}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {best.value.toFixed(2)}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Best in: {best.preset}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {stressRuns.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Comparison Table</div>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Option</TableHead>
                      <TableHead>Run</TableHead>
                      <TableHead className="text-right">RAROC</TableHead>
                      <TableHead className="text-right">EV</TableHead>
                      <TableHead className="text-right">VaR95</TableHead>
                      <TableHead className="text-right">CVaR95</TableHead>
                      <TableHead className="text-right">
                        Econ. Capital
                      </TableHead>
                      {utilityParams && (
                        <>
                          <TableHead className="text-right">CE</TableHead>
                          <TableHead className="text-right">Utility</TableHead>
                        </>
                      )}
                      {tcorParams && (
                        <TableHead className="text-right">TCOR</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {options.map((option) => {
                      const optionResults = getOptionResults(option.id);
                      return optionResults.map(({ preset, result }, idx) => {
                        if (!result) return null;

                        // Calculate delta vs base run
                        const baseResult = baseRun?.results.find(
                          (r) => r.optionId === option.id
                        );
                        const rarocDelta = baseResult
                          ? result.raroc - baseResult.raroc
                          : 0;
                        const evDelta = baseResult
                          ? result.ev - baseResult.ev
                          : 0;

                        return (
                          <TableRow key={`${option.id}-${preset}`}>
                            {idx === 0 && (
                              <TableCell
                                rowSpan={optionResults.length}
                                className="font-medium"
                              >
                                {option.label}
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {preset}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  className={getRAROCBadgeColor(
                                    result.raroc,
                                    thresholds
                                  )}
                                >
                                  {result.raroc.toFixed(4)}
                                </Badge>
                                {baseResult && preset !== "Base" && (
                                  <span
                                    className={`text-xs ${
                                      rarocDelta >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {rarocDelta >= 0 ? "+" : ""}
                                    {rarocDelta.toFixed(4)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-mono text-sm">
                                  {result.ev.toFixed(2)}
                                </span>
                                {baseResult && preset !== "Base" && (
                                  <span
                                    className={`text-xs ${
                                      evDelta >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {evDelta >= 0 ? "+" : ""}
                                    {evDelta.toFixed(2)}
                                  </span>
                                )}
                              </div>
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
                            {utilityParams && (
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
                            {tcorParams && (
                              <TableCell className="text-right font-mono text-sm">
                                {result.tcor !== undefined
                                  ? result.tcor.toFixed(2)
                                  : "-"}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      });
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper: Run simulation with cost spike (multiply cost by factor after scenario shocks)
function runSimulationWithCostSpike(
  options: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
  }>,
  variables: ScenarioVar[],
  runs: number,
  seed: number,
  costMultiplier: number,
  utilityParams?: UtilityParams,
  tcorParams?: TCORParams,
  gameConfig?: GameInteractionConfig,
  optionStrategies?: OptionGameStrategy[],
  dependenceConfig?: DependenceConfig,
  bayesianOverride?: BayesianPriorOverride
): SimulationResult[] {
  // Modify options to have higher cost
  const modifiedOptions = options.map((opt) => ({
    ...opt,
    cost: (opt.cost ?? 0) * costMultiplier,
  }));

  return runSimulation(
    modifiedOptions,
    variables,
    runs,
    seed,
    utilityParams,
    tcorParams,
    gameConfig,
    optionStrategies,
    dependenceConfig,
    bayesianOverride
  );
}

// Helper: Run simulation with demand slump (add -0.25 shock to returns)
function runSimulationWithDemandSlump(
  options: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
  }>,
  variables: ScenarioVar[],
  runs: number,
  seed: number,
  slumpFactor: number,
  utilityParams?: UtilityParams,
  tcorParams?: TCORParams,
  gameConfig?: GameInteractionConfig,
  optionStrategies?: OptionGameStrategy[],
  dependenceConfig?: DependenceConfig,
  bayesianOverride?: BayesianPriorOverride
): SimulationResult[] {
  // Modify options to have reduced returns
  const modifiedOptions = options.map((opt) => ({
    ...opt,
    expectedReturn: Math.max(0, (opt.expectedReturn ?? 0) * (1 - slumpFactor)),
  }));

  return runSimulation(
    modifiedOptions,
    variables,
    runs,
    seed,
    utilityParams,
    tcorParams,
    gameConfig,
    optionStrategies,
    dependenceConfig,
    bayesianOverride
  );
}
