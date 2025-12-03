/**
 * # Incident Matcher Service
 *
 * ## Overview
 * Matches incidents to affected decisions via their linked signals.
 * Records incident details in decision.incident_impact[] array.
 *
 * ## Features
 * - Signal-based incident matching
 * - Automatic decision tagging
 * - Impact estimation
 * - Audit logging
 * - Plain-language descriptions
 *
 * ## Plain-Language Label
 * "What real problems touched this decision?"
 *
 * ## Tooltip
 * "Helps trace which shocks hit which choices."
 */

import type { Decision, IncidentImpact } from "@/polymet/data/retina-store";
import { generateIncidentLinkEntry } from "@/polymet/data/auto-journal-generator";

export interface Incident {
  id: string;
  title: string;
  type:
    | "supply_failure"
    | "cyber_event"
    | "market_shock"
    | "regulatory_change"
    | "operational_disruption"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  description: string;
  affected_signals: string[]; // Signal IDs impacted by this incident
  tenant_id: string;
  resolution_status: "ongoing" | "mitigated" | "resolved";
  resolution_date?: number;
  metadata?: Record<string, any>;
}

// Storage key
const STORAGE_KEY_INCIDENTS = "retina:incidents";

/**
 * Get all incidents from localStorage
 */
export function getAllIncidents(tenantId?: string): Incident[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_INCIDENTS);
    const incidents: Incident[] = data ? JSON.parse(data) : [];
    return tenantId
      ? incidents.filter((i) => i.tenant_id === tenantId)
      : incidents;
  } catch {
    return [];
  }
}

/**
 * Save incidents to localStorage
 */
function saveIncidents(incidents: Incident[]) {
  localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
}

/**
 * Create a new incident
 */
