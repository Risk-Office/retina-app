/**
 * # Decision Portfolio System
 *
 * ## Overview
 * Decision Portfolios allow users to group related decisions under a common theme.
 * This enables viewing and analyzing multiple decisions together as a bundle.
 *
 * ## Plain-Language Label
 * "Group related choices under one theme."
 *
 * ## Tooltip
 * "Lets you view several decisions together — like an investment or strategy bundle."
 *
 * ## Fields
 * - portfolio_name: string - Name of the portfolio
 * - description: string - Description of the portfolio's purpose
 * - owner: string - Owner/creator of the portfolio
 * - time_horizon_months: number - Time horizon for the portfolio
 * - goal_alignment: string - Free text describing how this aligns with goals
 * - decision_ids: string[] - Array of decision IDs in this portfolio
 */

export interface PortfolioMetrics {
  aggregate_expected_value: number; // Weighted sum of EVs
  aggregate_var95: number; // Portfolio-level VaR95 via copula
  aggregate_cvar95: number; // Portfolio-level CVaR95 via copula
  diversification_index: number; // 1 - (Σ pairwise corr / n²)
  antifragility_score: number; // 0-100, placeholder for Set 13
  plain_language_label: string; // "How sturdy or spread-out this group of choices is."
  computed_at: number; // Timestamp of last computation
}

export interface PortfolioMetricsHistory {
  timestamp: number;
  metrics: PortfolioMetrics;
}

export interface DecisionPortfolio {
  id: string;
  tenantId: string;
  portfolio_name: string;
  description: string;
  owner: string;
  time_horizon_months: number;
  goal_alignment: string;
  decision_ids: string[];
  createdAt: number;
  updatedAt: number;
  metrics?: PortfolioMetrics; // Computed metrics
  metricsHistory?: PortfolioMetricsHistory[]; // Historical metrics for trend analysis
}

/**
 * Get storage key for portfolios
 */
function getStorageKey(tenantId: string): string {
  return `retina:portfolios:${tenantId}`;
}

/**
 * Load all portfolios for a tenant
 */
