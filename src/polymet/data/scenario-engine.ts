// Seedable RNG using mulberry32
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Distribution types
export type DistributionType =
  | "normal"
  | "lognormal"
  | "triangular"
  | "uniform";

export type ScenarioVar = {
  id: string;
  name: string;
  appliesTo: "return" | "cost";
  dist: DistributionType;
  params: Record<string, number>;
  weight?: number;
};

// Dependence configuration for rank correlation
export interface DependenceConfig {
  varAId: string;
  varBId: string;
  targetRho: number; // Target rank correlation [-0.9, 0.9]
}

// Copula Matrix configuration for full k×k correlation
export interface CopulaMatrixConfig {
  k: number;
  matrix: number[][]; // k×k symmetric matrix
  useNearestPD: boolean;
}

// Copula snapshot for storing in simulation results
export interface CopulaSnapshot {
  k: number;
  target: number[][] | null;
  achieved: number[][];
  froErr: number;
}

// Box-Muller transform for normal distribution
function boxMuller(rng: () => number): number {
  let u1 = 0,
    u2 = 0;
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

// Distribution samplers
export function sampleNormal(
  mean: number,
  sd: number,
  rng: () => number
): number {
  return mean + sd * boxMuller(rng);
}

export function sampleLognormal(
  mu: number,
  sigma: number,
  rng: () => number
): number {
  const normalSample = mu + sigma * boxMuller(rng);
  return Math.exp(normalSample);
}

export function sampleTriangular(
  min: number,
  mode: number,
  max: number,
  rng: () => number
): number {
  const u = rng();
  const fc = (mode - min) / (max - min);

  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

export function sampleUniform(
  min: number,
  max: number,
  rng: () => number
): number {
  return min + (max - min) * rng();
}

// Bayesian Prior configuration
export interface BayesianPriorOverride {
  targetVarId: string;
  posteriorMean: number;
  posteriorSd: number;
}

// Sample from a scenario variable with optional Bayesian posterior override
export function sampleVariable(
  variable: ScenarioVar,
  rng: () => number,
  bayesianOverride?: BayesianPriorOverride
): number {
  const { dist, params } = variable;

  // Apply Bayesian posterior if configured for this variable
  let effectiveParams = params;
  if (bayesianOverride && bayesianOverride.targetVarId === variable.id) {
    if (dist === "normal") {
      effectiveParams = {
        ...params,
        mean: bayesianOverride.posteriorMean,
        sd: bayesianOverride.posteriorSd,
      };
    } else if (dist === "lognormal") {
      effectiveParams = {
        ...params,
        mu: bayesianOverride.posteriorMean,
        sigma: bayesianOverride.posteriorSd,
      };
    }
  }

  switch (dist) {
    case "normal":
      return sampleNormal(
        effectiveParams.mean ?? 0,
        effectiveParams.sd ?? 1,
        rng
      );
    case "lognormal":
      return sampleLognormal(
        effectiveParams.mu ?? 0,
        effectiveParams.sigma ?? 1,
        rng
      );
    case "triangular":
      return sampleTriangular(
        effectiveParams.min ?? -1,
        effectiveParams.mode ?? 0,
        effectiveParams.max ?? 1,
        rng
      );
    case "uniform":
      return sampleUniform(
        effectiveParams.min ?? 0,
        effectiveParams.max ?? 1,
        rng
      );
    default:
      return 0;
  }
}

// TCOR settings
export interface TCORParams {
  insuranceRate: number; // % of option cost
  contingencyOnCap: number; // % of economic capital
}

// Game Interaction (2×2) settings
export type OurStrategy = "Conservative" | "Aggressive";
export type CompetitorMove = "Match" | "Undercut";

export interface GameInteractionConfig {
  pUndercut: number; // Probability of Undercut [0..1]
  multipliers: {
    Match: {
      retMult: Record<OurStrategy, number>;
      costMult: Record<OurStrategy, number>;
    };
    Undercut: {
      retMult: Record<OurStrategy, number>;
      costMult: Record<OurStrategy, number>;
    };
  };
}

export interface OptionGameStrategy {
  optionId: string;
  strategy: OurStrategy;
}

// Simulation result for an option
export interface SimulationResult {
  optionId: string;
  optionLabel: string;
  outcomes: number[];
  ev: number; // Expected Value (mean)
  var95: number; // Value at Risk (5th percentile)
  cvar95: number; // Conditional VaR (mean below VaR95)
  economicCapital: number;
  raroc: number; // Risk-Adjusted Return on Capital
  expectedUtility?: number; // Expected Utility (CARA)
  certaintyEquivalent?: number; // Certainty Equivalent
  tcor?: number; // Total Cost of Risk
  tcorComponents?: {
    expectedLoss: number;
    insurance: number;
    contingency: number;
    mitigation: number;
  };
  achievedSpearman?: number; // Achieved Spearman rank correlation (if dependence applied)
  copulaSnapshot?: CopulaSnapshot; // Copula matrix snapshot (if copula applied)
  horizonMonths: number; // Effective horizon used for this option
}

// Utility settings
export type UtilityMode =
  | "CARA"
  | "CRRA"
  | "Exponential"
  | "Quadratic"
  | "Power";

export interface UtilityParams {
  mode: UtilityMode;
  a: number; // risk aversion coefficient (CARA, Exponential) or relative risk aversion (CRRA)
  scale: number; // outcome scale divider
}

// Compute utility for a single outcome based on mode
export function computeUtility(outcome: number, params: UtilityParams): number {
  const xs = outcome / params.scale;

  switch (params.mode) {
    case "CARA":
      // Constant Absolute Risk Aversion: U(x) = 1 - exp(-a×x)
      if (params.a > 1e-10) {
        return 1 - Math.exp(-params.a * xs);
      } else {
        return xs; // Risk-neutral fallback
      }

    case "CRRA":
      // Constant Relative Risk Aversion: U(x) = (x^(1-γ))/(1-γ)
      // where γ = a (relative risk aversion coefficient)
      const x = xs * params.scale; // Use actual outcome for CRRA
      if (x <= 0) return -Infinity; // CRRA undefined for non-positive values

      if (Math.abs(params.a - 1) < 1e-10) {
        // Special case: γ = 1 → U(x) = ln(x)
        return Math.log(x);
      } else {
        return Math.pow(x, 1 - params.a) / (1 - params.a);
      }

    case "Exponential":
      // Exponential Utility: U(x) = -exp(-a×x)
      if (params.a > 1e-10) {
        return -Math.exp(-params.a * xs);
      } else {
        return xs; // Risk-neutral fallback
      }

    case "Quadratic":
      // Quadratic Utility: U(x) = x - (a/2)×x²
      // Risk aversion increases with wealth
      return xs - (params.a / 2) * xs * xs;

    case "Power":
      // Power Utility: U(x) = x^α where α = 1 - a
      // Similar to CRRA but simpler form
      const xPower = xs * params.scale;
      if (xPower <= 0) return -Infinity;
      const alphaPower = 1 - params.a;
      if (Math.abs(alphaPower) < 1e-10) {
        return Math.log(xPower); // Logarithmic utility when α ≈ 0
      }
      return Math.pow(xPower, alphaPower);

    default:
      return xs;
  }
}

// Compute certainty equivalent from expected utility
export function computeCertaintyEquivalent(
  expectedUtility: number,
  params: UtilityParams
): number {
  switch (params.mode) {
    case "CARA":
      if (params.a > 1e-10) {
        return (-1 / params.a) * Math.log(1 - expectedUtility) * params.scale;
      } else {
        return expectedUtility * params.scale; // Risk-neutral
      }

    case "CRRA":
      if (Math.abs(params.a - 1) < 1e-10) {
        // Special case: γ = 1 → CE = exp(EU)
        return Math.exp(expectedUtility);
      } else {
        // CE = [(1-γ)×EU]^(1/(1-γ))
        const base = (1 - params.a) * expectedUtility;
        if (base <= 0) return 0;
        return Math.pow(base, 1 / (1 - params.a));
      }

    case "Exponential":
      if (params.a > 1e-10) {
        return (-1 / params.a) * Math.log(-expectedUtility) * params.scale;
      } else {
        return expectedUtility * params.scale; // Risk-neutral
      }

    case "Quadratic":
      // CE for quadratic: solve x - (a/2)×x² = EU
      // Using quadratic formula: x = (1 - sqrt(1 - 2×a×EU)) / a
      if (params.a > 1e-10) {
        const discriminant = 1 - 2 * params.a * expectedUtility;
        if (discriminant < 0) return 0;
        return ((1 - Math.sqrt(discriminant)) / params.a) * params.scale;
      } else {
        return expectedUtility * params.scale;
      }

    case "Power":
      // CE for power: CE = EU^(1/α) where α = 1 - a
      const alpha = 1 - params.a;
      if (Math.abs(alpha) < 1e-10) {
        return Math.exp(expectedUtility);
      } else {
        if (expectedUtility <= 0) return 0;
        return Math.pow(expectedUtility, 1 / alpha);
      }

    default:
      return expectedUtility * params.scale;
  }
}

// Compute Spearman rank correlation between two arrays
function computeSpearmanRho(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  const n = a.length;

  // Create rank arrays
  const ranksA = getRanks(a);
  const ranksB = getRanks(b);

  // Compute Pearson correlation of ranks
  const meanA = ranksA.reduce((sum, r) => sum + r, 0) / n;
  const meanB = ranksB.reduce((sum, r) => sum + r, 0) / n;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = ranksA[i] - meanA;
    const diffB = ranksB[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  if (denomA === 0 || denomB === 0) return 0;
  return numerator / Math.sqrt(denomA * denomB);
}

// Get ranks of array elements (ascending order, 0-based)
function getRanks(arr: number[]): number[] {
  const indexed = arr.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(arr.length);
  for (let i = 0; i < indexed.length; i++) {
    ranks[indexed[i].idx] = i;
  }
  return ranks;
}

// Apply rank correlation (Iman-Conover inspired) to two sample arrays
function applyRankCorrelation(
  a: number[],
  b: number[],
  targetRho: number,
  rng: () => number
): { bCorr: number[]; achievedRho: number } {
  const runs = a.length;
  if (runs === 0) return { bCorr: b, achievedRho: 0 };

  // Get ranks of a (ascending)
  const ranksA = getRanks(a);

  // Sort b to get bSorted
  const bSorted = [...b].sort((x, y) => x - y);

  // Create correlated b array
  const bCorr = new Array(runs);
  const absRho = Math.abs(targetRho);

  for (let i = 0; i < runs; i++) {
    // Blend rank with randomness to approximate |ρ|
    const rRand = Math.floor(rng() * runs);
    const w = absRho;
    let rTarget = Math.round((1 - w) * rRand + w * ranksA[i]);

    // Clamp to valid range
    rTarget = Math.max(0, Math.min(runs - 1, rTarget));

    // Apply correlation direction
    if (targetRho >= 0) {
      bCorr[i] = bSorted[rTarget];
    } else {
      bCorr[i] = bSorted[runs - 1 - rTarget];
    }
  }

  // Compute achieved Spearman correlation
  const achievedRho = computeSpearmanRho(a, bCorr);

  return { bCorr, achievedRho };
}

// Compute Frobenius norm of matrix difference
function frobeniusNorm(A: number[][], B: number[][]): number {
  let sum = 0;
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[i].length; j++) {
      const diff = A[i][j] - B[i][j];
      sum += diff * diff;
    }
  }
  return Math.sqrt(sum);
}

// Compute Spearman correlation matrix for all variables
function computeSpearmanMatrix(
  samples: Map<string, number[]>,
  varIds: string[]
): number[][] {
  const k = varIds.length;
  const matrix: number[][] = [];

  for (let i = 0; i < k; i++) {
    matrix[i] = [];
    for (let j = 0; j < k; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const samplesI = samples.get(varIds[i]);
        const samplesJ = samples.get(varIds[j]);
        if (samplesI && samplesJ) {
          matrix[i][j] = computeSpearmanRho(samplesI, samplesJ);
        } else {
          matrix[i][j] = 0;
        }
      }
    }
  }

  return matrix;
}

