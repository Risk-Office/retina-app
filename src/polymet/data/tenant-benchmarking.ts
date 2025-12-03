/**
 * # Tenant Benchmarking System
 *
 * Provides anonymized cross-tenant comparison of antifragility metrics
 * to help organizations understand their relative performance in learning
 * speed and resilience.
 */

export interface TenantBenchmark {
  tenantId: string;
  anonymizedLabel: string; // e.g., "Peer A", "Peer B", "You"
  antifragilityIndex: number;
  learningRate: number; // Rate of improvement over time
  stabilityRatio: number;
  shockAbsorption: number;
  guardrailBreachRate: number;
  decisionCount: number;
  industry?: string;
  size?: "small" | "medium" | "large";
}

export interface BenchmarkDistribution {
  metric: string;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  yourValue: number;
  yourPercentile: number;
}

export interface BenchmarkInsight {
  category: "strength" | "opportunity" | "neutral";
  title: string;
  description: string;
  metric: string;
  yourValue: number;
  peerAverage: number;
  topPerformer: number;
}

/**
 * Generate anonymized benchmark data for cross-tenant comparison
 */
export function generateBenchmarkData(
  currentTenantId: string,
  currentMetrics: {
    antifragilityIndex: number;
    learningRate: number;
    stabilityRatio: number;
    shockAbsorption: number;
    guardrailBreachRate: number;
    decisionCount: number;
  }
): TenantBenchmark[] {
  // In production, this would fetch real anonymized data from backend
  // For now, generate synthetic peer data

  const peers: TenantBenchmark[] = [
    {
      tenantId: currentTenantId,
      anonymizedLabel: "You",
      antifragilityIndex: currentMetrics.antifragilityIndex,
      learningRate: currentMetrics.learningRate,
      stabilityRatio: currentMetrics.stabilityRatio,
      shockAbsorption: currentMetrics.shockAbsorption,
      guardrailBreachRate: currentMetrics.guardrailBreachRate,
      decisionCount: currentMetrics.decisionCount,
    },
  ];

  // Generate 15 synthetic peers with realistic distributions
  const peerLabels = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
  ];

  for (let i = 0; i < 15; i++) {
    // Generate metrics with normal distribution around realistic values
    const baseAF = 55 + Math.random() * 30; // 55-85 range
    const baseLR = 0.15 + Math.random() * 0.25; // 0.15-0.40 range
    const baseSR = 0.65 + Math.random() * 0.3; // 0.65-0.95 range
    const baseSA = 0.55 + Math.random() * 0.35; // 0.55-0.90 range
    const baseGBR = 0.05 + Math.random() * 0.2; // 0.05-0.25 range

    peers.push({
      tenantId: `peer-${i}`,
      anonymizedLabel: `Peer ${peerLabels[i]}`,
      antifragilityIndex: Math.round(baseAF * 10) / 10,
      learningRate: Math.round(baseLR * 100) / 100,
      stabilityRatio: Math.round(baseSR * 100) / 100,
      shockAbsorption: Math.round(baseSA * 100) / 100,
      guardrailBreachRate: Math.round(baseGBR * 100) / 100,
      decisionCount: Math.floor(20 + Math.random() * 180),
      industry: [
        "Financial Services",
        "Healthcare",
        "Manufacturing",
        "Technology",
        "Retail",
      ][Math.floor(Math.random() * 5)],
      size: ["small", "medium", "large"][Math.floor(Math.random() * 3)] as
        | "small"
        | "medium"
        | "large",
    });
  }

  return peers;
}

/**
 * Calculate percentile distributions for each metric
 */
