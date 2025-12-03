import React, { useState, useEffect } from "react";
import { usePlainLanguage } from "@/polymet/data/tenant-settings";
import { getLabel } from "@/polymet/data/terms";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BrainIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  PlusIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  ScanIcon,
  CalendarIcon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  useRetinaStore,
  SimulationSnapshot,
} from "@/polymet/data/retina-store";
import {
  useRAROCThresholds,
  useUtilitySettings,
  useTCORSettings,
  useHorizonMonths,
  getRAROCBadgeColor,
} from "@/polymet/data/tenant-settings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { getScanSignals, ScanSignal } from "@/polymet/data/api-scan-signals";
import { getEvents, Event } from "@/polymet/data/api-events";
import {
  runSimulation,
  DEFAULT_SCENARIO_VARS,
  formatParamSummary,
  getDistParamLabels,
  type ScenarioVar,
  type SimulationResult,
  type DistributionType,
  type UtilityParams,
  type GameInteractionConfig,
  type OptionGameStrategy,
  type DependenceConfig,
} from "@/polymet/data/scenario-engine";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2Icon, TrendingUpIcon, TrashIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MetricsSection } from "@/polymet/components/metrics-section";
import { SimulationComparison } from "@/polymet/components/simulation-comparison";
import {
  exportMetricsCSV,
  exportDecisionsCSV,
} from "@/polymet/data/csv-export-utils";
import { DownloadIcon } from "lucide-react";
import { ScenarioTemplates } from "@/polymet/components/scenario-templates";
import { GameInteractionPanel } from "@/polymet/components/game-interaction-panel";
import { DecisionCloseDialog } from "@/polymet/components/decision-close-dialog";
import { DependencePanel } from "@/polymet/components/dependence-panel";
import {
  BayesianPriorPanel,
  type BayesianPriorConfig,
} from "@/polymet/components/bayesian-prior-panel";
import {
  CopulaMatrixPanel,
  type CopulaMatrixConfig,
} from "@/polymet/components/copula-matrix-panel";
import {
  computeRunFingerprint,
  formatRunId,
} from "@/polymet/data/run-fingerprint";
import { AssumptionsPanel } from "@/polymet/components/assumptions-panel";
import {
  loadAssumptions,
  getCriticalOpenAssumptions,
  type Assumption,
} from "@/polymet/data/assumptions-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptionFinancialsSection } from "@/polymet/components/option-financials-section";
import { TemplatesDrawer } from "@/polymet/components/templates-drawer";
import {
  OptionPartnersSection,
  type Partner,
} from "@/polymet/components/option-partners-section";
import { OptionSummaryCards } from "@/polymet/components/option-summary-cards";
import { BoardSummaryGenerator } from "@/polymet/components/board-summary-generator";
import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
import { PortfolioManager } from "@/polymet/components/portfolio-manager";
import { ResilienceDashboard } from "@/polymet/components/resilience-dashboard";
import { LinkedSignalsPanel } from "@/polymet/components/linked-signals-panel";
import type { LinkedSignal } from "@/polymet/data/retina-store";
import { SignalRefreshBanner } from "@/polymet/components/signal-refresh-banner";
import { DecisionStoryTimeline } from "@/polymet/components/decision-story-timeline";
import {
  GoalSelector,
  type LinkedGoal,
} from "@/polymet/components/goal-selector";
import { DecisionWizard } from "@/polymet/components/decision-wizard";
import { ExpertWorkbench } from "@/polymet/components/expert-workbench";
import { CollapsibleInfoCard } from "@/polymet/components/collapsible-info-card";
import { DecisionHeader } from "@/polymet/components/decision-header";

interface DecisionOption {
  id: string;
  label: string;
  score?: number;
  expectedReturn?: number;
  cost?: number;
  mitigationCost?: number;
  horizonMonths?: number;
  partners?: Partner[];
}