// Check if matrix is symmetric
function isSymmetric(matrix: number[][]): boolean {
  const k = matrix.length;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-6) {
        return false;
      }
    }
  }
  return true;
}

// Simple Cholesky decomposition check (returns true if successful)
function tryCholesky(matrix: number[][]): boolean {
  const k = matrix.length;
  const L: number[][] = Array(k)
    .fill(0)
    .map(() => Array(k).fill(0));

  for (let i = 0; i < k; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let p = 0; p < j; p++) {
        sum += L[i][p] * L[j][p];
      }

      if (i === j) {
        const val = matrix[i][i] - sum;
        if (val <= 0) return false; // Not positive definite
        L[i][j] = Math.sqrt(val);
      } else {
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }

  return true;
}

// Project to nearest positive semi-definite matrix (simplified Higham 2002)
function nearestPSD(matrix: number[][]): number[][] {
  const k = matrix.length;
  const result: number[][] = Array(k)
    .fill(0)
    .map(() => Array(k).fill(0));

  // Simple approach: ensure diagonal is 1, clamp eigenvalues to be non-negative
  // For correlation matrices, we can use a simpler heuristic
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      if (i === j) {
        result[i][j] = 1.0;
      } else {
        // Shrink off-diagonal elements slightly towards zero
        result[i][j] = matrix[i][j] * 0.95;
      }
    }
  }

  return result;
}

