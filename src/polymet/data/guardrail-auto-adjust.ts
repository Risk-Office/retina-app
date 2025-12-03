import type { Guardrail } from "@/polymet/data/decision-guardrails";
import {
  loadGuardrails,
  updateGuardrail,
} from "@/polymet/data/decision-guardrails";
import {
  loadViolations,
  recordViolation,
  type GuardrailViolation,
} from "@/polymet/data/guardrail-violations";
import { generateGuardrailAdjustmentEntry } from "@/polymet/data/auto-journal-generator";

export interface ActualOutcome {
  id: string;
  decisionId: string;
  optionId: string;
  optionLabel: string;
  metricName: string;
  actualValue: number;
  recordedAt: string;
  source: "signal" | "incident" | "manual";
  sourceId?: string;
  notes?: string;
}

export interface AutoAdjustmentRecord {
  id: string;
  guardrailId: string;
  decisionId: string;
  optionId: string;
  metricName: string;
  oldThreshold: number;
  newThreshold: number;
  adjustmentPercent: number;
  reason: string;
  triggeredBy: string[];
  adjustedAt: string;
  severity?: "minor" | "moderate" | "severe" | "critical";
  breachSeverityPercent?: number;
  emailSent?: boolean;
  emailRecipients?: string[];
}

export interface AutoAdjustConfig {
  breachWindowDays: number;
  breachThresholdCount: number;
  tighteningPercent: number;
  severityBasedAdjustment: boolean;
  emailNotifications: boolean;
  emailRecipients: string[];
}

export interface AdjustmentTrend {
  date: string;
  count: number;
  avgSeverity: number;
  metrics: {
    [metricName: string]: number;
  };
}

// Default constants (can be overridden per tenant)
const DEFAULT_BREACH_WINDOW_DAYS = 90;
const DEFAULT_BREACH_THRESHOLD_COUNT = 2;
const DEFAULT_TIGHTENING_PERCENT = 0.1; // 10%
const DEFAULT_SEVERITY_BASED_ADJUSTMENT = true;

// Severity thresholds for smart adjustments
const SEVERITY_THRESHOLDS = {
  minor: 0.05, // 5% over threshold
  moderate: 0.15, // 15% over threshold
  severe: 0.3, // 30% over threshold
};

// Tightening percentages based on severity
const SEVERITY_TIGHTENING = {
  minor: 0.05, // 5% tightening
  moderate: 0.1, // 10% tightening
  severe: 0.15, // 15% tightening
  critical: 0.2, // 20% tightening
};

// Generate UUID v4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Storage keys
const getOutcomesKey = (decisionId: string) => `retina:outcomes:${decisionId}`;
const getAdjustmentsKey = (decisionId: string) =>
  `retina:guardrail-adjustments:${decisionId}`;
const getConfigKey = (tenantId: string) =>
  `retina:auto-adjust-config:${tenantId}`;

// Load actual outcomes
export function loadActualOutcomes(decisionId: string): ActualOutcome[] {
  const key = getOutcomesKey(decisionId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse outcomes:", error);
    return [];
  }
}

// Save actual outcomes
function saveActualOutcomes(
  decisionId: string,
  outcomes: ActualOutcome[]
): void {
  const key = getOutcomesKey(decisionId);
  localStorage.setItem(key, JSON.stringify(outcomes));
}

// Load adjustment records
export function loadAdjustmentRecords(
  decisionId: string
): AutoAdjustmentRecord[] {
  const key = getAdjustmentsKey(decisionId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse adjustments:", error);
    return [];
  }
}

// Save adjustment records
function saveAdjustmentRecords(
  decisionId: string,
  records: AutoAdjustmentRecord[]
): void {
  const key = getAdjustmentsKey(decisionId);
  localStorage.setItem(key, JSON.stringify(records));
}

// Log an actual outcome from signals/incidents
export function logActualOutcome(
  decisionId: string,
  optionId: string,
  optionLabel: string,
  metricName: string,
  actualValue: number,
  source: "signal" | "incident" | "manual",
  sourceId?: string,
  notes?: string
): ActualOutcome {
  const outcomes = loadActualOutcomes(decisionId);

  const outcome: ActualOutcome = {
    id: generateUUID(),
    decisionId,
    optionId,
    optionLabel,
    metricName,
    actualValue,
    recordedAt: new Date().toISOString(),
    source,
    sourceId,
    notes,
  };

  outcomes.push(outcome);
  saveActualOutcomes(decisionId, outcomes);

  return outcome;
}

