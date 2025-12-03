/**
 * # Signal Monitor Service
 *
 * ## Overview
 * Monitors linked signals for updates and tags decisions for re-evaluation
 * when signal values change beyond threshold.
 *
 * ## Features
 * - Periodic signal polling
 * - Change detection with threshold
 * - Decision tagging for re-evaluation
 * - Notification generation
 * - Audit logging
 */

import type { LinkedSignal, Decision } from "@/polymet/data/retina-store";

export interface SignalUpdate {
  signal_id: string;
  signal_label: string;
  old_value: number;
  new_value: number;
  change_percent: number;
  timestamp: number;
}

export interface DecisionRevaluationTag {
  decision_id: string;
  decision_title: string;
  tenant_id: string;
  reason: "signal_update";
  triggered_by: SignalUpdate[];
  tagged_at: number;
  acknowledged: boolean;
}

// Storage keys
const STORAGE_KEY_TAGS = "retina:revaluation-tags";
const STORAGE_KEY_SIGNAL_HISTORY = "retina:signal-history";

// Configuration
const CHANGE_THRESHOLD = 0.05; // 5% change triggers re-evaluation
const POLL_INTERVAL = 60000; // 60 seconds

/**
 * Get current signal values from API
 * In real app, this would fetch from actual signal sources
 */
export async function fetchSignalValues(
  signalIds: string[]
): Promise<Record<string, number>> {
  // Mock implementation - in real app, fetch from API
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate signal values with slight variations
  const values: Record<string, number> = {};
  signalIds.forEach((id) => {
    const baseValue = parseFloat(
      localStorage.getItem(`signal:${id}:base`) || "100"
    );
    // Add random variation ±10%
    const variation = (Math.random() - 0.5) * 0.2;
    values[id] = baseValue * (1 + variation);
  });

  return values;
}

/**
 * Get signal history from localStorage
 */
function getSignalHistory(): Record<string, number> {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SIGNAL_HISTORY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Export signal history for external use
 */
export function getSignalHistoryPublic(): Record<string, number> {
  return getSignalHistory();
}

/**
 * Save signal history to localStorage
 */
function saveSignalHistory(history: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY_SIGNAL_HISTORY, JSON.stringify(history));
}

/**
 * Get revaluation tags from localStorage
 */
export function getRevaluationTags(
  tenantId?: string
): DecisionRevaluationTag[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TAGS);
    const tags: DecisionRevaluationTag[] = data ? JSON.parse(data) : [];
    return tenantId ? tags.filter((t) => t.tenant_id === tenantId) : tags;
  } catch {
    return [];
  }
}

/**
 * Save revaluation tags to localStorage
 */
function saveRevaluationTags(tags: DecisionRevaluationTag[]) {
  localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(tags));
}

/**
 * Add a revaluation tag for a decision
 */
export function tagDecisionForRevaluation(
  decision: Decision,
  updates: SignalUpdate[]
) {
  const tags = getRevaluationTags();

  // Check if already tagged
  const existingIndex = tags.findIndex(
    (t) => t.decision_id === decision.id && !t.acknowledged
  );

  const newTag: DecisionRevaluationTag = {
    decision_id: decision.id,
    decision_title: decision.title,
    tenant_id: decision.tenantId,
    reason: "signal_update",
    triggered_by: updates,
    tagged_at: Date.now(),
    acknowledged: false,
  };

  if (existingIndex >= 0) {
    // Update existing tag with new updates
    tags[existingIndex] = {
      ...tags[existingIndex],
      triggered_by: [...tags[existingIndex].triggered_by, ...updates],
      tagged_at: Date.now(),
    };
  } else {
    // Add new tag
    tags.push(newTag);
  }

  saveRevaluationTags(tags);
  return newTag;
}

/**
 * Acknowledge a revaluation tag
 */
export function acknowledgeRevaluationTag(decisionId: string) {
  const tags = getRevaluationTags();
  const updated = tags.map((t) =>
    t.decision_id === decisionId ? { ...t, acknowledged: true } : t
  );
  saveRevaluationTags(updated);
}

/**
 * Clear acknowledged tags older than 7 days
 */
export function cleanupOldTags() {
  const tags = getRevaluationTags();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = tags.filter(
    (t) => !t.acknowledged || t.tagged_at > sevenDaysAgo
  );
  saveRevaluationTags(filtered);
}

/**
 * Record signal update for tracking
 */