export function loadPortfolios(tenantId: string): DecisionPortfolio[] {
  try {
    const key = getStorageKey(tenantId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load portfolios:", error);
    return [];
  }
}

/**
 * Save portfolios for a tenant
 */
function savePortfolios(
  tenantId: string,
  portfolios: DecisionPortfolio[]
): void {
  try {
    const key = getStorageKey(tenantId);
    localStorage.setItem(key, JSON.stringify(portfolios));
  } catch (error) {
    console.error("Failed to save portfolios:", error);
  }
}

/**
 * Create a new portfolio
 */
export function createPortfolio(
  tenantId: string,
  data: Omit<DecisionPortfolio, "id" | "tenantId" | "createdAt" | "updatedAt">
): DecisionPortfolio {
  const portfolios = loadPortfolios(tenantId);

  const newPortfolio: DecisionPortfolio = {
    id: `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  portfolios.push(newPortfolio);
  savePortfolios(tenantId, portfolios);

  return newPortfolio;
}

/**
 * Update an existing portfolio
 */
export function updatePortfolio(
  tenantId: string,
  portfolioId: string,
  updates: Partial<Omit<DecisionPortfolio, "id" | "tenantId" | "createdAt">>
): DecisionPortfolio | null {
  const portfolios = loadPortfolios(tenantId);
  const index = portfolios.findIndex((p) => p.id === portfolioId);

  if (index === -1) return null;

  const updatedPortfolio: DecisionPortfolio = {
    ...portfolios[index],
    ...updates,
    updatedAt: Date.now(),
  };

  portfolios[index] = updatedPortfolio;
  savePortfolios(tenantId, portfolios);

  return updatedPortfolio;
}

/**
 * Delete a portfolio
 */
export function deletePortfolio(
  tenantId: string,
  portfolioId: string
): boolean {
  const portfolios = loadPortfolios(tenantId);
  const filtered = portfolios.filter((p) => p.id !== portfolioId);

  if (filtered.length === portfolios.length) return false;

  savePortfolios(tenantId, filtered);
  return true;
}

/**
 * Add a decision to a portfolio
 */
export function addDecisionToPortfolio(
  tenantId: string,
  portfolioId: string,
  decisionId: string
): boolean {
  const portfolios = loadPortfolios(tenantId);
  const portfolio = portfolios.find((p) => p.id === portfolioId);

  if (!portfolio) return false;

  // Check if decision is already in portfolio
  if (portfolio.decision_ids.includes(decisionId)) return false;

  portfolio.decision_ids.push(decisionId);
  portfolio.updatedAt = Date.now();

  savePortfolios(tenantId, portfolios);
  return true;
}

/**
 * Remove a decision from a portfolio
 */
export function removeDecisionFromPortfolio(
  tenantId: string,
  portfolioId: string,
  decisionId: string
): boolean {
  const portfolios = loadPortfolios(tenantId);
  const portfolio = portfolios.find((p) => p.id === portfolioId);

  if (!portfolio) return false;

  const initialLength = portfolio.decision_ids.length;
  portfolio.decision_ids = portfolio.decision_ids.filter(
    (id) => id !== decisionId
  );

  if (portfolio.decision_ids.length === initialLength) return false;

  portfolio.updatedAt = Date.now();
  savePortfolios(tenantId, portfolios);
  return true;
}

/**
 * Get portfolio by ID
 */
export function getPortfolioById(
  tenantId: string,
  portfolioId: string
): DecisionPortfolio | null {
  const portfolios = loadPortfolios(tenantId);
  return portfolios.find((p) => p.id === portfolioId) || null;
}

/**
 * Get portfolios containing a specific decision
 */
export function getPortfoliosForDecision(
  tenantId: string,
  decisionId: string
): DecisionPortfolio[] {
  const portfolios = loadPortfolios(tenantId);
  return portfolios.filter((p) => p.decision_ids.includes(decisionId));
}

/**
 * Get portfolio statistics
 */
export interface PortfolioStats {
  totalPortfolios: number;
  totalDecisions: number;
  averageDecisionsPerPortfolio: number;
  portfoliosWithMostDecisions: {
    portfolio: DecisionPortfolio;
    count: number;
  } | null;
}

export function getPortfolioStats(tenantId: string): PortfolioStats {
  const portfolios = loadPortfolios(tenantId);

  const totalDecisions = portfolios.reduce(
    (sum, p) => sum + p.decision_ids.length,
    0
  );

  const averageDecisionsPerPortfolio =
    portfolios.length > 0 ? totalDecisions / portfolios.length : 0;

  let portfoliosWithMostDecisions: PortfolioStats["portfoliosWithMostDecisions"] =
    null;
  if (portfolios.length > 0) {
    const sorted = [...portfolios].sort(
      (a, b) => b.decision_ids.length - a.decision_ids.length
    );
    portfoliosWithMostDecisions = {
      portfolio: sorted[0],
      count: sorted[0].decision_ids.length,
    };
  }

  return {
    totalPortfolios: portfolios.length,
    totalDecisions,
    averageDecisionsPerPortfolio,
    portfoliosWithMostDecisions,
  };
}

/**
 * Decision data for portfolio metrics computation
 */
export interface DecisionMetricsData {
  decisionId: string;
  chosenOptionId: string;
  ev: number;
  var95: number;
  cvar95: number;
  weight?: number; // Optional weight (defaults to 1/n)
}

/**
 * Compute diversification index from correlation matrix
 * Formula: 1 - (Σ pairwise correlations / n²)
 * Higher values indicate better diversification
 */
function computeDiversificationIndex(correlationMatrix: number[][]): number {
  const n = correlationMatrix.length;
  if (n === 0) return 0;
  if (n === 1) return 1; // Single decision = perfect diversification

  let sumCorrelations = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumCorrelations += correlationMatrix[i][j];
    }
  }

  const diversificationIndex = 1 - sumCorrelations / (n * n);
  return Math.max(0, Math.min(1, diversificationIndex)); // Clamp to [0, 1]
}

/**
 * Generate correlation matrix using Iman-Conover inspired approach
 * For now, we use a simple heuristic based on decision metrics similarity
 */
function generateCorrelationMatrix(
  decisions: DecisionMetricsData[]
): number[][] {
  const n = decisions.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0; // Perfect correlation with self
      } else {
        // Simple heuristic: correlation based on metric similarity
        const d1 = decisions[i];
        const d2 = decisions[j];

        // Normalize metrics to [0, 1] range for comparison
        const evSim =
          1 -
          Math.abs(d1.ev - d2.ev) /
            Math.max(Math.abs(d1.ev), Math.abs(d2.ev), 1);
        const varSim =
          1 -
          Math.abs(d1.var95 - d2.var95) /
            Math.max(Math.abs(d1.var95), Math.abs(d2.var95), 1);
        const cvarSim =
          1 -
          Math.abs(d1.cvar95 - d2.cvar95) /
            Math.max(Math.abs(d1.cvar95), Math.abs(d2.cvar95), 1);

        // Average similarity as correlation proxy
        const correlation = (evSim + varSim + cvarSim) / 3;
        matrix[i][j] = Math.max(0, Math.min(1, correlation));
      }
    }
  }

  return matrix;
}

/**
 * Compute portfolio-level VaR95 and CVaR95 using copula approach
 * This is a simplified implementation - in production, use full Iman-Conover
 */
function computePortfolioRiskMetrics(
  decisions: DecisionMetricsData[],
  correlationMatrix: number[][]
): { var95: number; cvar95: number } {
  const n = decisions.length;
  if (n === 0) return { var95: 0, cvar95: 0 };
  if (n === 1)
    return { var95: decisions[0].var95, cvar95: decisions[0].cvar95 };

  // Compute weighted average correlation
  let avgCorrelation = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      avgCorrelation += correlationMatrix[i][j];
      count++;
    }
  }
  avgCorrelation = count > 0 ? avgCorrelation / count : 0;

  // Portfolio variance formula: σ²_p = Σw²σ² + ΣΣw_iw_jρ_ijσ_iσ_j
  // Simplified: assume equal weights and use VaR as proxy for σ
  const weights = decisions.map((d) => d.weight || 1 / n);

  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    // Individual variance contribution
    portfolioVariance += Math.pow(weights[i] * decisions[i].var95, 2);

    // Covariance contributions
    for (let j = i + 1; j < n; j++) {
      portfolioVariance +=
        2 *
        weights[i] *
        weights[j] *
        correlationMatrix[i][j] *
        decisions[i].var95 *
        decisions[j].var95;
    }
  }

  const portfolioVar95 =
    Math.sqrt(Math.abs(portfolioVariance)) * (portfolioVariance < 0 ? -1 : 1);

  // CVaR approximation: CVaR ≈ VaR * 1.15 (rule of thumb for normal distribution)
  const portfolioCVar95 = portfolioVar95 * 1.15;

  return {
    var95: portfolioVar95,
    cvar95: portfolioCVar95,
  };
}

/**
 * Compute all portfolio metrics
 */
export function computePortfolioMetrics(
  decisions: DecisionMetricsData[]
): PortfolioMetrics {
  const n = decisions.length;

  // Handle empty portfolio
  if (n === 0) {
    return {
      aggregate_expected_value: 0,
      aggregate_var95: 0,
      aggregate_cvar95: 0,
      diversification_index: 0,
      antifragility_score: 0,
      plain_language_label:
        "How sturdy or spread-out this group of choices is.",
      computed_at: Date.now(),
    };
  }

  // Normalize weights
  const totalWeight = decisions.reduce((sum, d) => sum + (d.weight || 1), 0);
  const normalizedDecisions = decisions.map((d) => ({
    ...d,
    weight: (d.weight || 1) / totalWeight,
  }));

  // 1. Aggregate Expected Value (weighted sum)
  const aggregate_expected_value = normalizedDecisions.reduce(
    (sum, d) => sum + d.ev * (d.weight || 1 / n),
    0
  );

  // 2. Generate correlation matrix
  const correlationMatrix = generateCorrelationMatrix(normalizedDecisions);

  // 3. Compute portfolio-level VaR95 and CVaR95
  const { var95, cvar95 } = computePortfolioRiskMetrics(
    normalizedDecisions,
    correlationMatrix
  );

  // 4. Compute diversification index
  const diversification_index = computeDiversificationIndex(correlationMatrix);

  // 5. Antifragility score (placeholder for Set 13)
  // For now, use a simple heuristic: higher diversification + positive EV = higher antifragility
  const antifragility_score = Math.min(
    100,
    Math.max(
      0,
      diversification_index * 50 + // Diversification contributes up to 50 points
        (aggregate_expected_value > 0 ? 30 : 0) + // Positive EV adds 30 points
        (Math.abs(var95) < Math.abs(aggregate_expected_value) ? 20 : 0) // Risk < Return adds 20 points
    )
  );

  return {
    aggregate_expected_value,
    aggregate_var95: var95,
    aggregate_cvar95: cvar95,
    diversification_index,
    antifragility_score,
    plain_language_label: "How sturdy or spread-out this group of choices is.",
    computed_at: Date.now(),
  };
}

/**
 * Update portfolio metrics with historical tracking
 */
export function updatePortfolioMetrics(
  tenantId: string,
  portfolioId: string,
  decisions: DecisionMetricsData[]
): DecisionPortfolio | null {
  const portfolios = loadPortfolios(tenantId);
  const portfolio = portfolios.find((p) => p.id === portfolioId);

  if (!portfolio) return null;

  const metrics = computePortfolioMetrics(decisions);

  // Add current metrics to history before updating
  const metricsHistory = portfolio.metricsHistory || [];
  if (portfolio.metrics) {
    metricsHistory.push({
      timestamp: portfolio.metrics.computed_at,
      metrics: portfolio.metrics,
    });
  }

  // Keep only last 30 historical entries
  const trimmedHistory = metricsHistory.slice(-30);

  return updatePortfolio(tenantId, portfolioId, {
    metrics,
    metricsHistory: trimmedHistory,
  });
}