export function RetinaIDecide() {
  const { tenant } = useTenant();
  const { enabled: plainLanguage } = usePlainLanguage(tenant.tenantId);
  const {
    saveClosedDecision,
    addAudit,
    getDecisionsByTenant,
    saveSimulationSnapshot,
    getLastSnapshot,
  } = useRetinaStore();
  const { thresholds } = useRAROCThresholds(tenant.tenantId);
  const { settings: utilitySettings } = useUtilitySettings(tenant.tenantId);
  const { settings: tcorSettings } = useTCORSettings(tenant.tenantId);
  const { horizonMonths, updateHorizonMonths } = useHorizonMonths(
    tenant.tenantId
  );

  // Simple toast notification (inline implementation)
  const toast = ({
    title,
    description,
    variant,
  }: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    console.log(`[Toast ${variant || "default"}] ${title}:`, description);
  };
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedGoals, setLinkedGoals] = useState<LinkedGoal[]>([]);
  const [options, setOptions] = useState<DecisionOption[]>([
    {
      id: "opt-1",
      label: "Option A",
      score: 0,
      expectedReturn: 100,
      cost: 50,
      mitigationCost: 0,
    },
    {
      id: "opt-2",
      label: "Option B",
      score: 0,
      expectedReturn: 120,
      cost: 70,
      mitigationCost: 0,
    },
  ]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [currentDecisionId, setCurrentDecisionId] = useState<string | null>(
    null
  );
  const [draftDecisionId, setDraftDecisionId] = useState<string | null>(null);

  // Scenario Builder state
  const [scenarioVars, setScenarioVars] = useState<ScenarioVar[]>(
    DEFAULT_SCENARIO_VARS
  );
  const [simRuns, setSimRuns] = useState(5000);
  const [simSeed, setSimSeed] = useState(42);
  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[]
  >([]);
  const [previousSnapshot, setPreviousSnapshot] = useState<
    SimulationSnapshot | undefined
  >(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [lastSimulationTime, setLastSimulationTime] = useState<
    number | undefined
  >(undefined);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | undefined>(
    undefined
  );
  const [lastRunId, setLastRunId] = useState<string | undefined>(undefined);

  // Game Interaction state
  const [gameConfig, setGameConfig] = useState<
    GameInteractionConfig | undefined
  >(undefined);
  const [optionStrategies, setOptionStrategies] = useState<
    OptionGameStrategy[] | undefined
  >(undefined);

  // Dependence state
  const [dependenceConfig, setDependenceConfig] = useState<
    DependenceConfig | undefined
  >(undefined);
  const [achievedSpearman, setAchievedSpearman] = useState<number | undefined>(
    undefined
  );

  // Bayesian Prior state
  const [bayesianConfig, setBayesianConfig] = useState<
    BayesianPriorConfig | undefined
  >(undefined);

  // Copula Matrix state
  const [copulaConfig, setCopulaConfig] = useState<
    CopulaMatrixConfig | undefined
  >(undefined);
  const [achievedCopulaMatrix, setAchievedCopulaMatrix] = useState<
    number[][] | undefined
  >(undefined);
  const [copulaFrobeniusError, setCopulaFrobeniusError] = useState<
    number | undefined
  >(undefined);

  // Stress preset state
  const [activeStressPreset, setActiveStressPreset] = useState<string | null>(
    null
  );

  // Baseline comparison state
  const [baselineComparison, setBaselineComparison] = useState<
    | {
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
    | undefined
  >(undefined);

  // Top sensitive factors state (for board summary)
  const [topSensitiveFactors, setTopSensitiveFactors] = useState<
    Array<{
      paramName: string;
      impact: number;
    }>
  >([]);

  // Feedback loop modal state
  const [feedbackLoopOpen, setFeedbackLoopOpen] = useState(false);
  const [selectedDecisionForLoop, setSelectedDecisionForLoop] = useState<
    string | null
  >(null);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Linked signals state
  const [linkedSignals, setLinkedSignals] = useState<LinkedSignal[]>([]);

  // Signals state
  const [signals, setSignals] = useState<ScanSignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsError, setSignalsError] = useState<string | null>(null);

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const closedDecisions = getDecisionsByTenant(tenant.tenantId);

  // Generate UUID v4
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftKey = `retina:draft:${tenant.tenantId}`;
    const savedDraft = localStorage.getItem(draftKey);

    // Check if first-time user (no closed decisions and no draft)
    const hasClosedDecisions = getDecisionsByTenant(tenant.tenantId).length > 0;
    const wizardCompletedKey = `retina:wizard-completed:${tenant.tenantId}`;
    const wizardCompleted = localStorage.getItem(wizardCompletedKey) === "true";

    if (!hasClosedDecisions && !savedDraft && !wizardCompleted) {
      setIsFirstTimeUser(true);
    }

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || "");
        setDescription(draft.description || "");
        setLinkedGoals(draft.linkedGoals || []);
        setOptions(
          draft.options || [
            {
              id: "opt-1",
              label: "Option A",
              score: 0,
              expectedReturn: 100,
              cost: 50,
            },
            {
              id: "opt-2",
              label: "Option B",
              score: 0,
              expectedReturn: 120,
              cost: 70,
            },
          ]
        );
        setDraftDecisionId(draft.id);
        setCurrentDecisionId(draft.id);
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, [tenant.tenantId, getDecisionsByTenant]);

  // Load baseline comparison when decision ID changes
  useEffect(() => {
    if (!currentDecisionId) {
      setBaselineComparison(undefined);
      return;
    }

    const storageKey = `retina:comparison:${currentDecisionId}`;
    const savedComparison = localStorage.getItem(storageKey);
    if (savedComparison) {
      try {
        const comparison = JSON.parse(savedComparison);
        setBaselineComparison(comparison);
      } catch (error) {
        console.error("Failed to load baseline comparison:", error);
      }
    } else {
      setBaselineComparison(undefined);
    }
  }, [currentDecisionId]);

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    if (
      showForm &&
      (title || description || linkedGoals.length > 0 || options.length > 2)
    ) {
      // Generate or reuse decision ID
      const decisionId = draftDecisionId || generateUUID();
      if (!draftDecisionId) {
        setDraftDecisionId(decisionId);
        setCurrentDecisionId(decisionId);
      }

      const draftKey = `retina:draft:${tenant.tenantId}`;
      const draft = {
        id: decisionId,
        title,
        description,
        linkedGoals,
        options,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [
    title,
    description,
    linkedGoals,
    options,
    showForm,
    tenant.tenantId,
    draftDecisionId,
  ]);

  const handleAddOption = () => {
    const newId = `opt-${options.length + 1}`;
    setOptions([
      ...options,
      {
        id: newId,
        label: `Option ${String.fromCharCode(65 + options.length)}`,
        score: 0,
        expectedReturn: 100,
        cost: 50,
      },
    ]);
  };

  const handleUpdateOption = (id: string, label: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, label } : opt)));
  };

  const handleUpdateOptionFinancials = (
    id: string,
    field: "expectedReturn" | "cost" | "mitigationCost" | "horizonMonths",
    value: number | undefined
  ) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
    );

    // Add audit event for horizon updates
    if (field === "horizonMonths") {
      const option = options.find((o) => o.id === id);
      if (option) {
        addAudit("option.horizon.updated", {
          optionId: id,
          optionLabel: option.label,
          horizonMonths: value,
          globalHorizonMonths: horizonMonths,
        });
      }
    }
  };

  const handleUpdatePartners = (optionId: string, partners: Partner[]) => {
    setOptions(
      options.map((opt) => (opt.id === optionId ? { ...opt, partners } : opt))
    );

    // Add audit event for partner updates
    addAudit("option.partners.updated", {
      optionId,
      partnerCount: partners.length,
    });
  };

  // Scenario variable handlers
  const handleAddScenarioVar = () => {
    const newId = `var-${Date.now()}`;
    setScenarioVars([
      ...scenarioVars,
      {
        id: newId,
        name: `Variable ${scenarioVars.length + 1}`,
        appliesTo: "return",
        dist: "normal",
        params: { mean: 0, sd: 1 },
        weight: 1,
      },
    ]);
  };

  const handleRemoveScenarioVar = (id: string) => {
    setScenarioVars(scenarioVars.filter((v) => v.id !== id));
  };

  const handleUpdateScenarioVar = (
    id: string,
    updates: Partial<ScenarioVar>
  ) => {
    setScenarioVars(
      scenarioVars.map((v) => {
        if (v.id !== id) return v;

        const updated = { ...v, ...updates };

        // Reset params when distribution changes
        if (updates.dist && updates.dist !== v.dist) {
          switch (updates.dist) {
            case "normal":
              updated.params = { mean: 0, sd: 1 };
              break;
            case "lognormal":
              updated.params = { mu: 0, sigma: 1 };
              break;
            case "triangular":
              updated.params = { min: -0.2, mode: 0, max: 0.2 };
              break;
            case "uniform":
              updated.params = { min: -0.1, max: 0.1 };
              break;
          }
        }

        return updated;
      })
    );
  };

  const handleUpdateVarParam = (
    varId: string,
    paramKey: string,
    value: number
  ) => {
    setScenarioVars(
      scenarioVars.map((v) =>
        v.id === varId
          ? { ...v, params: { ...v.params, [paramKey]: value } }
          : v
      )
    );
  };

  // Handle template application
  const handleApplyTemplate = (
    variables: ScenarioVar[],
    templateName: string
  ) => {
    setScenarioVars(variables);
    toast({
      title: "Template applied",
      description: `${templateName} has been applied with ${variables.length} variable(s)`,
    });
  };

  // Run simulation
  const handleRunSimulation = async () => {
    if (options.length === 0) {
      toast({
        title: "No options",
        description: "Add at least one option to simulate",
        variant: "destructive",
      });
      return;
    }

    // Get decision ID (use draft or generate new)
    const decisionId = draftDecisionId || generateUUID();
    if (!draftDecisionId) {
      setDraftDecisionId(decisionId);
      setCurrentDecisionId(decisionId);
    }

    // Get previous snapshot for comparison
    const lastSnapshot = getLastSnapshot(decisionId);
    setPreviousSnapshot(lastSnapshot);

    setIsSimulating(true);

    // Simulate async behavior
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Compute run fingerprint
      const runId = await computeRunFingerprint(
        simSeed,
        simRuns,
        options,
        scenarioVars
      );

      // Check if same inputs as last run
      if (lastRunId && lastRunId === runId) {
        toast({
          title: "Same inputs detected",
          description: "Identical results expected (seeded simulation)",
        });
      }

      // Prepare utility params
      const utilityParams: UtilityParams = {
        mode: utilitySettings.mode,
        a: utilitySettings.a,
        scale: utilitySettings.scale,
      };

      // Prepare TCOR params
      const tcorParams = {
        insuranceRate: tcorSettings.insuranceRate,
        contingencyOnCap: tcorSettings.contingencyOnCap,
      };

      // Prepare Bayesian override if configured
      const bayesianOverride = bayesianConfig
        ? {
            targetVarId: bayesianConfig.targetVarId,
            posteriorMean: bayesianConfig.posteriorMean,
            posteriorSd: bayesianConfig.posteriorSd,
          }
        : undefined;

      const results = runSimulation(
        options,
        scenarioVars,
        simRuns,
        simSeed,
        utilityParams,
        tcorParams,
        gameConfig,
        optionStrategies,
        dependenceConfig,
        bayesianOverride,
        copulaConfig,
        horizonMonths
      );

      // Extract achieved Spearman correlation and copula results from first result
      let newAchievedSpearman: number | undefined;
      if (results.length > 0) {
        // Handle copula snapshot
        if (results[0].copulaSnapshot) {
          const copulaSnap = results[0].copulaSnapshot;
          setAchievedCopulaMatrix(copulaSnap.achieved);
          setCopulaFrobeniusError(copulaSnap.froErr);

          // Show toast for copula results
          toast({
            title: "Copula matrix applied",
            description: `Frobenius error: ${copulaSnap.froErr.toFixed(3)} (${copulaSnap.k}×${copulaSnap.k} matrix)`,
          });
        }

        // Handle pairwise dependence
        if (results[0].achievedSpearman !== undefined) {
          newAchievedSpearman = results[0].achievedSpearman;
          setAchievedSpearman(newAchievedSpearman);

          // Check if correlation changed significantly
          if (lastSnapshot?.achievedSpearman !== undefined) {
            const spearmanDelta = Math.abs(
              newAchievedSpearman - lastSnapshot.achievedSpearman
            );
            if (spearmanDelta > 0.1) {
              toast({
                title: "Correlation changed",
                description: `Spearman correlation changed by ${spearmanDelta.toFixed(2)} (${lastSnapshot.achievedSpearman.toFixed(2)} → ${newAchievedSpearman.toFixed(2)})`,
              });
            }
          }
        }
      }
      setSimulationResults(results);
      setCurrentRunId(runId);
      setLastRunId(runId);

      // Capture assumptions snapshot
      const allAssumptions = loadAssumptions(decisionId);
      const criticalOpenAssumptions = getCriticalOpenAssumptions(decisionId);
      const assumptionsSnapshot = {
        count: allAssumptions.length,
        criticalOpen: criticalOpenAssumptions.length,
        list: allAssumptions.map((a) => ({
          id: a.id,
          scope: a.scope,
          statement: a.statement,
          status: a.status,
        })),
      };

      // Create 3x3 preview of copula matrix (first three vars)
      let copulaPreview: number[][] | undefined;
      if (achievedCopulaMatrix && achievedCopulaMatrix.length >= 3) {
        copulaPreview = achievedCopulaMatrix
          .slice(0, 3)
          .map((row) => row.slice(0, 3));
      }

      // Create snapshot with CE, TCOR, achievedSpearman, Bayesian data, assumptions, copula, horizon, and sensitivity baseline
      const snapshot: SimulationSnapshot = {
        runId,
        decisionId,
        tenantId: tenant.tenantId,
        seed: simSeed,
        runs: simRuns,
        timestamp: Date.now(),
        achievedSpearman: newAchievedSpearman,
        bayes: bayesianConfig
          ? {
              varKey:
                scenarioVars.find((v) => v.id === bayesianConfig.targetVarId)
                  ?.name || bayesianConfig.targetVarId,
              muN: bayesianConfig.posteriorMean,
              sigmaN: bayesianConfig.posteriorSd,
              applied: true,
            }
          : undefined,
        assumptions: assumptionsSnapshot,
        copula:
          copulaConfig && achievedCopulaMatrix
            ? {
                k: scenarioVars.length,
                targetSet: true,
                froErr: copulaFrobeniusError,
                achievedPreview: copulaPreview,
              }
            : undefined,
        horizonMonths,
        sensitivityBaseline:
          simulationResults.length > 0
            ? {
                basis: utilitySettings.useForRecommendation ? "CE" : "RAROC",
                optionId: simulationResults[0].optionId,
              }
            : undefined,
        metricsByOption: results.reduce(
          (acc, result) => {
            acc[result.optionId] = {
              optionLabel: result.optionLabel,
              ev: result.ev,
              var95: result.var95,
              cvar95: result.cvar95,
              economicCapital: result.economicCapital,
              raroc: result.raroc,
              ce: result.certaintyEquivalent,
              tcor: result.tcor,
            };
            return acc;
          },
          {} as SimulationSnapshot["metricsByOption"]
        ),
      };

      // Save snapshot
      saveSimulationSnapshot(snapshot);

      // Update last simulation time
      setLastSimulationTime(Date.now());

      // Add audit event for simulation.run with runId, CE/TCOR summary, achievedSpearman, Bayesian data, and assumptions
      const optionSummary = results.map((result) => ({
        optionId: result.optionId,
        optionLabel: result.optionLabel,
        raroc: result.raroc,
        ev: result.ev,
        economicCapital: result.economicCapital,
        ce: result.certaintyEquivalent,
        tcor: result.tcor,
      }));

      addAudit("simulation.run", {
        decisionId,
        runId,
        seed: simSeed,
        runs: simRuns,
        horizonMonths,
        optionCount: options.length,
        variableCount: scenarioVars.length,
        optionSummary,
        achievedSpearman: newAchievedSpearman,
        bayes: bayesianConfig
          ? {
              varKey:
                scenarioVars.find((v) => v.id === bayesianConfig.targetVarId)
                  ?.name || bayesianConfig.targetVarId,
              muN: bayesianConfig.posteriorMean,
              sigmaN: bayesianConfig.posteriorSd,
              applied: true,
            }
          : { applied: false },
        assumptionsCount: assumptionsSnapshot.count,
        criticalOpen: assumptionsSnapshot.criticalOpen,
        copula:
          copulaFrobeniusError !== undefined
            ? { froErr: copulaFrobeniusError }
            : undefined,
      });

      // Add audit event for simulation.rerun if there was a previous snapshot
      if (lastSnapshot) {
        // Calculate diff summary
        const diffSummary = results
          .map((result) => {
            const prevMetrics = lastSnapshot.metricsByOption[result.optionId];
            if (!prevMetrics) return null;

            return {
              optionId: result.optionId,
              optionLabel: result.optionLabel,
              rarocDelta: result.raroc - prevMetrics.raroc,
              evDelta: result.ev - prevMetrics.ev,
            };
          })
          .filter(Boolean);

        addAudit("simulation.rerun", {
          decisionId,
          runId_prev: lastSnapshot.runId,
          runId_new: runId,
          diffSummary,
        });
      }

      toast({
        title: "Simulation complete",
        description: `Ran ${simRuns} simulations across ${options.length} options`,
      });
    } catch (error) {
      toast({
        title: "Simulation failed",
        description: "An error occurred during simulation",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Fetch signals
  const fetchSignals = async (decisionId: string) => {
    setSignalsLoading(true);
    setSignalsError(null);
    try {
      const response = await getScanSignals(decisionId, tenant.tenantId);
      setSignals(response.signals);
    } catch (error) {
      setSignalsError("Failed to load signals");
      console.error("Failed to fetch signals:", error);
    } finally {
      setSignalsLoading(false);
    }
  };

  // Fetch events
  const fetchEvents = async (decisionId?: string) => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const response = await getEvents(tenant.tenantId, decisionId);
      setEvents(response.events);
    } catch (error) {
      setEventsError("Failed to load events");
      console.error("Failed to fetch events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, [tenant.tenantId]);

  // Load signals when decision is created
  useEffect(() => {
    if (currentDecisionId) {
      fetchSignals(currentDecisionId);
    }
  }, [currentDecisionId]);

  const handleConfirmDecision = (
    rationale?: string,
    overrideReason?: string
  ) => {
    if (!title || !selectedOption) return;

    // Use existing draft ID or generate new one
    const decisionId = draftDecisionId || generateUUID();

    // Find simulation results for the chosen option
    const chosenOptionResult = simulationResults.find(
      (r) => r.optionId === selectedOption
    );

    // Get all assumptions and lock them
    const allAssumptions = loadAssumptions(decisionId);
    const lockedAssumptions = allAssumptions.map((a) => ({
      id: a.id,
      scope: a.scope,
      statement: a.statement,
      status: a.status,
      critical: a.critical,
      lockedAt: new Date().toISOString(),
    }));

    // Get critical open assumptions count
    const criticalOpenAssumptions = getCriticalOpenAssumptions(decisionId);

    // Determine basis (RAROC or CE)
    const basis = utilitySettings.useForRecommendation ? "CE" : "RAROC";

    // Build description with linked goals, rationale and override reason
    let finalDescription = description;
    if (linkedGoals.length > 0) {
      const goalsText = linkedGoals
        .map((lg) => {
          const kpisText =
            lg.linked_kpis.length > 0
              ? ` (KPIs: ${lg.linked_kpis.length})`
              : "";
          return `- ${lg.goal_statement} [${lg.goal_category}]${kpisText}`;
        })
        .join("\n");
      finalDescription = `${finalDescription}\n\nLinked Goals & KPIs:\n${goalsText}`;
    }
    if (rationale) {
      finalDescription = `${finalDescription}\n\nDecision Rationale:\n${rationale}`;
    }
    if (overrideReason) {
      finalDescription = `${finalDescription}\n\nAssumptions Override Reason:\n${overrideReason}`;
    }

    const decision = {
      id: decisionId,
      tenantId: tenant.tenantId,
      title,
      description: finalDescription,
      chosenOptionId: selectedOption,
      options,
      closedAt: Date.now(),
      closedBy: "Admin User",
      // Store metrics if simulation was run
      metrics: chosenOptionResult
        ? {
            raroc: chosenOptionResult.raroc,
            ev: chosenOptionResult.ev,
            var95: chosenOptionResult.var95,
            cvar95: chosenOptionResult.cvar95,
            ce: chosenOptionResult.certaintyEquivalent,
            tcor: chosenOptionResult.tcor,
          }
        : undefined,
      basisAtClose: basis,
      achievedSpearmanAtClose: achievedSpearman,
      bayesAtClose: bayesianConfig
        ? {
            varKey:
              scenarioVars.find((v) => v.id === bayesianConfig.targetVarId)
                ?.name || bayesianConfig.targetVarId,
            muN: bayesianConfig.posteriorMean,
            sigmaN: bayesianConfig.posteriorSd,
            applied: true,
          }
        : undefined,
      criticalOpenAtClose: criticalOpenAssumptions.length,
      horizonMonthsAtClose: horizonMonths,
      copulaFroErrAtClose: copulaFrobeniusError,
      lockedAssumptions,
    };

    saveClosedDecision(decision);

    // Enhanced audit event with CE, TCOR, horizon, and copula
    addAudit("decision.closed", {
      decisionId,
      chosenOptionId: selectedOption,
      decisionTitle: title,
      basis,
      horizonMonthsAtClose: horizonMonths,
      copulaFroErrAtClose: copulaFrobeniusError,
      chosen: chosenOptionResult
        ? {
            optionId: selectedOption,
            RAROC: chosenOptionResult.raroc,
            EV: chosenOptionResult.ev,
            EconCap: chosenOptionResult.economicCapital,
            CE: chosenOptionResult.certaintyEquivalent,
            TCOR: chosenOptionResult.tcor,
          }
        : undefined,
    });

    // Set current decision and fetch signals
    setCurrentDecisionId(decisionId);

    console.log("Decision confirmed:", title);

    toast({
      title: "Decision closed",
      description: `${title} has been closed successfully`,
    });

    // Clear draft from localStorage
    const draftKey = `retina:draft:${tenant.tenantId}`;
    localStorage.removeItem(draftKey);

    // Reset form
    setTitle("");
    setDescription("");
    setLinkedGoals([]);
    setOptions([
      {
        id: "opt-1",
        label: "Option A",
        score: 0,
        expectedReturn: 100,
        cost: 50,
      },
      {
        id: "opt-2",
        label: "Option B",
        score: 0,
        expectedReturn: 120,
        cost: 70,
      },
    ]);
    setSelectedOption("");
    setShowForm(false);
    setSimulationResults([]);
    setDraftDecisionId(null);
  };

  // Handle recommendation application
  const handleApplyRecommendation = (
    optionId: string,
    rationale: string,
    isOverride: boolean
  ) => {
    // Set the selected option
    setSelectedOption(optionId);

    // Find the option result for audit
    const optionResult = simulationResults.find((r) => r.optionId === optionId);

    // Add audit event
    addAudit("decision.recommended.applied", {
      optionId,
      raroc: optionResult?.raroc,
      ev: optionResult?.ev,
      economicCapital: optionResult?.economicCapital,
      isOverride,
    });

    // Confirm the decision with the rationale
    setTimeout(() => {
      handleConfirmDecision(rationale);
    }, 100);
  };

  // Handle wizard completion
  const handleWizardComplete = (wizardData: any) => {
    // Apply wizard data to form
    setTitle(wizardData.title);
    setDescription(wizardData.description);
    setLinkedGoals(wizardData.linkedGoals);
    setOptions(wizardData.options);
    setScenarioVars(
      wizardData.scenarioVars.length > 0
        ? wizardData.scenarioVars
        : DEFAULT_SCENARIO_VARS
    );

    // Mark wizard as completed
    const wizardCompletedKey = `retina:wizard-completed:${tenant.tenantId}`;
    localStorage.setItem(wizardCompletedKey, "true");

    // Show form and run simulation
    setShowForm(true);
    setShowWizard(false);
    setIsFirstTimeUser(false);

    // Auto-run simulation after a short delay
    setTimeout(() => {
      handleRunSimulation();
    }, 500);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    setIsFirstTimeUser(false);
  };

  // Show wizard for first-time users
  if (isFirstTimeUser || showWizard) {
    return (
      <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/retina"
            className="hover:text-foreground transition-colors"
          >
            Retina
          </Link>
          <ChevronRightIcon className="w-4 h-4" />

          <Link
            to="/retina/modules"
            className="hover:text-foreground transition-colors"
          >
            Modules
          </Link>
          <ChevronRightIcon className="w-4 h-4" />

          <span className="text-foreground font-medium">i-Decide</span>
        </div>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                Retina · i-Decide
              </h1>
              <Badge variant="secondary" className="text-sm">
                {tenant.tenantName}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Let's create your first decision together
            </p>
          </div>
        </div>

        {/* Wizard */}
        <DecisionWizard
          tenantId={tenant.tenantId}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/retina" className="hover:text-foreground transition-colors">
          Retina
        </Link>
        <ChevronRightIcon className="w-4 h-4" />

        <Link
          to="/retina/modules"
          className="hover:text-foreground transition-colors"
        >
          Modules
        </Link>
        <ChevronRightIcon className="w-4 h-4" />

        <span className="text-foreground font-medium">i-Decide</span>
      </div>

      {/* Page Header with View Mode */}
      <DecisionHeader
        title="Retina · i-Decide"
        tenantName={tenant.tenantName}
        description="AI-powered decision support system"
        onLevelChange={(level, isTemporary) => {
          // Track analytics
          addAudit("interface.level.changed", {
            level,
            isTemporary,
            context: "i-decide",
            timestamp: Date.now(),
          });
        }}
        actions={
          <TemplatesDrawer
            tenantId={tenant.tenantId}
            currentTitle={title}
            currentDescription={description}
            currentOptions={options}
            currentScenarioVars={scenarioVars}
            onApplyTemplate={(
              newTitle,
              newDescription,
              newOptions,
              newScenarioVars
            ) => {
              setTitle(newTitle);
              setDescription(newDescription);
              setOptions(newOptions);
              setScenarioVars(newScenarioVars);
              setShowForm(true);
            }}
            onAuditEvent={addAudit}
          />
        }
      />

      {/* Signal Refresh Banner */}
      <SignalRefreshBanner tenantId={tenant.tenantId} className="mb-6" />

      {/* Main Content */}
      <Tabs defaultValue="decision" className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="decision">Decision</TabsTrigger>
          <TabsTrigger value="story">Decision Story</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
          <TabsTrigger value="resilience">Resilience</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="expert">Expert Workbench</TabsTrigger>
        </TabsList>

        <TabsContent value="decision">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Decision Form & Scenario Builder */}
            <div className="lg:col-span-7 space-y-6">
              {!showForm ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <BrainIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                      i-Decide Lite
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed max-w-md mx-auto">
                      Create and track decisions with AI-powered support. Start
                      by creating a new decision below.
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={() => setShowWizard(true)}>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Use Wizard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowForm(true)}
                      >
                        Advanced Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>New Decision</CardTitle>
                    <CardDescription>
                      Define your decision and evaluate options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Decision Title</Label>
                      <Input
                        id="title"
                        placeholder="What decision needs to be made?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Provide context and details..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <GoalSelector
                        selectedGoals={linkedGoals}
                        onGoalsChange={setLinkedGoals}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddOption}
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {options.map((option, idx) => (
                          <Input
                            key={option.id}
                            placeholder={`Option ${idx + 1}`}
                            value={option.label}
                            onChange={(e) =>
                              handleUpdateOption(option.id, e.target.value)
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Choose Your Decision</Label>
                      <RadioGroup
                        value={selectedOption}
                        onValueChange={setSelectedOption}
                      >
                        {options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem value={option.id} id={option.id} />

                            <Label
                              htmlFor={option.id}
                              className="font-normal cursor-pointer"
                            >
                              {option.label || "Unnamed option"}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setShowCloseDialog(true)}
                        disabled={
                          !title || !selectedOption || linkedGoals.length === 0
                        }
                        className="flex-1"
                      >
                        <CheckCircle2Icon className="w-4 h-4 mr-2" />
                        Confirm Decision
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scenario Builder Panel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-primary" />
                        Scenario Builder
                      </CardTitle>
                      <CardDescription>
                        {getLabel("monteCarlo", { plain: plainLanguage })} with
                        risk metrics
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowScenarioBuilder(!showScenarioBuilder)
                      }
                    >
                      {showScenarioBuilder ? "Hide" : "Show"}
                    </Button>
                  </div>
                </CardHeader>
                {showScenarioBuilder && (
                  <CardContent className="space-y-6">
                    {/* Scenario Templates */}
                    <ScenarioTemplates
                      currentVariables={scenarioVars}
                      onApplyTemplate={handleApplyTemplate}
                      tenantId={tenant.tenantId}
                      onAuditEvent={addAudit}
                    />

                    {/* Simulation Settings */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sim-runs">
                            {getLabel("runs", { plain: plainLanguage })}
                          </Label>
                          <Input
                            id="sim-runs"
                            type="number"
                            value={simRuns}
                            onChange={(e) => setSimRuns(Number(e.target.value))}
                            min={100}
                            max={50000}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sim-seed">
                            {getLabel("seed", { plain: plainLanguage })}
                          </Label>
                          <Input
                            id="sim-seed"
                            type="number"
                            value={simSeed}
                            onChange={(e) => setSimSeed(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Option Financials */}
                    <OptionFinancialsSection
                      options={options}
                      onUpdateOptionFinancials={handleUpdateOptionFinancials}
                      plainLanguage={plainLanguage}
                      globalHorizonMonths={horizonMonths}
                    />

                    {/* Option Partners */}
                    <OptionPartnersSection
                      options={options}
                      onUpdatePartners={handleUpdatePartners}
                    />

                    {/* Linked Signals Panel */}
                    {currentDecisionId && (
                      <LinkedSignalsPanel
                        decisionId={currentDecisionId}
                        linkedSignals={linkedSignals}
                        scenarioVars={scenarioVars.map((v) => ({
                          key: v.id,
                          label: v.name,
                        }))}
                        onUpdateSignals={(signals) => {
                          setLinkedSignals(signals);
                          // Update decision in store with linked signals
                          // In real app, this would save to backend
                        }}
                        onAuditEvent={addAudit}
                      />
                    )}

                    {/* Option Summary Cards with Credit Risk */}
                    {options.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label>Option Summary</Label>
                        </div>
                        <OptionSummaryCards
                          options={options}
                          plainLanguage={plainLanguage}
                          decisionId={currentDecisionId || undefined}
                          simulationResults={simulationResults}
                          onAuditEvent={addAudit}
                        />
                      </div>
                    )}

                    {/* Game Interaction (2×2) Panel */}
                    {currentDecisionId && (
                      <GameInteractionPanel
                        decisionId={currentDecisionId}
                        tenantId={tenant.tenantId}
                        options={options}
                        onConfigChange={(config, strategies) => {
                          setGameConfig(config);
                          setOptionStrategies(strategies);
                        }}
                        onAuditEvent={addAudit}
                      />
                    )}

                    {/* Dependence Panel */}
                    <DependencePanel
                      scenarioVars={scenarioVars}
                      onConfigChange={setDependenceConfig}
                      achievedSpearman={achievedSpearman}
                      onAuditEvent={addAudit}
                      runs={simRuns}
                      onToast={toast}
                    />

                    {/* Copula Matrix (beta) Panel */}
                    <CopulaMatrixPanel
                      scenarioVars={scenarioVars}
                      onConfigChange={setCopulaConfig}
                      achievedMatrix={achievedCopulaMatrix}
                      frobeniusError={copulaFrobeniusError}
                      onAuditEvent={addAudit}
                      runs={simRuns}
                      onToast={toast}
                    />

                    {/* Bayesian Prior Panel */}
                    <BayesianPriorPanel
                      scenarioVars={scenarioVars}
                      onConfigChange={setBayesianConfig}
                      onAuditEvent={addAudit}
                      onToast={toast}
                    />

                    {/* Scenario Variables */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>
                          {getLabel("scenario", { plain: plainLanguage })}{" "}
                          Variables
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddScenarioVar}
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Variable
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {scenarioVars.map((variable) => (
                          <div
                            key={variable.id}
                            className="p-3 border border-border rounded-lg space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Input
                                value={variable.name}
                                onChange={(e) =>
                                  handleUpdateScenarioVar(variable.id, {
                                    name: e.target.value,
                                  })
                                }
                                className="h-8 font-medium"
                                placeholder="Variable name"
                              />

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveScenarioVar(variable.id)
                                }
                                className="shrink-0"
                              >
                                <TrashIcon className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Applies To
                                </Label>
                                <Select
                                  value={variable.appliesTo}
                                  onValueChange={(value: "return" | "cost") =>
                                    handleUpdateScenarioVar(variable.id, {
                                      appliesTo: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="return">
                                      Return
                                    </SelectItem>
                                    <SelectItem value="cost">Cost</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Distribution
                                </Label>
                                <Select
                                  value={variable.dist}
                                  onValueChange={(value: DistributionType) =>
                                    handleUpdateScenarioVar(variable.id, {
                                      dist: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">
                                      Normal
                                    </SelectItem>
                                    <SelectItem value="lognormal">
                                      Lognormal
                                    </SelectItem>
                                    <SelectItem value="triangular">
                                      Triangular
                                    </SelectItem>
                                    <SelectItem value="uniform">
                                      Uniform
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Distribution Parameters */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Parameters: {formatParamSummary(variable)}
                              </Label>
                              <div className="grid grid-cols-3 gap-2">
                                {getDistParamLabels(variable.dist).map(
                                  (paramKey) => (
                                    <div key={paramKey} className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">
                                        {paramKey}
                                      </Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={variable.params[paramKey] ?? 0}
                                        onChange={(e) =>
                                          handleUpdateVarParam(
                                            variable.id,
                                            paramKey,
                                            Number(e.target.value)
                                          )
                                        }
                                        className="h-8"
                                      />
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Weight */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Weight (multiplier strength)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={variable.weight ?? 1}
                                onChange={(e) =>
                                  handleUpdateScenarioVar(variable.id, {
                                    weight: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simulate Button with Run ID */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleRunSimulation}
                        disabled={isSimulating || options.length === 0}
                        className="w-full"
                      >
                        {isSimulating ? (
                          <>
                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                            Simulating...
                          </>
                        ) : (
                          <>
                            <TrendingUpIcon className="w-4 h-4 mr-2" />

                            {getLabel("simulate", { plain: plainLanguage })}
                          </>
                        )}
                      </Button>
                      {currentRunId && (
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="font-mono">
                            {formatRunId(currentRunId)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Stress Preset Banner */}
                    {activeStressPreset && (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-md flex items-center gap-2">
                        <AlertTriangleIcon className="w-4 h-4 text-orange-600 shrink-0" />

                        <div className="text-sm">
                          <span className="font-medium text-orange-700 dark:text-orange-400">
                            Stress: {activeStressPreset}
                          </span>
                          <span className="text-orange-600 dark:text-orange-500 ml-2">
                            (read-only overrides applied)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Simulation Results with Charts */}
                    {simulationResults.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            Simulation Results
                          </div>
                          <div className="flex gap-2">
                            {selectedOption && (
                              <BoardSummaryGenerator
                                decisionTitle={title}
                                chosenOptionId={selectedOption}
                                chosenOptionLabel={
                                  options.find((o) => o.id === selectedOption)
                                    ?.label || "Unknown"
                                }
                                simulationResults={simulationResults}
                                topSensitiveFactors={topSensitiveFactors}
                                partners={
                                  options.find((o) => o.id === selectedOption)
                                    ?.partners || []
                                }
                                onAuditEvent={addAudit}
                                plainLanguage={plainLanguage}
                                decisionId={currentDecisionId || undefined}
                                seed={simSeed}
                                runs={simRuns}
                                options={options}
                                scenarioVars={scenarioVars}
                              />
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const decisionId =
                                  draftDecisionId || currentDecisionId;
                                const allAssumptions = decisionId
                                  ? loadAssumptions(decisionId)
                                  : [];
                                const criticalOpen = decisionId
                                  ? getCriticalOpenAssumptions(decisionId)
                                      .length
                                  : 0;

                                exportMetricsCSV(
                                  simulationResults,
                                  simSeed,
                                  simRuns,
                                  options,
                                  currentRunId,
                                  utilitySettings,
                                  achievedSpearman,
                                  bayesianConfig
                                    ? {
                                        varKey:
                                          scenarioVars.find(
                                            (v) =>
                                              v.id ===
                                              bayesianConfig.targetVarId
                                          )?.name || bayesianConfig.targetVarId,
                                        muN: bayesianConfig.posteriorMean,
                                        sigmaN: bayesianConfig.posteriorSd,
                                      }
                                    : undefined,
                                  {
                                    count: allAssumptions.length,
                                    criticalOpen,
                                  },
                                  horizonMonths,
                                  copulaFrobeniusError
                                );
                              }}
                            >
                              <DownloadIcon className="w-4 h-4 mr-2" />
                              Export Metrics CSV
                            </Button>
                          </div>
                        </div>

                        {/* What Changed? Comparison Panel */}
                        {previousSnapshot && (
                          <SimulationComparison
                            currentResults={simulationResults}
                            previousSnapshot={previousSnapshot}
                            currentSeed={simSeed}
                            currentRuns={simRuns}
                            currentSpearman={achievedSpearman}
                            previousSpearman={previousSnapshot.achievedSpearman}
                            currentHorizonMonths={horizonMonths}
                            currentCopulaFroErr={copulaFrobeniusError}
                            currentCopulaTargetSet={
                              copulaConfig !== undefined &&
                              achievedCopulaMatrix !== undefined
                            }
                          />
                        )}

                        <MetricsSection
                          simulationResults={simulationResults}
                          thresholds={thresholds}
                          utilitySettings={utilitySettings}
                          horizonMonths={horizonMonths}
                          onHorizonChange={(newHorizon) => {
                            updateHorizonMonths(newHorizon);
                            addAudit("settings.horizon.changed", {
                              horizonMonths: newHorizon,
                            });
                          }}
                          keyAssumptions={
                            currentDecisionId
                              ? loadAssumptions(currentDecisionId)
                                  .filter(
                                    (a) =>
                                      a.critical ||
                                      new Date(a.updatedAt).getTime() >
                                        Date.now() - 7 * 24 * 60 * 60 * 1000
                                  )
                                  .sort((a, b) => {
                                    if (a.critical && !b.critical) return -1;
                                    if (!a.critical && b.critical) return 1;
                                    return (
                                      new Date(b.updatedAt).getTime() -
                                      new Date(a.updatedAt).getTime()
                                    );
                                  })
                                  .slice(0, 3)
                              : []
                          }
                          baselineComparison={baselineComparison}
                          onApplyRecommendation={handleApplyRecommendation}
                          onToast={toast}
                          options={options}
                          scenarioVars={scenarioVars}
                          seed={simSeed}
                          runs={simRuns}
                          runId={currentRunId}
                          tcorParams={{
                            insuranceRate: tcorSettings.insuranceRate,
                            contingencyOnCap: tcorSettings.contingencyOnCap,
                          }}
                          gameConfig={gameConfig}
                          optionStrategies={optionStrategies}
                          dependenceConfig={dependenceConfig}
                          bayesianOverride={
                            bayesianConfig
                              ? {
                                  targetVarId: bayesianConfig.targetVarId,
                                  posteriorMean: bayesianConfig.posteriorMean,
                                  posteriorSd: bayesianConfig.posteriorSd,
                                }
                              : undefined
                          }
                          onAuditEvent={addAudit}
                          onStressPresetChange={setActiveStressPreset}
                          decisionId={currentDecisionId || undefined}
                          onTopFactorsChange={setTopSensitiveFactors}
                        />
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Right Column - Signals & Events */}
            <div className="lg:col-span-5 space-y-6">
              {/* Signals from i-Scan */}
              <CollapsibleInfoCard
                title="Signals (i-Scan)"
                description={
                  currentDecisionId
                    ? "Relevant signals for current decision"
                    : "Save decision to fetch signals"
                }
                icon={<ScanIcon className="w-5 h-5 text-primary" />}
                itemCount={signals.length}
                defaultCollapsed={true}
                headerActions={
                  currentDecisionId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchSignals(currentDecisionId)}
                      disabled={signalsLoading}
                    >
                      <RefreshCwIcon
                        className={`w-4 h-4 ${signalsLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  ) : undefined
                }
              >
                <div>
                  {!currentDecisionId ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <InfoIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Save decision to fetch Signals
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create a decision and it will be automatically saved as
                        draft. Signals will be fetched based on the decision
                        context.
                      </p>
                    </div>
                  ) : signalsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4 bg-muted" />

                          <Skeleton className="h-3 w-full bg-muted" />

                          <Skeleton className="h-3 w-1/2 bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : signalsError ? (
                    <div className="text-center py-8 space-y-3">
                      <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto" />

                      <p className="text-sm text-destructive">{signalsError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSignals(currentDecisionId)}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : signals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No signals found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {signals.map((signal, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="font-semibold text-sm">
                              {signal.source}
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {signal.relevance}% relevant
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {signal.snippet}
                          </p>
                          <a
                            href={signal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View source <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleInfoCard>

              {/* Incidents from i-Event */}
              <CollapsibleInfoCard
                title="Incidents (i-Event)"
                description={
                  currentDecisionId
                    ? "Incidents related to current decision"
                    : "Save decision to fetch incidents"
                }
                icon={<CalendarIcon className="w-5 h-5 text-primary" />}
                itemCount={events.length}
                defaultCollapsed={true}
                headerActions={
                  currentDecisionId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchEvents(currentDecisionId)}
                      disabled={eventsLoading}
                    >
                      <RefreshCwIcon
                        className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  ) : undefined
                }
              >
                <div>
                  {!currentDecisionId ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <InfoIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Save decision to fetch Incidents
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create a decision and it will be automatically saved as
                        draft. Incidents will be fetched based on the decision
                        context.
                      </p>
                    </div>
                  ) : eventsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4 bg-muted" />

                          <Skeleton className="h-3 w-full bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : eventsError ? (
                    <div className="text-center py-8 space-y-3">
                      <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto" />

                      <p className="text-sm text-destructive">{eventsError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchEvents(currentDecisionId || undefined)
                        }
                      >
                        Retry
                      </Button>
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No events found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => {
                        const severityConfig = {
                          low: {
                            icon: InfoIcon,
                            color: "text-blue-500",
                            variant: "outline" as const,
                          },
                          medium: {
                            icon: AlertCircleIcon,
                            color: "text-yellow-500",
                            variant: "outline" as const,
                          },
                          high: {
                            icon: AlertTriangleIcon,
                            color: "text-orange-500",
                            variant: "outline" as const,
                          },
                          critical: {
                            icon: AlertTriangleIcon,
                            color: "text-red-500",
                            variant: "destructive" as const,
                          },
                        };
                        const config = severityConfig[event.severity];
                        const Icon = config.icon;

                        return (
                          <div
                            key={event.id}
                            className="p-4 border border-border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-2 flex-1">
                                <Icon
                                  className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`}
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">
                                    {event.title}
                                  </div>
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                <Badge variant={config.variant}>
                                  {event.severity}
                                </Badge>
                                <Badge variant="outline">{event.status}</Badge>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CollapsibleInfoCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="story">
          <div className="max-w-4xl mx-auto">
            {currentDecisionId ? (
              <DecisionStoryTimeline
                decisionId={currentDecisionId}
                decisionTitle={title || "Untitled Decision"}
                onAuditEvent={addAudit}
              />
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <InfoIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a decision to see its story unfold
                  </p>
                  <Button onClick={() => setShowForm(true)} variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Decision
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assumptions">
          <div className="max-w-6xl mx-auto">
            {currentDecisionId ? (
              <AssumptionsPanel
                decisionId={currentDecisionId}
                onAuditEvent={addAudit}
              />
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <InfoIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a decision to start tracking assumptions
                  </p>
                  <Button onClick={() => setShowForm(true)} variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Decision
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="portfolios">
          <div className="max-w-6xl mx-auto">
            <PortfolioManager
              tenantId={tenant.tenantId}
              currentDecisionId={currentDecisionId || undefined}
              currentDecisionTitle={title}
              onAuditEvent={addAudit}
            />
          </div>
        </TabsContent>

        <TabsContent value="resilience">
          <div className="max-w-7xl mx-auto">
            {simulationResults.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <InfoIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run simulation to see resilience analysis
                  </p>
                  <Button
                    onClick={() => handleRunSimulation()}
                    disabled={options.length === 0}
                    variant="outline"
                  >
                    <TrendingUpIcon className="w-4 h-4 mr-2" />
                    Run Simulation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ResilienceDashboard
                simulationResults={simulationResults}
                thresholds={thresholds}
                options={options}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Right Column - Signals & Events */}
            <div className="lg:col-span-12 space-y-6">
              {/* Signals from i-Scan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ScanIcon className="w-5 h-5 text-primary" />

                      <CardTitle>Signals (i-Scan)</CardTitle>
                    </div>
                    {currentDecisionId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchSignals(currentDecisionId)}
                        disabled={signalsLoading}
                      >
                        <RefreshCwIcon
                          className={`w-4 h-4 ${signalsLoading ? "animate-spin" : ""}`}
                        />
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {currentDecisionId
                      ? "Relevant signals for current decision"
                      : "Save decision to fetch signals"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentDecisionId ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <InfoIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Save decision to fetch Signals
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create a decision and it will be automatically saved as
                        draft. Signals will be fetched based on the decision
                        context.
                      </p>
                    </div>
                  ) : signalsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4 bg-muted" />

                          <Skeleton className="h-3 w-full bg-muted" />

                          <Skeleton className="h-3 w-1/2 bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : signalsError ? (
                    <div className="text-center py-8 space-y-3">
                      <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto" />

                      <p className="text-sm text-destructive">{signalsError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSignals(currentDecisionId)}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : signals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No signals found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {signals.map((signal, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="font-semibold text-sm">
                              {signal.source}
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {signal.relevance}% relevant
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {signal.snippet}
                          </p>
                          <a
                            href={signal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View source <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Incidents from i-Event */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />

                      <CardTitle>Incidents (i-Event)</CardTitle>
                    </div>
                    {currentDecisionId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchEvents(currentDecisionId)}
                        disabled={eventsLoading}
                      >
                        <RefreshCwIcon
                          className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`}
                        />
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {currentDecisionId
                      ? "Incidents related to current decision"
                      : "Save decision to fetch incidents"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentDecisionId ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <InfoIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Save decision to fetch Incidents
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create a decision and it will be automatically saved as
                        draft. Incidents will be fetched based on the decision
                        context.
                      </p>
                    </div>
                  ) : eventsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4 bg-muted" />

                          <Skeleton className="h-3 w-full bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : eventsError ? (
                    <div className="text-center py-8 space-y-3">
                      <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto" />

                      <p className="text-sm text-destructive">{eventsError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchEvents(currentDecisionId || undefined)
                        }
                      >
                        Retry
                      </Button>
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No events found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => {
                        const severityConfig = {
                          low: {
                            icon: InfoIcon,
                            color: "text-blue-500",
                            variant: "outline" as const,
                          },
                          medium: {
                            icon: AlertCircleIcon,
                            color: "text-yellow-500",
                            variant: "outline" as const,
                          },
                          high: {
                            icon: AlertTriangleIcon,
                            color: "text-orange-500",
                            variant: "outline" as const,
                          },
                          critical: {
                            icon: AlertTriangleIcon,
                            color: "text-red-500",
                            variant: "destructive" as const,
                          },
                        };
                        const config = severityConfig[event.severity];
                        const Icon = config.icon;

                        return (
                          <div
                            key={event.id}
                            className="p-4 border border-border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-2 flex-1">
                                <Icon
                                  className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`}
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">
                                    {event.title}
                                  </div>
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                <Badge variant={config.variant}>
                                  {event.severity}
                                </Badge>
                                <Badge variant="outline">{event.status}</Badge>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expert">
          <div className="h-[800px]">
            {currentDecisionId && scenarioVars.length > 0 ? (
              <ExpertWorkbench
                decisionId={currentDecisionId}
                tenantId={tenant.tenantId}
                options={options}
                scenarioVars={scenarioVars}
                runs={simRuns}
                onConfigChange={(config) => {
                  console.log("Expert config changed:", config);
                  // Apply configurations
                  if (config.game) {
                    setGameConfig(config.game);
                    setOptionStrategies(config.strategies);
                  }
                  if (config.bayesian) {
                    setBayesianConfig(config.bayesian);
                  }
                  if (config.copula) {
                    setCopulaConfig(config.copula);
                  }
                }}
                onAuditEvent={addAudit}
                onToast={toast}
              />
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <InfoIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a decision and add scenario variables to access the
                    Expert Workbench
                  </p>
                  <Button onClick={() => setShowForm(true)} variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Decision
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Decision Close Dialog with Guardrails */}
      <DecisionCloseDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        decisionTitle={title}
        chosenOptionId={selectedOption}
        chosenOptionLabel={
          options.find((o) => o.id === selectedOption)?.label || "Unknown"
        }
        simulationResults={simulationResults}
        lastSimulationTime={lastSimulationTime}
        thresholds={thresholds}
        assumptions={
          currentDecisionId ? loadAssumptions(currentDecisionId) : []
        }
        onConfirm={handleConfirmDecision}
        onAuditEvent={addAudit}
      />

      {/* Feedback Loop Modal */}
      {selectedDecisionForLoop &&
        (() => {
          const decision = closedDecisions.find(
            (d) => d.id === selectedDecisionForLoop
          );
          if (!decision) return null;

          const chosenOption = decision.options.find(
            (o) => o.id === decision.chosenOptionId
          );

          // Mock outcome and adjustment data (in real app, fetch from backend)
          const hasOutcome = Math.random() > 0.3; // 70% chance of having outcome
          const hasAdjustments = hasOutcome && Math.random() > 0.4; // 60% chance of adjustments if outcome exists

          return (
            <FeedbackLoopModal
              open={feedbackLoopOpen}
              onOpenChange={setFeedbackLoopOpen}
              decisionTitle={decision.title}
              decisionDate={decision.closedAt || Date.now()}
              chosenOption={chosenOption?.label || "Unknown Option"}
              outcomeData={
                hasOutcome
                  ? {
                      logged: true,
                      date:
                        (decision.closedAt || Date.now()) +
                        15 * 24 * 60 * 60 * 1000,
                      summary:
                        Math.random() > 0.5
                          ? "Performance exceeded expectations"
                          : "Results tracking close to projections",
                    }
                  : {
                      logged: false,
                    }
              }
              adjustmentData={
                hasAdjustments
                  ? {
                      count: Math.floor(Math.random() * 3) + 1,
                      lastAdjustment: "Tightened VaR95 threshold by 5%",
                      date:
                        (decision.closedAt || Date.now()) +
                        20 * 24 * 60 * 60 * 1000,
                    }
                  : {
                      count: 0,
                    }
              }
            />
          );
        })()}
    </div>
  );
}