// Apply Iman-Conover reordering for full k×k copula matrix
function applyImanConoverReordering(
  samples: Map<string, number[]>,
  varIds: string[],
  targetMatrix: number[][],
  useNearestPD: boolean,
  rng: () => number
): {
  reorderedSamples: Map<string, number[]>;
  achievedMatrix: number[][];
  frobErr: number;
} {
  const k = varIds.length;
  const runs = samples.get(varIds[0])?.length || 0;

  if (runs === 0 || k === 0) {
    return {
      reorderedSamples: samples,
      achievedMatrix: targetMatrix,
      frobErr: 0,
    };
  }

  // Validate matrix is symmetric
  if (!isSymmetric(targetMatrix)) {
    console.warn("Target matrix is not symmetric");
  }

  // Try Cholesky decomposition
  let workingMatrix = targetMatrix;
  if (!tryCholesky(targetMatrix)) {
    if (useNearestPD) {
      workingMatrix = nearestPSD(targetMatrix);
      console.log("Applied nearest PSD projection");
    } else {
      console.warn("Matrix is not positive definite, using as-is");
    }
  }

  // For simplicity, we'll apply pairwise correlations iteratively
  // This is a simplified Iman-Conover approach
  const reorderedSamples = new Map<string, number[]>();

  // Start with first variable unchanged
  const firstVarId = varIds[0];
  reorderedSamples.set(firstVarId, samples.get(firstVarId)!);

  // For each subsequent variable, apply correlation with all previous variables
  for (let i = 1; i < k; i++) {
    const currentVarId = varIds[i];
    let currentSamples = samples.get(currentVarId)!;

    // Apply correlation with the most correlated previous variable
    let maxCorr = 0;
    let maxCorrIdx = 0;
    for (let j = 0; j < i; j++) {
      const corr = Math.abs(workingMatrix[i][j]);
      if (corr > maxCorr) {
        maxCorr = corr;
        maxCorrIdx = j;
      }
    }

    if (maxCorr > 0.01) {
      const refVarId = varIds[maxCorrIdx];
      const refSamples = reorderedSamples.get(refVarId)!;
      const targetRho = workingMatrix[i][maxCorrIdx];

      const { bCorr } = applyRankCorrelation(
        refSamples,
        currentSamples,
        targetRho,
        rng
      );
      currentSamples = bCorr;
    }

    reorderedSamples.set(currentVarId, currentSamples);
  }

  // Compute achieved Spearman matrix
  const achievedMatrix = computeSpearmanMatrix(reorderedSamples, varIds);

  // Compute Frobenius error
  const frobErr = frobeniusNorm(achievedMatrix, workingMatrix);

  return { reorderedSamples, achievedMatrix, frobErr };
}

