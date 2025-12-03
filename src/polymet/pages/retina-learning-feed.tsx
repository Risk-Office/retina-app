import React, { useState } from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  getDailyLearningFeed,
  getLearningFeedHistory,
  getCategoryStyle,
  getImpactStyle,
  type LearningInsight,
  type DailyLearningFeed,
} from "@/polymet/data/learning-feed";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  RefreshCwIcon,
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  SparklesIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RetinaLearningFeed() {
  const { tenant } = useTenant();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedImpact, setSelectedImpact] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<number>(1); // Days

  // Get learning feed
  const feed = getDailyLearningFeed(tenant.tenantId);

  // Filter insights
  const filteredInsights = feed.insights.filter((insight) => {
    if (selectedCategory !== "all" && insight.category !== selectedCategory) {
      return false;
    }
    if (selectedImpact !== "all" && insight.impact !== selectedImpact) {
      return false;
    }
    return true;
  });

  // Export insights as CSV
  const handleExport = () => {
    const rows = [
      ["Timestamp", "Category", "Impact", "Title", "Description"],
      ...filteredInsights.map((insight) => [
        new Date(insight.timestamp).toLocaleString(),
        insight.category,
        insight.impact,
        insight.title,
        insight.description,
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learning-feed-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Refresh feed (in real app, would fetch from API)
  const handleRefresh = () => {
    console.warn(
      "Prevented function call: `window.location.reload()`"
    ) /*TODO: Do not use window.location for navigation. Use react-router instead.*/;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-primary" />
            Daily Learning Feed
          </h1>
          <p className="text-muted-foreground mt-1">
            System-generated insights from the last 24 hours
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Insights</CardDescription>
            <CardTitle className="text-3xl">
              {feed.summary.totalInsights}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generated in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>High Impact</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">
              {feed.summary.highImpact}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Top Category</CardDescription>
            <CardTitle className="text-2xl capitalize">
              {feed.summary.topCategory}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Most active area</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FilterIcon className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>
                Showing {filteredInsights.length} of {feed.insights.length}{" "}
                insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="guardrails">Guardrails</SelectItem>
                  <SelectItem value="antifragility">Antifragility</SelectItem>
                  <SelectItem value="signals">Signals</SelectItem>
                  <SelectItem value="incidents">Incidents</SelectItem>
                  <SelectItem value="outcomes">Outcomes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Impact</label>
              <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  <SelectItem value="high">High Impact</SelectItem>
                  <SelectItem value="medium">Medium Impact</SelectItem>
                  <SelectItem value="low">Low Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <SparklesIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />

              <p className="text-muted-foreground">
                No insights match your filters. Try adjusting the filters above.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}

interface InsightCardProps {
  insight: LearningInsight;
}

function InsightCard({ insight }: InsightCardProps) {
  const categoryStyle = getCategoryStyle(insight.category);
  const impactStyle = getImpactStyle(insight.impact);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={categoryStyle.bgColor}>
                <span className={categoryStyle.color}>
                  {categoryStyle.label}
                </span>
              </Badge>
              <Badge className={impactStyle.color}>{impactStyle.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(insight.timestamp).toLocaleString()}
              </span>
            </div>
            <CardTitle className="text-xl">{insight.title}</CardTitle>
            <CardDescription className="mt-2">
              {insight.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {insight.metrics && insight.metrics.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {insight.metrics.map((metric, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {metric.label}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-lg font-semibold">{metric.value}</p>
                    {metric.trend && (
                      <span>
                        {metric.trend === "up" && (
                          <TrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                        {metric.trend === "down" && (
                          <TrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                        {metric.trend === "stable" && (
                          <MinusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {insight.relatedEntities && insight.relatedEntities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Related Entities
              </p>
              <div className="flex flex-wrap gap-2">
                {insight.relatedEntities.map((entity, idx) => (
                  <Badge key={idx} variant="secondary">
                    {entity.type}: {entity.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
