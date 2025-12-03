import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  HistoryIcon,
  LayoutGridIcon,
} from "lucide-react";
import { AntifragilityGauge } from "@/polymet/components/antifragility-gauge";
import { AntifragilityHistoryChart } from "@/polymet/components/antifragility-history-chart";
import { AntifragilityComparisonView } from "@/polymet/components/antifragility-comparison-view";
import type { DecisionAntifragilityData } from "@/polymet/components/antifragility-comparison-view";
import {
  getPortfolioHistory,
  addPortfolioSnapshot,
  calculateTrend,
  getStatistics,
} from "@/polymet/data/antifragility-history";
import { cn } from "@/lib/utils";

interface PortfolioAntifragilityCardProps {
  portfolioId: string;
  portfolioName: string;
  tenantId: string;
  currentIndex: number;
  decisions?: DecisionAntifragilityData[];
  onViewHistory?: () => void;
  onViewComparison?: () => void;
  className?: string;
}

export function PortfolioAntifragilityCard({
  portfolioId,
  portfolioName,
  tenantId,
  currentIndex,
  decisions = [],
  className,
}: PortfolioAntifragilityCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [history, setHistory] = useState(
    getPortfolioHistory(tenantId, portfolioId)
  );

  // Update history when current index changes
  useEffect(() => {
    if (currentIndex > 0) {
      addPortfolioSnapshot(tenantId, portfolioId, portfolioName, {
        timestamp: Date.now(),
        value: currentIndex,
        label: "Portfolio update",
      });
      setHistory(getPortfolioHistory(tenantId, portfolioId));
    }
  }, [currentIndex, portfolioId, portfolioName, tenantId]);

  const trend = history ? calculateTrend(history.snapshots) : null;
  const stats = history ? getStatistics(history.snapshots) : null;

  const getTrendIcon = () => {
    if (!trend) return MinusIcon;
    switch (trend.direction) {
      case "up":
        return TrendingUpIcon;
      case "down":
        return TrendingDownIcon;
      default:
        return MinusIcon;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    switch (trend.direction) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <>
      <Card className={cn("rounded-2xl shadow-sm", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Portfolio Antifragility</CardTitle>
              <CardDescription>
                Aggregate resilience across {decisions.length} decision
                {decisions.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            {trend && (
              <div className="flex items-center gap-2">
                <TrendIcon className={cn("w-5 h-5", getTrendColor())} />

                <div className="text-right">
                  <p className={cn("text-lg font-bold", getTrendColor())}>
                    {trend.change > 0 ? "+" : ""}
                    {trend.change.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trend.percentage > 0 ? "+" : ""}
                    {trend.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gauge */}
          <div className="flex justify-center">
            <AntifragilityGauge
              value={currentIndex}
              size="lg"
              variant="inline"
            />
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-lg font-bold">{stats.current.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Average</p>
                <p className="text-lg font-bold">{stats.average.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Peak</p>
                <p className="text-lg font-bold">{stats.peak.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Volatility</p>
                <p className="text-lg font-bold">
                  {stats.volatility.toFixed(1)}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowHistory(true)}
              disabled={!history || history.snapshots.length < 2}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              View History
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowComparison(true)}
              disabled={decisions.length === 0}
            >
              <LayoutGridIcon className="w-4 h-4 mr-2" />
              Compare Decisions
            </Button>
          </div>

          {/* Decision Summary */}
          {decisions.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold mb-2">Decision Breakdown</p>
              <div className="space-y-2">
                {decisions.slice(0, 3).map((decision) => (
                  <div
                    key={decision.decisionId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground truncate flex-1">
                      {decision.decisionTitle}
                    </span>
                    <Badge variant="outline">
                      {decision.antifragilityIndex.toFixed(1)}
                    </Badge>
                  </div>
                ))}
                {decisions.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{decisions.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Chart Dialog */}
      {history && history.snapshots.length >= 2 && (
        <AntifragilityHistoryChart
          data={history.snapshots}
          title={`${portfolioName} - Antifragility History`}
          description="Track portfolio resilience over time"
          className={showHistory ? "block" : "hidden"}
        />
      )}

      {/* Comparison View Dialog */}
      <AntifragilityComparisonView
        open={showComparison}
        onOpenChange={setShowComparison}
        decisions={decisions}
        title={`${portfolioName} - Decision Comparison`}
        description="Compare antifragility across portfolio decisions"
      />
    </>
  );
}
