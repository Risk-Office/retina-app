import { getAdjustmentTrends } from "@/polymet/data/guardrail-auto-adjust";
import { getPortfolioHistory } from "@/polymet/data/antifragility-history";
import { loadPortfolios } from "@/polymet/data/decision-portfolios";

/**
 * # Learning Feed System
 *
 * Aggregates daily insights from:
 * - Guardrail adjustments (tightening/loosening patterns)
 * - Portfolio antifragility trends
 * - Signal refresh impacts
 * - Incident patterns
 * - Decision outcomes
 */

export interface LearningInsight {
  id: string;
  timestamp: number;
  category:
    | "guardrails"
    | "antifragility"
    | "signals"
    | "incidents"
    | "outcomes";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  metrics?: {
    label: string;
    value: string;
    trend?: "up" | "down" | "stable";
  }[];
  relatedEntities?: {
    type: "portfolio" | "decision" | "guardrail";
    id: string;
    name: string;
  }[];
}

export interface DailyLearningFeed {
  date: number;
  insights: LearningInsight[];
  summary: {
    totalInsights: number;
    highImpact: number;
    topCategory: string;
  };
}

/**
 * Generate learning insights for the last 24 hours
 */
export function generateDailyInsights(tenantId: string): LearningInsight[] {
  const insights: LearningInsight[] = [];
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // 1. Guardrail adjustment insights
  const adjustmentTrends = getAdjustmentTrends(tenantId, 1); // Last 1 day
  const recentAdjustments = adjustmentTrends.flatMap((trend) =>
    Object.entries(trend.metrics).map(([metric, count]) => ({
      metric,
      count,
      date: trend.date,
    }))
  );

  if (recentAdjustments.length > 0) {
    // Group by metric/domain
    const domainCounts: Record<string, number> = {};
    recentAdjustments.forEach((adj) => {
      const domain = adj.metric.includes("RAROC")
        ? "Finance"
        : adj.metric.includes("VaR")
          ? "Risk"
          : "General";
      domainCounts[domain] = (domainCounts[domain] || 0) + adj.count;
    });

    Object.entries(domainCounts).forEach(([domain, count]) => {
      if (count >= 2) {
        insights.push({
          id: `guardrail-${domain}-${now}`,
          timestamp: now,
          category: "guardrails",
          title: `Guardrails Tightened ${count}× in ${domain} Domain`,
          description: `System detected ${count} guardrail adjustments in the ${domain} domain over the last 24 hours, indicating increased risk sensitivity in this area.`,
          impact: count >= 3 ? "high" : "medium",
          metrics: [
            {
              label: "Adjustments",
              value: `${count}`,
              trend: "up",
            },
            {
              label: "Domain",
              value: domain,
            },
          ],
        });
      }
    });
  }

  // 2. Portfolio antifragility insights
  const portfolios = loadPortfolios(tenantId);
  portfolios.forEach((portfolio) => {
    const history = getPortfolioHistory(tenantId, portfolio.id);
    if (history.length >= 2) {
      const latest = history[history.length - 1];
      const previous = history[history.length - 2];
      const change = ((latest.index - previous.index) / previous.index) * 100;

      if (Math.abs(change) >= 10) {
        insights.push({
          id: `antifragility-${portfolio.id}-${now}`,
          timestamp: now,
          category: "antifragility",
          title: `Portfolio "${portfolio.name}" Shows ${Math.abs(change).toFixed(0)}% Antifragility ${change > 0 ? "Gain" : "Decline"}`,
          description: `Portfolio antifragility index ${change > 0 ? "increased" : "decreased"} from ${previous.index.toFixed(1)} to ${latest.index.toFixed(1)}, indicating ${change > 0 ? "improved" : "reduced"} resilience to shocks.`,
          impact: Math.abs(change) >= 20 ? "high" : "medium",
          metrics: [
            {
              label: "Current Index",
              value: latest.index.toFixed(1),
              trend: change > 0 ? "up" : "down",
            },
            {
              label: "Change",
              value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
              trend: change > 0 ? "up" : "down",
            },
          ],

          relatedEntities: [
            {
              type: "portfolio",
              id: portfolio.id,
              name: portfolio.name,
            },
          ],
        });
      }
    }
  });

  // 3. Cross-portfolio learning patterns
  if (portfolios.length >= 2) {
    const portfolioIndices = portfolios.map((p) => {
      const history = getPortfolioHistory(tenantId, p.id);
      return {
        name: p.name,
        index: history.length > 0 ? history[history.length - 1].index : 50,
      };
    });

    const avgIndex =
      portfolioIndices.reduce((sum, p) => sum + p.index, 0) /
      portfolioIndices.length;
    const strongPortfolios = portfolioIndices.filter((p) => p.index >= 70);

    if (strongPortfolios.length >= 2) {
      insights.push({
        id: `cross-portfolio-${now}`,
        timestamp: now,
        category: "antifragility",
        title: `${strongPortfolios.length} Portfolios Achieve "Excellent" Antifragility Rating`,
        description: `Organization-wide antifragility average is ${avgIndex.toFixed(1)}, with ${strongPortfolios.length} portfolios exceeding the 70-point threshold for excellent resilience.`,
        impact: "high",
        metrics: [
          {
            label: "Org Average",
            value: avgIndex.toFixed(1),
            trend: avgIndex >= 60 ? "up" : "stable",
          },
          {
            label: "Strong Portfolios",
            value: `${strongPortfolios.length}/${portfolios.length}`,
          },
        ],
      });
    }
  }

  // 4. Signal refresh insights (simulated - would come from signal-monitor)
  const signalRefreshCount = Math.floor(Math.random() * 5) + 1;
  if (signalRefreshCount >= 3) {
    insights.push({
      id: `signals-${now}`,
      timestamp: now,
      category: "signals",
      title: `${signalRefreshCount} Decisions Auto-Refreshed from Signal Updates`,
      description: `External signals triggered automatic re-evaluation of ${signalRefreshCount} decisions, ensuring decisions remain aligned with current market conditions.`,
      impact: "medium",
      metrics: [
        {
          label: "Refreshed Decisions",
          value: `${signalRefreshCount}`,
        },
      ],
    });
  }

  // 5. Incident pattern insights (simulated)
  const incidentCount = Math.floor(Math.random() * 3);
  if (incidentCount >= 2) {
    insights.push({
      id: `incidents-${now}`,
      timestamp: now,
      category: "incidents",
      title: `${incidentCount} Incidents Matched to Active Decisions`,
      description: `System detected ${incidentCount} external incidents that impacted active decisions, triggering automatic journal entries and re-evaluation tags.`,
      impact: "high",
      metrics: [
        {
          label: "Matched Incidents",
          value: `${incidentCount}`,
          trend: "up",
        },
      ],
    });
  }

  // Sort by impact and timestamp
  insights.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
    if (impactDiff !== 0) return impactDiff;
    return b.timestamp - a.timestamp;
  });

  return insights;
}

