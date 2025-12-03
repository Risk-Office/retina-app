/**
 * # Antifragility History Tracker
 *
 * ## Overview
 * Tracks antifragility index changes over time for decisions and portfolios
 * with localStorage persistence.
 *
 * ## Features
 * - Historical tracking of antifragility indices
 * - Event-based snapshots (simulation updates, guardrail changes, etc.)
 * - Trend analysis and statistics
 * - Portfolio-level aggregation
 */

export interface AntifragilitySnapshot {
  timestamp: number;
  value: number;
  label?: string;
  event?: string;
  metadata?: {
    stabilityRatio?: number;
    learningRate?: number;
    shockAbsorption?: number;
    breachRate?: number;
  };
}

export interface DecisionAntifragilityHistory {
  decisionId: string;
  decisionTitle: string;
  tenantId: string;
  snapshots: AntifragilitySnapshot[];
  createdAt: number;
  updatedAt: number;
}

export interface PortfolioAntifragilityHistory {
  portfolioId: string;
  portfolioName: string;
  tenantId: string;
  snapshots: AntifragilitySnapshot[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY_DECISIONS = "retina_antifragility_history_decisions";
const STORAGE_KEY_PORTFOLIOS = "retina_antifragility_history_portfolios";

/**
 * Get all decision histories for a tenant
 */
export function getDecisionHistories(
  tenantId: string
): DecisionAntifragilityHistory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DECISIONS);
    if (!stored) return [];
    const all: DecisionAntifragilityHistory[] = JSON.parse(stored);
    return all.filter((h) => h.tenantId === tenantId);
  } catch (error) {
    console.error("Error loading decision histories:", error);
    return [];
  }
}

/**
 * Get history for a specific decision
 */
export function getDecisionHistory(
  tenantId: string,
  decisionId: string
): DecisionAntifragilityHistory | null {
  const histories = getDecisionHistories(tenantId);
  return histories.find((h) => h.decisionId === decisionId) || null;
}

/**
 * Add snapshot to decision history
 */
export function addDecisionSnapshot(
  tenantId: string,
  decisionId: string,
  decisionTitle: string,
  snapshot: AntifragilitySnapshot
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DECISIONS);
    const all: DecisionAntifragilityHistory[] = stored
      ? JSON.parse(stored)
      : [];

    const existingIndex = all.findIndex(
      (h) => h.tenantId === tenantId && h.decisionId === decisionId
    );

    if (existingIndex >= 0) {
      // Update existing history
      all[existingIndex].snapshots.push(snapshot);
      all[existingIndex].updatedAt = Date.now();
      all[existingIndex].decisionTitle = decisionTitle; // Update title in case it changed
    } else {
      // Create new history
      all.push({
        decisionId,
        decisionTitle,
        tenantId,
        snapshots: [snapshot],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify(all));
  } catch (error) {
    console.error("Error adding decision snapshot:", error);
  }
}

/**
 * Get all portfolio histories for a tenant
 */
export function getPortfolioHistories(
  tenantId: string
): PortfolioAntifragilityHistory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PORTFOLIOS);
    if (!stored) return [];
    const all: PortfolioAntifragilityHistory[] = JSON.parse(stored);
    return all.filter((h) => h.tenantId === tenantId);
  } catch (error) {
    console.error("Error loading portfolio histories:", error);
    return [];
  }
}

/**
 * Get history for a specific portfolio
 */
export function getPortfolioHistory(
  tenantId: string,
  portfolioId: string
): PortfolioAntifragilityHistory | null {
  const histories = getPortfolioHistories(tenantId);
  return histories.find((h) => h.portfolioId === portfolioId) || null;
}

/**
 * Add snapshot to portfolio history
 */
export function addPortfolioSnapshot(
  tenantId: string,
  portfolioId: string,
  portfolioName: string,
  snapshot: AntifragilitySnapshot
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PORTFOLIOS);
    const all: PortfolioAntifragilityHistory[] = stored
      ? JSON.parse(stored)
      : [];

    const existingIndex = all.findIndex(
      (h) => h.tenantId === tenantId && h.portfolioId === portfolioId
    );

    if (existingIndex >= 0) {
      // Update existing history
      all[existingIndex].snapshots.push(snapshot);
      all[existingIndex].updatedAt = Date.now();
      all[existingIndex].portfolioName = portfolioName; // Update name in case it changed
    } else {
      // Create new history
      all.push({
        portfolioId,
        portfolioName,
        tenantId,
        snapshots: [snapshot],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    localStorage.setItem(STORAGE_KEY_PORTFOLIOS, JSON.stringify(all));
  } catch (error) {
    console.error("Error adding portfolio snapshot:", error);
  }
}

/**
 * Calculate trend from snapshots
 */
export function calculateTrend(snapshots: AntifragilitySnapshot[]): {
  direction: "up" | "down" | "stable";
  change: number;
  percentage: number;
} {
  if (snapshots.length < 2) {
    return { direction: "stable", change: 0, percentage: 0 };
  }

  const firstValue = snapshots[0].value;
  const lastValue = snapshots[snapshots.length - 1].value;
  const change = lastValue - firstValue;
  const percentage = (change / firstValue) * 100;

  let direction: "up" | "down" | "stable" = "stable";
  if (Math.abs(change) > 2) {
    direction = change > 0 ? "up" : "down";
  }

  return { direction, change, percentage };
}

/**
 * Get statistics from snapshots
 */
export function getStatistics(snapshots: AntifragilitySnapshot[]): {
  current: number;
  average: number;
  peak: number;
  lowest: number;
  volatility: number;
} {
  if (snapshots.length === 0) {
    return { current: 0, average: 0, peak: 0, lowest: 0, volatility: 0 };
  }

  const values = snapshots.map((s) => s.value);
  const current = values[values.length - 1];
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const peak = Math.max(...values);
  const lowest = Math.min(...values);

  // Calculate volatility (standard deviation)
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) /
    values.length;
  const volatility = Math.sqrt(variance);

  return { current, average, peak, lowest, volatility };
}

/**
 * Delete decision history
 */
export function deleteDecisionHistory(
  tenantId: string,
  decisionId: string
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DECISIONS);
    if (!stored) return;
    const all: DecisionAntifragilityHistory[] = JSON.parse(stored);
    const filtered = all.filter(
      (h) => !(h.tenantId === tenantId && h.decisionId === decisionId)
    );
    localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting decision history:", error);
  }
}

/**
 * Delete portfolio history
 */
export function deletePortfolioHistory(
  tenantId: string,
  portfolioId: string
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PORTFOLIOS);
    if (!stored) return;
    const all: PortfolioAntifragilityHistory[] = JSON.parse(stored);
    const filtered = all.filter(
      (h) => !(h.tenantId === tenantId && h.portfolioId === portfolioId)
    );
    localStorage.setItem(STORAGE_KEY_PORTFOLIOS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting portfolio history:", error);
  }
}
