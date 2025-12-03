import { useState, useEffect } from "react";
import {
  getLearningTrace,
  getAntifragilityScore,
  classifyAntifragility,
  clearLearningTrace,
  type LearningTrace,
  type LearningTraceEntry,
} from "@/polymet/data/auto-refresh-engine";
import { useTenant } from "@/polymet/data/tenant-context";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  InfoIcon,
  TrashIcon,
  ActivityIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LearningTracePanelProps {
  decisionId: string;
  decisionTitle?: string;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function LearningTracePanel({
  decisionId,
  decisionTitle = "Decision",
  onAuditEvent,
}: LearningTracePanelProps) {
  const { tenant } = useTenant();
  const [trace, setTrace] = useState<LearningTrace | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    loadTrace();
  }, [decisionId, tenant.tenantId]);

  const loadTrace = () => {
    const loadedTrace = getLearningTrace(decisionId, tenant.tenantId);
    setTrace(loadedTrace);

    // Set default selected option to first option with entries
    if (loadedTrace && loadedTrace.entries.length > 0 && !selectedOption) {
      setSelectedOption(loadedTrace.entries[0].optionId);
    }
  };

  const handleClearTrace = () => {
    clearLearningTrace(decisionId, tenant.tenantId);
    setTrace(null);
    setSelectedOption(null);

    if (onAuditEvent) {
      onAuditEvent("decision.learning_trace_cleared", {
        decisionId,
        decisionTitle,
        tenantId: tenant.tenantId,
        timestamp: Date.now(),
      });
    }
  };

  if (!trace || trace.entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5" />
                Learning Trace
              </CardTitle>
              <CardDescription>
                Tracks how decisions respond to signal changes
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Plain-Language Tooltip:</p>
                  <p className="text-sm">
                    "Tracks how well decisions bounce back or improve after
                    shocks."
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ActivityIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />

            <p className="text-sm">
              No learning trace data yet. Data will appear after auto-refresh
              events.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get unique options
  const options = Array.from(new Set(trace.entries.map((e) => e.optionId))).map(
    (optionId) => {
      const entry = trace.entries.find((e) => e.optionId === optionId);
      return {
        id: optionId,
        label: entry?.optionLabel || optionId,
      };
    }
  );

  // Filter entries by selected option
  const filteredEntries = selectedOption
    ? trace.entries.filter((e) => e.optionId === selectedOption)
    : trace.entries;

  // Prepare chart data
  const chartData = filteredEntries.map((entry, idx) => ({
    index: idx + 1,
    timestamp: new Date(entry.timestamp).toLocaleString(),
    utility: entry.newUtility,
    deltaUtility: entry.deltaUtility,
    shockMagnitude: entry.shockMagnitude,
    recoveryRatio: entry.recoveryRatio,
  }));

  // Get antifragility score
  const antifragilityScore = trace.antifragilityScore ?? 0;
  const classification = classifyAntifragility(antifragilityScore);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Learning Trace
            </CardTitle>
            <CardDescription>
              {trace.entries.length} refresh events tracked
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Plain-Language Tooltip:</p>
                  <p className="text-sm">
                    "Tracks how well decisions bounce back or improve after
                    shocks."
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Learning Trace?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all learning trace data for
                    this decision. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearTrace}>
                    Clear Trace
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Antifragility Score */}
        <div className="p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Antifragility Score</div>
            <Badge variant="outline" className={classification.color}>
              {classification.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">
              {antifragilityScore.toFixed(3)}
            </div>
            {antifragilityScore > 0 ? (
              <TrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : antifragilityScore < 0 ? (
              <TrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            ) : (
              <MinusIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {classification.description}
          </p>
        </div>

        {/* Option Selector */}
        {options.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <div className="text-sm font-medium mr-2">View option:</div>
            {options.map((option) => (
              <Button
                key={option.id}
                variant={selectedOption === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOption(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* Utility Trend Chart */}
        <div>
          <div className="text-sm font-medium mb-3">Utility Over Time</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

              <XAxis
                dataKey="index"
                label={{
                  value: "Refresh Event",
                  position: "insideBottom",
                  offset: -5,
                }}
                className="text-xs"
              />

              <YAxis
                label={{ value: "Utility", angle: -90, position: "insideLeft" }}
                className="text-xs"
              />

              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="utility"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Utility"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recovery Ratio Chart */}
        <div>
          <div className="text-sm font-medium mb-3">
            Recovery Ratio (ΔUtility / Shock Magnitude)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

              <XAxis
                dataKey="index"
                label={{
                  value: "Refresh Event",
                  position: "insideBottom",
                  offset: -5,
                }}
                className="text-xs"
              />

              <YAxis
                label={{
                  value: "Recovery Ratio",
                  angle: -90,
                  position: "insideLeft",
                }}
                className="text-xs"
              />

              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />

              <Legend />

              <ReferenceLine
                y={0}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
              />

              <Line
                type="monotone"
                dataKey="recoveryRatio"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Recovery Ratio"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            Positive values indicate antifragility (improves under stress).
            Negative values indicate fragility (degrades under stress).
          </p>
        </div>

        {/* Recent Events Table */}
        <div>
          <div className="text-sm font-medium mb-3">Recent Events</div>
          <div className="space-y-2">
            {filteredEntries
              .slice(-5)
              .reverse()
              .map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-border rounded-lg text-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">{entry.optionLabel}</div>
                    <Badge
                      variant={entry.deltaUtility > 0 ? "default" : "secondary"}
                    >
                      {entry.deltaUtility > 0 ? "+" : ""}
                      {entry.deltaUtility.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Previous: {entry.previousUtility.toFixed(2)}</div>
                    <div>New: {entry.newUtility.toFixed(2)}</div>
                    <div>Shock: {entry.shockMagnitude.toFixed(1)}%</div>
                    <div>Recovery: {entry.recoveryRatio.toFixed(3)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Triggered by:{" "}
                    {entry.triggeredBy.map((u) => u.signal_label).join(", ")}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
