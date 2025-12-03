/**
 * # Incident Tracker Widget
 *
 * ## Overview
 * Dashboard widget showing incident statistics and recent incidents
 * with decision impact tracking.
 */

import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PlusIcon,
  ZapIcon,
} from "lucide-react";
import {
  getAllIncidents,
  getIncidentStats,
  createIncident,
  processIncidentImpact,
  seedMockIncidents,
  type Incident,
  type IncidentStats,
} from "@/polymet/data/incident-matcher";
import type { Decision } from "@/polymet/data/retina-store";
import { cn } from "@/lib/utils";

interface IncidentTrackerWidgetProps {
  tenantId: string;
  decisions: Decision[];
  onDecisionsUpdate?: (decisions: Decision[]) => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function IncidentTrackerWidget({
  tenantId,
  decisions,
  onDecisionsUpdate,
  onAuditEvent,
}: IncidentTrackerWidgetProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Seed mock incidents on first load
    seedMockIncidents(tenantId);
    loadIncidents();
  }, [tenantId]);

  const loadIncidents = () => {
    const loaded = getAllIncidents(tenantId);
    setIncidents(loaded);

    const calculatedStats = getIncidentStats(tenantId, decisions);
    setStats(calculatedStats);
  };

  const handleProcessIncident = (incident: Incident) => {
    const updatedDecisions = processIncidentImpact(
      incident,
      decisions,
      onAuditEvent
    );

    if (onDecisionsUpdate && updatedDecisions.length > 0) {
      onDecisionsUpdate(updatedDecisions);
    }

    loadIncidents();
  };

  const severityColors = {
    low: "bg-blue-500 dark:bg-blue-600",
    medium: "bg-yellow-500 dark:bg-yellow-600",
    high: "bg-orange-500 dark:bg-orange-600",
    critical: "bg-red-500 dark:bg-red-600",
  };

  const statusIcons = {
    ongoing: <ClockIcon className="w-4 h-4" />,

    mitigated: <AlertTriangleIcon className="w-4 h-4" />,

    resolved: <CheckCircleIcon className="w-4 h-4" />,
  };

  const statusColors = {
    ongoing: "text-orange-600 dark:text-orange-400",
    mitigated: "text-yellow-600 dark:text-yellow-400",
    resolved: "text-green-600 dark:text-green-400",
  };

  if (!stats) {
    return null;
  }

  const recentIncidents = incidents
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <ZapIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                Incident Tracking
              </CardTitle>
              <CardDescription>
                Real-world shocks affecting decisions
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {stats.total}
            </div>
            <div className="text-xs text-muted-foreground">Total Incidents</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.by_status.ongoing}
            </div>
            <div className="text-xs text-muted-foreground">Ongoing</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.by_severity.critical}
            </div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {stats.decisions_affected}
            </div>
            <div className="text-xs text-muted-foreground">
              Decisions Affected
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        {recentIncidents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Recent Incidents
            </div>
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {incident.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(incident.timestamp).toLocaleDateString()} •{" "}
                    {incident.affected_signals.length} signals
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${severityColors[incident.severity]} text-white text-xs`}
                  >
                    {incident.severity}
                  </Badge>
                  <div className={statusColors[incident.resolution_status]}>
                    {statusIcons[incident.resolution_status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              View All Incidents
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Incident History</DialogTitle>
              <DialogDescription>
                All incidents recorded for {tenantId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No incidents recorded yet
                </p>
              ) : (
                incidents
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 border border-border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            {incident.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {incident.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${severityColors[incident.severity]} text-white`}
                          >
                            {incident.severity}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {incident.type.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {incident.affected_signals.length} signals
                        </Badge>
                        <div
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            statusColors[incident.resolution_status]
                          )}
                        >
                          {statusIcons[incident.resolution_status]}
                          <span className="capitalize">
                            {incident.resolution_status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
