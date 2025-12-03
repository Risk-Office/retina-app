import type { Guardrail, AlertLevel } from "@/polymet/data/decision-guardrails";

export interface GuardrailViolation {
  id: string;
  guardrailId: string;
  decisionId: string;
  optionId: string;
  optionLabel: string;
  metricName: string;
  thresholdValue: number;
  actualValue: number;
  direction: "above" | "below";
  alertLevel: AlertLevel;
  violatedAt: string;
  resolvedAt?: string;
  notificationSent: boolean;
  notes?: string;
}

export interface ViolationSummary {
  totalViolations: number;
  activeViolations: number;
  resolvedViolations: number;
  criticalViolations: number;
  cautionViolations: number;
  infoViolations: number;
  byMetric: Record<string, number>;
  byOption: Record<string, number>;
}

// Generate UUID v4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get storage key for violations
const getStorageKey = (decisionId: string) => {
  return `retina:guardrail-violations:${decisionId}`;
};

// Load all violations for a decision
export function loadViolations(decisionId: string): GuardrailViolation[] {
  const key = getStorageKey(decisionId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse violations:", error);
    return [];
  }
}

// Save violations for a decision
function saveViolations(
  decisionId: string,
  violations: GuardrailViolation[]
): void {
  const key = getStorageKey(decisionId);
  localStorage.setItem(key, JSON.stringify(violations));
}

// Record a new violation
export function recordViolation(
  guardrail: Guardrail,
  optionLabel: string,
  actualValue: number,
  notificationSent: boolean = false
): GuardrailViolation {
  const violations = loadViolations(guardrail.decisionId);

  const violation: GuardrailViolation = {
    id: generateUUID(),
    guardrailId: guardrail.id,
    decisionId: guardrail.decisionId,
    optionId: guardrail.optionId,
    optionLabel,
    metricName: guardrail.metricName,
    thresholdValue: guardrail.thresholdValue,
    actualValue,
    direction: guardrail.direction,
    alertLevel: guardrail.alertLevel,
    violatedAt: new Date().toISOString(),
    notificationSent,
  };

  violations.push(violation);
  saveViolations(guardrail.decisionId, violations);

  return violation;
}

// Resolve a violation
export function resolveViolation(
  decisionId: string,
  violationId: string,
  notes?: string
): boolean {
  const violations = loadViolations(decisionId);
  const violation = violations.find((v) => v.id === violationId);

  if (!violation) return false;

  violation.resolvedAt = new Date().toISOString();
  if (notes) violation.notes = notes;

  saveViolations(decisionId, violations);
  return true;
}

// Mark notification as sent
export function markNotificationSent(
  decisionId: string,
  violationId: string
): boolean {
  const violations = loadViolations(decisionId);
  const violation = violations.find((v) => v.id === violationId);

  if (!violation) return false;

  violation.notificationSent = true;
  saveViolations(decisionId, violations);
  return true;
}

// Get active violations (not resolved)
export function getActiveViolations(decisionId: string): GuardrailViolation[] {
  const violations = loadViolations(decisionId);
  return violations.filter((v) => !v.resolvedAt);
}

// Get violations for a specific option
export function getViolationsByOption(
  decisionId: string,
  optionId: string
): GuardrailViolation[] {
  const violations = loadViolations(decisionId);
  return violations.filter((v) => v.optionId === optionId);
}

// Get violations by alert level
export function getViolationsByAlertLevel(
  decisionId: string,
  alertLevel: AlertLevel
): GuardrailViolation[] {
  const violations = loadViolations(decisionId);
  return violations.filter((v) => v.alertLevel === alertLevel);
}

// Get violations summary
export function getViolationsSummary(decisionId: string): ViolationSummary {
  const violations = loadViolations(decisionId);

  const summary: ViolationSummary = {
    totalViolations: violations.length,
    activeViolations: violations.filter((v) => !v.resolvedAt).length,
    resolvedViolations: violations.filter((v) => v.resolvedAt).length,
    criticalViolations: violations.filter((v) => v.alertLevel === "critical")
      .length,
    cautionViolations: violations.filter((v) => v.alertLevel === "caution")
      .length,
    infoViolations: violations.filter((v) => v.alertLevel === "info").length,
    byMetric: {},
    byOption: {},
  };

  // Count by metric
  violations.forEach((v) => {
    summary.byMetric[v.metricName] = (summary.byMetric[v.metricName] || 0) + 1;
  });

  // Count by option
  violations.forEach((v) => {
    summary.byOption[v.optionLabel] =
      (summary.byOption[v.optionLabel] || 0) + 1;
  });

  return summary;
}

// Get recent violations (last N days)
export function getRecentViolations(
  decisionId: string,
  days: number = 7
): GuardrailViolation[] {
  const violations = loadViolations(decisionId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return violations.filter((v) => {
    const violatedDate = new Date(v.violatedAt);
    return violatedDate >= cutoffDate;
  });
}

// Get violation trend (count per day)
export function getViolationTrend(
  decisionId: string,
  days: number = 30
): Array<{ date: string; count: number }> {
  const violations = loadViolations(decisionId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Filter violations within the time range
  const recentViolations = violations.filter((v) => {
    const violatedDate = new Date(v.violatedAt);
    return violatedDate >= cutoffDate;
  });

  // Group by date
  const countsByDate: Record<string, number> = {};
  recentViolations.forEach((v) => {
    const date = new Date(v.violatedAt).toISOString().split("T")[0];
    countsByDate[date] = (countsByDate[date] || 0) + 1;
  });

  // Convert to array and sort
  return Object.entries(countsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Clear all violations for a decision
export function clearViolations(decisionId: string): void {
  const key = getStorageKey(decisionId);
  localStorage.removeItem(key);
}

// Export violations as CSV
export function exportViolationsCSV(decisionId: string): string {
  const violations = loadViolations(decisionId);

  const rows = [
    [
      "Violation ID",
      "Option",
      "Metric",
      "Threshold",
      "Actual Value",
      "Direction",
      "Alert Level",
      "Violated At",
      "Resolved At",
      "Notification Sent",
      "Notes",
    ],

    ...violations.map((v) => [
      v.id,
      v.optionLabel,
      v.metricName,
      v.thresholdValue.toString(),
      v.actualValue.toString(),
      v.direction,
      v.alertLevel,
      new Date(v.violatedAt).toLocaleString(),
      v.resolvedAt ? new Date(v.resolvedAt).toLocaleString() : "Active",
      v.notificationSent ? "Yes" : "No",
      v.notes || "",
    ]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}
