import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip as RechartsTooltip,
  LabelList,
} from "recharts";
import {
  ActivityIcon,
  DownloadIcon,
  Loader2Icon,
  InfoIcon,
} from "lucide-react";
import type {
  SimulationResult,
  ScenarioVar,
  UtilityParams,
  TCORParams,
  GameInteractionConfig,
  OptionGameStrategy,
  DependenceConfig,
  BayesianPriorOverride,
  CopulaMatrixConfig,
} from "@/polymet/data/scenario-engine";
import { runSimulation } from "@/polymet/data/scenario-engine";
import { exportSensitivityCSV } from "@/polymet/data/csv-export-utils";
import { PartnerImpactOverlay } from "@/polymet/components/partner-impact-overlay";
import { PartnerSensitivityPanel } from "@/polymet/components/partner-sensitivity-panel";
import {
  TornadoBarIndicators,
  calculatePartnerInfluences,
} from "@/polymet/components/tornado-bar-indicators";
import { SensitivityStoryline } from "@/polymet/components/sensitivity-storyline";

interface SensitivityTornadoProps {
  simulationResults: SimulationResult[];
  options: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
    partners?: Array<{
      id: string;
      name: string;
      relationship: string;
      creditExposure?: number;
      dependencyScore?: number;
      notes?: string;
    }>;
  }>;
  scenarioVars: ScenarioVar[];
  seed: number;
  runs: number;
  utilityParams?: UtilityParams;
  tcorParams?: TCORParams;
  gameConfig?: GameInteractionConfig;
  optionStrategies?: OptionGameStrategy[];
  dependenceConfig?: DependenceConfig;
  bayesianOverride?: BayesianPriorOverride;
  copulaConfig?: CopulaMatrixConfig;
  horizonMonths?: number;
  onAuditEvent: (eventType: string, payload: any) => void;
  onTopFactorsChange?: (
    factors: Array<{ paramName: string; impact: number }>
  ) => void;
}

interface SensitivityResult {
  paramName: string;
  paramType: "cost" | "return" | "varWeight" | "varMean";
  deltaPlus: number;
  deltaMinus: number;
  percentPlus: number;
  percentMinus: number;
  maxAbsDelta: number;
}

type TargetMetric = "RAROC" | "CE";

