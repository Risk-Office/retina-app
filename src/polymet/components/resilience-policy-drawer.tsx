import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ShieldIcon,
  BarChart3Icon,
  InfoIcon,
  SparklesIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTenant } from "@/polymet/data/tenant-context";

/**
 * # Resilience Policy Drawer
 *
 * ## Overview
 * Analyzes organization-wide resilience trends and recommends system-wide guardrail adjustments.
 *
 * ## Features
 * - Trend analysis across all decisions and portfolios
 * - Automatic recommendations for tighter or looser guardrails
 * - Confidence scoring for each recommendation
 * - Preview of impact before applying changes
 * - Audit logging for policy changes
 */

export interface ResilienceTrendData {
  avgAntifragilityIndex: number;
  antifragilityTrend: "improving" | "declining" | "stable";
  breachRate: number;
  breachTrend: "increasing" | "decreasing" | "stable";
  learningRate: number;
  adaptationScore: number;
  totalDecisions: number;
  totalPortfolios: number;
}

export interface GuardrailRecommendation {
  id: string;
  guardrailType: string;
  currentThreshold: number;
  recommendedThreshold: number;
  direction: "tighten" | "loosen";
  confidence: number;
  rationale: string;
  impactedDecisions: number;
  riskLevel: "low" | "medium" | "high";
}

export interface ResiliencePolicyDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trendData: ResilienceTrendData;
  recommendations: GuardrailRecommendation[];
  onApplyRecommendations?: (selectedIds: string[]) => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
  className?: string;
}

/**
 * Get trend icon and color based on direction
 */
function getTrendIndicator(
  trend: "improving" | "declining" | "stable" | "increasing" | "decreasing"
) {
  switch (trend) {
    case "improving":
    case "decreasing":
      return {
        icon: TrendingUpIcon,
        color: "text-green-600 dark:text-green-400",
      };
    case "declining":
    case "increasing":
      return {
        icon: TrendingDownIcon,
        color: "text-red-600 dark:text-red-400",
      };
    case "stable":
      return { icon: BarChart3Icon, color: "text-muted-foreground" };
  }
}

/**
 * Get confidence badge variant
 */
function getConfidenceBadge(confidence: number) {
  if (confidence >= 80)
    return { variant: "default" as const, label: "High Confidence" };
  if (confidence >= 60)
    return { variant: "secondary" as const, label: "Medium Confidence" };
  return { variant: "outline" as const, label: "Low Confidence" };
}

/**
 * Get risk level badge
 */
function getRiskBadge(riskLevel: "low" | "medium" | "high") {
  switch (riskLevel) {
    case "low":
      return {
        variant: "outline" as const,
        color: "text-green-600 dark:text-green-400",
      };
    case "medium":
      return {
        variant: "secondary" as const,
        color: "text-yellow-600 dark:text-yellow-400",
      };
    case "high":
      return {
        variant: "destructive" as const,
        color: "text-red-600 dark:text-red-400",
      };
  }
}

