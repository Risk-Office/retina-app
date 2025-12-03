/**
 * # Auto Journal Generator
 *
 * ## Overview
 * Automatically generates journal entries on key triggers:
 * - Decision finalization
 * - Signal refresh
 * - Guardrail adjustment
 * - Incident link
 *
 * ## Plain-Language Header
 * "What just happened?"
 *
 * ## Tooltip
 * "Creates short summaries automatically so we don't forget context."
 *
 * ## Features
 * - Context-aware summaries
 * - Plain-language descriptions
 * - Automatic metadata capture
 * - 500 character limit enforcement
 * - Integration with existing triggers
 */

import {
  addJournalEntry,
  type JournalEntryType,
} from "@/polymet/data/decision-journal";
import type { SimulationResult } from "@/polymet/data/scenario-engine";
import type { SignalUpdate } from "@/polymet/data/signal-monitor";
import type { AutoAdjustmentRecord } from "@/polymet/data/guardrail-auto-adjust";
import type { Incident } from "@/polymet/data/incident-matcher";
import type { MetricComparison } from "@/polymet/data/auto-refresh-engine";

// ============================================================================
// Decision Finalization
// ============================================================================

/**
 * Generate journal entry when a decision is finalized
 */
export function generateDecisionFinalizedEntry(
  decisionId: string,
  decisionTitle: string,
  tenantId: string,
  chosenOptionId: string,
  chosenOptionLabel: string,
  simulationResult: SimulationResult,
  rationale?: string
): void {
  const raroc = simulationResult.raroc.toFixed(2);
  const ev = simulationResult.ev.toFixed(0);
  const var95 = Math.abs(simulationResult.var95).toFixed(0);

  let summary = `Chose "${chosenOptionLabel}" with RAROC ${raroc}, EV $${ev}, and VaR95 $${var95}.`;

  // Add rationale if provided
  if (rationale && rationale.trim().length > 0) {
    const truncatedRationale =
      rationale.length > 150 ? rationale.substring(0, 147) + "..." : rationale;
    summary += ` Rationale: ${truncatedRationale}`;
  }

  // Ensure 500 char limit
  if (summary.length > 500) {
    summary = summary.substring(0, 497) + "...";
  }

  addJournalEntry(decisionId, decisionTitle, tenantId, {
    decision_id: decisionId,
    entry_type: "choice",
    summary_text: summary,
    auto_generated: true,
    author: "system",
    metadata: {
      option_id: chosenOptionId,
      option_label: chosenOptionLabel,
      raroc: simulationResult.raroc,
      ev: simulationResult.ev,
      var95: simulationResult.var95,
      rationale: rationale || undefined,
    },
  });
}

// ============================================================================
// Signal Refresh
// ============================================================================

/**
 * Generate journal entry when signals refresh and metrics change
 */
export function generateSignalRefreshEntry(
  decisionId: string,
  decisionTitle: string,
  tenantId: string,
  signalUpdates: SignalUpdate[],
  metricComparisons: MetricComparison[]
): void {
  // Find the most significant signal change
  const maxSignalChange = signalUpdates.reduce((max, update) =>
    Math.abs(update.change_percent) > Math.abs(max.change_percent)
      ? update
      : max
  );

  const signalChangePercent = (
    Math.abs(maxSignalChange.change_percent) * 100
  ).toFixed(0);
  const signalDirection =
    maxSignalChange.change_percent > 0 ? "increased" : "decreased";

  // Find the most significant metric change
  const significantMetricChanges = metricComparisons
    .map((comp) => ({
      optionLabel: comp.optionLabel,
      metric: "EV",
      delta: comp.ev.delta,
      deltaPercent: comp.ev.deltaPercent,
    }))
    .filter((change) => Math.abs(change.deltaPercent) > 1) // Only changes > 1%
    .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent));

  let summary = `When ${maxSignalChange.signal_label} ${signalDirection} by ${signalChangePercent}%`;

  if (significantMetricChanges.length > 0) {
    const topChange = significantMetricChanges[0];
    const metricDirection = topChange.delta > 0 ? "rose" : "fell";
    const metricChangePercent = Math.abs(topChange.deltaPercent).toFixed(0);

    summary += `, the expected value ${metricDirection} by ${metricChangePercent}%`;

    // Check if guardrails held
    const hasViolations = metricComparisons.some(
      (comp) =>
        Math.abs(comp.var95.deltaPercent) > 10 ||
        Math.abs(comp.ev.deltaPercent) > 15
    );

    if (hasViolations) {
      summary += " and triggered guardrail reviews.";
    } else {
      summary += " but guardrails held steady.";
    }
  } else {
    summary += ", metrics remained stable within acceptable ranges.";
  }

  // Ensure 500 char limit
  if (summary.length > 500) {
    summary = summary.substring(0, 497) + "...";
  }

  addJournalEntry(decisionId, decisionTitle, tenantId, {
    decision_id: decisionId,
    entry_type: "update",
    summary_text: summary,
    auto_generated: true,
    author: "system",
    metadata: {
      signal_updates: signalUpdates.map((u) => ({
        signal_id: u.signal_id,
        signal_label: u.signal_label,
        change_percent: u.change_percent,
      })),
      metric_changes: significantMetricChanges.slice(0, 3), // Top 3 changes
      max_signal_change: {
        signal_label: maxSignalChange.signal_label,
        change_percent: maxSignalChange.change_percent,
      },
    },
  });
}

