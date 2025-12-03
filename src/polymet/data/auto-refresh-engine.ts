/**
 * # Auto-Refresh Engine
 *
 * ## Overview
 * Automatically recomputes decision metrics (EV, VaR95, CVaR95, Utility) when linked signals update.
 * Runs as a background job triggered by signal changes.
 *
 * ## Features
 * - Signal change detection
 * - Automatic metric recomputation
 * - Timestamp tracking (last_refreshed_at)
 * - Audit logging
 * - Batch processing for multiple decisions
 * - Configurable refresh thresholds
 *
 * ## Plain-Language Tooltip
 * "When conditions shift, results refresh automatically — no manual rerun needed."
 */

import {
  runSimulation,
  type ScenarioVar,
  type SimulationResult,
} from "@/polymet/data/scenario-engine";
import { useRetinaStore, type Decision } from "@/polymet/data/retina-store";
import {
  fetchSignalValues,
  type SignalUpdate,
} from "@/polymet/data/signal-monitor";
import { generateSignalRefreshEntry } from "@/polymet/data/auto-journal-generator";

// ============================================================================
// Types
// ============================================================================

export interface AutoRefreshConfig {
  enabled: boolean;
  changeThreshold: number; // Minimum % change to trigger refresh (default: 5%)
  batchSize: number; // Max decisions to refresh in one batch
  debounceMs: number; // Debounce time for multiple signal updates
}

export interface RefreshResult {
  decisionId: string;
  decisionTitle: string;
  success: boolean;
  previousResults?: SimulationResult[];
  newResults?: SimulationResult[];
  error?: string;
  refreshedAt: number;
  triggeredBy: SignalUpdate[];
}

export interface MetricComparison {
  optionId: string;
  optionLabel: string;
  ev: { old: number; new: number; delta: number; deltaPercent: number };
  var95: { old: number; new: number; delta: number; deltaPercent: number };
  cvar95: { old: number; new: number; delta: number; deltaPercent: number };
  utility?: { old: number; new: number; delta: number; deltaPercent: number };
}

export interface LearningTraceEntry {
  timestamp: number;
  decisionId: string;
  optionId: string;
  optionLabel: string;
  previousUtility: number;
  newUtility: number;
  deltaUtility: number;
  deltaPercent: number;
  triggeredBy: SignalUpdate[];
  shockMagnitude: number; // Max absolute change % from triggering signals
  recoveryRatio: number; // deltaUtility / shockMagnitude (positive = antifragile)
}

export interface LearningTrace {
  decisionId: string;
  entries: LearningTraceEntry[];
  antifragilityScore?: number; // Computed from recovery ratios
  lastUpdated: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: AutoRefreshConfig = {
  enabled: true,
  changeThreshold: 0.05, // 5% change threshold
  batchSize: 10,
  debounceMs: 2000, // 2 second debounce
};

let globalConfig: AutoRefreshConfig = { ...DEFAULT_CONFIG };

export function setAutoRefreshConfig(config: Partial<AutoRefreshConfig>) {
  globalConfig = { ...globalConfig, ...config };
  localStorage.setItem(
    "retina-auto-refresh-config",
    JSON.stringify(globalConfig)
  );
}

export function getAutoRefreshConfig(): AutoRefreshConfig {
  const stored = localStorage.getItem("retina-auto-refresh-config");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }
  return { ...DEFAULT_CONFIG };
}

// ============================================================================
// Signal Change Detection
// ============================================================================

/**
 * Check if signal updates exceed the change threshold
 */
export function shouldTriggerRefresh(
  updates: SignalUpdate[],
  threshold: number = globalConfig.changeThreshold
): boolean {
  return updates.some((update) => Math.abs(update.change_percent) >= threshold);
}

/**
 * Get all decisions that should be refreshed based on signal updates
 */
export function getDecisionsToRefresh(
  signalUpdates: SignalUpdate[],
  tenantId: string
): Decision[] {
  const store = useRetinaStore.getState();
  const allDecisions = store.decisions.filter((d) => d.tenantId === tenantId);

  const decisionsToRefresh: Decision[] = [];

  for (const decision of allDecisions) {
    if (!decision.linked_signals || decision.linked_signals.length === 0) {
      continue;
    }

    // Check if any of the decision's linked signals have updates
    const relevantUpdates = signalUpdates.filter((update) =>
      decision.linked_signals?.some((ls) => ls.signal_id === update.signal_id)
    );

    if (relevantUpdates.length > 0 && shouldTriggerRefresh(relevantUpdates)) {
      decisionsToRefresh.push(decision);
    }
  }

  return decisionsToRefresh;
}