function recordSignalUpdate(tenantId: string, update: SignalUpdate) {
  const updatesKey = `retina:signal-updates:${tenantId}`;
  try {
    const existing = localStorage.getItem(updatesKey);
    const updates: SignalUpdate[] = existing ? JSON.parse(existing) : [];

    // Add new update
    updates.push(update);

    // Keep only last 100 updates
    const trimmed = updates.slice(-100);

    localStorage.setItem(updatesKey, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to record signal update:", error);
  }
}

/**
 * Check signals for a single decision
 */
export async function checkDecisionSignals(
  decision: Decision
): Promise<SignalUpdate[]> {
  if (!decision.linked_signals || decision.linked_signals.length === 0) {
    return [];
  }

  const signalIds = decision.linked_signals.map((s) => s.signal_id);
  const currentValues = await fetchSignalValues(signalIds);
  const history = getSignalHistory();

  const updates: SignalUpdate[] = [];

  decision.linked_signals.forEach((signal) => {
    const oldValue = history[signal.signal_id] || signal.last_value;
    const newValue = currentValues[signal.signal_id];

    if (oldValue !== undefined && newValue !== undefined) {
      const changePercent = Math.abs((newValue - oldValue) / oldValue);

      // Check if change exceeds threshold
      if (changePercent >= CHANGE_THRESHOLD) {
        const update: SignalUpdate = {
          signal_id: signal.signal_id,
          signal_label: signal.signal_label || signal.signal_id,
          old_value: oldValue,
          new_value: newValue,
          change_percent: changePercent,
          timestamp: Date.now(),
        };

        updates.push(update);

        // Record update for banner tracking
        recordSignalUpdate(decision.tenantId, update);

        // Update history
        history[signal.signal_id] = newValue;
      }
    } else if (newValue !== undefined) {
      // First time seeing this signal
      history[signal.signal_id] = newValue;
    }
  });

  saveSignalHistory(history);
  return updates;
}

/**
 * Monitor all decisions with linked signals
 */
export async function monitorAllDecisions(
  decisions: Decision[]
): Promise<DecisionRevaluationTag[]> {
  const newTags: DecisionRevaluationTag[] = [];

  for (const decision of decisions) {
    if (
      decision.linked_signals &&
      decision.linked_signals.length > 0 &&
      decision.status !== "closed"
    ) {
      const updates = await checkDecisionSignals(decision);

      if (updates.length > 0) {
        const tag = tagDecisionForRevaluation(decision, updates);
        newTags.push(tag);
      }
    }
  }

  return newTags;
}

/**
 * Start monitoring service
 * Returns cleanup function to stop monitoring
 */
export function startSignalMonitoring(
  getDecisions: () => Decision[],
  onTagCreated?: (tag: DecisionRevaluationTag) => void
): () => void {
  let isRunning = true;

  const monitor = async () => {
    if (!isRunning) return;

    try {
      const decisions = getDecisions();
      const tags = await monitorAllDecisions(decisions);

      tags.forEach((tag) => {
        if (onTagCreated) {
          onTagCreated(tag);
        }
      });

      // Cleanup old tags
      cleanupOldTags();
    } catch (error) {
      console.error("Signal monitoring error:", error);
    }

    // Schedule next check
    if (isRunning) {
      setTimeout(monitor, POLL_INTERVAL);
    }
  };

  // Start monitoring
  monitor();

  // Return cleanup function
  return () => {
    isRunning = false;
  };
}

/**
 * Get pending revaluation count for a tenant
 */
export function getPendingRevaluationCount(tenantId: string): number {
  const tags = getRevaluationTags(tenantId);
  return tags.filter((t) => !t.acknowledged).length;
}

/**
 * Get revaluation notifications for display
 */
export function getRevaluationNotifications(tenantId: string): Array<{
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  timestamp: number;
  decisionId: string;
}> {
  const tags = getRevaluationTags(tenantId).filter((t) => !t.acknowledged);

  return tags.map((tag) => ({
    id: `reeval-${tag.decision_id}`,
    title: "Decision Re-evaluation Required",
    message: `"${tag.decision_title}" has ${tag.triggered_by.length} signal update${tag.triggered_by.length !== 1 ? "s" : ""}. Review and re-simulate with updated parameters.`,
    severity: "warning" as const,
    timestamp: tag.tagged_at,
    decisionId: tag.decision_id,
  }));
}

/**
 * Seed mock signal values for demo
 */
export function seedMockSignalValues() {
  const signals = [
    { id: "sig-cost-index", base: 285.2 },
    { id: "sig-demand-score", base: 72.5 },
    { id: "sig-market-volatility", base: 18.3 },
    { id: "sig-competitor-price", base: 149.99 },
    { id: "sig-supply-chain", base: 91.2 },
    { id: "sig-customer-sentiment", base: 8.1 },
  ];

  signals.forEach((signal) => {
    localStorage.setItem(`signal:${signal.id}:base`, signal.base.toString());
  });
}