export function calculateDistributions(
  benchmarks: TenantBenchmark[],
  currentTenantId: string
): BenchmarkDistribution[] {
  const currentTenant = benchmarks.find((b) => b.tenantId === currentTenantId);
  if (!currentTenant) return [];

  const metrics = [
    { key: "antifragilityIndex", label: "Antifragility Index" },
    { key: "learningRate", label: "Learning Rate" },
    { key: "stabilityRatio", label: "Stability Ratio" },
    { key: "shockAbsorption", label: "Shock Absorption" },
    {
      key: "guardrailBreachRate",
      label: "Guardrail Breach Rate",
      inverse: true,
    },
  ];

  return metrics.map(({ key, label, inverse }) => {
    const values = benchmarks
      .map((b) => b[key as keyof TenantBenchmark] as number)
      .sort((a, b) => a - b);

    const yourValue = currentTenant[key as keyof TenantBenchmark] as number;

    // Calculate percentiles
    const p25 = values[Math.floor(values.length * 0.25)];
    const p50 = values[Math.floor(values.length * 0.5)];
    const p75 = values[Math.floor(values.length * 0.75)];
    const p90 = values[Math.floor(values.length * 0.9)];

    // Calculate your percentile
    const rank = values.filter((v) =>
      inverse ? v > yourValue : v < yourValue
    ).length;
    const yourPercentile = Math.round((rank / values.length) * 100);

    return {
      metric: label,
      percentile25: p25,
      percentile50: p50,
      percentile75: p75,
      percentile90: p90,
      yourValue,
      yourPercentile,
    };
  });
}

/**
 * Generate insights based on benchmark comparison
 */
export function generateBenchmarkInsights(
  distributions: BenchmarkDistribution[]
): BenchmarkInsight[] {
  const insights: BenchmarkInsight[] = [];

  distributions.forEach((dist) => {
    const peerAverage = dist.percentile50;
    const topPerformer = dist.percentile90;
    const isInverse = dist.metric === "Guardrail Breach Rate";

    let category: "strength" | "opportunity" | "neutral";
    let title: string;
    let description: string;

    if (isInverse) {
      // Lower is better
      if (dist.yourPercentile >= 75) {
        category = "strength";
        title = `Strong ${dist.metric} Performance`;
        description = `Your ${dist.metric.toLowerCase()} is in the top 25% of peers, indicating excellent risk management.`;
      } else if (dist.yourPercentile <= 25) {
        category = "opportunity";
        title = `${dist.metric} Improvement Opportunity`;
        description = `Your ${dist.metric.toLowerCase()} is higher than 75% of peers. Consider tightening guardrails.`;
      } else {
        category = "neutral";
        title = `Average ${dist.metric}`;
        description = `Your ${dist.metric.toLowerCase()} is in line with peer average.`;
      }
    } else {
      // Higher is better
      if (dist.yourPercentile >= 75) {
        category = "strength";
        title = `Excellent ${dist.metric}`;
        description = `You're in the top 25% of peers for ${dist.metric.toLowerCase()}, demonstrating strong performance.`;
      } else if (dist.yourPercentile <= 25) {
        category = "opportunity";
        title = `${dist.metric} Growth Opportunity`;
        description = `Your ${dist.metric.toLowerCase()} is below 75% of peers. Focus on this area for improvement.`;
      } else {
        category = "neutral";
        title = `Competitive ${dist.metric}`;
        description = `Your ${dist.metric.toLowerCase()} is competitive with peer average.`;
      }
    }

    insights.push({
      category,
      title,
      description,
      metric: dist.metric,
      yourValue: dist.yourValue,
      peerAverage,
      topPerformer,
    });
  });

  return insights;
}

/**
 * Get industry-specific benchmarks
 */
export function getIndustryBenchmarks(
  benchmarks: TenantBenchmark[],
  industry?: string
): TenantBenchmark[] {
  if (!industry) return benchmarks;

  return benchmarks.filter(
    (b) => b.tenantId === benchmarks[0].tenantId || b.industry === industry
  );
}

/**
 * Get size-specific benchmarks
 */
export function getSizeBenchmarks(
  benchmarks: TenantBenchmark[],
  size?: "small" | "medium" | "large"
): TenantBenchmark[] {
  if (!size) return benchmarks;

  return benchmarks.filter(
    (b) => b.tenantId === benchmarks[0].tenantId || b.size === size
  );
}
