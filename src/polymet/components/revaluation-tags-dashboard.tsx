/**
 * # Re-evaluation Tags Dashboard
 *
 * ## Overview
 * Dashboard for viewing and managing all decision re-evaluation tags
 * triggered by signal updates.
 *
 * ## Features
 * - View all pending and acknowledged tags
 * - Filter by decision, signal, or date
 * - Acknowledge tags
 * - Navigate to decisions
 * - View signal change details
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getRevaluationTags,
  acknowledgeRevaluationTag,
  getPendingRevaluationCount,
  type DecisionRevaluationTag,
  type SignalUpdate,
} from "@/polymet/data/signal-monitor";
import { useTenant } from "@/polymet/data/tenant-context";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  SearchIcon,
  FilterIcon,
} from "lucide-react";

interface RevaluationTagsDashboardProps {
  onNavigateToDecision?: (decisionId: string) => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function RevaluationTagsDashboard({
  onNavigateToDecision,
  onAuditEvent,
}: RevaluationTagsDashboardProps) {
  const { tenant } = useTenant();
  const [tags, setTags] = useState<DecisionRevaluationTag[]>([]);
  const [filteredTags, setFilteredTags] = useState<DecisionRevaluationTag[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "acknowledged"
  >("all");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadTags();
    const interval = setInterval(loadTags, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [tenant.tenantId]);

  useEffect(() => {
    applyFilters();
  }, [tags, searchQuery, statusFilter]);

  const loadTags = () => {
    const allTags = getRevaluationTags(tenant.tenantId);
    setTags(allTags);
    setPendingCount(getPendingRevaluationCount(tenant.tenantId));
  };

  const applyFilters = () => {
    let filtered = [...tags];

    // Status filter
    if (statusFilter === "pending") {
      filtered = filtered.filter((t) => !t.acknowledged);
    } else if (statusFilter === "acknowledged") {
      filtered = filtered.filter((t) => t.acknowledged);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.decision_title.toLowerCase().includes(query) ||
          t.triggered_by.some((u) =>
            u.signal_label.toLowerCase().includes(query)
          )
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.tagged_at - a.tagged_at);

    setFilteredTags(filtered);
  };

  const handleAcknowledge = (decisionId: string) => {
    acknowledgeRevaluationTag(decisionId);
    loadTags();

    if (onAuditEvent) {
      onAuditEvent("revaluation_tag.acknowledged", {
        decisionId,
        tenantId: tenant.tenantId,
        timestamp: Date.now(),
      });
    }
  };

  const handleNavigate = (decisionId: string) => {
    if (onNavigateToDecision) {
      onNavigateToDecision(decisionId);
    }
  };

  const getChangeIcon = (oldValue: number, newValue: number) => {
    if (newValue > oldValue) {
      return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else if (newValue < oldValue) {
      return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const formatChange = (update: SignalUpdate) => {
    const change =
      ((update.new_value - update.old_value) / update.old_value) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />

              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-muted-foreground" />

              <span className="text-2xl font-bold">{tags.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="h-5 w-5 text-green-500" />

              <span className="text-2xl font-bold">
                {tags.filter((t) => t.acknowledged).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Re-evaluation Tags</CardTitle>
          <CardDescription>
            Decisions flagged for re-evaluation due to signal updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search by decision or signal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v: any) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <FilterIcon className="h-4 w-4 mr-2" />

                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="acknowledged">Acknowledged Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags Table */}
          {filteredTags.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No tags match your filters"
                  : "No re-evaluation tags yet"}
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Decision</TableHead>
                    <TableHead>Signal Updates</TableHead>
                    <TableHead>Tagged</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map((tag) => (
                    <TableRow key={`${tag.decision_id}-${tag.tagged_at}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tag.decision_title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tag.decision_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {tag.triggered_by.slice(0, 2).map((update, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              {getChangeIcon(
                                update.old_value,
                                update.new_value
                              )}
                              <span className="font-medium">
                                {update.signal_label}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {formatChange(update)}
                              </Badge>
                            </div>
                          ))}
                          {tag.triggered_by.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{tag.triggered_by.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(tag.tagged_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tag.tagged_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tag.acknowledged ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2Icon className="h-3 w-3" />
                            Acknowledged
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangleIcon className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigate(tag.decision_id)}
                          >
                            View
                          </Button>
                          {!tag.acknowledged && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcknowledge(tag.decision_id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
