import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircleIcon,
  ActivityIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  InfoIcon,
  DownloadIcon,
} from "lucide-react";
import {
  processActualOutcome,
  loadActualOutcomes,
  loadAdjustmentRecords,
  getAutoAdjustConfig,
  exportOutcomesCSV,
  exportAdjustmentsCSV,
  type ActualOutcome,
  type AutoAdjustmentRecord,
} from "@/polymet/data/guardrail-auto-adjust";
import { loadGuardrailsForOption } from "@/polymet/data/decision-guardrails";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OutcomeLoggerProps {
  decisionId: string;
  optionId: string;
  optionLabel: string;
  onAuditEvent: (eventType: string, payload: any) => void;
  onToast?: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

export function OutcomeLogger({
  decisionId,
  optionId,
  optionLabel,
  onAuditEvent,
  onToast,
}: OutcomeLoggerProps) {
  const { tenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [outcomes, setOutcomes] = useState<ActualOutcome[]>([]);
  const [adjustments, setAdjustments] = useState<AutoAdjustmentRecord[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);

  // Form state
  const [metricName, setMetricName] = useState<string>("");
  const [actualValue, setActualValue] = useState<string>("");
  const [source, setSource] = useState<"signal" | "incident" | "manual">(
    "manual"
  );
  const [sourceId, setSourceId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const config = getAutoAdjustConfig();

  // Load data
  useEffect(() => {
    if (open) {
      refreshData();
    }
  }, [open, decisionId, optionId]);

  const refreshData = () => {
    const allOutcomes = loadActualOutcomes(decisionId);
    const optionOutcomes = allOutcomes.filter((o) => o.optionId === optionId);
    setOutcomes(optionOutcomes);

    const allAdjustments = loadAdjustmentRecords(decisionId);
    const optionAdjustments = allAdjustments.filter(
      (a) => a.optionId === optionId
    );
    setAdjustments(optionAdjustments);

    // Get available metrics from guardrails
    const guardrails = loadGuardrailsForOption(decisionId, optionId);
    const metrics = guardrails.map((g) => g.metricName);
    setAvailableMetrics([...new Set(metrics)]);

    if (metrics.length > 0 && !metricName) {
      setMetricName(metrics[0]);
    }
  };

  const handleLogOutcome = () => {
    const value = parseFloat(actualValue);
    if (isNaN(value)) {
      onToast?.({
        title: "Invalid Value",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    if (!metricName) {
      onToast?.({
        title: "Missing Metric",
        description: "Please select a metric",
        variant: "destructive",
      });
      return;
    }

    const result = processActualOutcome(
      decisionId,
      optionId,
      optionLabel,
      metricName,
      value,
      source,
      tenant.tenantId,
      sourceId || undefined,
      notes || undefined,
      onAuditEvent
    );

    // Reset form
    setActualValue("");
    setSourceId("");
    setNotes("");

    // Refresh data
    refreshData();

    // Show toast
    if (result.adjustment) {
      onToast?.({
        title: "Auto-Adjustment Triggered",
        description: `Threshold changed from ${result.adjustment.oldThreshold.toFixed(2)} to ${result.adjustment.newThreshold.toFixed(2)}`,
      });
    } else if (result.violation) {
      onToast?.({
        title: "Guardrail Breach Detected",
        description: `${metricName} breached threshold`,
        variant: "destructive",
      });
    } else {
      onToast?.({
        title: "Outcome Logged",
        description: `${metricName} value recorded successfully`,
      });
    }
  };

  const handleExportOutcomes = () => {
    const csv = exportOutcomesCSV(decisionId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outcomes-${decisionId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    onAuditEvent("outcomes.exported", {
      decisionId,
      optionId,
      count: outcomes.length,
    });
  };

  const handleExportAdjustments = () => {
    const csv = exportAdjustmentsCSV(decisionId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adjustments-${decisionId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    onAuditEvent("adjustments.exported", {
      decisionId,
      optionId,
      count: adjustments.length,
    });
  };

  const getSourceBadgeVariant = (
    source: string
  ): "default" | "secondary" | "outline" => {
    switch (source) {
      case "signal":
        return "default";
      case "incident":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ActivityIcon className="h-4 w-4 mr-2" />
          Log Outcome
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Outcome Logger
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{config.plainLanguageTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SheetTitle>
          <SheetDescription>
            Log actual outcomes from signals/incidents to track guardrail
            performance
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Auto-Adjustment Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="font-medium">Breach Window</div>
                  <div className="text-muted-foreground">
                    {config.breachWindowDays} days
                  </div>
                </div>
                <div>
                  <div className="font-medium">Breach Threshold</div>
                  <div className="text-muted-foreground">
                    {config.breachThresholdCount} breaches
                  </div>
                </div>
                <div>
                  <div className="font-medium">Tightening</div>
                  <div className="text-muted-foreground">
                    {config.tighteningPercent * 100}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Log Outcome Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Log New Outcome</CardTitle>
              <CardDescription>
                Record actual outcome for {optionLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Metric</Label>
                <Select value={metricName} onValueChange={setMetricName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetrics.map((metric) => (
                      <SelectItem key={metric} value={metric}>
                        {metric}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Actual Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  placeholder="Enter actual value"
                />
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={source}
                  onValueChange={(v) =>
                    setSource(v as "signal" | "incident" | "manual")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signal">Signal</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source ID (Optional)</Label>
                <Input
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  placeholder="e.g., sig-001, inc-042"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or observations"
                  rows={3}
                />
              </div>

              <Button onClick={handleLogOutcome} className="w-full">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Log Outcome
              </Button>
            </CardContent>
          </Card>

          {/* History Tabs */}
          <Tabs defaultValue="outcomes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="outcomes">
                Outcomes ({outcomes.length})
              </TabsTrigger>
              <TabsTrigger value="adjustments">
                Adjustments ({adjustments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="outcomes" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Recent actual outcomes
                </p>
                {outcomes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportOutcomes}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {outcomes.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center">
                        No outcomes logged yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  outcomes
                    .slice()
                    .reverse()
                    .map((outcome) => (
                      <Card key={outcome.id}>
                        <CardContent className="pt-6 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">
                              {outcome.metricName}
                            </div>
                            <Badge
                              variant={getSourceBadgeVariant(outcome.source)}
                            >
                              {outcome.source}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Value:
                            </span>{" "}
                            {outcome.actualValue.toFixed(2)}
                          </div>
                          {outcome.sourceId && (
                            <div className="text-xs text-muted-foreground">
                              Source ID: {outcome.sourceId}
                            </div>
                          )}
                          {outcome.notes && (
                            <div className="text-xs text-muted-foreground">
                              {outcome.notes}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {new Date(outcome.recordedAt).toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="adjustments" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Auto-adjustment history
                </p>
                {adjustments.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportAdjustments}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {adjustments.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center">
                        No auto-adjustments yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  adjustments
                    .slice()
                    .reverse()
                    .map((adjustment) => (
                      <Card key={adjustment.id}>
                        <CardContent className="pt-6 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />

                            <div className="font-medium text-sm">
                              {adjustment.metricName}
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Threshold:
                            </span>{" "}
                            {adjustment.oldThreshold.toFixed(2)} →{" "}
                            <span className="font-medium">
                              {adjustment.newThreshold.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tightened by {adjustment.adjustmentPercent}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {adjustment.reason}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Triggered by {adjustment.triggeredBy.length}{" "}
                            breaches
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(adjustment.adjustedAt).toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