export function ResiliencePolicyDrawer({
  open,
  onOpenChange,
  trendData,
  recommendations,
  onApplyRecommendations,
  onAuditEvent,
  className,
}: ResiliencePolicyDrawerProps) {
  const { tenantId } = useTenant();
  const [selectedRecommendations, setSelectedRecommendations] = useState<
    Set<string>
  >(new Set());
  const [isApplying, setIsApplying] = useState(false);

  // Toggle recommendation selection
  const toggleRecommendation = (id: string) => {
    const newSelected = new Set(selectedRecommendations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecommendations(newSelected);
  };

  // Select all recommendations
  const selectAll = () => {
    setSelectedRecommendations(new Set(recommendations.map((r) => r.id)));
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedRecommendations(new Set());
  };

  // Apply selected recommendations
  const handleApply = () => {
    if (selectedRecommendations.size === 0) return;

    setIsApplying(true);

    const selectedIds = Array.from(selectedRecommendations);
    const selectedRecs = recommendations.filter((r) =>
      selectedIds.includes(r.id)
    );

    // Audit event
    onAuditEvent?.("resilience_policy_applied", {
      tenantId,
      timestamp: Date.now(),
      recommendationCount: selectedIds.length,
      recommendations: selectedRecs.map((r) => ({
        guardrailType: r.guardrailType,
        direction: r.direction,
        currentThreshold: r.currentThreshold,
        recommendedThreshold: r.recommendedThreshold,
      })),
    });

    // Apply recommendations
    onApplyRecommendations?.(selectedIds);

    setTimeout(() => {
      setIsApplying(false);
      setSelectedRecommendations(new Set());
      onOpenChange?.(false);
    }, 1000);
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const tightenCount = recommendations.filter(
      (r) => r.direction === "tighten"
    ).length;
    const loosenCount = recommendations.filter(
      (r) => r.direction === "loosen"
    ).length;
    const highConfidenceCount = recommendations.filter(
      (r) => r.confidence >= 80
    ).length;
    const totalImpactedDecisions = recommendations.reduce(
      (sum, r) => sum + r.impactedDecisions,
      0
    );

    return {
      tightenCount,
      loosenCount,
      highConfidenceCount,
      totalImpactedDecisions,
    };
  }, [recommendations]);

  const antifragilityTrendIndicator = getTrendIndicator(
    trendData.antifragilityTrend
  );
  const breachTrendIndicator = getTrendIndicator(trendData.breachTrend);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-primary" />

            <SheetTitle>Resilience Policy</SheetTitle>
          </div>
          <SheetDescription>
            <TooltipProvider>
              <div className="flex items-center gap-2">
                <span>
                  Auto-suggests tighter or looser limits depending on how the
                  organization adapts.
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      The system analyzes antifragility trends, breach rates,
                      and learning patterns to recommend guardrail adjustments
                      that align with your organization's adaptive capacity.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Trend Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Organization Resilience Trends
                </CardTitle>
                <CardDescription>
                  System-wide metrics over the last 90 days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Antifragility Index */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <antifragilityTrendIndicator.icon
                      className={`h-4 w-4 ${antifragilityTrendIndicator.color}`}
                    />

                    <span className="text-sm font-medium">
                      Avg Antifragility Index
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {trendData.avgAntifragilityIndex.toFixed(0)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {trendData.antifragilityTrend}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Breach Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <breachTrendIndicator.icon
                      className={`h-4 w-4 ${breachTrendIndicator.color}`}
                    />

                    <span className="text-sm font-medium">
                      Guardrail Breach Rate
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {(trendData.breachRate * 100).toFixed(1)}%
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {trendData.breachTrend}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Learning Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                    <span className="text-sm font-medium">Learning Rate</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {(trendData.learningRate * 100).toFixed(0)}%
                  </span>
                </div>

                <Separator />

                {/* Adaptation Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />

                    <span className="text-sm font-medium">
                      Adaptation Score
                    </span>
                  </div>
                  <span className="text-2xl font-bold">
                    {trendData.adaptationScore.toFixed(0)}/100
                  </span>
                </div>

                <Separator />

                {/* Coverage */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {trendData.totalDecisions}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Decisions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {trendData.totalPortfolios}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Portfolios
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Recommendations Summary
                </CardTitle>
                <CardDescription>
                  {recommendations.length} guardrail adjustments suggested
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Tighten</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {summary.tightenCount}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Loosen</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {summary.loosenCount}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      High Confidence
                    </div>
                    <div className="text-2xl font-bold">
                      {summary.highConfidenceCount}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Impacted Decisions
                    </div>
                    <div className="text-2xl font-bold">
                      {summary.totalImpactedDecisions}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Recommended Adjustments
                </h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    Clear
                  </Button>
                </div>
              </div>

              {recommendations.map((rec) => {
                const isSelected = selectedRecommendations.has(rec.id);
                const confidenceBadge = getConfidenceBadge(rec.confidence);
                const riskBadge = getRiskBadge(rec.riskLevel);

                return (
                  <Card
                    key={rec.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "ring-2 ring-primary" : "hover:bg-accent/50"
                    }`}
                    onClick={() => toggleRecommendation(rec.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => toggleRecommendation(rec.id)}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold">
                                {rec.guardrailType}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {rec.rationale}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <Badge {...confidenceBadge}>
                                {confidenceBadge.label}
                              </Badge>
                              <Badge {...riskBadge} className={riskBadge.color}>
                                {rec.riskLevel} risk
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Current:
                              </span>
                              <span className="font-mono font-semibold">
                                {rec.currentThreshold}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {rec.direction === "tighten" ? (
                                <TrendingDownIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              ) : (
                                <TrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Recommended:
                              </span>
                              <span className="font-mono font-semibold">
                                {rec.recommendedThreshold}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <AlertTriangleIcon className="h-3 w-3" />

                            <span>
                              Impacts {rec.impactedDecisions} decision(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {recommendations.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle2Icon className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />

                  <p className="text-sm font-medium">No adjustments needed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your guardrails are well-calibrated to current resilience
                    trends.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {selectedRecommendations.size} of {recommendations.length}{" "}
              selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={selectedRecommendations.size === 0 || isApplying}
              >
                {isApplying
                  ? "Applying..."
                  : `Apply ${selectedRecommendations.size} Change(s)`}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Trigger button for the Resilience Policy drawer
 */
export function ResiliencePolicyTrigger({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={className}
          >
            <ShieldIcon className="h-4 w-4 mr-2" />
            Resilience Policy
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Auto-suggests tighter or looser limits depending on how the
            organization adapts.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