// Check if a guardrail is breached by an actual outcome
function isGuardrailBreached(
  guardrail: Guardrail,
  actualValue: number
): boolean {
  if (guardrail.direction === "above") {
    return actualValue > guardrail.thresholdValue;
  } else {
    return actualValue < guardrail.thresholdValue;
  }
}

// Get breaches within the specified time window
function getRecentBreaches(
  decisionId: string,
  guardrailId: string,
  windowDays: number
): GuardrailViolation[] {
  const violations = loadViolations(decisionId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);

  return violations.filter((v) => {
    const violatedDate = new Date(v.violatedAt);
    return v.guardrailId === guardrailId && violatedDate >= cutoffDate;
  });
}

// Calculate breach severity
function calculateBreachSeverity(
  actualValue: number,
  thresholdValue: number,
  direction: "above" | "below"
): { severity: "minor" | "moderate" | "severe" | "critical"; percent: number } {
  let breachPercent: number;

  if (direction === "above") {
    breachPercent = (actualValue - thresholdValue) / thresholdValue;
  } else {
    breachPercent = (thresholdValue - actualValue) / thresholdValue;
  }

  breachPercent = Math.abs(breachPercent);

  let severity: "minor" | "moderate" | "severe" | "critical";
  if (breachPercent >= SEVERITY_THRESHOLDS.severe) {
    severity = "critical";
  } else if (breachPercent >= SEVERITY_THRESHOLDS.moderate) {
    severity = "severe";
  } else if (breachPercent >= SEVERITY_THRESHOLDS.minor) {
    severity = "moderate";
  } else {
    severity = "minor";
  }

  return { severity, percent: breachPercent * 100 };
}

// Calculate new threshold after tightening
function calculateTightenedThreshold(
  currentThreshold: number,
  direction: "above" | "below",
  tighteningPercent: number,
  severityBasedAdjustment: boolean = false,
  severity?: "minor" | "moderate" | "severe" | "critical"
): { newThreshold: number; adjustmentPercent: number } {
  let adjustmentPercent = tighteningPercent;

  // Use severity-based adjustment if enabled
  if (severityBasedAdjustment && severity) {
    adjustmentPercent = SEVERITY_TIGHTENING[severity];
  }

  let newThreshold: number;
  if (direction === "above") {
    // For "above" thresholds, tighten by reducing the threshold
    newThreshold = currentThreshold * (1 - adjustmentPercent);
  } else {
    // For "below" thresholds, tighten by increasing the threshold
    newThreshold = currentThreshold * (1 + adjustmentPercent);
  }

  return { newThreshold, adjustmentPercent: adjustmentPercent * 100 };
}

// Auto-adjust guardrail if breach conditions are met
export function autoAdjustGuardrail(
  decisionId: string,
  guardrailId: string,
  violationIds: string[],
  tenantId: string,
  severity?: "minor" | "moderate" | "severe" | "critical",
  breachSeverityPercent?: number,
  decisionTitle?: string
): AutoAdjustmentRecord | null {
  const guardrails = loadGuardrails(decisionId);
  const guardrail = guardrails.find((g) => g.id === guardrailId);

  if (!guardrail) {
    console.error("Guardrail not found:", guardrailId);
    return null;
  }

  // Load tenant configuration
  const config = loadAutoAdjustConfig(tenantId);

  // Calculate new threshold
  const oldThreshold = guardrail.thresholdValue;
  const { newThreshold, adjustmentPercent } = calculateTightenedThreshold(
    oldThreshold,
    guardrail.direction,
    config.tighteningPercent,
    config.severityBasedAdjustment,
    severity
  );

  // Update the guardrail
  const updated = updateGuardrail(decisionId, guardrailId, {
    thresholdValue: newThreshold,
  });

  if (!updated) {
    console.error("Failed to update guardrail:", guardrailId);
    return null;
  }

  // Create adjustment record
  const adjustmentRecord: AutoAdjustmentRecord = {
    id: generateUUID(),
    guardrailId,
    decisionId,
    optionId: guardrail.optionId,
    metricName: guardrail.metricName,
    oldThreshold,
    newThreshold,
    adjustmentPercent,
    reason: severity
      ? `Guardrail auto-adjusted due to ${severity} repeated breach.`
      : "Guardrail auto-adjusted due to repeated breach.",
    triggeredBy: violationIds,
    adjustedAt: new Date().toISOString(),
    severity,
    breachSeverityPercent,
    emailSent: false,
    emailRecipients: config.emailRecipients,
  };

  // Save adjustment record
  const adjustments = loadAdjustmentRecords(decisionId);
  adjustments.push(adjustmentRecord);
  saveAdjustmentRecords(decisionId, adjustments);

  // Generate automatic journal entry
  if (decisionTitle) {
    generateGuardrailAdjustmentEntry(
      decisionId,
      decisionTitle,
      tenantId,
      adjustmentRecord
    );
  }

  return adjustmentRecord;
}