// ============================================================================
// Guardrail Adjustment
// ============================================================================

/**
 * Generate journal entry when a guardrail is auto-adjusted
 */
export function generateGuardrailAdjustmentEntry(
  decisionId: string,
  decisionTitle: string,
  tenantId: string,
  adjustment: AutoAdjustmentRecord
): void {
  const metricLabel = getMetricLabel(adjustment.metricName);
  const oldThreshold = formatThresholdValue(
    adjustment.oldThreshold,
    adjustment.metricName
  );
  const newThreshold = formatThresholdValue(
    adjustment.newThreshold,
    adjustment.metricName
  );
  const adjustmentPercent = adjustment.adjustmentPercent.toFixed(0);

  const severityText = adjustment.severity
    ? ` due to ${adjustment.severity} breach`
    : "";

  let summary = `${metricLabel} guardrail auto-adjusted${severityText}. Threshold tightened ${adjustmentPercent}% from ${oldThreshold} to ${newThreshold}`;

  // Add context about breach count
  if (adjustment.triggeredBy && adjustment.triggeredBy.length > 0) {
    summary += ` after ${adjustment.triggeredBy.length} repeated breach${adjustment.triggeredBy.length > 1 ? "es" : ""}.`;
  } else {
    summary += ".";
  }

  // Add severity context if available
  if (adjustment.breachSeverityPercent) {
    const breachPercent = adjustment.breachSeverityPercent.toFixed(0);
    summary += ` Last breach exceeded threshold by ${breachPercent}%.`;
  }

  // Ensure 500 char limit
  if (summary.length > 500) {
    summary = summary.substring(0, 497) + "...";
  }

  addJournalEntry(decisionId, decisionTitle, tenantId, {
    decision_id: decisionId,
    entry_type: "guardrail_adjustment",
    summary_text: summary,
    auto_generated: true,
    author: "system",
    metadata: {
      guardrail_id: adjustment.guardrailId,
      option_id: adjustment.optionId,
      metric_name: adjustment.metricName,
      old_value: adjustment.oldThreshold,
      new_value: adjustment.newThreshold,
      adjustment_percent: adjustment.adjustmentPercent,
      severity: adjustment.severity,
      breach_severity_percent: adjustment.breachSeverityPercent,
      breach_count: adjustment.triggeredBy.length,
    },
  });
}

// ============================================================================
// Incident Link
// ============================================================================

/**
 * Generate journal entry when an incident is linked to a decision
 */
