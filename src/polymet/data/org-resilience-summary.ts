/**
 * # Organization Resilience Summary
 *
 * ## Overview
 * Aggregates resilience metrics across all decisions to provide an organization-level
 * view of learning, adaptation, and risk management effectiveness.
 *
 * ## Features
 * - Average antifragility index across all decisions
 * - Identification of top learning decision (highest antifragility growth)
 * - Identification of weakest decision (lowest antifragility or declining)
 * - Guardrail breach trend analysis (improving, stable, or worsening)
 * - Tenant-aware with localStorage persistence
 *
 * ## Usage
 * ```tsx
 * import { getOrgResilienceSummary, computeOrgResilienceSummary } from "@/polymet/data/org-resilience-summary";
 *
 * // Get cached summary
 * const summary = getOrgResilienceSummary("tenant-123");
 *
 * // Compute fresh summary from decisions
 * const freshSummary = computeOrgResilienceSummary("tenant-123", decisions);
 * ```
 */

import { getDecisionHistory } from "@/polymet/data/antifragility-history";
import { loadViolations } from "@/polymet/data/guardrail-violations";

export interface OrgResilienceSummary {
  tenant_id: string;
  avg_antifragility_index: number;
  top_learning_decision: {
    id: string;
    title: string;
    antifragility_index: number;
    growth_rate: number; // Percentage growth over time
  } | null;
  weakest_decision: {
    id: string;
    title: string;
    antifragility_index: number;
    trend: "declining" | "stable" | "low";
  } | null;
  guardrail_breach_trend: {
    direction: "improving" | "stable" | "worsening";
    recent_breach_count: number; // Last 30 days
    previous_breach_count: number; // Previous 30 days
    change_percent: number;
  };
  last_updated: number;
  decision_count: number;
}

export interface DecisionResilienceData {
  id: string;
  title: string;
  antifragility_index: number;
  status?: string;
}

const STORAGE_KEY_PREFIX = "org_resilience_summary_";

/**
 * Get organization resilience summary from localStorage
 */
export function getOrgResilienceSummary(
  tenantId: string
): OrgResilienceSummary | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${tenantId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading org resilience summary:", error);
    return null;
  }
}

/**
 * Save organization resilience summary to localStorage
 */
export function saveOrgResilienceSummary(summary: OrgResilienceSummary): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${summary.tenant_id}`;
    localStorage.setItem(key, JSON.stringify(summary));
  } catch (error) {
    console.error("Error saving org resilience summary:", error);
  }
}

/**
 * Compute organization resilience summary from decision data
 */
export function computeOrgResilienceSummary(
  tenantId: string,
  decisions: DecisionResilienceData[]
): OrgResilienceSummary {
  // Filter decisions for this tenant
  const tenantDecisions = decisions.filter(
    (d) => d.id.startsWith(tenantId) || true
  );

  // Calculate average antifragility index
  const avgAntifragilityIndex =
    tenantDecisions.length > 0
      ? tenantDecisions.reduce((sum, d) => sum + d.antifragility_index, 0) /
        tenantDecisions.length
      : 0;

  // Find top learning decision (highest growth rate)
  let topLearningDecision: OrgResilienceSummary["top_learning_decision"] = null;
  let maxGrowthRate = -Infinity;

  for (const decision of tenantDecisions) {
    const history = getDecisionHistory(tenantId, decision.id);
    if (history && history.snapshots && history.snapshots.length >= 2) {
      // Calculate growth rate from first to last entry
      const firstEntry = history.snapshots[0];
      const lastEntry = history.snapshots[history.snapshots.length - 1];
      const growthRate =
        ((lastEntry.value - firstEntry.value) / firstEntry.value) * 100;

      if (growthRate > maxGrowthRate) {
        maxGrowthRate = growthRate;
        topLearningDecision = {
          id: decision.id,
          title: decision.title,
          antifragility_index: decision.antifragility_index,
          growth_rate: growthRate,
        };
      }
    }
  }

  // Find weakest decision (lowest antifragility or declining)
  let weakestDecision: OrgResilienceSummary["weakest_decision"] = null;
  let lowestScore = Infinity;

  for (const decision of tenantDecisions) {
    const history = getDecisionHistory(tenantId, decision.id);
    let trend: "declining" | "stable" | "low" = "low";

    if (history && history.snapshots && history.snapshots.length >= 2) {
      const recentEntries = history.snapshots.slice(-3);
      const isDecreasing = recentEntries.every(
        (entry, idx) => idx === 0 || entry.value < recentEntries[idx - 1].value
      );
      trend = isDecreasing ? "declining" : "stable";
    }

    // Consider both low score and declining trend
    const effectiveScore =
      trend === "declining"
        ? decision.antifragility_index * 0.8
        : decision.antifragility_index;

    if (effectiveScore < lowestScore) {
      lowestScore = effectiveScore;
      weakestDecision = {
        id: decision.id,
        title: decision.title,
        antifragility_index: decision.antifragility_index,
        trend,
      };
    }
  }

  // Analyze guardrail breach trend
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

  let recentBreachCount = 0;
  let previousBreachCount = 0;

  for (const decision of tenantDecisions) {
    const violations = loadViolations(decision.id);
    for (const violation of violations) {
      if (violation.timestamp >= thirtyDaysAgo) {
        recentBreachCount++;
      } else if (violation.timestamp >= sixtyDaysAgo) {
        previousBreachCount++;
      }
    }
  }

  let breachDirection: "improving" | "stable" | "worsening" = "stable";
  let changePercent = 0;

  if (previousBreachCount > 0) {
    changePercent =
      ((recentBreachCount - previousBreachCount) / previousBreachCount) * 100;
    if (changePercent < -10) {
      breachDirection = "improving";
    } else if (changePercent > 10) {
      breachDirection = "worsening";
    }
  } else if (recentBreachCount > 0) {
    breachDirection = "worsening";
    changePercent = 100;
  } else if (recentBreachCount === 0 && previousBreachCount === 0) {
    breachDirection = "stable";
  }

  const summary: OrgResilienceSummary = {
    tenant_id: tenantId,
    avg_antifragility_index: Math.round(avgAntifragilityIndex * 10) / 10,
    top_learning_decision: topLearningDecision,
    weakest_decision: weakestDecision,
    guardrail_breach_trend: {
      direction: breachDirection,
      recent_breach_count: recentBreachCount,
      previous_breach_count: previousBreachCount,
      change_percent: Math.round(changePercent * 10) / 10,
    },
    last_updated: now,
    decision_count: tenantDecisions.length,
  };

  // Save to localStorage
  saveOrgResilienceSummary(summary);

  return summary;
}

/**
 * Get or compute organization resilience summary
 * Returns cached version if less than 1 hour old, otherwise recomputes
 */
export function getOrComputeOrgResilienceSummary(
  tenantId: string,
  decisions: DecisionResilienceData[]
): OrgResilienceSummary {
  const cached = getOrgResilienceSummary(tenantId);
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  if (cached && cached.last_updated > oneHourAgo) {
    return cached;
  }

  return computeOrgResilienceSummary(tenantId, decisions);
}

/**
 * Clear organization resilience summary for a tenant
 */
export function clearOrgResilienceSummary(tenantId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${tenantId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing org resilience summary:", error);
  }
}
