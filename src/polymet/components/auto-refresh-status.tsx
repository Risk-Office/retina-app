import { useState, useEffect } from "react";
import {
  getAutoRefreshConfig,
  setAutoRefreshConfig,
  getAllLearningTraces,
  classifyAntifragility,
  type AutoRefreshConfig,
} from "@/polymet/data/auto-refresh-engine";
import { useRetinaStore } from "@/polymet/data/retina-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  RefreshCwIcon,
  CheckCircleIcon,
  ClockIcon,
  SettingsIcon,
  InfoIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface AutoRefreshStatusProps {
  tenantId: string;
  showConfig?: boolean;
  compact?: boolean;
}

export function AutoRefreshStatus({
  tenantId,
  showConfig = true,
  compact = false,
}: AutoRefreshStatusProps) {
  const [config, setConfigState] = useState<AutoRefreshConfig>(
    getAutoRefreshConfig()
  );
  const [configOpen, setConfigOpen] = useState(false);
  const { decisions, audit } = useRetinaStore();

  // Get recent auto-refresh events from audit log
  const recentRefreshes = audit
    .filter(
      (e) =>
        e.tenantId === tenantId &&
        e.eventType === "decision.auto_refreshed" &&
        e.ts > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    )
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  // Count decisions with linked signals
  const decisionsWithSignals = decisions.filter(
    (d) =>
      d.tenantId === tenantId &&
      d.linked_signals &&
      d.linked_signals.length > 0 &&
      d.status !== "closed"
  ).length;

  // Count recently refreshed decisions
  const recentlyRefreshed = decisions.filter(
    (d) =>
      d.tenantId === tenantId &&
      d.last_refreshed_at &&
      d.last_refreshed_at > Date.now() - 24 * 60 * 60 * 1000
  ).length;

  // Get learning traces
  const learningTraces = getAllLearningTraces(tenantId);
  const decisionsWithTraces = learningTraces.length;

  // Calculate average antifragility score
  const avgAntifragility =
    learningTraces.length > 0
      ? learningTraces.reduce(
          (sum, t) => sum + (t.antifragilityScore ?? 0),
          0
        ) / learningTraces.length
      : 0;

  const handleConfigChange = (updates: Partial<AutoRefreshConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfigState(newConfig);
    setAutoRefreshConfig(newConfig);
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <RefreshCwIcon
                  className={`h-4 w-4 ${config.enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                />

                <Badge variant={config.enabled ? "default" : "secondary"}>
                  {config.enabled ? "Auto-refresh ON" : "Auto-refresh OFF"}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Auto-Refresh Status</p>
              <p className="text-sm">
                When conditions shift, results refresh automatically — no manual
                rerun needed.
              </p>
              <div className="mt-2 text-xs space-y-1">
                <div>• {decisionsWithSignals} decisions monitored</div>
                <div>• {recentlyRefreshed} refreshed today</div>
                <div>• {recentRefreshes.length} refresh events (24h)</div>
                <div>• {decisionsWithTraces} with learning traces</div>
              </div>
            </TooltipContent>
          </Tooltip>

          {showConfig && (
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto-Refresh Configuration</DialogTitle>
                  <DialogDescription>
                    Control when and how decisions are automatically refreshed
                  </DialogDescription>
                </DialogHeader>
                <ConfigForm config={config} onChange={handleConfigChange} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCwIcon className="h-5 w-5" />
              Auto-Refresh Status
            </CardTitle>
            <CardDescription>
              Automatic metric recomputation when signals update
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
                  "When conditions shift, results refresh automatically — no
                  manual rerun needed."
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={config.enabled ? "default" : "secondary"}>
                {config.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Auto-refresh is {config.enabled ? "active" : "inactive"}
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />

              <span className="font-semibold">{decisionsWithSignals}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Decisions monitored
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />

              <span className="font-semibold">{recentlyRefreshed}</span>
            </div>
            <div className="text-sm text-muted-foreground">Refreshed today</div>
          </div>
        </div>

        {/* Antifragility Score */}
        {decisionsWithTraces > 0 && (
          <div className="p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                Average Antifragility Score
              </div>
              <Badge
                variant="outline"
                className={classifyAntifragility(avgAntifragility).color}
              >
                {classifyAntifragility(avgAntifragility).label}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              {avgAntifragility.toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">
              {classifyAntifragility(avgAntifragility).description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {decisionsWithTraces} decision
              {decisionsWithTraces !== 1 ? "s" : ""} with learning traces
            </p>
          </div>
        )}

        {/* Recent Activity */}
        {recentRefreshes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Recent Auto-Refresh Activity</h3>
            <div className="space-y-2">
              {recentRefreshes.map((event, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-border rounded-lg text-sm"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium">
                      {event.payload.decisionTitle}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(event.ts).toLocaleTimeString()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.payload.message}
                  </div>
                  {event.payload.triggeredBy && (
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Triggered by: </span>
                      {event.payload.triggeredBy
                        .map(
                          (t: any) =>
                            `${t.signal_label} (${(t.change_percent * 100).toFixed(1)}%)`
                        )
                        .join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        {showConfig && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Configuration</h3>
              <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Auto-Refresh Configuration</DialogTitle>
                    <DialogDescription>
                      Control when and how decisions are automatically refreshed
                    </DialogDescription>
                  </DialogHeader>
                  <ConfigForm config={config} onChange={handleConfigChange} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <span className="text-muted-foreground">Change Threshold</span>
                <span className="font-medium">
                  {(config.changeThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <span className="text-muted-foreground">Debounce Time</span>
                <span className="font-medium">{config.debounceMs}ms</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConfigForm({
  config,
  onChange,
}: {
  config: AutoRefreshConfig;
  onChange: (updates: Partial<AutoRefreshConfig>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Enable Auto-Refresh</Label>
          <p className="text-sm text-muted-foreground">
            Automatically recompute metrics when signals change
          </p>
        </div>
        <Switch
          id="enabled"
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="threshold">Change Threshold (%)</Label>
        <Input
          id="threshold"
          type="number"
          min="0"
          max="100"
          step="1"
          value={config.changeThreshold * 100}
          onChange={(e) =>
            onChange({ changeThreshold: parseFloat(e.target.value) / 100 })
          }
        />

        <p className="text-xs text-muted-foreground">
          Minimum signal change percentage to trigger refresh (default: 5%)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="batchSize">Batch Size</Label>
        <Input
          id="batchSize"
          type="number"
          min="1"
          max="100"
          value={config.batchSize}
          onChange={(e) => onChange({ batchSize: parseInt(e.target.value) })}
        />

        <p className="text-xs text-muted-foreground">
          Maximum number of decisions to refresh in one batch (default: 10)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="debounce">Debounce Time (ms)</Label>
        <Input
          id="debounce"
          type="number"
          min="0"
          max="10000"
          step="100"
          value={config.debounceMs}
          onChange={(e) => onChange({ debounceMs: parseInt(e.target.value) })}
        />

        <p className="text-xs text-muted-foreground">
          Wait time before processing multiple signal updates (default: 2000ms)
        </p>
      </div>
    </div>
  );
}
