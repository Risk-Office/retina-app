import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircleIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  SkipBackIcon,
  DownloadIcon,
  BarChart3Icon,
  ClockIcon,
  FileTextIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface TimelineEvent {
  id: string;
  type: "decision" | "outcome" | "adjustment" | "review";
  date: number;
  title: string;
  description: string;
  metrics?: {
    expectedValue?: number;
    actualValue?: number;
    variance?: number;
  };
}

interface MetricsData {
  month: string;
  expected: number;
  actual: number;
  variance: number;
}

interface FeedbackLoopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionTitle: string;
  decisionDate: number;
  chosenOption: string;
  outcomeData?: {
    logged: boolean;
    date?: number;
    summary?: string;
  };
  adjustmentData?: {
    count: number;
    lastAdjustment?: string;
    date?: number;
  };
  // Enhanced props
  timelineEvents?: TimelineEvent[];
  metricsHistory?: MetricsData[];
  decisionId?: string;
}

export function FeedbackLoopModal({
  open,
  onOpenChange,
  decisionTitle,
  decisionDate,
  chosenOption,
  outcomeData,
  adjustmentData,
  timelineEvents,
  metricsHistory,
  decisionId,
}: FeedbackLoopModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState("cycle");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );

  // Animation cycle: 0 -> 1 -> 2 -> 0
  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setIsPlaying(true);
      return;
    }

    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(interval);
  }, [open, isPlaying]);

  // Generate mock timeline events if not provided
  const timeline: TimelineEvent[] = timelineEvents || [
    {
      id: "1",
      type: "decision",
      date: decisionDate,
      title: "Decision Finalized",
      description: `Chose ${chosenOption}`,
      metrics: {
        expectedValue: 100,
      },
    },
    ...(outcomeData?.logged
      ? [
          {
            id: "2",
            type: "outcome" as const,
            date: outcomeData.date || decisionDate + 15 * 24 * 60 * 60 * 1000,
            title: "Outcome Logged",
            description: outcomeData.summary || "Actual results recorded",
            metrics: {
              expectedValue: 100,
              actualValue: Math.random() > 0.5 ? 115 : 92,
              variance: Math.random() > 0.5 ? 15 : -8,
            },
          },
        ]
      : []),
    ...(adjustmentData && adjustmentData.count > 0
      ? [
          {
            id: "3",
            type: "adjustment" as const,
            date:
              adjustmentData.date || decisionDate + 20 * 24 * 60 * 60 * 1000,
            title: "Guardrails Adjusted",
            description:
              adjustmentData.lastAdjustment ||
              `${adjustmentData.count} adjustment(s) applied`,
            metrics: {
              expectedValue: 100,
              actualValue: Math.random() > 0.5 ? 115 : 92,
              variance: Math.random() > 0.5 ? 15 : -8,
            },
          },
        ]
      : []),
  ];

  // Generate mock metrics history if not provided
  const metrics: MetricsData[] = metricsHistory || [
    { month: "Month 1", expected: 100, actual: 98, variance: -2 },
    { month: "Month 2", expected: 105, actual: 110, variance: 5 },
    { month: "Month 3", expected: 110, actual: 115, variance: 5 },
    { month: "Month 4", expected: 115, actual: 112, variance: -3 },
    { month: "Month 5", expected: 120, actual: 125, variance: 5 },
    { month: "Month 6", expected: 125, actual: 130, variance: 5 },
  ];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    setActiveStep((prev) => (prev + 1) % 3);
  };

  const handleStepBack = () => {
    setActiveStep((prev) => (prev - 1 + 3) % 3);
  };

  const handleExport = () => {
    const exportData = {
      decisionId: decisionId || "unknown",
      decisionTitle,
      chosenOption,
      decisionDate: new Date(decisionDate).toISOString(),
      timeline,
      metrics,
      summary: {
        totalEvents: timeline.length,
        outcomeLogged: outcomeData?.logged || false,
        adjustmentsMade: adjustmentData?.count || 0,
        averageVariance:
          metrics.reduce((sum, m) => sum + m.variance, 0) / metrics.length,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-loop-${decisionId || "export"}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const nodes = [
    {
      id: "decision",
      label: "What we did",
      title: "Decision",
      icon: CheckCircleIcon,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      borderColor: "border-blue-300 dark:border-blue-700",
      content: (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            {decisionTitle}
          </div>
          <div className="text-xs text-muted-foreground">
            Chose: {chosenOption}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(decisionDate)}
          </div>
        </div>
      ),
    },
    {
      id: "outcome",
      label: "What happened",
      title: "Outcome",
      icon: TrendingUpIcon,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      borderColor: "border-green-300 dark:border-green-700",
      content: outcomeData?.logged ? (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            Outcome Logged
          </div>
          {outcomeData.summary && (
            <div className="text-xs text-muted-foreground">
              {outcomeData.summary}
            </div>
          )}
          {outcomeData.date && (
            <div className="text-xs text-muted-foreground">
              {formatDate(outcomeData.date)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Awaiting Outcome
          </div>
          <div className="text-xs text-muted-foreground">
            Log actual results from signals/incidents
          </div>
        </div>
      ),
    },
    {
      id: "adjustment",
      label: "What changed",
      title: "Adjustment",
      icon: RefreshCwIcon,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      borderColor: "border-purple-300 dark:border-purple-700",
      content:
        adjustmentData && adjustmentData.count > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              {adjustmentData.count} Adjustment
              {adjustmentData.count > 1 ? "s" : ""}
            </div>
            {adjustmentData.lastAdjustment && (
              <div className="text-xs text-muted-foreground">
                {adjustmentData.lastAdjustment}
              </div>
            )}
            {adjustmentData.date && (
              <div className="text-xs text-muted-foreground">
                {formatDate(adjustmentData.date)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              No Adjustments Yet
            </div>
            <div className="text-xs text-muted-foreground">
              Guardrails auto-adjust based on outcomes
            </div>
          </div>
        ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCwIcon className="w-5 h-5 text-primary" />
                Feedback Loop
              </DialogTitle>
              <DialogDescription>How we learn and adapt</DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="py-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cycle">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Cycle View
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <ClockIcon className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <BarChart3Icon className="w-4 h-4 mr-2" />
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cycle" className="space-y-6">
            {/* Visual Cycle */}
            <div className="relative">
              {/* Nodes */}
              <div className="grid grid-cols-3 gap-8">
                {nodes.map((node, index) => {
                  const Icon = node.icon;
                  const isActive = activeStep === index;

                  return (
                    <div key={node.id} className="space-y-3">
                      {/* Node Circle */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-500",
                            isActive
                              ? `${node.bgColor} ${node.borderColor} scale-110 shadow-lg`
                              : "bg-muted border-border scale-100"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-10 h-10 transition-colors duration-500",
                              isActive ? node.color : "text-muted-foreground"
                            )}
                          />
                        </div>

                        {/* Label Badge */}
                        <Badge
                          variant={isActive ? "default" : "outline"}
                          className="mt-3 text-xs"
                        >
                          {node.label}
                        </Badge>
                      </div>

                      {/* Node Title */}
                      <div className="text-center">
                        <div
                          className={cn(
                            "text-sm font-semibold transition-colors duration-500",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {node.title}
                        </div>
                      </div>

                      {/* Arrow (not for last node) */}
                      {index < nodes.length - 1 && (
                        <div
                          className="absolute top-10 flex items-center justify-center"
                          style={{
                            left: `${(index + 1) * 33.33 - 8}%`,
                            width: "16%",
                          }}
                        >
                          <ArrowRightIcon
                            className={cn(
                              "w-8 h-8 transition-all duration-500",
                              activeStep === index
                                ? "text-primary scale-125"
                                : "text-muted-foreground scale-100"
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Feedback Arrow (from Adjustment back to Decision) */}
              <div className="mt-8 flex items-center justify-center">
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-500",
                    activeStep === 2
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border bg-muted scale-100"
                  )}
                >
                  <RefreshCwIcon
                    className={cn(
                      "w-4 h-4 transition-colors duration-500",
                      activeStep === 2
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />

                  <span
                    className={cn(
                      "text-xs font-medium transition-colors duration-500",
                      activeStep === 2
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Continuous Learning
                  </span>
                </div>
              </div>
            </div>

            {/* Content Cards */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {nodes.map((node, index) => {
                const isActive = activeStep === index;

                return (
                  <div
                    key={node.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-500",
                      isActive
                        ? `${node.borderColor} ${node.bgColor}`
                        : "border-border bg-muted/50"
                    )}
                  >
                    {node.content}
                  </div>
                );
              })}
            </div>

            {/* Interactive Controls */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={handleStepBack}>
                <SkipBackIcon className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePlayPause}>
                {isPlaying ? (
                  <PauseIcon className="w-4 h-4" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleStepForward}>
                <SkipForwardIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Explanation */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> When
                you finalize a decision, we track the actual outcomes through
                signals and incidents. If outcomes differ from expectations, our
                system automatically adjusts guardrails to improve future
                decisions. This creates a continuous learning cycle.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-4">
              {timeline.map((event, index) => {
                const isSelected = selectedEvent?.id === event.id;
                const Icon =
                  event.type === "decision"
                    ? CheckCircleIcon
                    : event.type === "outcome"
                      ? TrendingUpIcon
                      : event.type === "adjustment"
                        ? RefreshCwIcon
                        : FileTextIcon;

                const color =
                  event.type === "decision"
                    ? "text-blue-600 dark:text-blue-400"
                    : event.type === "outcome"
                      ? "text-green-600 dark:text-green-400"
                      : event.type === "adjustment"
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-orange-600 dark:text-orange-400";

                const bgColor =
                  event.type === "decision"
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : event.type === "outcome"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : event.type === "adjustment"
                        ? "bg-purple-100 dark:bg-purple-900/30"
                        : "bg-orange-100 dark:bg-orange-900/30";

                return (
                  <div key={event.id} className="relative">
                    {/* Connector Line */}
                    {index < timeline.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
                    )}

                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center",
                              bgColor
                            )}
                          >
                            <Icon className={cn("w-6 h-6", color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-foreground">
                                {event.title}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.date)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {event.description}
                            </p>
                            {event.metrics && (
                              <div className="flex gap-4 text-xs">
                                {event.metrics.expectedValue !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Expected:{" "}
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {event.metrics.expectedValue}
                                    </span>
                                  </div>
                                )}
                                {event.metrics.actualValue !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Actual:{" "}
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {event.metrics.actualValue}
                                    </span>
                                  </div>
                                )}
                                {event.metrics.variance !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Variance:{" "}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-medium",
                                        event.metrics.variance >= 0
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-red-600 dark:text-red-400"
                                      )}
                                    >
                                      {event.metrics.variance > 0 ? "+" : ""}
                                      {event.metrics.variance}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {selectedEvent && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-base">Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Type:{" "}
                    </span>
                    <Badge variant="outline">{selectedEvent.type}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Date:{" "}
                    </span>
                    <span className="text-sm text-foreground">
                      {new Date(selectedEvent.date).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Description:{" "}
                    </span>
                    <p className="text-sm text-foreground mt-1">
                      {selectedEvent.description}
                    </p>
                  </div>
                  {selectedEvent.metrics && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Metrics:{" "}
                      </span>
                      <div className="mt-2 grid grid-cols-3 gap-4">
                        {selectedEvent.metrics.expectedValue !== undefined && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">
                              Expected
                            </div>
                            <div className="text-lg font-bold text-foreground">
                              {selectedEvent.metrics.expectedValue}
                            </div>
                          </div>
                        )}
                        {selectedEvent.metrics.actualValue !== undefined && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">
                              Actual
                            </div>
                            <div className="text-lg font-bold text-foreground">
                              {selectedEvent.metrics.actualValue}
                            </div>
                          </div>
                        )}
                        {selectedEvent.metrics.variance !== undefined && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">
                              Variance
                            </div>
                            <div
                              className={cn(
                                "text-lg font-bold",
                                selectedEvent.metrics.variance >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {selectedEvent.metrics.variance > 0 ? "+" : ""}
                              {selectedEvent.metrics.variance}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Expected vs Actual Performance</CardTitle>
                <CardDescription>Tracking outcomes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />

                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />

                      <ChartTooltip />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="expected"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Expected"
                      />

                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Actual"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Variance</CardTitle>
                <CardDescription>
                  Difference between expected and actual outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />

                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />

                      <ChartTooltip />

                      <Legend />

                      <Bar
                        dataKey="variance"
                        fill="hsl(var(--chart-3))"
                        radius={[4, 4, 0, 0]}
                        name="Variance (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      Avg Expected
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {(
                        metrics.reduce((sum, m) => sum + m.expected, 0) /
                        metrics.length
                      ).toFixed(1)}
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      Avg Actual
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {(
                        metrics.reduce((sum, m) => sum + m.actual, 0) /
                        metrics.length
                      ).toFixed(1)}
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      Avg Variance
                    </div>
                    <div
                      className={cn(
                        "text-xl font-bold",
                        metrics.reduce((sum, m) => sum + m.variance, 0) /
                          metrics.length >=
                          0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {(
                        metrics.reduce((sum, m) => sum + m.variance, 0) /
                        metrics.length
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      Adjustments
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {adjustmentData?.count || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