export function SensitivityTornado({
  simulationResults,
  options,
  scenarioVars,
  seed,
  runs,
  utilityParams,
  tcorParams,
  gameConfig,
  optionStrategies,
  dependenceConfig,
  bayesianOverride,
  copulaConfig,
  horizonMonths,
  onAuditEvent,
  onTopFactorsChange,
}: SensitivityTornadoProps) {
  const [open, setOpen] = useState(false);
  const [targetOptionId, setTargetOptionId] = useState<string>("");
  const [targetMetric, setTargetMetric] = useState<TargetMetric>("RAROC");
  const [stepPercent, setStepPercent] = useState<number>(10);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SensitivityResult[]>([]);
  const [runIdBase, setRunIdBase] = useState<string>("");
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [showPartnerImpact, setShowPartnerImpact] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>();
  const [dependencyThreshold, setDependencyThreshold] = useState<number>(0.6);

  // Determine default target option (recommended or first)
  React.useEffect(() => {
    if (!targetOptionId && simulationResults.length > 0) {
      // Find recommended option (highest RAROC or CE)
      const sortedByMetric = [...simulationResults].sort((a, b) => {
        if (targetMetric === "RAROC") {
          return b.raroc - a.raroc;
        } else {
          return (b.certaintyEquivalent ?? 0) - (a.certaintyEquivalent ?? 0);
        }
      });
      setTargetOptionId(sortedByMetric[0].optionId);
    }
  }, [simulationResults, targetOptionId, targetMetric]);

  // Determine default metric based on utility mode
  React.useEffect(() => {
    if (utilityParams && utilityParams.mode !== "CARA") {
      setTargetMetric("CE");
    } else {
      setTargetMetric("RAROC");
    }
  }, [utilityParams]);

  const getBaselineMetric = (optionId: string): number => {
    const result = simulationResults.find((r) => r.optionId === optionId);
    if (!result) return 0;

    if (targetMetric === "RAROC") {
      return result.raroc;
    } else {
      return result.certaintyEquivalent ?? 0;
    }
  };

  const runSensitivityAnalysis = async () => {
    if (!targetOptionId) return;

    setIsRunning(true);
    setResults([]);

    // Calculate total number of parameters to test
    const targetOption = options.find((o) => o.id === targetOptionId);
    if (!targetOption) {
      setIsRunning(false);
      return;
    }

    let totalParams = 0;
    if (targetOption.cost !== undefined && targetOption.cost > 0) totalParams++;
    if (
      targetOption.expectedReturn !== undefined &&
      targetOption.expectedReturn > 0
    )
      totalParams++;
    totalParams += scenarioVars.length; // weights
    totalParams += scenarioVars.filter(
      (v) =>
        (v.dist === "normal" && v.params.mean !== undefined) ||
        (v.dist === "lognormal" && v.params.mu !== undefined)
    ).length; // means

    // Cap to 2×(#params) quick runs
    const maxQuickRuns = 2 * totalParams;
    const estimatedSeconds = Math.ceil(maxQuickRuns * 0.05); // ~50ms per run
    setEstimatedTime(estimatedSeconds < 3 ? "~<3s" : `~${estimatedSeconds}s`);

    const baselineMetric = getBaselineMetric(targetOptionId);

    const step = stepPercent / 100;
    const fastRuns = Math.min(2000, runs);
    const sensitivityResults: SensitivityResult[] = [];

    // Test option cost
    if (targetOption.cost !== undefined && targetOption.cost > 0) {
      const costPlus = targetOption.cost * (1 + step);
      const costMinus = targetOption.cost * (1 - step);

      const optionPlus = { ...targetOption, cost: costPlus };
      const optionMinus = { ...targetOption, cost: costMinus };

      const resultsPlus = runSimulation(
        [optionPlus],
        scenarioVars,
        fastRuns,
        seed + 11,
        utilityParams,
        tcorParams,
        gameConfig,
        optionStrategies,
        dependenceConfig,
        bayesianOverride,
        copulaConfig,
        horizonMonths
      );

      const resultsMinus = runSimulation(
        [optionMinus],
        scenarioVars,
        fastRuns,
        seed + 13,
        utilityParams,
        tcorParams,
        gameConfig,
        optionStrategies,
        dependenceConfig,
        bayesianOverride,
        copulaConfig,
        horizonMonths
      );

      const metricPlus =
        targetMetric === "RAROC"
          ? resultsPlus[0].raroc
          : resultsPlus[0].certaintyEquivalent ?? 0;
      const metricMinus =
        targetMetric === "RAROC"
          ? resultsMinus[0].raroc
          : resultsMinus[0].certaintyEquivalent ?? 0;

      const deltaPlus = metricPlus - baselineMetric;
      const deltaMinus = metricMinus - baselineMetric;

      sensitivityResults.push({
        paramName: "Option Cost",
        paramType: "cost",
        deltaPlus,
        deltaMinus,
        percentPlus: (deltaPlus / baselineMetric) * 100,
        percentMinus: (deltaMinus / baselineMetric) * 100,
        maxAbsDelta: Math.max(Math.abs(deltaPlus), Math.abs(deltaMinus)),
      });
    }

    // Test option expectedReturn
    if (
      targetOption.expectedReturn !== undefined &&
      targetOption.expectedReturn > 0
    ) {
      const returnPlus = targetOption.expectedReturn * (1 + step);
      const returnMinus = targetOption.expectedReturn * (1 - step);

      const optionPlus = { ...targetOption, expectedReturn: returnPlus };
      const optionMinus = { ...targetOption, expectedReturn: returnMinus };

      const resultsPlus = runSimulation(
        [optionPlus],
        scenarioVars,
        fastRuns,
        seed + 11,
        utilityParams,
        tcorParams,
        gameConfig,
        optionStrategies,
        dependenceConfig,
        bayesianOverride,
        copulaConfig,
        horizonMonths
      );

      const resultsMinus = runSimulation(
        [optionMinus],
        scenarioVars,
        fastRuns,
        seed + 13,
        utilityParams,
        tcorParams,
        gameConfig,
        optionStrategies,
        dependenceConfig,
        bayesianOverride,
        copulaConfig,
        horizonMonths
      );

      const metricPlus =
        targetMetric === "RAROC"
          ? resultsPlus[0].raroc
          : resultsPlus[0].certaintyEquivalent ?? 0;
      const metricMinus =
        targetMetric === "RAROC"
          ? resultsMinus[0].raroc
          : resultsMinus[0].certaintyEquivalent ?? 0;

      const deltaPlus = metricPlus - baselineMetric;
      const deltaMinus = metricMinus - baselineMetric;

      sensitivityResults.push({
        paramName: "Option Return",
        paramType: "return",
        deltaPlus,
        deltaMinus,
        percentPlus: (deltaPlus / baselineMetric) * 100,
        percentMinus: (deltaMinus / baselineMetric) * 100,
        maxAbsDelta: Math.max(Math.abs(deltaPlus), Math.abs(deltaMinus)),
      });
    }

    // Test each ScenarioVar weight
    for (const variable of scenarioVars) {
      const baseWeight = variable.weight ?? 1;
      const weightPlus = baseWeight * (1 + step);
      const weightMinus = baseWeight * (1 - step);

      const varsPlus = scenarioVars.map((v) =>
        v.id === variable.id ? { ...v, weight: weightPlus } : v
      );
      const varsMinus = scenarioVars.map((v) =>
        v.id === variable.id ? { ...v, weight: weightMinus } : v
      );

      const resultsPlus = runSimulation(
        [targetOption],
        varsPlus,
        fastRuns,
        seed + 11,
        utilityParams,
        tcorParams,
        gameConfig,
        optionStrategies,
        dependenceConfig,
        bayesianOverride,
        copulaConfig,
        horizonMonths
      );

      const resultsMinus = runSimulation(
        [targetOption],
        varsMinus,
        fastRuns,
        seed + 13,
        utilityParams,
        tcorParams,
        gameConfig,
        optionStrategies,
        dependenceConfig,
        bayesianOverride,
        copulaConfig,
        horizonMonths
      );

      const metricPlus =
        targetMetric === "RAROC"
          ? resultsPlus[0].raroc
          : resultsPlus[0].certaintyEquivalent ?? 0;
      const metricMinus =
        targetMetric === "RAROC"
          ? resultsMinus[0].raroc
          : resultsMinus[0].certaintyEquivalent ?? 0;

      const deltaPlus = metricPlus - baselineMetric;
      const deltaMinus = metricMinus - baselineMetric;

      sensitivityResults.push({
        paramName: `${variable.name} (weight)`,
        paramType: "varWeight",
        deltaPlus,
        deltaMinus,
        percentPlus: (deltaPlus / baselineMetric) * 100,
        percentMinus: (deltaMinus / baselineMetric) * 100,
        maxAbsDelta: Math.max(Math.abs(deltaPlus), Math.abs(deltaMinus)),
      });
    }

    // Test mean parameter for normal/lognormal distributions
    for (const variable of scenarioVars) {
      if (variable.dist === "normal" && variable.params.mean !== undefined) {
        const baseMean = variable.params.mean;
        const meanPlus = baseMean * (1 + step);
        const meanMinus = baseMean * (1 - step);

        const varsPlus = scenarioVars.map((v) =>
          v.id === variable.id
            ? { ...v, params: { ...v.params, mean: meanPlus } }
            : v
        );
        const varsMinus = scenarioVars.map((v) =>
          v.id === variable.id
            ? { ...v, params: { ...v.params, mean: meanMinus } }
            : v
        );

        const resultsPlus = runSimulation(
          [targetOption],
          varsPlus,
          fastRuns,
          seed + 11,
          utilityParams,
          tcorParams,
          gameConfig,
          optionStrategies,
          dependenceConfig,
          bayesianOverride,
          copulaConfig,
          horizonMonths
        );

        const resultsMinus = runSimulation(
          [targetOption],
          varsMinus,
          fastRuns,
          seed + 13,
          utilityParams,
          tcorParams,
          gameConfig,
          optionStrategies,
          dependenceConfig,
          bayesianOverride,
          copulaConfig,
          horizonMonths
        );

        const metricPlus =
          targetMetric === "RAROC"
            ? resultsPlus[0].raroc
            : resultsPlus[0].certaintyEquivalent ?? 0;
        const metricMinus =
          targetMetric === "RAROC"
            ? resultsMinus[0].raroc
            : resultsMinus[0].certaintyEquivalent ?? 0;

        const deltaPlus = metricPlus - baselineMetric;
        const deltaMinus = metricMinus - baselineMetric;

        sensitivityResults.push({
          paramName: `${variable.name} (mean)`,
          paramType: "varMean",
          deltaPlus,
          deltaMinus,
          percentPlus: (deltaPlus / baselineMetric) * 100,
          percentMinus: (deltaMinus / baselineMetric) * 100,
          maxAbsDelta: Math.max(Math.abs(deltaPlus), Math.abs(deltaMinus)),
        });
      } else if (
        variable.dist === "lognormal" &&
        variable.params.mu !== undefined
      ) {
        const baseMu = variable.params.mu;
        const muPlus = baseMu * (1 + step);
        const muMinus = baseMu * (1 - step);

        const varsPlus = scenarioVars.map((v) =>
          v.id === variable.id
            ? { ...v, params: { ...v.params, mu: muPlus } }
            : v
        );
        const varsMinus = scenarioVars.map((v) =>
          v.id === variable.id
            ? { ...v, params: { ...v.params, mu: muMinus } }
            : v
        );

        const resultsPlus = runSimulation(
          [targetOption],
          varsPlus,
          fastRuns,
          seed + 11,
          utilityParams,
          tcorParams,
          gameConfig,
          optionStrategies,
          dependenceConfig,
          bayesianOverride,
          copulaConfig,
          horizonMonths
        );

        const resultsMinus = runSimulation(
          [targetOption],
          varsMinus,
          fastRuns,
          seed + 13,
          utilityParams,
          tcorParams,
          gameConfig,
          optionStrategies,
          dependenceConfig,
          bayesianOverride,
          copulaConfig,
          horizonMonths
        );

        const metricPlus =
          targetMetric === "RAROC"
            ? resultsPlus[0].raroc
            : resultsPlus[0].certaintyEquivalent ?? 0;
        const metricMinus =
          targetMetric === "RAROC"
            ? resultsMinus[0].raroc
            : resultsMinus[0].certaintyEquivalent ?? 0;

        const deltaPlus = metricPlus - baselineMetric;
        const deltaMinus = metricMinus - baselineMetric;

        sensitivityResults.push({
          paramName: `${variable.name} (mu)`,
          paramType: "varMean",
          deltaPlus,
          deltaMinus,
          percentPlus: (deltaPlus / baselineMetric) * 100,
          percentMinus: (deltaMinus / baselineMetric) * 100,
          maxAbsDelta: Math.max(Math.abs(deltaPlus), Math.abs(deltaMinus)),
        });
      }
    }

    // Sort by maxAbsDelta descending
    sensitivityResults.sort((a, b) => b.maxAbsDelta - a.maxAbsDelta);

    setResults(sensitivityResults);
    setRunIdBase(`sensitivity-${Date.now()}`);
    setIsRunning(false);

    // Capture top 3 sensitive factors and notify parent
    const topThree = sensitivityResults.slice(0, 3).map((r) => ({
      paramName: r.paramName,
      impact: r.maxAbsDelta,
    }));

    if (onTopFactorsChange) {
      onTopFactorsChange(topThree);
    }

    // Audit event
    onAuditEvent("sensitivity.tornado.ran", {
      optionId: targetOptionId,
      metric: targetMetric,
      stepPct: stepPercent,
      testedCount: sensitivityResults.length,
      topThreeFactors: topThree,
    });
  };

  const exportCSV = () => {
    if (results.length === 0) return;

    const targetOption = options.find((o) => o.id === targetOptionId);
    const sensitivityData: Array<{
      paramName: string;
      direction: "Plus" | "Minus";
      delta: number;
      percent: number;
      metric: "RAROC" | "CE";
      optionLabel: string;
      runIdBase: string;
    }> = [];

    for (const result of results) {
      sensitivityData.push({
        paramName: result.paramName,
        direction: "Plus",
        delta: result.deltaPlus,
        percent: result.percentPlus,
        metric: targetMetric,
        optionLabel: targetOption?.label ?? targetOptionId,
        runIdBase,
      });
      sensitivityData.push({
        paramName: result.paramName,
        direction: "Minus",
        delta: result.deltaMinus,
        percent: result.percentMinus,
        metric: targetMetric,
        optionLabel: targetOption?.label ?? targetOptionId,
        runIdBase,
      });
    }

    exportSensitivityCSV(sensitivityData);
  };

  // Get partners for the target option
  const getTargetOptionPartners = () => {
    if (!targetOptionId) return [];
    const targetOption = options.find((o) => o.id === targetOptionId);
    return targetOption?.partners ?? [];
  };

  const targetOptionPartners = getTargetOptionPartners();

  // Get selected partner details
  const selectedPartner = selectedPartnerId
    ? targetOptionPartners.find((p) => p.id === selectedPartnerId)
    : undefined;

  // Generate mock parameter sensitivities for selected partner
  const getPartnerParameterSensitivities = () => {
    if (!selectedPartner) return [];

    return results.map((result) => {
      const baseInfluence = selectedPartner.dependencyScore ?? 0;
      let influenceFactor = 0.5;

      // Adjust influence based on parameter type
      if (result.paramName.includes("Cost")) {
        influenceFactor = 0.8;
      } else if (result.paramName.includes("Return")) {
        influenceFactor = 0.6;
      } else if (
        result.paramName.includes("Volatility") ||
        result.paramName.includes("Risk")
      ) {
        influenceFactor = 0.9;
      }

      const partnerInfluence = Math.min(1, baseInfluence * influenceFactor);
      const direction =
        result.deltaPlus > Math.abs(result.deltaMinus)
          ? "positive"
          : "negative";

      return {
        paramName: result.paramName,
        partnerInfluence,
        direction: direction as "positive" | "negative" | "neutral",
        magnitude: result.maxAbsDelta,
      };
    });
  };

  // Prepare tornado chart data
  const tornadoData = results.map((result) => ({
    name: result.paramName,
    deltaMinus: result.deltaMinus,
    deltaPlus: result.deltaPlus,
  }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ActivityIcon className="w-4 h-4 mr-2" />
          Sensitivity (Tornado)
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Sensitivity Analysis (Tornado)</SheetTitle>
          <SheetDescription>
            One-at-a-time parameter sensitivity analysis with ±{stepPercent}%
            perturbation
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Option */}
              <div className="space-y-2">
                <Label htmlFor="target-option">Target Option</Label>
                <Select
                  value={targetOptionId}
                  onValueChange={setTargetOptionId}
                >
                  <SelectTrigger id="target-option">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Metric */}
              <div className="space-y-2">
                <Label>Target Metric</Label>
                <RadioGroup
                  value={targetMetric}
                  onValueChange={(value) =>
                    setTargetMetric(value as TargetMetric)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="RAROC" id="metric-raroc" />

                    <Label htmlFor="metric-raroc" className="font-normal">
                      RAROC
                    </Label>
                  </div>
                  {utilityParams && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CE" id="metric-ce" />

                      <Label htmlFor="metric-ce" className="font-normal">
                        CE (Certainty Equivalent)
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              {/* Step % */}
              <div className="space-y-2">
                <Label htmlFor="step-percent">Step % (min 1, max 50)</Label>
                <Input
                  id="step-percent"
                  type="number"
                  min={1}
                  max={50}
                  value={stepPercent}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 50) {
                      setStepPercent(val);
                    }
                  }}
                />
              </div>

              {/* Run Button */}
              <div className="space-y-2">
                <Button
                  onClick={runSensitivityAnalysis}
                  disabled={
                    isRunning ||
                    !targetOptionId ||
                    simulationResults.length === 0
                  }
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      Running Analysis... {estimatedTime}
                    </>
                  ) : (
                    "Quick Run"
                  )}
                </Button>
                {simulationResults.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Run a simulation first to enable sensitivity analysis
                  </p>
                )}
                {isRunning && estimatedTime && (
                  <p className="text-xs text-muted-foreground text-center">
                    Estimated time: {estimatedTime}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <>
              {/* Tornado Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">
                          Tornado Chart
                        </CardTitle>
                        <Badge variant="outline">
                          Baseline {targetMetric}:{" "}
                          {getBaselineMetric(targetOptionId).toFixed(4)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="show-partner-impact"
                          checked={showPartnerImpact}
                          onChange={(e) =>
                            setShowPartnerImpact(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-border"
                        />

                        <Label
                          htmlFor="show-partner-impact"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Show Partner Impact
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Shows which external partners drive our biggest
                                ups or downs.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={tornadoData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis type="number" />

                        <YAxis type="category" dataKey="name" width={110} />

                        <RechartsTooltip
                          formatter={(value: number) => value.toFixed(6)}
                        />

                        <ReferenceLine x={0} stroke="hsl(var(--border))" />

                        <Bar
                          dataKey="deltaMinus"
                          stackId="a"
                          fill="hsl(0 84.2% 60.2%)"
                        >
                          {tornadoData.map((entry, index) => (
                            <Cell
                              key={`cell-minus-${index}`}
                              fill={
                                entry.deltaMinus < 0
                                  ? "hsl(0 84.2% 60.2%)"
                                  : "hsl(142 76% 36%)"
                              }
                            />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="deltaPlus"
                          stackId="a"
                          fill="hsl(142 76% 36%)"
                        >
                          {tornadoData.map((entry, index) => (
                            <Cell
                              key={`cell-plus-${index}`}
                              fill={
                                entry.deltaPlus > 0
                                  ? "hsl(142 76% 36%)"
                                  : "hsl(0 84.2% 60.2%)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Partner Impact Overlay */}
                    {showPartnerImpact && targetOptionPartners.length > 0 && (
                      <PartnerImpactOverlay
                        partners={targetOptionPartners}
                        onThresholdChange={setDependencyThreshold}
                        onPartnerSelect={setSelectedPartnerId}
                        selectedPartnerId={selectedPartnerId}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-600 rounded" />

                      <span>Improves metric</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded" />

                      <span>Worsens metric</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sensitivity Storyline */}
              <SensitivityStoryline
                results={results}
                targetMetric={targetMetric}
                stepPercent={stepPercent}
                baselineMetric={getBaselineMetric(targetOptionId)}
                optionLabel={
                  options.find((o) => o.id === targetOptionId)?.label ??
                  targetOptionId
                }
              />

              {/* Partner-Specific Sensitivity Panel */}
              {selectedPartner && (
                <PartnerSensitivityPanel
                  partner={selectedPartner}
                  parameterSensitivities={getPartnerParameterSensitivities()}
                  onClose={() => setSelectedPartnerId(undefined)}
                />
              )}

              {/* Results Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Detailed Results
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        {showPartnerImpact && (
                          <TableHead>Partner Influence</TableHead>
                        )}
                        <TableHead className="text-right">Δ+ (Plus)</TableHead>
                        <TableHead className="text-right">% Change +</TableHead>
                        <TableHead className="text-right">Δ− (Minus)</TableHead>
                        <TableHead className="text-right">% Change −</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, idx) => {
                        const partnerInfluences = showPartnerImpact
                          ? calculatePartnerInfluences(
                              result.paramName,
                              targetOptionPartners
                            )
                          : [];

                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {result.paramName}
                                {showPartnerImpact && (
                                  <TornadoBarIndicators
                                    paramName={result.paramName}
                                    partnerInfluences={partnerInfluences}
                                    showIndicators={true}
                                  />
                                )}
                              </div>
                            </TableCell>
                            {showPartnerImpact && (
                              <TableCell>
                                <div className="text-xs text-muted-foreground">
                                  {partnerInfluences.length > 0
                                    ? `${partnerInfluences.length} partner${partnerInfluences.length !== 1 ? "s" : ""}`
                                    : "None"}
                                </div>
                              </TableCell>
                            )}
                            <TableCell
                              className={`text-right font-mono text-sm ${
                                result.deltaPlus > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {result.deltaPlus > 0 ? "+" : ""}
                              {result.deltaPlus.toFixed(6)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono text-sm ${
                                result.percentPlus > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {result.percentPlus > 0 ? "+" : ""}
                              {result.percentPlus.toFixed(2)}%
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono text-sm ${
                                result.deltaMinus > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {result.deltaMinus > 0 ? "+" : ""}
                              {result.deltaMinus.toFixed(6)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono text-sm ${
                                result.percentMinus > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {result.percentMinus > 0 ? "+" : ""}
                              {result.percentMinus.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
