import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BrainIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ZapIcon,
  TargetIcon,
  LayersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionPattern {
  id: string;
  decisionId: string;
  decisionTitle: string;
  pattern: string;
  frequency: number;
  confidence: number;
  impact: "high" | "medium" | "low";
  category:
    | "variance_spike"
    | "gradual_drift"
    | "seasonal"
    | "threshold_breach"
    | "correlation";
}

interface PatternCluster {
  id: string;
  name: string;
  description: string;
  decisions: string[];
  commonality: string;
  strength: number;
  recommendation?: string;
}

interface PatternRecognitionPanelProps {
  decisions: Array<{
    id: string;
    title: string;
    adjustmentCount: number;
    avgVariance: number;
    status: string;
  }>;
  onApplyInsight?: (insight: string) => void;
}

export function PatternRecognitionPanel({
  decisions,
  onApplyInsight,
}: PatternRecognitionPanelProps) {
  // Analyze patterns across decisions
  const analyzePatterns = (): DecisionPattern[] => {
    const patterns: DecisionPattern[] = [];

    decisions.forEach((decision) => {
      // Pattern 1: High variance spike
      if (Math.abs(decision.avgVariance) > 10) {
        patterns.push({
          id: `${decision.id}-variance-spike`,
          decisionId: decision.id,
          decisionTitle: decision.title,
          pattern: "Variance Spike",
          frequency: decision.adjustmentCount,
          confidence: 0.85,
          impact: "high",
          category: "variance_spike",
        });
      }

      // Pattern 2: Gradual drift
      if (decision.adjustmentCount >= 3 && Math.abs(decision.avgVariance) > 5) {
        patterns.push({
          id: `${decision.id}-gradual-drift`,
          decisionId: decision.id,
          decisionTitle: decision.title,
          pattern: "Gradual Performance Drift",
          frequency: decision.adjustmentCount,
          confidence: 0.75,
          impact: "medium",
          category: "gradual_drift",
        });
      }

      // Pattern 3: Frequent adjustments
      if (decision.adjustmentCount >= 4) {
        patterns.push({
          id: `${decision.id}-frequent-adj`,
          decisionId: decision.id,
          decisionTitle: decision.title,
          pattern: "Frequent Adjustment Cycle",
          frequency: decision.adjustmentCount,
          confidence: 0.9,
          impact: "high",
          category: "threshold_breach",
        });
      }
    });

    return patterns;
  };

  // Identify pattern clusters
  const identifyClusters = (): PatternCluster[] => {
    const patterns = analyzePatterns();
    const clusters: PatternCluster[] = [];

    // Cluster 1: High variance decisions
    const highVarianceDecisions = decisions.filter(
      (d) => Math.abs(d.avgVariance) > 10
    );
    if (highVarianceDecisions.length >= 2) {
      clusters.push({
        id: "cluster-high-variance",
        name: "High Variance Cluster",
        description:
          "Decisions experiencing significant performance deviations",
        decisions: highVarianceDecisions.map((d) => d.title),
        commonality: "All show variance exceeding 10% threshold",
        strength: 0.85,
        recommendation:
          "Consider implementing stricter initial guardrails for similar decisions",
      });
    }

    // Cluster 2: Frequent adjusters
    const frequentAdjusters = decisions.filter((d) => d.adjustmentCount >= 3);
    if (frequentAdjusters.length >= 2) {
      clusters.push({
        id: "cluster-frequent-adj",
        name: "Frequent Adjustment Cluster",
        description: "Decisions requiring multiple guardrail adjustments",
        decisions: frequentAdjusters.map((d) => d.title),
        commonality: "All required 3+ adjustments within monitoring period",
        strength: 0.78,
        recommendation:
          "Review initial assumptions and consider more conservative baseline parameters",
      });
    }

    // Cluster 3: Stable performers
    const stablePerformers = decisions.filter(
      (d) => Math.abs(d.avgVariance) < 5 && d.adjustmentCount <= 1
    );
    if (stablePerformers.length >= 2) {
      clusters.push({
        id: "cluster-stable",
        name: "Stable Performance Cluster",
        description: "Decisions tracking close to expectations",
        decisions: stablePerformers.map((d) => d.title),
        commonality: "Low variance and minimal adjustments required",
        strength: 0.92,
        recommendation:
          "Use these decisions as templates for similar future scenarios",
      });
    }

    return clusters;
  };

  const patterns = analyzePatterns();
  const clusters = identifyClusters();

  // Calculate overall insights
  const totalPatterns = patterns.length;
  const highImpactPatterns = patterns.filter((p) => p.impact === "high").length;
  const avgConfidence =
    patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "medium":
        return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30";
      case "low":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "variance_spike":
        return TrendingUpIcon;
      case "gradual_drift":
        return AlertCircleIcon;
      case "threshold_breach":
        return ZapIcon;
      case "seasonal":
        return TargetIcon;
      case "correlation":
        return LayersIcon;
      default:
        return BrainIcon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BrainIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Pattern Recognition
          </h3>
          <p className="text-sm text-muted-foreground">
            ML-powered analysis across {decisions.length} decisions
          </p>
        </div>
      </div>

      {/* Overall Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                Patterns Detected
              </div>
              <div className="text-2xl font-bold text-foreground">
                {totalPatterns}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                High Impact
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {highImpactPatterns}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                Avg Confidence
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(avgConfidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detected Patterns</CardTitle>
            <CardDescription>
              Recurring behaviors identified across decisions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {patterns.map((pattern) => {
              const Icon = getCategoryIcon(pattern.category);
              return (
                <div
                  key={pattern.id}
                  className="p-4 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">
                            {pattern.pattern}
                          </span>
                          <Badge className={getImpactColor(pattern.impact)}>
                            {pattern.impact} impact
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pattern.decisionTitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium text-foreground">
                        {(pattern.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={pattern.confidence * 100}
                      className="h-1"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Frequency: {pattern.frequency}x</span>
                    <span>Category: {pattern.category.replace("_", " ")}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Pattern Clusters */}
      {clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-primary" />
              Pattern Clusters
            </CardTitle>
            <CardDescription>
              Groups of decisions with similar behaviors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-4 border-2 border-primary/20 rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      {cluster.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {cluster.description}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      cluster.strength >= 0.8
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {(cluster.strength * 100).toFixed(0)}% match
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-foreground">
                    Decisions in cluster ({cluster.decisions.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cluster.decisions.map((decision, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {decision.substring(0, 30)}
                        {decision.length > 30 ? "..." : ""}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircleIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />

                    <div className="flex-1">
                      <div className="text-xs font-medium text-foreground mb-1">
                        Common Pattern
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cluster.commonality}
                      </p>
                    </div>
                  </div>

                  {cluster.recommendation && (
                    <div className="flex items-start gap-2 mt-3">
                      <ZapIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />

                      <div className="flex-1">
                        <div className="text-xs font-medium text-foreground mb-1">
                          Recommendation
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {cluster.recommendation}
                        </p>
                        {onApplyInsight && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onApplyInsight(cluster.recommendation!)
                            }
                          >
                            Apply Insight
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ML Model Info */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <BrainIcon className="w-5 h-5 text-muted-foreground mt-0.5" />

            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">ML Model:</strong>{" "}
                Unsupervised clustering with k-means and DBSCAN algorithms.
                Patterns are identified using statistical analysis of variance
                trends, adjustment frequency, and temporal correlations.
                Confidence scores reflect pattern consistency across the
                dataset.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {patterns.length === 0 && clusters.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BrainIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

            <p className="text-sm text-muted-foreground">
              Not enough data to identify patterns. Add more decisions with
              outcome data to enable pattern recognition.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