// Run Monte Carlo simulation for a single option
export function simulateOption(
  option: {
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
    horizonMonths?: number;
  },
  variables: ScenarioVar[],
  runs: number,
  rng: () => number,
  utilityParams?: UtilityParams,
  tcorParams?: TCORParams,
  gameConfig?: GameInteractionConfig,
  optionStrategy?: OurStrategy,
  dependenceConfig?: DependenceConfig,
  bayesianOverride?: BayesianPriorOverride,
  copulaConfig?: CopulaMatrixConfig,
  globalHorizonMonths?: number
): SimulationResult {
  // Generate independent samples for all variables first
  const varSamples = new Map<string, number[]>();
  for (const variable of variables) {
    const samples: number[] = [];
    for (let i = 0; i < runs; i++) {
      samples.push(sampleVariable(variable, rng, bayesianOverride));
    }
    varSamples.set(variable.id, samples);
  }

  // Apply copula matrix if configured (takes precedence over pairwise dependence)
  let copulaSnapshot: CopulaSnapshot | undefined;
  let achievedSpearman: number | undefined;

  if (copulaConfig && copulaConfig.k === variables.length) {
    const varIds = variables.map((v) => v.id);
    const { reorderedSamples, achievedMatrix, frobErr } =
      applyImanConoverReordering(
        varSamples,
        varIds,
        copulaConfig.matrix,
        copulaConfig.useNearestPD,
        rng
      );

    // Replace samples with reordered samples
    for (const [varId, samples] of reorderedSamples.entries()) {
      varSamples.set(varId, samples);
    }

    copulaSnapshot = {
      k: copulaConfig.k,
      target: copulaConfig.matrix,
      achieved: achievedMatrix,
      froErr: frobErr,
    };
  } else if (dependenceConfig) {
    // Apply pairwise rank correlation if copula not configured
    const { varAId, varBId, targetRho } = dependenceConfig;
    const samplesA = varSamples.get(varAId);
    const samplesB = varSamples.get(varBId);

    if (samplesA && samplesB && varAId !== varBId) {
      const { bCorr, achievedRho } = applyRankCorrelation(
        samplesA,
        samplesB,
        targetRho,
        rng
      );
      varSamples.set(varBId, bCorr);
      achievedSpearman = achievedRho;
    }
  }

  // Now compute outcomes using the (possibly correlated) samples
  const outcomes: number[] = [];

  for (let i = 0; i < runs; i++) {
    let ret = option.expectedReturn ?? 0;
    let cost = option.cost ?? 0;

    // Apply scenario variables using pre-generated samples
    for (const variable of variables) {
      const samples = varSamples.get(variable.id);
      if (!samples) continue;

      const x = samples[i];
      const weight = variable.weight ?? 1;
      const f = 1 + weight * x;

      if (variable.appliesTo === "return") {
        ret = Math.max(0, ret * f);
      } else {
        cost = Math.max(0, cost * f);
      }
    }

    // Apply game interaction (2×2) if configured
    if (gameConfig && optionStrategy) {
      // Sample competitor move
      const rand = rng();
      const competitorMove: CompetitorMove =
        rand < gameConfig.pUndercut ? "Undercut" : "Match";

      // Apply multipliers based on competitor move and our strategy
      const retMult =
        gameConfig.multipliers[competitorMove].retMult[optionStrategy];
      const costMult =
        gameConfig.multipliers[competitorMove].costMult[optionStrategy];

      ret = ret * retMult;
      cost = cost * costMult;
    }

    outcomes.push(ret - cost);
  }

  // Apply horizon scaling if provided
  // Use per-option horizon if set, otherwise use global horizon
  // Treat outcomes as annual baseline; scale by h = horizonMonths / 12
  const effectiveHorizon = option.horizonMonths ?? globalHorizonMonths ?? 12;
  const h = effectiveHorizon / 12;
  const scaledOutcomes = outcomes.map((outcome) => outcome * h);

  // Sort outcomes for percentile calculations
  const sortedOutcomes = [...scaledOutcomes].sort((a, b) => a - b);

  // Calculate metrics using scaled outcomes
  const ev =
    scaledOutcomes.reduce((sum, val) => sum + val, 0) / scaledOutcomes.length;
  const var95Index = Math.floor(scaledOutcomes.length * 0.05);
  const var95 = sortedOutcomes[var95Index];

  // CVaR95: mean of outcomes below VaR95
  const belowVar = sortedOutcomes.slice(0, var95Index + 1);
  const cvar95 =
    belowVar.length > 0
      ? belowVar.reduce((sum, val) => sum + val, 0) / belowVar.length
      : var95;

  // Scale economic capital by sqrt(h) for horizon adjustment
  const baseEconomicCapital = Math.max(1, Math.abs(cvar95));
  const economicCapital = baseEconomicCapital * Math.sqrt(h);
  const raroc = ev / economicCapital;

  // Compute utility metrics if params provided (using scaled outcomes)
  let expectedUtility: number | undefined;
  let certaintyEquivalent: number | undefined;

  if (utilityParams) {
    const utilities = scaledOutcomes.map((outcome) =>
      computeUtility(outcome, utilityParams)
    );
    expectedUtility =
      utilities.reduce((sum, u) => sum + u, 0) / utilities.length;
    certaintyEquivalent = computeCertaintyEquivalent(
      expectedUtility,
      utilityParams
    );
  }

  // Compute TCOR if params provided
  let tcor: number | undefined;
  let tcorComponents:
    | {
        expectedLoss: number;
        insurance: number;
        contingency: number;
        mitigation: number;
      }
    | undefined;

  if (tcorParams) {
    // pLoss = fraction of outcomes < 0
    const negativeOutcomes = sortedOutcomes.filter((x) => x < 0);
    const pLoss = negativeOutcomes.length / outcomes.length;

    // meanLossNeg = mean of absolute values for negative outcomes
    const meanLossNeg =
      negativeOutcomes.length > 0
        ? negativeOutcomes.reduce((sum, x) => sum + Math.abs(x), 0) /
          negativeOutcomes.length
        : 0;

    // expectedLoss = pLoss * meanLossNeg
    const expectedLoss = pLoss * meanLossNeg;

    // insurance = insuranceRate * cost
    const insurance = tcorParams.insuranceRate * (option.cost ?? 0);

    // contingency = contingencyOnCap * economicCapital
    const contingency = tcorParams.contingencyOnCap * economicCapital;

    // mitigation = option.mitigationCost || 0
    const mitigation = option.mitigationCost ?? 0;

    // TCOR = expectedLoss + insurance + contingency + mitigation
    tcor = expectedLoss + insurance + contingency + mitigation;

    tcorComponents = {
      expectedLoss,
      insurance,
      contingency,
      mitigation,
    };
  }

  return {
    optionId: option.id,
    optionLabel: option.label,
    outcomes: scaledOutcomes,
    ev,
    var95,
    cvar95,
    economicCapital,
    raroc,
    expectedUtility,
    certaintyEquivalent,
    tcor,
    tcorComponents,
    achievedSpearman,
    copulaSnapshot,
    horizonMonths: effectiveHorizon,
  };
}