// Process an actual outcome and check for auto-adjustment
export function processActualOutcome(
  decisionId: string,
  optionId: string,
  optionLabel: string,
  metricName: string,
  actualValue: number,
  source: "signal" | "incident" | "manual",
  tenantId: string,
  sourceId?: string,
  notes?: string,
  onAuditEvent?: (eventType: string, payload: any) => void
): {
  outcome: ActualOutcome;
  violation?: GuardrailViolation;
  adjustment?: AutoAdjustmentRecord;
} {
  // Load tenant configuration
  const config = loadAutoAdjustConfig(tenantId);

  // Log the actual outcome
  const outcome = logActualOutcome(
    decisionId,
    optionId,
    optionLabel,
    metricName,
    actualValue,
    source,
    sourceId,
    notes
  );

  // Find matching guardrail
  const guardrails = loadGuardrails(decisionId);
  const matchingGuardrail = guardrails.find(
    (g) => g.optionId === optionId && g.metricName === metricName
  );

  if (!matchingGuardrail) {
    return { outcome };
  }

  // Check if guardrail is breached
  const isBreached = isGuardrailBreached(matchingGuardrail, actualValue);

  if (!isBreached) {
    return { outcome };
  }

  // Calculate breach severity
  const { severity, percent: breachSeverityPercent } = calculateBreachSeverity(
    actualValue,
    matchingGuardrail.thresholdValue,
    matchingGuardrail.direction
  );

  // Record violation
  const violation = recordViolation(
    matchingGuardrail,
    optionLabel,
    actualValue,
    false
  );

  // Log audit event for violation
  if (onAuditEvent) {
    onAuditEvent("guardrail.outcome_breach", {
      guardrailId: matchingGuardrail.id,
      violationId: violation.id,
      optionId,
      metricName,
      actualValue,
      thresholdValue: matchingGuardrail.thresholdValue,
      source,
      sourceId,
      severity,
      breachSeverityPercent,
    });
  }

  // Check for repeated breaches within the window
  const recentBreaches = getRecentBreaches(
    decisionId,
    matchingGuardrail.id,
    config.breachWindowDays
  );

  // If we have enough breaches (including this one), auto-adjust
  if (recentBreaches.length >= config.breachThresholdCount) {
    const violationIds = recentBreaches.map((v) => v.id);

    // Get decision title from store for journal entry
    const decisions = JSON.parse(
      localStorage.getItem("retina:decisions") || "[]"
    );
    const decision = decisions.find((d: any) => d.id === decisionId);
    const decisionTitle = decision?.title || "Untitled Decision";

    const adjustment = autoAdjustGuardrail(
      decisionId,
      matchingGuardrail.id,
      violationIds,
      tenantId,
      severity,
      breachSeverityPercent,
      decisionTitle
    );

    if (adjustment && onAuditEvent) {
      onAuditEvent("guardrail.auto_adjusted", {
        guardrailId: matchingGuardrail.id,
        adjustmentId: adjustment.id,
        optionId,
        metricName,
        oldThreshold: adjustment.oldThreshold,
        newThreshold: adjustment.newThreshold,
        adjustmentPercent: adjustment.adjustmentPercent,
        breachCount: recentBreaches.length,
        windowDays: config.breachWindowDays,
        severity,
        breachSeverityPercent,
      });
    }

    return { outcome, violation, adjustment };
  }

  return { outcome, violation };
}

// Get outcomes for a specific option
export function getOutcomesByOption(
  decisionId: string,
  optionId: string
): ActualOutcome[] {
  const outcomes = loadActualOutcomes(decisionId);
  return outcomes.filter((o) => o.optionId === optionId);
}

