import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  FilterIcon,
  DownloadIcon,
  FileTextIcon,
  BellIcon,
  TrendingUpIcon as ChartIcon,
  ExternalLinkIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useRetinaStore } from "@/polymet/data/retina-store";
import {
  getSignalHistory,
  type SignalUpdate,
} from "@/polymet/data/signal-monitor";

interface SignalRefreshBannerProps {
  tenantId: string;
  className?: string;
}

interface SignalChangeMetric {
  signal_id: string;
  signal_label: string;
  old_value: number;
  new_value: number;
  change_percent: number;
  timestamp: number;
  affected_decisions: number;
  signal_type?: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface AffectedDecision {
  id: string;
  title: string;
  status: string;
}

interface SignalHistoryPoint {
  timestamp: number;
  value: number;
  label: string;
}

/**
 * Get signal type from signal ID
 */
function getSignalType(signalId: string): string {
  if (signalId.includes("cost")) return "Financial";
  if (signalId.includes("demand")) return "Market";
  if (signalId.includes("volatility")) return "Risk";
  if (signalId.includes("supply")) return "Operational";
  if (signalId.includes("sentiment")) return "Customer";
  if (signalId.includes("competitor")) return "Competitive";
  return "Other";
}

/**
 * Get severity based on change percent
 */
function getSeverity(
  changePercent: number
): "low" | "medium" | "high" | "critical" {
  const absChange = Math.abs(changePercent * 100);
  if (absChange > 20) return "critical";
  if (absChange > 10) return "high";
  if (absChange > 5) return "medium";
  return "low";
}

/**
 * Get affected decisions for a signal
 */
function getAffectedDecisions(
  signalId: string,
  tenantId: string
): AffectedDecision[] {
  try {
    const decisionsKey = `retina:decisions:${tenantId}`;
    const decisionsData = localStorage.getItem(decisionsKey);
    if (!decisionsData) return [];

    const decisions = JSON.parse(decisionsData);
    return decisions
      .filter(
        (d: any) =>
          d.linked_signals &&
          d.linked_signals.some((s: any) => s.signal_id === signalId)
      )
      .map((d: any) => ({
        id: d.id,
        title: d.title,
        status: d.status || "active",
      }));
  } catch (error) {
    console.error("Failed to get affected decisions:", error);
    return [];
  }
}

/**
 * Get signal updates from the last 24 hours
 */
function getRecentSignalUpdates(tenantId: string): SignalChangeMetric[] {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  try {
    // Get all signal updates from the last 24 hours
    const updatesKey = `retina:signal-updates:${tenantId}`;
    const updatesData = localStorage.getItem(updatesKey);
    if (!updatesData) return [];

    const allUpdates: SignalUpdate[] = JSON.parse(updatesData);

    // Filter updates from last 24 hours
    const recentUpdates = allUpdates.filter(
      (update) => update.timestamp > twentyFourHoursAgo
    );

    // Group by signal_id and get the latest update for each
    const latestBySignal = new Map<string, SignalUpdate>();
    recentUpdates.forEach((update) => {
      const existing = latestBySignal.get(update.signal_id);
      if (!existing || update.timestamp > existing.timestamp) {
        latestBySignal.set(update.signal_id, update);
      }
    });

    // Convert to metrics with affected decisions count
    const updates: SignalChangeMetric[] = [];
    latestBySignal.forEach((update) => {
      const affectedDecisions = getAffectedDecisions(
        update.signal_id,
        tenantId
      );
      const severity = getSeverity(update.change_percent);

      updates.push({
        signal_id: update.signal_id,
        signal_label: update.signal_label,
        old_value: update.old_value,
        new_value: update.new_value,
        change_percent: update.change_percent,
        timestamp: update.timestamp,
        affected_decisions: affectedDecisions.length,
        signal_type: getSignalType(update.signal_id),
        severity,
      });
    });

    return updates;
  } catch (error) {
    console.error("Failed to get recent signal updates:", error);
    return [];
  }
}

/**
 * Get historical signal data for trending
 */
function getSignalHistoricalData(
  signalId: string,
  tenantId: string,
  days: number = 7
): SignalHistoryPoint[] {
  try {
    const updatesKey = `retina:signal-updates:${tenantId}`;
    const updatesData = localStorage.getItem(updatesKey);
    if (!updatesData) return [];

    const allUpdates: SignalUpdate[] = JSON.parse(updatesData);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Filter updates for this signal
    const signalUpdates = allUpdates
      .filter((u) => u.signal_id === signalId && u.timestamp > cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);

    return signalUpdates.map((u) => ({
      timestamp: u.timestamp,
      value: u.new_value,
      label: new Date(u.timestamp).toLocaleDateString(),
    }));
  } catch (error) {
    console.error("Failed to get signal historical data:", error);
    return [];
  }
}

/**
 * Export signal changes to CSV
 */
function exportToCSV(updates: SignalChangeMetric[], tenantId: string) {
  const headers = [
    "Signal ID",
    "Signal Label",
    "Type",
    "Old Value",
    "New Value",
    "Change %",
    "Severity",
    "Affected Decisions",
    "Timestamp",
  ];

  const rows = updates.map((u) => [
    u.signal_id,
    u.signal_label,
    u.signal_type || "Other",
    u.old_value.toFixed(2),
    u.new_value.toFixed(2),
    (u.change_percent * 100).toFixed(2) + "%",
    u.severity,
    u.affected_decisions.toString(),
    new Date(u.timestamp).toISOString(),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signal-changes-${tenantId}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export signal changes to PDF
 */
function exportToPDF(updates: SignalChangeMetric[], tenantId: string) {
  // Simple text-based PDF export
  const content = [
    "Signal Changes Report",
    `Tenant: ${tenantId}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Signal Updates (Last 24 Hours):",
    "",
    ...updates.map(
      (u) =>
        `${u.signal_label} (${u.signal_id})\n` +
        `  Type: ${u.signal_type || "Other"}\n` +
        `  Change: ${u.old_value.toFixed(2)} → ${u.new_value.toFixed(2)} (${(u.change_percent * 100).toFixed(2)}%)\n` +
        `  Severity: ${u.severity}\n` +
        `  Affected Decisions: ${u.affected_decisions}\n` +
        `  Updated: ${new Date(u.timestamp).toLocaleString()}\n`
    ),
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signal-changes-${tenantId}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Create notification for critical signal change
 */
function createCriticalNotification(
  update: SignalChangeMetric,
  tenantId: string
) {
  const notificationsKey = `retina:notifications:${tenantId}`;
  try {
    const existing = localStorage.getItem(notificationsKey);
    const notifications = existing ? JSON.parse(existing) : [];

    const notification = {
      id: `signal-critical-${update.signal_id}-${Date.now()}`,
      type: "signal_critical",
      title: "Critical Signal Change Detected",
      message: `${update.signal_label} changed by ${(Math.abs(update.change_percent) * 100).toFixed(1)}%. Review affected decisions immediately.`,
      severity: "critical",
      signal_id: update.signal_id,
      signal_label: update.signal_label,
      change_percent: update.change_percent,
      affected_decisions: update.affected_decisions,
      timestamp: Date.now(),
      read: false,
    };

    notifications.push(notification);

    // Keep only last 50 notifications
    const trimmed = notifications.slice(-50);

    localStorage.setItem(notificationsKey, JSON.stringify(trimmed));

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Seed mock signal updates for demo
 */
function seedMockSignalUpdates(tenantId: string) {
  const now = Date.now();
  const mockUpdates: SignalUpdate[] = [
    {
      signal_id: "sig-cost-index",
      signal_label: "Cost Index (CPI)",
      old_value: 285.2,
      new_value: 302.8,
      change_percent: 0.062,
      timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
    },
    {
      signal_id: "sig-demand-score",
      signal_label: "Demand Score",
      old_value: 72.5,
      new_value: 68.3,
      change_percent: -0.058,
      timestamp: now - 5 * 60 * 60 * 1000, // 5 hours ago
    },
    {
      signal_id: "sig-market-volatility",
      signal_label: "Market Volatility Index",
      old_value: 18.3,
      new_value: 24.7,
      change_percent: 0.35,
      timestamp: now - 8 * 60 * 60 * 1000, // 8 hours ago
    },
    {
      signal_id: "sig-supply-chain",
      signal_label: "Supply Chain Health",
      old_value: 91.2,
      new_value: 87.5,
      change_percent: -0.041,
      timestamp: now - 12 * 60 * 60 * 1000, // 12 hours ago
    },
  ];

  const updatesKey = `retina:signal-updates:${tenantId}`;
  localStorage.setItem(updatesKey, JSON.stringify(mockUpdates));
}

export function SignalRefreshBanner({
  tenantId,
  className = "",
}: SignalRefreshBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [signalUpdates, setSignalUpdates] = useState<SignalChangeMetric[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const { decisions } = useRetinaStore();

  useEffect(() => {
    // Seed mock data on mount
    seedMockSignalUpdates(tenantId);

    // Load signal updates
    const updates = getRecentSignalUpdates(tenantId);
    setSignalUpdates(updates);

    // Check for critical signals and create notifications
    updates.forEach((update) => {
      if (update.severity === "critical") {
        createCriticalNotification(update, tenantId);
      }
    });

    // Refresh every minute
    const interval = setInterval(() => {
      const updates = getRecentSignalUpdates(tenantId);
      setSignalUpdates(updates);

      // Check for new critical signals
      updates.forEach((update) => {
        if (update.severity === "critical") {
          createCriticalNotification(update, tenantId);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [tenantId]);

  // Apply filters
  const filteredUpdates = signalUpdates.filter((update) => {
    if (filterType !== "all" && update.signal_type !== filterType) return false;
    if (filterSeverity !== "all" && update.severity !== filterSeverity)
      return false;
    return true;
  });

  // Sort by absolute change percent (most significant first)
  const sortedUpdates = [...filteredUpdates].sort(
    (a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent)
  );

  // Get unique signal types for filter
  const signalTypes = Array.from(
    new Set(signalUpdates.map((u) => u.signal_type).filter(Boolean))
  );

  // Get affected decisions for selected signal
  const getAffectedDecisionsForSignal = (
    signalId: string
  ): AffectedDecision[] => {
    return getAffectedDecisions(signalId, tenantId);
  };

  // Get historical data for selected signal
  const selectedSignalHistory = selectedSignal
    ? getSignalHistoricalData(selectedSignal, tenantId, 7)
    : [];

  if (signalUpdates.length === 0) {
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setModalOpen(true)}
              className={`w-full px-4 py-2 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-colors ${className}`}
            >
              <div className="flex items-center justify-center gap-2">
                <RefreshCwIcon
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin"
                  style={{ animationDuration: "3s" }}
                />

                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {signalUpdates.length} active signal
                  {signalUpdates.length !== 1 ? "s" : ""} refreshed in last 24h
                </span>
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                >
                  What's changing right now?
                </Badge>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              Keeps you aware of fresh data affecting your decisions.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Signal Changes Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCwIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              What's changing right now?
            </DialogTitle>
            <DialogDescription>
              Signal updates from the last 24 hours, sorted by impact
            </DialogDescription>
          </DialogHeader>

          {/* Filters and Export */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FilterIcon className="w-4 h-4 text-muted-foreground" />

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {signalTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => exportToCSV(sortedUpdates, tenantId)}
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => exportToPDF(sortedUpdates, tenantId)}
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground mt-2">
            Showing {sortedUpdates.length} of {signalUpdates.length} signal
            updates
          </div>

          <Tabs defaultValue="list" className="mt-4">
            <TabsList>
              <TabsTrigger value="list">Signal List</TabsTrigger>
              <TabsTrigger value="trends">Historical Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4 mt-4">
              {sortedUpdates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {filterType !== "all" || filterSeverity !== "all"
                    ? "No signal updates match the selected filters"
                    : "No signal updates in the last 24 hours"}
                </p>
              ) : (
                sortedUpdates.map((update) => {
                  const isPositive = update.change_percent > 0;
                  const changePercent = Math.abs(update.change_percent * 100);
                  const affectedDecisions = getAffectedDecisionsForSignal(
                    update.signal_id
                  );

                  return (
                    <div
                      key={update.signal_id}
                      className="p-4 border border-border rounded-lg space-y-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm">
                              {update.signal_label}
                            </h3>
                            <Badge
                              variant={
                                update.severity === "critical"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {isPositive ? "+" : "-"}
                              {changePercent.toFixed(1)}%
                            </Badge>
                            {update.signal_type && (
                              <Badge variant="secondary" className="text-xs">
                                {update.signal_type}
                              </Badge>
                            )}
                            {update.severity === "critical" && (
                              <Badge variant="destructive" className="text-xs">
                                <BellIcon className="w-3 h-3 mr-1" />
                                Critical
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Signal ID: {update.signal_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            {isPositive ? (
                              <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                            <span
                              className={
                                isPositive
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {update.new_value.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            was {update.old_value.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground">
                          Updated {new Date(update.timestamp).toLocaleString()}
                        </div>
                        {update.affected_decisions > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {update.affected_decisions} decision
                            {update.affected_decisions !== 1 ? "s" : ""}{" "}
                            affected
                          </Badge>
                        )}
                      </div>

                      {/* Impact Description */}
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">
                          <strong>Impact:</strong>{" "}
                          {changePercent > 20
                            ? "Major change detected. Review affected decisions immediately."
                            : changePercent > 10
                              ? "Significant change. Consider re-evaluating related decisions."
                              : changePercent > 5
                                ? "Moderate change. Monitor for continued trends."
                                : "Minor fluctuation within normal range."}
                        </p>
                      </div>

                      {/* Affected Decisions */}
                      {affectedDecisions.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs font-medium mb-2">
                            Affected Decisions:
                          </div>
                          <div className="space-y-1">
                            {affectedDecisions.map((decision) => (
                              <Link
                                key={decision.id}
                                to={`/retina/modules/i-decide?id=${decision.id}`}
                                className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <ExternalLinkIcon className="w-3 h-3" />

                                {decision.title}
                                <Badge
                                  variant="outline"
                                  className="text-xs ml-auto"
                                >
                                  {decision.status}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Trend Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedSignal(update.signal_id)}
                      >
                        <ChartIcon className="w-4 h-4 mr-2" />
                        View Historical Trend
                      </Button>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4 mt-4">
              {!selectedSignal ? (
                <div className="text-center py-8">
                  <ChartIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />

                  <p className="text-sm text-muted-foreground">
                    Select a signal from the list to view its historical trend
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {sortedUpdates.find(
                          (u) => u.signal_id === selectedSignal
                        )?.signal_label || selectedSignal}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Last 7 days
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSignal(null)}
                    >
                      Back to List
                    </Button>
                  </div>

                  {selectedSignalHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No historical data available for this signal
                    </p>
                  ) : (
                    <ChartContainer config={{}} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedSignalHistory}>
                          <CartesianGrid strokeDasharray="3 3" />

                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />

                          <YAxis tick={{ fontSize: 12 }} />

                          <ChartTooltip />

                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                // In real app, navigate to re-evaluation tags dashboard
                console.warn(
                  'Prevented assignment: `window.location.href = "/retina/revaluation-tags"`'
                ) /*TODO: Do not use window.location for navigation. Use react-router instead.*/;
              }}
            >
              View Re-evaluation Tags
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