// Run simulation for all options
export function runSimulation(
  options: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
    mitigationCost?: number;
    horizonMonths?: number;
  }>,
  variables: ScenarioVar[],
  runs: number,
  seed: number,
  utilityParams?: UtilityParams,
  tcorParams?: TCORParams,
  gameConfig?: GameInteractionConfig,
  optionStrategies?: OptionGameStrategy[],
  dependenceConfig?: DependenceConfig,
  bayesianOverride?: BayesianPriorOverride,
  copulaConfig?: CopulaMatrixConfig,
  globalHorizonMonths?: number
): SimulationResult[] {
  const rng = mulberry32(seed);
  return options.map((option) => {
    const optionStrategy = optionStrategies?.find(
      (s) => s.optionId === option.id
    )?.strategy;
    return simulateOption(
      option,
      variables,
      runs,
      rng,
      utilityParams,
      tcorParams,
      gameConfig,
      optionStrategy,
      dependenceConfig,
      bayesianOverride,
      copulaConfig,
      globalHorizonMonths
    );
  });
}

// Default scenario variables
export const DEFAULT_SCENARIO_VARS: ScenarioVar[] = [
  {
    id: "var-1",
    name: "Demand",
    appliesTo: "return",
    dist: "triangular",
    params: { min: -0.2, mode: 0.0, max: 0.4 },
    weight: 1,
  },
  {
    id: "var-2",
    name: "CostInflation",
    appliesTo: "cost",
    dist: "normal",
    params: { mean: 0.05, sd: 0.03 },
    weight: 1,
  },
];

// Utility: Get parameter labels for a distribution
export function getDistParamLabels(dist: DistributionType): string[] {
  switch (dist) {
    case "normal":
      return ["mean", "sd"];
    case "lognormal":
      return ["mu", "sigma"];
    case "triangular":
      return ["min", "mode", "max"];
    case "uniform":
      return ["min", "max"];
    default:
      return [];
  }
}

// Utility: Format parameter summary
export function formatParamSummary(variable: ScenarioVar): string {
  const { dist, params } = variable;

  switch (dist) {
    case "normal":
      return `N(μ=${params.mean ?? 0}, σ=${params.sd ?? 1})`;
    case "lognormal":
      return `LogN(μ=${params.mu ?? 0}, σ=${params.sigma ?? 1})`;
    case "triangular":
      return `Tri(${params.min ?? -1}, ${params.mode ?? 0}, ${params.max ?? 1})`;
    case "uniform":
      return `U(${params.min ?? 0}, ${params.max ?? 1})`;
    default:
      return "";
  }
}
