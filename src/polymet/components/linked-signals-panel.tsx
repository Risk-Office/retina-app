import { useState, useEffect } from "react";
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
  MOCK_SIGNAL_SOURCES,
  type LiveSignalSource,
} from "@/polymet/data/api-scan-signals";
import {
  getBestForecast,
  analyzeTrend,
  detectAnomaly,
} from "@/polymet/data/signal-forecasting";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  PlusIcon,
  TrashIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LinkedSignal } from "@/polymet/data/retina-store";

interface LinkedSignalsPanelProps {
  decisionId: string;
  linkedSignals: LinkedSignal[];
  scenarioVars: Array<{
    key: string;
    label: string;
  }>;
  onUpdateSignals: (signals: LinkedSignal[]) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function LinkedSignalsPanel({
  decisionId,
  linkedSignals,
  scenarioVars,
  onUpdateSignals,
  onAuditEvent,
}: LinkedSignalsPanelProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSignal, setNewSignal] = useState<Partial<LinkedSignal>>({
    direction: "positive",
    sensitivity: 0.5,
  });
  const [selectedSignalDetails, setSelectedSignalDetails] =
    useState<LiveSignalSource | null>(null);
  const [showForecast, setShowForecast] = useState(false);

  // Use expanded signal sources
  const availableSignals = MOCK_SIGNAL_SOURCES;

  // Load signal details when a signal is selected
  useEffect(() => {
    if (newSignal.signal_id) {
      const signal = availableSignals.find((s) => s.id === newSignal.signal_id);
      setSelectedSignalDetails(signal || null);
    } else {
      setSelectedSignalDetails(null);
    }
  }, [newSignal.signal_id]);

  const handleAddSignal = () => {
    if (!newSignal.signal_id || !newSignal.variable_name) {
      return;
    }

    const selectedSignal = availableSignals.find(
      (s) => s.id === newSignal.signal_id
    );

    const signal: LinkedSignal = {
      signal_id: newSignal.signal_id!,
      variable_name: newSignal.variable_name!,
      direction: newSignal.direction || "positive",
      sensitivity: newSignal.sensitivity || 0.5,
      signal_label: selectedSignal?.label,
      last_value: selectedSignal?.currentValue,
      last_updated: Date.now(),
    };

    const updated = [...linkedSignals, signal];
    onUpdateSignals(updated);

    onAuditEvent("decision.signal_linked", {
      decisionId,
      signalId: signal.signal_id,
      variableName: signal.variable_name,
      direction: signal.direction,
      sensitivity: signal.sensitivity,
    });

    setNewSignal({
      direction: "positive",
      sensitivity: 0.5,
    });
    setIsAddDialogOpen(false);
  };

  const handleRemoveSignal = (signalId: string) => {
    const updated = linkedSignals.filter((s) => s.signal_id !== signalId);
    onUpdateSignals(updated);

    onAuditEvent("decision.signal_unlinked", {
      decisionId,
      signalId,
    });
  };

  const handleUpdateSensitivity = (signalId: string, sensitivity: number) => {
    const updated = linkedSignals.map((s) =>
      s.signal_id === signalId ? { ...s, sensitivity } : s
    );
    onUpdateSignals(updated);

    onAuditEvent("decision.signal_sensitivity_updated", {
      decisionId,
      signalId,
      sensitivity,
    });
  };

  const getDirectionIcon = (direction: "positive" | "negative") => {
    return direction === "positive" ? TrendingUpIcon : TrendingDownIcon;
  };