// Get outcomes for a specific metric
export function getOutcomesByMetric(
  decisionId: string,
  metricName: string
): ActualOutcome[] {
  const outcomes = loadActualOutcomes(decisionId);
  return outcomes.filter((o) => o.metricName === metricName);
}

// Get recent outcomes (last N days)
export function getRecentOutcomes(
  decisionId: string,
  days: number = 30
): ActualOutcome[] {
  const outcomes = loadActualOutcomes(decisionId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return outcomes.filter((o) => {
    const recordedDate = new Date(o.recordedAt);
    return recordedDate >= cutoffDate;
  });
}

// Get adjustment history for a guardrail
export function getGuardrailAdjustmentHistory(
  decisionId: string,
  guardrailId: string
): AutoAdjustmentRecord[] {
  const adjustments = loadAdjustmentRecords(decisionId);
  return adjustments
    .filter((a) => a.guardrailId === guardrailId)
    .sort(
      (a, b) =>
        new Date(b.adjustedAt).getTime() - new Date(a.adjustedAt).getTime()
    );
}

// Get all adjustments for a decision
export function getAllAdjustments(decisionId: string): AutoAdjustmentRecord[] {
  const adjustments = loadAdjustmentRecords(decisionId);
  return adjustments.sort(
    (a, b) =>
      new Date(b.adjustedAt).getTime() - new Date(a.adjustedAt).getTime()
  );
}

// Export outcomes as CSV
export function exportOutcomesCSV(decisionId: string): string {
  const outcomes = loadActualOutcomes(decisionId);

  const rows = [
    [
      "Outcome ID",
      "Option",
      "Metric",
      "Actual Value",
      "Recorded At",
      "Source",
      "Source ID",
      "Notes",
    ],

    ...outcomes.map((o) => [
      o.id,
      o.optionLabel,
      o.metricName,
      o.actualValue.toString(),
      new Date(o.recordedAt).toLocaleString(),
      o.source,
      o.sourceId || "",
      o.notes || "",
    ]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

// Export adjustments as CSV
export function exportAdjustmentsCSV(decisionId: string): string {
  const adjustments = loadAdjustmentRecords(decisionId);

  const rows = [
    [
      "Adjustment ID",
      "Metric",
      "Old Threshold",
      "New Threshold",
      "Adjustment %",
      "Reason",
      "Adjusted At",
      "Triggered By Count",
    ],

    ...adjustments.map((a) => [
      a.id,
      a.metricName,
      a.oldThreshold.toString(),
      a.newThreshold.toString(),
      a.adjustmentPercent.toString(),
      a.reason,
      new Date(a.adjustedAt).toLocaleString(),
      a.triggeredBy.length.toString(),
    ]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

// Clear all outcomes for a decision
export function clearOutcomes(decisionId: string): void {
  const key = getOutcomesKey(decisionId);
  localStorage.removeItem(key);
}

// Clear all adjustments for a decision
export function clearAdjustments(decisionId: string): void {
  const key = getAdjustmentsKey(decisionId);
  localStorage.removeItem(key);
}

// Get adjustment trends over time
export function getAdjustmentTrends(
  tenantId: string,
  days: number = 30
): AdjustmentTrend[] {
  // Get all decisions for tenant (simplified - in real app would query store)
  const allDecisions = JSON.parse(
    localStorage.getItem("retina:decisions") || "[]"
  ).filter((d: any) => d.tenantId === tenantId);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Collect all adjustments
  const allAdjustments: (AutoAdjustmentRecord & { date: string })[] = [];
  allDecisions.forEach((decision: any) => {
    const adjustments = loadAdjustmentRecords(decision.id);
    adjustments.forEach((adj) => {
      const adjustedDate = new Date(adj.adjustedAt);
      if (adjustedDate >= cutoffDate) {
        allAdjustments.push({
          ...adj,
          date: adjustedDate.toISOString().split("T")[0],
        });
      }
    });
  });

  // Group by date
  const trendMap = new Map<string, AdjustmentTrend>();

  allAdjustments.forEach((adj) => {
    const existing = trendMap.get(adj.date);
    if (existing) {
      existing.count++;
      existing.avgSeverity =
        (existing.avgSeverity * (existing.count - 1) +
          (adj.breachSeverityPercent || 0)) /
        existing.count;
      existing.metrics[adj.metricName] =
        (existing.metrics[adj.metricName] || 0) + 1;
    } else {
      trendMap.set(adj.date, {
        date: adj.date,
        count: 1,
        avgSeverity: adj.breachSeverityPercent || 0,
        metrics: { [adj.metricName]: 1 },
      });
    }
  });

  // Convert to array and sort by date
  return Array.from(trendMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// Get adjustment statistics
export function getAdjustmentStats(tenantId: string, days: number = 30) {
  const trends = getAdjustmentTrends(tenantId, days);
  const totalAdjustments = trends.reduce((sum, t) => sum + t.count, 0);
  const avgSeverity =
    trends.length > 0
      ? trends.reduce((sum, t) => sum + t.avgSeverity, 0) / trends.length
      : 0;

  // Get most adjusted metrics
  const metricCounts = new Map<string, number>();
  trends.forEach((t) => {
    Object.entries(t.metrics).forEach(([metric, count]) => {
      metricCounts.set(metric, (metricCounts.get(metric) || 0) + count);
    });
  });

  const topMetrics = Array.from(metricCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([metric, count]) => ({ metric, count }));

  return {
    totalAdjustments,
    avgSeverity,
    topMetrics,
    trends,
  };
}

// Mark adjustment email as sent
export function markAdjustmentEmailSent(
  decisionId: string,
  adjustmentId: string
): void {
  const adjustments = loadAdjustmentRecords(decisionId);
  const adjustment = adjustments.find((a) => a.id === adjustmentId);
  if (adjustment) {
    adjustment.emailSent = true;
    saveAdjustmentRecords(decisionId, adjustments);
  }
}

// Get pending email notifications
export function getPendingEmailNotifications(
  tenantId: string
): AutoAdjustmentRecord[] {
  // Get all decisions for tenant
  const allDecisions = JSON.parse(
    localStorage.getItem("retina:decisions") || "[]"
  ).filter((d: any) => d.tenantId === tenantId);

  const pending: AutoAdjustmentRecord[] = [];
  allDecisions.forEach((decision: any) => {
    const adjustments = loadAdjustmentRecords(decision.id);
    adjustments.forEach((adj) => {
      if (
        !adj.emailSent &&
        adj.emailRecipients &&
        adj.emailRecipients.length > 0
      ) {
        pending.push(adj);
      }
    });
  });

  return pending;
}

// Load auto-adjustment configuration
export function loadAutoAdjustConfig(tenantId: string): AutoAdjustConfig {
  const key = getConfigKey(tenantId);
  const stored = localStorage.getItem(key);

  if (!stored) {
    return {
      breachWindowDays: DEFAULT_BREACH_WINDOW_DAYS,
      breachThresholdCount: DEFAULT_BREACH_THRESHOLD_COUNT,
      tighteningPercent: DEFAULT_TIGHTENING_PERCENT,
      severityBasedAdjustment: DEFAULT_SEVERITY_BASED_ADJUSTMENT,
      emailNotifications: false,
      emailRecipients: [],
    };
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse auto-adjust config:", error);
    return {
      breachWindowDays: DEFAULT_BREACH_WINDOW_DAYS,
      breachThresholdCount: DEFAULT_BREACH_THRESHOLD_COUNT,
      tighteningPercent: DEFAULT_TIGHTENING_PERCENT,
      severityBasedAdjustment: DEFAULT_SEVERITY_BASED_ADJUSTMENT,
      emailNotifications: false,
      emailRecipients: [],
    };
  }
}

// Save auto-adjustment configuration
export function saveAutoAdjustConfig(
  tenantId: string,
  config: AutoAdjustConfig
): void {
  const key = getConfigKey(tenantId);
  localStorage.setItem(key, JSON.stringify(config));
}

// Get auto-adjustment configuration (legacy support)
export function getAutoAdjustConfig(tenantId?: string) {
  if (tenantId) {
    return loadAutoAdjustConfig(tenantId);
  }
  return {
    breachWindowDays: DEFAULT_BREACH_WINDOW_DAYS,
    breachThresholdCount: DEFAULT_BREACH_THRESHOLD_COUNT,
    tighteningPercent: DEFAULT_TIGHTENING_PERCENT,
    severityBasedAdjustment: DEFAULT_SEVERITY_BASED_ADJUSTMENT,
    plainLanguageTooltip:
      "Learns from repeated problems and makes our limits stricter.",
  };
}