export function createIncident(incident: Omit<Incident, "id">): Incident {
  const newIncident: Incident = {
    ...incident,
    id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  const incidents = getAllIncidents();
  incidents.push(newIncident);
  saveIncidents(incidents);

  return newIncident;
}

/**
 * Update incident resolution status
 */
export function updateIncidentStatus(
  incidentId: string,
  status: "ongoing" | "mitigated" | "resolved",
  resolutionDate?: number
) {
  const incidents = getAllIncidents();
  const updated = incidents.map((inc) =>
    inc.id === incidentId
      ? { ...inc, resolution_status: status, resolution_date: resolutionDate }
      : inc
  );
  saveIncidents(updated);
}

/**
 * Match incident to affected decisions based on linked signals
 */
export function matchIncidentToDecisions(
  incident: Incident,
  decisions: Decision[]
): Decision[] {
  const affectedDecisions: Decision[] = [];

  decisions.forEach((decision) => {
    // Skip if decision has no linked signals
    if (!decision.linked_signals || decision.linked_signals.length === 0) {
      return;
    }

    // Check if any of the decision's linked signals are affected by the incident
    const matchingSignals = decision.linked_signals.filter((signal) =>
      incident.affected_signals.includes(signal.signal_id)
    );

    if (matchingSignals.length > 0) {
      affectedDecisions.push(decision);
    }
  });

  return affectedDecisions;
}

/**
 * Estimate impact on decision metrics
 * This is a simplified estimation - in a real system, you'd rerun simulations
 */
function estimateImpact(
  incident: Incident,
  decision: Decision,
  matchingSignals: string[]
): IncidentImpact["estimated_effect"] | undefined {
  // If decision has no metrics, can't estimate impact
  if (!decision.metrics) {
    return undefined;
  }

  // Estimate impact based on severity and number of affected signals
  const severityMultiplier = {
    low: 0.02,
    medium: 0.05,
    high: 0.1,
    critical: 0.2,
  }[incident.severity];

  const signalImpactMultiplier = Math.min(matchingSignals.length * 0.03, 0.15);
  const totalImpact = severityMultiplier + signalImpactMultiplier;

  // For negative incidents (most common), impact is negative
  const changePercent =
    incident.type === "market_shock" && Math.random() > 0.5
      ? totalImpact // Positive shock
      : -totalImpact; // Negative shock

  // Choose which metric to highlight based on incident type
  const metricMap = {
    supply_failure: "EV",
    cyber_event: "VaR95",
    market_shock: "RAROC",
    regulatory_change: "CE",
    operational_disruption: "EV",
    other: "EV",
  };

  return {
    metric: metricMap[incident.type],
    change_percent: changePercent * 100, // Convert to percentage
  };
}

/**
 * Record incident impact on a decision
 */
export function recordIncidentImpact(
  decision: Decision,
  incident: Incident
): IncidentImpact {
  // Find matching signals
  const matchingSignals =
    decision.linked_signals?.filter((signal) =>
      incident.affected_signals.includes(signal.signal_id)
    ) || [];

  const matchingSignalIds = matchingSignals.map((s) => s.signal_id);

  // Create impact record
  const impact: IncidentImpact = {
    incident_id: incident.id,
    incident_title: incident.title,
    incident_type: incident.type,
    severity: incident.severity,
    affected_signals: matchingSignalIds,
    impact_timestamp: incident.timestamp,
    impact_description: generateImpactDescription(
      incident,
      matchingSignals.length
    ),
    estimated_effect: estimateImpact(incident, decision, matchingSignalIds),
    resolution_status: incident.resolution_status,
    resolution_date: incident.resolution_date,
  };

  return impact;
}

/**
 * Generate plain-language impact description
 */
function generateImpactDescription(
  incident: Incident,
  signalCount: number
): string {
  const typeDescriptions = {
    supply_failure: "Supply chain disruption",
    cyber_event: "Cybersecurity incident",
    market_shock: "Market volatility event",
    regulatory_change: "Regulatory update",
    operational_disruption: "Operational issue",
    other: "External event",
  };

  const severityDescriptions = {
    low: "minor impact",
    medium: "moderate impact",
    high: "significant impact",
    critical: "critical impact",
  };

  return `${typeDescriptions[incident.type]} with ${severityDescriptions[incident.severity]} affecting ${signalCount} linked signal${signalCount !== 1 ? "s" : ""}.`;
}

/**
 * Process incident and update all affected decisions
 * Returns array of updated decisions
 */
export function processIncidentImpact(
  incident: Incident,
  decisions: Decision[],
  onAuditEvent?: (eventType: string, payload: any) => void
): Decision[] {
  const affectedDecisions = matchIncidentToDecisions(incident, decisions);
  const updatedDecisions: Decision[] = [];

  affectedDecisions.forEach((decision) => {
    const impact = recordIncidentImpact(decision, incident);

    // Add impact to decision's incident_impact array
    const updatedDecision: Decision = {
      ...decision,
      incident_impact: [...(decision.incident_impact || []), impact],
    };

    updatedDecisions.push(updatedDecision);

    // Log audit event
    if (onAuditEvent) {
      onAuditEvent("incident.matched", {
        incidentId: incident.id,
        incidentTitle: incident.title,
        incidentType: incident.type,
        severity: incident.severity,
        decisionId: decision.id,
        decisionTitle: decision.title,
        affectedSignals: impact.affected_signals,
        estimatedEffect: impact.estimated_effect,
        timestamp: Date.now(),
      });
    }

    // Generate automatic journal entry for incident link
    generateIncidentLinkEntry(
      decision.id,
      decision.title || "Untitled Decision",
      decision.tenantId,
      incident,
      impact.affected_signals.length,
      impact.estimated_effect
    );
  });

  return updatedDecisions;
}

/**
 * Get incident statistics for a tenant
 */
export interface IncidentStats {
  total: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  recent_count: number; // Last 7 days
  decisions_affected: number;
}

export function getIncidentStats(
  tenantId: string,
  decisions: Decision[]
): IncidentStats {
  const incidents = getAllIncidents(tenantId);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const stats: IncidentStats = {
    total: incidents.length,
    by_severity: { low: 0, medium: 0, high: 0, critical: 0 },
    by_type: {
      supply_failure: 0,
      cyber_event: 0,
      market_shock: 0,
      regulatory_change: 0,
      operational_disruption: 0,
      other: 0,
    },
    by_status: { ongoing: 0, mitigated: 0, resolved: 0 },
    recent_count: 0,
    decisions_affected: 0,
  };

  incidents.forEach((incident) => {
    stats.by_severity[incident.severity]++;
    stats.by_type[incident.type]++;
    stats.by_status[incident.resolution_status]++;

    if (incident.timestamp >= sevenDaysAgo) {
      stats.recent_count++;
    }
  });

  // Count unique decisions with incident impacts
  const decisionsWithImpacts = new Set<string>();
  decisions.forEach((decision) => {
    if (decision.incident_impact && decision.incident_impact.length > 0) {
      decisionsWithImpacts.add(decision.id);
    }
  });
  stats.decisions_affected = decisionsWithImpacts.size;

  return stats;
}

/**
 * Get decisions affected by a specific incident
 */
export function getDecisionsAffectedByIncident(
  incidentId: string,
  decisions: Decision[]
): Decision[] {
  return decisions.filter((decision) =>
    decision.incident_impact?.some(
      (impact) => impact.incident_id === incidentId
    )
  );
}

/**
 * Get all incidents affecting a specific decision
 */
export function getIncidentsForDecision(
  decisionId: string,
  decisions: Decision[]
): IncidentImpact[] {
  const decision = decisions.find((d) => d.id === decisionId);
  return decision?.incident_impact || [];
}

/**
 * Seed mock incidents for demo
 */
export function seedMockIncidents(tenantId: string) {
  const existing = getAllIncidents(tenantId);
  if (existing.length > 0) return; // Already seeded

  const now = Date.now();
  const mockIncidents: Omit<Incident, "id">[] = [
    {
      title: "Supply Chain Disruption - Port Delays",
      type: "supply_failure",
      severity: "high",
      timestamp: now - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      description: "Major port congestion causing 2-3 week delays in shipments",
      affected_signals: ["sig-supply-chain", "sig-cost-index"],
      tenant_id: tenantId,
      resolution_status: "mitigated",
      resolution_date: now - 2 * 24 * 60 * 60 * 1000,
    },
    {
      title: "Ransomware Attack on Partner System",
      type: "cyber_event",
      severity: "critical",
      timestamp: now - 12 * 24 * 60 * 60 * 1000, // 12 days ago
      description:
        "Key supplier's systems compromised, affecting order processing",
      affected_signals: ["sig-supply-chain", "sig-demand-score"],
      tenant_id: tenantId,
      resolution_status: "resolved",
      resolution_date: now - 7 * 24 * 60 * 60 * 1000,
    },
    {
      title: "Market Volatility Spike",
      type: "market_shock",
      severity: "medium",
      timestamp: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      description: "Sudden 15% increase in commodity prices",
      affected_signals: [
        "sig-cost-index",
        "sig-market-volatility",
        "sig-competitor-price",
      ],

      tenant_id: tenantId,
      resolution_status: "ongoing",
    },
    {
      title: "New Compliance Requirements",
      type: "regulatory_change",
      severity: "medium",
      timestamp: now - 20 * 24 * 60 * 60 * 1000, // 20 days ago
      description: "Updated data privacy regulations requiring system changes",
      affected_signals: ["sig-cost-index"],
      tenant_id: tenantId,
      resolution_status: "resolved",
      resolution_date: now - 10 * 24 * 60 * 60 * 1000,
    },
    {
      title: "Customer Sentiment Drop",
      type: "operational_disruption",
      severity: "low",
      timestamp: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      description: "Social media backlash following product issue",
      affected_signals: ["sig-customer-sentiment", "sig-demand-score"],
      tenant_id: tenantId,
      resolution_status: "ongoing",
    },
  ];

  mockIncidents.forEach((incident) => {
    createIncident(incident);
  });
}