  const getDirectionColor = (direction: "positive" | "negative") => {
    return direction === "positive"
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getSensitivityLabel = (sensitivity: number) => {
    if (sensitivity >= 0.8) return "Very High";
    if (sensitivity >= 0.6) return "High";
    if (sensitivity >= 0.4) return "Medium";
    if (sensitivity >= 0.2) return "Low";
    return "Very Low";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Linked Signals</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">
                      What live signals should affect this choice?
                    </p>
                    <p className="text-xs">
                      Connects your decision to real-world data — like cost,
                      demand, or market signals. When a linked signal updates,
                      the decision is tagged for re-evaluation.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Connect real-world data to scenario variables
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                Link Signal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link Signal to Decision</DialogTitle>
                <DialogDescription>
                  Connect a live signal to a scenario variable
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signal">Signal Source</Label>
                  <Select
                    value={newSignal.signal_id}
                    onValueChange={(value) =>
                      setNewSignal({ ...newSignal, signal_id: value })
                    }
                  >
                    <SelectTrigger id="signal">
                      <SelectValue placeholder="Select a signal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSignals.map((signal) => (
                        <SelectItem key={signal.id} value={signal.id}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span>{signal.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {signal.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Current: {signal.currentValue.toFixed(2)}{" "}
                                {signal.unit}
                              </span>
                              {signal.trend && (
                                <Badge variant="secondary" className="text-xs">
                                  {signal.trend === "up"
                                    ? "↑"
                                    : signal.trend === "down"
                                      ? "↓"
                                      : "→"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variable">Scenario Variable</Label>
                  <Select
                    value={newSignal.variable_name}
                    onValueChange={(value) =>
                      setNewSignal({ ...newSignal, variable_name: value })
                    }
                  >
                    <SelectTrigger id="variable">
                      <SelectValue placeholder="Select a variable..." />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarioVars.map((v) => (
                        <SelectItem key={v.key} value={v.key}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Impact Direction</Label>
                  <Select
                    value={newSignal.direction}
                    onValueChange={(value: "positive" | "negative") =>
                      setNewSignal({ ...newSignal, direction: value })
                    }
                  >
                    <SelectTrigger id="direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">
                        <div className="flex items-center gap-2">
                          <TrendingUpIcon className="h-4 w-4 text-green-600" />

                          <span>Positive (signal ↑ = variable ↑)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="negative">
                        <div className="flex items-center gap-2">
                          <TrendingDownIcon className="h-4 w-4 text-red-600" />

                          <span>Negative (signal ↑ = variable ↓)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sensitivity">Sensitivity</Label>
                    <span className="text-sm text-muted-foreground">
                      {getSensitivityLabel(newSignal.sensitivity || 0.5)} (
                      {((newSignal.sensitivity || 0.5) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <Slider
                    id="sensitivity"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[newSignal.sensitivity || 0.5]}
                    onValueChange={([value]) =>
                      setNewSignal({ ...newSignal, sensitivity: value })
                    }
                  />

                  <p className="text-xs text-muted-foreground">
                    How strongly should this signal affect the variable?
                  </p>
                </div>

                {/* Signal Details & Forecast */}
                {selectedSignalDetails && (
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Signal Details
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowForecast(!showForecast)}
                      >
                        {showForecast ? "Hide" : "Show"} Forecast
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Category</span>
                        <div className="font-medium capitalize">
                          {selectedSignalDetails.category}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Update Frequency
                        </span>
                        <div className="font-medium capitalize">
                          {selectedSignalDetails.updateFrequency}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Current Value
                        </span>
                        <div className="font-medium">
                          {selectedSignalDetails.currentValue.toFixed(2)}{" "}
                          {selectedSignalDetails.unit}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trend</span>
                        <div className="flex items-center gap-1">
                          {selectedSignalDetails.trend === "up" && (
                            <TrendingUpIcon className="h-3 w-3 text-green-600" />
                          )}
                          {selectedSignalDetails.trend === "down" && (
                            <TrendingDownIcon className="h-3 w-3 text-red-600" />
                          )}
                          <span className="font-medium capitalize">
                            {selectedSignalDetails.trend}
                          </span>
                        </div>
                      </div>
                    </div>

                    {showForecast &&
                      selectedSignalDetails.historicalData.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <div className="text-sm font-medium">
                            7-Day Forecast
                          </div>
                          {(() => {
                            const forecast = getBestForecast(
                              selectedSignalDetails.historicalData,
                              7
                            );
                            const trend = analyzeTrend(
                              selectedSignalDetails.historicalData
                            );
                            const anomaly = detectAnomaly(
                              selectedSignalDetails.historicalData,
                              selectedSignalDetails.currentValue
                            );

                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Method
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {forecast.method.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Confidence
                                  </span>
                                  <span className="font-medium">
                                    {(forecast.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                {anomaly.isAnomaly && (
                                  <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
                                    <AlertTriangleIcon className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />

                                    <span className="text-amber-600 dark:text-amber-400">
                                      Anomaly detected: {anomaly.reason}
                                    </span>
                                  </div>
                                )}
                                <div className="space-y-1">
                                  {forecast.forecast
                                    .slice(0, 3)
                                    .map((point, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <span className="text-muted-foreground">
                                          Day +{idx + 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono">
                                            {point.predicted.toFixed(2)}
                                          </span>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {(point.confidence * 100).toFixed(
                                              0
                                            )}
                                            %
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    <p className="text-xs text-muted-foreground">
                      {selectedSignalDetails.description}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddSignal}
                    disabled={!newSignal.signal_id || !newSignal.variable_name}
                  >
                    Link Signal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {linkedSignals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ActivityIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />

            <p className="text-sm mb-2">No signals linked yet</p>
            <p className="text-xs">
              Link live signals to automatically update your decision when
              real-world data changes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedSignals.map((signal) => {
              const DirectionIcon = getDirectionIcon(signal.direction);
              const directionColor = getDirectionColor(signal.direction);

              return (
                <div
                  key={signal.signal_id}
                  className="p-3 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ActivityIcon className="h-4 w-4 text-primary" />

                        <span className="font-medium text-sm">
                          {signal.signal_label || signal.signal_id}
                        </span>
                        <DirectionIcon
                          className={`h-3 w-3 ${directionColor}`}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Affects:{" "}
                        <span className="font-medium">
                          {signal.variable_name}
                        </span>
                      </div>
                      {signal.last_value !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Current value:{" "}
                          <span className="font-medium">
                            {signal.last_value}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRemoveSignal(signal.signal_id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Sensitivity</Label>
                      <Badge variant="secondary" className="text-xs">
                        {getSensitivityLabel(signal.sensitivity)} (
                        {(signal.sensitivity * 100).toFixed(0)}%)
                      </Badge>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[signal.sensitivity]}
                      onValueChange={([value]) =>
                        handleUpdateSensitivity(signal.signal_id, value)
                      }
                      className="cursor-pointer"
                    />
                  </div>

                  {signal.last_updated && (
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Last updated:{" "}
                      {new Date(signal.last_updated).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-3 border-t border-border">
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />

                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Auto Re-evaluation</p>
                  <p>
                    When any linked signal updates, this decision will be tagged
                    for re-evaluation. You'll be notified to review and
                    re-simulate with updated parameters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