/**
 * Get daily learning feed for a tenant
 */
export function getDailyLearningFeed(tenantId: string): DailyLearningFeed {
  const insights = generateDailyInsights(tenantId);

  // Calculate summary
  const highImpact = insights.filter((i) => i.impact === "high").length;
  const categoryCounts: Record<string, number> = {};
  insights.forEach((i) => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });

  const topCategory =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "none";

  return {
    date: Date.now(),
    insights,
    summary: {
      totalInsights: insights.length,
      highImpact,
      topCategory,
    },
  };
}

/**
 * Get learning feed history for the last N days
 */
export function getLearningFeedHistory(
  tenantId: string,
  days: number = 7
): DailyLearningFeed[] {
  const feeds: DailyLearningFeed[] = [];
  const now = Date.now();

  for (let i = 0; i < days; i++) {
    const date = now - i * 24 * 60 * 60 * 1000;
    // In a real system, this would fetch historical data
    // For now, we'll just generate current insights for demo
    if (i === 0) {
      feeds.push(getDailyLearningFeed(tenantId));
    } else {
      // Historical feeds would be stored/retrieved
      feeds.push({
        date,
        insights: [],
        summary: {
          totalInsights: 0,
          highImpact: 0,
          topCategory: "none",
        },
      });
    }
  }

  return feeds;
}

/**
 * Get category icon and color
 */
export function getCategoryStyle(category: LearningInsight["category"]): {
  color: string;
  bgColor: string;
  label: string;
} {
  const styles = {
    guardrails: {
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      label: "Guardrails",
    },
    antifragility: {
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
      label: "Antifragility",
    },
    signals: {
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      label: "Signals",
    },
    incidents: {
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      label: "Incidents",
    },
    outcomes: {
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
      label: "Outcomes",
    },
  };

  return styles[category];
}

/**
 * Get impact badge style
 */
export function getImpactStyle(impact: LearningInsight["impact"]): {
  color: string;
  label: string;
} {
  const styles = {
    high: {
      color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
      label: "High Impact",
    },
    medium: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      label: "Medium Impact",
    },
    low: {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      label: "Low Impact",
    },
  };

  return styles[impact];
}