// ============================================================================
// Metric Recomputation
// ============================================================================

/**
 * Recompute metrics for a single decision
 */
export async function recomputeDecisionMetrics(
  decision: Decision,
  signalUpdates: SignalUpdate[]
): Promise<RefreshResult> {
  try {
    // Get previous results
    const previousResults = decision.simulationResults || [];

    // Update scenario variables with new signal values
    const updatedScenarioVars = updateScenarioVarsWithSignals(
      decision.scenarioVars || [],
      decision.linked_signals || [],
      signalUpdates
    );

    // Rerun simulation with updated values
    const newResults = runSimulation(
      decision.options || [],
      updatedScenarioVars,
      decision.seed || 42,
      decision.runs || 1000,
      decision.utilityParams,
      decision.tcorParams,
      decision.gameConfig,
      decision.optionStrategies,
      decision.dependenceConfig,
      decision.bayesianOverride,
      decision.copulaConfig
    );

    // Update decision in store
    const store = useRetinaStore.getState();
    const updatedDecision: Decision = {
      ...decision,
      simulationResults: newResults,
      scenarioVars: updatedScenarioVars,
      last_refreshed_at: Date.now(),
    };

    // Update the decision in the store
    const decisions = store.decisions.map((d) =>
      d.id === decision.id ? updatedDecision : d
    );
    store.setDecisions(decisions);

    return {
      decisionId: decision.id,
      decisionTitle: decision.title || "Untitled Decision",
      success: true,
      previousResults,
      newResults,
      refreshedAt: Date.now(),
      triggeredBy: signalUpdates,
    };
  } catch (error) {
    return {
      decisionId: decision.id,
      decisionTitle: decision.title || "Untitled Decision",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: Date.now(),
      triggeredBy: signalUpdates,
    };
  }
}

/**
 * Update scenario variables with new signal values
 */
function updateScenarioVarsWithSignals(
  scenarioVars: ScenarioVar[],
  linkedSignals: any[],
  signalUpdates: SignalUpdate[]
): ScenarioVar[] {
  const updatedVars = [...scenarioVars];

  for (const linkedSignal of linkedSignals) {
    const update = signalUpdates.find(
      (u) => u.signal_id === linkedSignal.signal_id
    );
    if (!update) continue;

    // Find the scenario variable that this signal affects
    const varIndex = updatedVars.findIndex(
      (v) => v.key === linkedSignal.variable_name
    );
    if (varIndex === -1) continue;

    const scenarioVar = updatedVars[varIndex];

    // Update the variable's parameters based on signal direction
    if (linkedSignal.direction === "positive") {
      // Positive correlation: increase mean
      if (scenarioVar.dist === "normal" || scenarioVar.dist === "lognormal") {
        const changeRatio = update.new_value / update.old_value;
        updatedVars[varIndex] = {
          ...scenarioVar,
          params: [scenarioVar.params[0] * changeRatio, scenarioVar.params[1]],
        };
      } else if (scenarioVar.dist === "uniform") {
        const changeRatio = update.new_value / update.old_value;
        updatedVars[varIndex] = {
          ...scenarioVar,
          params: [
            scenarioVar.params[0] * changeRatio,
            scenarioVar.params[1] * changeRatio,
          ],
        };
      }
    } else if (linkedSignal.direction === "negative") {
      // Negative correlation: decrease mean
      if (scenarioVar.dist === "normal" || scenarioVar.dist === "lognormal") {
        const changeRatio = update.old_value / update.new_value;
        updatedVars[varIndex] = {
          ...scenarioVar,
          params: [scenarioVar.params[0] * changeRatio, scenarioVar.params[1]],
        };
      } else if (scenarioVar.dist === "uniform") {
        const changeRatio = update.old_value / update.new_value;
        updatedVars[varIndex] = {
          ...scenarioVar,
          params: [
            scenarioVar.params[0] * changeRatio,
            scenarioVar.params[1] * changeRatio,
          ],
        };
      }
    }
  }

  return updatedVars;
}

/**
 * Batch recompute metrics for multiple decisions
 */
export async function batchRecomputeMetrics(
  decisions: Decision[],
  signalUpdates: SignalUpdate[],
  onProgress?: (completed: number, total: number) => void
): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];
  const batchSize = globalConfig.batchSize;

  for (let i = 0; i < decisions.length; i += batchSize) {
    const batch = decisions.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((decision) => {
        // Filter signal updates relevant to this decision
        const relevantUpdates = signalUpdates.filter((update) =>
          decision.linked_signals?.some(
            (ls) => ls.signal_id === update.signal_id
          )
        );
        return recomputeDecisionMetrics(decision, relevantUpdates);
      })
    );

    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, decisions.length), decisions.length);
    }
  }

  return results;
}