export function generateIncidentLinkEntry(
  decisionId: string,
  decisionTitle: string,
  tenantId: string,
  incident: Incident,
  affectedSignalCount: number,
  estimatedEffect?: {
    metric: string;
    change_percent: number;
  }
): void {
  const incidentTypeLabel = getIncidentTypeLabel(incident.type);
  const severityLabel = incident.severity.toUpperCase();

  let summary = `${severityLabel} ${incidentTypeLabel}: "${incident.title}" affected ${affectedSignalCount} linked signal${affectedSignalCount !== 1 ? "s" : ""}.`;

  // Add estimated effect if available
  if (estimatedEffect) {
    const metricLabel = getMetricLabel(estimatedEffect.metric);
    const effectDirection =
      estimatedEffect.change_percent > 0 ? "increase" : "decrease";
    const effectPercent = Math.abs(estimatedEffect.change_percent).toFixed(0);

    summary += ` Estimated ${effectPercent}% ${effectDirection} in ${metricLabel}.`;
  }

  // Add resolution status
  const statusText = {
    ongoing: "Incident ongoing, monitoring impact.",
    mitigated: "Incident mitigated, residual effects possible.",
    resolved: "Incident resolved.",
  }[incident.resolution_status];

  summary += ` ${statusText}`;

  // Ensure 500 char limit
  if (summary.length > 500) {
    summary = summary.substring(0, 497) + "...";
  }

  addJournalEntry(decisionId, decisionTitle, tenantId, {
    decision_id: decisionId,
    entry_type: "incident",
    summary_text: summary,
    auto_generated: true,
    author: "system",
    metadata: {
      incident_id: incident.id,
      incident_title: incident.title,
      incident_type: incident.type,
      severity: incident.severity,
      affected_signal_count: affectedSignalCount,
      estimated_effect: estimatedEffect,
      resolution_status: incident.resolution_status,
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get plain-language metric label
 */
function getMetricLabel(metricName: string): string {
  const labels: Record<string, string> = {
    raroc: "Risk-Adjusted Return",
    ev: "Expected Value",
    var95: "Value at Risk",
    cvar95: "Conditional VaR",
    ce: "Certainty Equivalent",
    utility: "Utility Score",
    EV: "Expected Value",
    VaR95: "Value at Risk",
    CVaR95: "Conditional VaR",
    RAROC: "Risk-Adjusted Return",
    CE: "Certainty Equivalent",
  };

  return labels[metricName] || metricName;
}

/**
 * Format threshold value based on metric type
 */
function formatThresholdValue(value: number, metricName: string): string {
  const lowerMetric = metricName.toLowerCase();

  // Currency metrics
  if (
    lowerMetric.includes("ev") ||
    lowerMetric.includes("var") ||
    lowerMetric.includes("cvar") ||
    lowerMetric.includes("ce")
  ) {
    return `$${Math.abs(value).toFixed(0)}`;
  }

  // Ratio metrics
  if (lowerMetric.includes("raroc")) {
    return value.toFixed(2);
  }

  // Percentage metrics
  if (lowerMetric.includes("percent") || lowerMetric.includes("rate")) {
    return `${(value * 100).toFixed(1)}%`;
  }

  // Default
  return value.toFixed(2);
}

/**
 * Get plain-language incident type label
 */
function getIncidentTypeLabel(type: Incident["type"]): string {
  const labels: Record<Incident["type"], string> = {
    supply_failure: "Supply Chain Disruption",
    cyber_event: "Cybersecurity Incident",
    market_shock: "Market Volatility",
    regulatory_change: "Regulatory Change",
    operational_disruption: "Operational Issue",
    other: "External Event",
  };

  return labels[type];
}

// ============================================================================
// Batch Generation
// ============================================================================

/**
 * Generate multiple journal entries in batch
 * Useful for processing historical events
 */
export function generateBatchJournalEntries(
  entries: Array<{
    type: "finalized" | "signal_refresh" | "guardrail_adjustment" | "incident";
    decisionId: string;
    decisionTitle: string;
    tenantId: string;
    data: any;
  }>
): void {
  entries.forEach((entry) => {
    try {
      switch (entry.type) {
        case "finalized":
          generateDecisionFinalizedEntry(
            entry.decisionId,
            entry.decisionTitle,
            entry.tenantId,
            entry.data.chosenOptionId,
            entry.data.chosenOptionLabel,
            entry.data.simulationResult,
            entry.data.rationale
          );
          break;

        case "signal_refresh":
          generateSignalRefreshEntry(
            entry.decisionId,
            entry.decisionTitle,
            entry.tenantId,
            entry.data.signalUpdates,
            entry.data.metricComparisons
          );
          break;

        case "guardrail_adjustment":
          generateGuardrailAdjustmentEntry(
            entry.decisionId,
            entry.decisionTitle,
            entry.tenantId,
            entry.data.adjustment
          );
          break;

        case "incident":
          generateIncidentLinkEntry(
            entry.decisionId,
            entry.decisionTitle,
            entry.tenantId,
            entry.data.incident,
            entry.data.affectedSignalCount,
            entry.data.estimatedEffect
          );
          break;
      }
    } catch (error) {
      console.error(
        `Failed to generate journal entry for ${entry.type}:`,
        error
      );
    }
  });
}

// ============================================================================
// Exports
// ============================================================================

export default {
  generateDecisionFinalizedEntry,
  generateSignalRefreshEntry,
  generateGuardrailAdjustmentEntry,
  generateIncidentLinkEntry,
  generateBatchJournalEntries,
};
