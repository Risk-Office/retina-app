import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
  ActivityIcon,
  DownloadIcon,
  FilterIcon,
  XIcon,
  SearchIcon,
} from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";
import { useRetinaStore, type AuditEvent } from "@/polymet/data/retina-store";
import { exportAuditCSV } from "@/polymet/data/csv-export-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/polymet/data/auth-store";

type TimeRange = "24h" | "7d" | "30d" | "all";

const EVENT_TYPES = [
  "decision.closed",
  "feature.flag.changed",
  "simulation.rerun",
  "decision.recommended.applied",
  "board.brief.generated",
  "guardrail.added",
  "guardrail.deleted",
  "guardrail.violated",
  "guardrail.template.applied",
  "guardrail.notifications.updated",
  "guardrail.outcome_breach",
  "guardrail.auto_adjusted",
  "outcomes.exported",
  "adjustments.exported",
] as const;

const ROLES: UserRole[] = ["viewer", "analyst", "manager", "admin"];

export function RetinaAudit() {
  const { tenant } = useTenant();
  const { audit } = useRetinaStore();

  // Filter states
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get all audit events for tenant
  const tenantAuditEvents = useMemo(() => {
    return audit
      .filter((e) => e.tenantId === tenant.tenantId)
      .sort((a, b) => b.ts - a.ts);
  }, [audit, tenant.tenantId]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let filtered = [...tenantAuditEvents];

    // Time range filter
    if (timeRange !== "all") {
      const now = Date.now();
      const timeRangeMs = {
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      }[timeRange];
      filtered = filtered.filter((e) => now - e.ts <= timeRangeMs);
    }

    // Event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter((e) =>
        selectedEventTypes.includes(e.eventType)
      );
    }

    // Role filter
    if (selectedRoles.length > 0) {
      filtered = filtered.filter(
        (e) => e.actorRole && selectedRoles.includes(e.actorRole as UserRole)
      );
    }

    // Search filter (matches in payload JSON)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => {
        const payloadStr = JSON.stringify(e.payload).toLowerCase();
        return payloadStr.includes(query);
      });
    }

    return filtered;
  }, [
    tenantAuditEvents,
    timeRange,
    selectedEventTypes,
    selectedRoles,
    searchQuery,
  ]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType.includes("closed")) return "default";
    if (eventType.includes("recommended")) return "default";
    if (eventType.includes("flag")) return "secondary";
    if (eventType.includes("simulation")) return "outline";
    return "secondary";
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((t) => t !== eventType)
        : [...prev, eventType]
    );
  };

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const clearFilters = () => {
    setTimeRange("7d");
    setSelectedEventTypes([]);
    setSelectedRoles([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    timeRange !== "7d" ||
    selectedEventTypes.length > 0 ||
    selectedRoles.length > 0 ||
    searchQuery.trim() !== "";

  const handleExportCSV = () => {
    exportAuditCSV(filteredEvents);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/retina" className="hover:text-foreground transition-colors">
          Retina
        </Link>
        <ChevronRightIcon className="w-4 h-4" />

        <span className="text-foreground font-medium">Audit</span>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
            <Badge variant="secondary" className="text-sm">
              {tenant.tenantName}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Track all system events and user actions
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={filteredEvents.length === 0}
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="w-5 h-5 text-muted-foreground" />

              <CardTitle>Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XIcon className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Range */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium min-w-[100px]">
              Time Range:
            </label>
            <div className="flex gap-2">
              {(["24h", "7d", "30d", "all"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === "24h" && "Last 24h"}
                  {range === "7d" && "Last 7 days"}
                  {range === "30d" && "Last 30 days"}
                  {range === "all" && "All"}
                </Button>
              ))}
            </div>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-start gap-4">
            <label className="text-sm font-medium min-w-[100px] pt-1">
              Event Types:
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((eventType) => (
                <Badge
                  key={eventType}
                  variant={
                    selectedEventTypes.includes(eventType)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleEventType(eventType)}
                >
                  {eventType}
                  {selectedEventTypes.includes(eventType) && (
                    <XIcon className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-start gap-4">
            <label className="text-sm font-medium min-w-[100px] pt-1">
              Roles:
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <Badge
                  key={role}
                  variant={selectedRoles.includes(role) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleRole(role)}
                >
                  {role}
                  {selectedRoles.includes(role) && (
                    <XIcon className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium min-w-[100px]">Search:</label>
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search in payload JSON..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ActivityIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {filteredEvents.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {hasActiveFilters ? "Filtered Events" : "Total Events"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {filteredEvents.length > 0
                    ? formatTimestamp(filteredEvents[0].ts).date
                    : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Latest Activity
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(filteredEvents.map((e) => e.actor)).size}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Users
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `Showing ${filteredEvents.length} filtered events`
              : `Showing all ${filteredEvents.length} events for ${tenant.tenantName}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full bg-muted" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "No events match your filters"
                  : "No audit events yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {hasActiveFilters
                  ? "Try adjusting your filter criteria"
                  : "Events will appear here as actions are performed"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Tenant ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event, idx) => {
                    const { date, time } = formatTimestamp(event.ts);
                    const payloadStr = JSON.stringify(event.payload);
                    const truncatedPayload =
                      payloadStr.length > 50
                        ? payloadStr.substring(0, 50) + "..."
                        : payloadStr;

                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{date}</div>
                            <div className="text-xs text-muted-foreground">
                              {time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {event.tenantId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm">{event.actor}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.actorRole ? (
                            <Badge variant="secondary">{event.actorRole}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getEventBadgeVariant(event.eventType)}
                          >
                            {event.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-sm text-muted-foreground max-w-xs truncate cursor-help">
                                  {truncatedPayload}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <pre className="text-xs whitespace-pre-wrap break-words">
                                  {JSON.stringify(event.payload, null, 2)}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