// ============================================================================
// Metric Comparison
// ============================================================================

/**
 * Compare old and new metrics
 */
export function compareMetrics(
  previousResults: SimulationResult[],
  newResults: SimulationResult[]
): MetricComparison[] {
  const comparisons: MetricComparison[] = [];

  for (const newResult of newResults) {
    const oldResult = previousResults.find(
      (r) => r.optionId === newResult.optionId
    );
    if (!oldResult) continue;

    const evDelta = newResult.ev - oldResult.ev;
    const var95Delta = newResult.var95 - oldResult.var95;
    const cvar95Delta = (newResult.cvar95 || 0) - (oldResult.cvar95 || 0);

    comparisons.push({
      optionId: newResult.optionId,
      optionLabel: newResult.optionLabel,
      ev: {
        old: oldResult.ev,
        new: newResult.ev,
        delta: evDelta,
        deltaPercent:
          oldResult.ev !== 0 ? (evDelta / Math.abs(oldResult.ev)) * 100 : 0,
      },
      var95: {
        old: oldResult.var95,
        new: newResult.var95,
        delta: var95Delta,
        deltaPercent:
          oldResult.var95 !== 0
            ? (var95Delta / Math.abs(oldResult.var95)) * 100
            : 0,
      },
      cvar95: {
        old: oldResult.cvar95 || 0,
        new: newResult.cvar95 || 0,
        delta: cvar95Delta,
        deltaPercent:
          oldResult.cvar95 && oldResult.cvar95 !== 0
            ? (cvar95Delta / Math.abs(oldResult.cvar95)) * 100
            : 0,
      },
      utility:
        oldResult.utility && newResult.utility
          ? {
              old: oldResult.utility,
              new: newResult.utility,
              delta: newResult.utility - oldResult.utility,
              deltaPercent:
                oldResult.utility !== 0
                  ? ((newResult.utility - oldResult.utility) /
                      Math.abs(oldResult.utility)) *
                    100
                  : 0,
            }
          : undefined,
    });
  }

  return comparisons;
}

// ============================================================================
// Learning Trace Management
// ============================================================================

const LEARNING_TRACE_KEY = "retina:learning-trace";

/**
 * Get learning trace for a decision
 */
export function getLearningTrace(
  decisionId: string,
  tenantId: string
): LearningTrace | null {
  const key = `${LEARNING_TRACE_KEY}:${tenantId}:${decisionId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Get all learning traces for a tenant
 */
export function getAllLearningTraces(tenantId: string): LearningTrace[] {
  const traces: LearningTrace[] = [];
  const prefix = `${LEARNING_TRACE_KEY}:${tenantId}:`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          traces.push(JSON.parse(stored));
        } catch {
          // Skip invalid entries
        }
      }
    }
  }

  return traces;
}

/**
 * Update learning trace with new utility comparison
 * Plain-Language Tooltip: "Tracks how well decisions bounce back or improve after shocks."
 */
export function updateLearningTrace(
  decisionId: string,
  tenantId: string,
  comparisons: MetricComparison[],
  signalUpdates: SignalUpdate[]
): LearningTrace {
  // Get existing trace or create new one
  let trace = getLearningTrace(decisionId, tenantId);
  if (!trace) {
    trace = {
      decisionId,
      entries: [],
      lastUpdated: Date.now(),
    };
  }

  // Calculate shock magnitude (max absolute change from signals)
  const shockMagnitude = Math.max(
    ...signalUpdates.map((u) => Math.abs(u.change_percent * 100))
  );

  // Create new entries for each option with utility data
  const newEntries: LearningTraceEntry[] = [];

  for (const comparison of comparisons) {
    if (!comparison.utility) continue;

    const deltaUtility = comparison.utility.delta;
    const recoveryRatio =
      shockMagnitude !== 0 ? deltaUtility / shockMagnitude : 0;

    newEntries.push({
      timestamp: Date.now(),
      decisionId,
      optionId: comparison.optionId,
      optionLabel: comparison.optionLabel,
      previousUtility: comparison.utility.old,
      newUtility: comparison.utility.new,
      deltaUtility,
      deltaPercent: comparison.utility.deltaPercent,
      triggeredBy: signalUpdates,
      shockMagnitude,
      recoveryRatio,
    });
  }

  // Add new entries to trace
  trace.entries.push(...newEntries);

  // Keep only last 100 entries per decision
  if (trace.entries.length > 100) {
    trace.entries = trace.entries.slice(-100);
  }

  // Compute antifragility score (average recovery ratio)
  // Positive = antifragile (improves under stress)
  // Negative = fragile (degrades under stress)
  if (trace.entries.length > 0) {
    const avgRecoveryRatio =
      trace.entries.reduce((sum, e) => sum + e.recoveryRatio, 0) /
      trace.entries.length;
    trace.antifragilityScore = avgRecoveryRatio;
  }

  trace.lastUpdated = Date.now();

  // Save to localStorage
  const key = `${LEARNING_TRACE_KEY}:${tenantId}:${decisionId}`;
  localStorage.setItem(key, JSON.stringify(trace));

  return trace;
}

/**
 * Get antifragility score for a decision
 * Returns a score between -1 (very fragile) and +1 (very antifragile)
 */
export function getAntifragilityScore(
  decisionId: string,
  tenantId: string
): number | null {
  const trace = getLearningTrace(decisionId, tenantId);
  return trace?.antifragilityScore ?? null;
}

/**
 * Get antifragility classification
 */
export function classifyAntifragility(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 0.5) {
    return {
      label: "Highly Antifragile",
      color: "text-green-600 dark:text-green-400",
      description: "Consistently improves under stress",
    };
  } else if (score >= 0.1) {
    return {
      label: "Antifragile",
      color: "text-green-600 dark:text-green-400",
      description: "Generally benefits from volatility",
    };
  } else if (score >= -0.1) {
    return {
      label: "Robust",
      color: "text-blue-600 dark:text-blue-400",
      description: "Maintains performance under stress",
    };
  } else if (score >= -0.5) {
    return {
      label: "Fragile",
      color: "text-amber-600 dark:text-amber-400",
      description: "Degrades under stress",
    };
  } else {
    return {
      label: "Highly Fragile",
      color: "text-red-600 dark:text-red-400",
      description: "Severely impacted by volatility",
    };
  }
}

/**
 * Clear learning trace for a decision
 */
export function clearLearningTrace(decisionId: string, tenantId: string) {
  const key = `${LEARNING_TRACE_KEY}:${tenantId}:${decisionId}`;
  localStorage.removeItem(key);
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Log auto-refresh audit event
 */
export function logAutoRefreshEvent(
  result: RefreshResult,
  comparisons: MetricComparison[],
  tenantId: string
) {
  const store = useRetinaStore.getState();

  const significantChanges = comparisons.filter(
    (c) =>
      Math.abs(c.ev.deltaPercent) > 5 ||
      Math.abs(c.var95.deltaPercent) > 5 ||
      Math.abs(c.cvar95.deltaPercent) > 5
  );

  store.addAudit("decision.auto_refreshed", {
    decisionId: result.decisionId,
    decisionTitle: result.decisionTitle,
    tenantId,
    triggeredBy: result.triggeredBy.map((u) => ({
      signal_id: u.signal_id,
      signal_label: u.signal_label,
      change_percent: u.change_percent,
    })),
    refreshedAt: result.refreshedAt,
    success: result.success,
    significantChanges: significantChanges.map((c) => ({
      optionId: c.optionId,
      optionLabel: c.optionLabel,
      ev_change: c.ev.deltaPercent.toFixed(2) + "%",
      var95_change: c.var95.deltaPercent.toFixed(2) + "%",
      cvar95_change: c.cvar95.deltaPercent.toFixed(2) + "%",
      utility_change: c.utility
        ? c.utility.deltaPercent.toFixed(2) + "%"
        : "N/A",
    })),
    message: "Decision auto-updated due to signal change.",
  });

  // Generate automatic journal entry for signal refresh
  if (comparisons.length > 0) {
    generateSignalRefreshEntry(
      result.decisionId,
      result.decisionTitle,
      tenantId,
      result.triggeredBy,
      comparisons
    );
  }

  // Update learning trace if utility data is available
  const hasUtilityData = comparisons.some((c) => c.utility !== undefined);
  if (hasUtilityData) {
    updateLearningTrace(
      result.decisionId,
      tenantId,
      comparisons,
      result.triggeredBy
    );

    // Log learning trace update
    store.addAudit("decision.learning_trace_updated", {
      decisionId: result.decisionId,
      decisionTitle: result.decisionTitle,
      tenantId,
      timestamp: Date.now(),
      utilityChanges: comparisons
        .filter((c) => c.utility)
        .map((c) => ({
          optionId: c.optionId,
          optionLabel: c.optionLabel,
          deltaUtility: c.utility!.delta,
          deltaPercent: c.utility!.deltaPercent,
        })),
      message: "Learning trace updated.",
    });
  }
}

// ============================================================================
// Background Job Trigger
// ============================================================================

let debounceTimer: NodeJS.Timeout | null = null;
let pendingUpdates: SignalUpdate[] = [];

/**
 * Main trigger function called when signals update
 * Debounces multiple updates and triggers batch refresh
 */
export function onSignalUpdate(
  signalUpdates: SignalUpdate[],
  tenantId: string,
  onComplete?: (results: RefreshResult[]) => void
) {
  const config = getAutoRefreshConfig();

  if (!config.enabled) {
    console.log("[Auto-Refresh] Disabled, skipping refresh");
    return;
  }

  // Add to pending updates
  pendingUpdates.push(...signalUpdates);

  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set new debounce timer
  debounceTimer = setTimeout(async () => {
    console.log(
      `[Auto-Refresh] Processing ${pendingUpdates.length} signal updates for tenant ${tenantId}`
    );

    // Get decisions to refresh
    const decisionsToRefresh = getDecisionsToRefresh(pendingUpdates, tenantId);

    if (decisionsToRefresh.length === 0) {
      console.log("[Auto-Refresh] No decisions to refresh");
      pendingUpdates = [];
      return;
    }

    console.log(
      `[Auto-Refresh] Refreshing ${decisionsToRefresh.length} decisions`
    );

    // Batch recompute
    const results = await batchRecomputeMetrics(
      decisionsToRefresh,
      pendingUpdates,
      (completed, total) => {
        console.log(`[Auto-Refresh] Progress: ${completed}/${total}`);
      }
    );

    // Log audit events for successful refreshes
    for (const result of results) {
      if (result.success && result.previousResults && result.newResults) {
        const comparisons = compareMetrics(
          result.previousResults,
          result.newResults
        );
        logAutoRefreshEvent(result, comparisons, tenantId);
      }
    }

    console.log(
      `[Auto-Refresh] Completed: ${results.filter((r) => r.success).length} successful, ${results.filter((r) => !r.success).length} failed`
    );

    // Clear pending updates
    pendingUpdates = [];

    // Callback
    if (onComplete) {
      onComplete(results);
    }
  }, config.debounceMs);
}

/**
 * Manually trigger refresh for specific decisions
 */
export async function manualRefresh(
  decisionIds: string[],
  tenantId: string,
  onComplete?: (results: RefreshResult[]) => void
): Promise<RefreshResult[]> {
  const store = useRetinaStore.getState();
  const decisions = store.decisions.filter(
    (d) => decisionIds.includes(d.id) && d.tenantId === tenantId
  );

  if (decisions.length === 0) {
    return [];
  }

  // Get current signal values for linked signals
  const signalUpdates: SignalUpdate[] = [];
  const allSignalIds = new Set<string>();

  for (const decision of decisions) {
    if (!decision.linked_signals) continue;
    decision.linked_signals.forEach((ls) => allSignalIds.add(ls.signal_id));
  }

  const currentValues = await fetchSignalValues(Array.from(allSignalIds));

  for (const decision of decisions) {
    if (!decision.linked_signals) continue;

    for (const linkedSignal of decision.linked_signals) {
      const currentValue = currentValues[linkedSignal.signal_id];
      if (currentValue !== undefined) {
        signalUpdates.push({
          signal_id: linkedSignal.signal_id,
          signal_label: linkedSignal.signal_label,
          old_value: linkedSignal.last_value || currentValue,
          new_value: currentValue,
          change_percent:
            linkedSignal.last_value && linkedSignal.last_value !== 0
              ? (currentValue - linkedSignal.last_value) /
                linkedSignal.last_value
              : 0,
          timestamp: Date.now(),
        });
      }
    }
  }

  const results = await batchRecomputeMetrics(decisions, signalUpdates);

  // Log audit events
  for (const result of results) {
    if (result.success && result.previousResults && result.newResults) {
      const comparisons = compareMetrics(
        result.previousResults,
        result.newResults
      );
      logAutoRefreshEvent(result, comparisons, tenantId);
    }
  }

  if (onComplete) {
    onComplete(results);
  }

  return results;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  onSignalUpdate,
  manualRefresh,
  setAutoRefreshConfig,
  getAutoRefreshConfig,
  recomputeDecisionMetrics,
  batchRecomputeMetrics,
  compareMetrics,
  shouldTriggerRefresh,
  getDecisionsToRefresh,
  getLearningTrace,
  getAllLearningTraces,
  updateLearningTrace,
  getAntifragilityScore,
  classifyAntifragility,
  clearLearningTrace,
};
