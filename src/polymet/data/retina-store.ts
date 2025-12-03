import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export type DecisionStatus = "draft" | "analyzing" | "deciding" | "closed";

export interface LockedAssumption {
  id: string;
  scope: "decision" | "option" | "variable";
  statement: string;
  status: "open" | "validated" | "invalidated";
  critical: boolean;
  lockedAt: string; // ISO timestamp
}

export interface LinkedSignal {
  signal_id: string;
  variable_name: string;
  direction: "positive" | "negative";
  sensitivity: number; // 0-1 scale
  signal_label?: string; // Human-readable label
  last_value?: number; // Last known value from signal
  last_updated?: number; // Timestamp of last update
}

export interface IncidentImpact {
  incident_id: string;
  incident_title: string;
  incident_type:
    | "supply_failure"
    | "cyber_event"
    | "market_shock"
    | "regulatory_change"
    | "operational_disruption"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  affected_signals: string[]; // Signal IDs that were impacted
  impact_timestamp: number;
  impact_description: string;
  estimated_effect?: {
    metric: string; // e.g., "EV", "VaR95", "RAROC"
    change_percent: number;
  };
  resolution_status: "ongoing" | "mitigated" | "resolved";
  resolution_date?: number;
  notes?: string;
}

export interface Decision {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: DecisionStatus;
  chosenOptionId?: string; // Optional for non-closed decisions
  options: Array<{
    id: string;
    label: string;
    score?: number;
  }>;
  linked_signals?: LinkedSignal[]; // Live signals affecting this decision
  incident_impact?: IncidentImpact[]; // Historical record of incidents that affected this decision
  createdAt: number;
  closedAt?: number; // Optional for non-closed decisions
  closedBy?: string; // Optional for non-closed decisions
  portfolio_id?: string; // Optional link to portfolio
  // Simulation metrics (optional)
  metrics?: {
    raroc?: number;
    ev?: number;
    var95?: number;
    cvar95?: number;
    ce?: number;
    tcor?: number;
  };
  basisAtClose?: "RAROC" | "CE";
  achievedSpearmanAtClose?: number;
  bayesAtClose?: {
    varKey: string;
    muN: number;
    sigmaN: number;
    applied: boolean;
  };
  criticalOpenAtClose?: number;
  lockedAssumptions?: LockedAssumption[];
  topSensitiveFactors?: Array<{
    paramName: string;
    impact: number;
  }>;
  creditRiskScore?: number;
  last_refreshed_at?: number; // Timestamp of last auto-refresh
  // Simulation configuration (for auto-refresh)
  simulationResults?: any[];
  scenarioVars?: any[];
  seed?: number;
  runs?: number;
  utilityParams?: any;
  tcorParams?: any;
  gameConfig?: any;
  optionStrategies?: any[];
  dependenceConfig?: any;
  bayesianOverride?: any;
  copulaConfig?: any;
}

export interface AuditEvent {
  ts: number;
  tenantId: string;
  actor: string;
  actorRole?: string;
  eventType: string;
  payload: Record<string, any>;
}

export interface AssumptionSnapshot {
  id: string;
  scope: "decision" | "option" | "variable";
  statement: string;
  status: "open" | "validated" | "invalidated";
}

export interface SimulationSnapshot {
  runId: string;
  decisionId: string;
  tenantId: string;
  seed: number;
  runs: number;
  timestamp: number;
  achievedSpearman?: number;
  bayes?: {
    varKey: string;
    muN: number;
    sigmaN: number;
    applied: boolean;
  };
  assumptions?: {
    count: number;
    criticalOpen: number;
    list: AssumptionSnapshot[];
  };
  copula?: {
    k: number;
    targetSet: boolean;
    froErr?: number;
    achievedPreview?: number[][]; // 3x3 preview of first three vars
  };
  horizonMonths?: number;
  sensitivityBaseline?: {
    basis: "RAROC" | "CE";
    optionId: string;
  };
  metricsByOption: Record<
    string,
    {
      optionLabel: string;
      ev: number;
      var95: number;
      cvar95: number;
      economicCapital: number;
      raroc: number;
      ce?: number;
      tcor?: number;
    }
  >;
}

interface DecisionsSlice {
  decisions: Decision[];
  saveDecision: (decision: Decision) => void;
  updateDecisionStatus: (id: string, status: DecisionStatus) => void;
  saveClosedDecision: (decision: Decision) => void;
  getDecisionsByTenant: (tenantId: string) => Decision[];
  getDecisionsByStatus: (
    tenantId: string,
    status: DecisionStatus
  ) => Decision[];
  seedMockClosedDecisions: (tenantId: string) => void;
  setDecisions: (decisions: Decision[]) => void; // For batch updates
}

interface AuditSlice {
  audit: AuditEvent[];
  addAudit: (eventType: string, payload: Record<string, any>) => void;
  getAuditByTenant: (tenantId: string, limit?: number) => AuditEvent[];
}

interface SimulationSlice {
  simulationSnapshots: SimulationSnapshot[];
  saveSimulationSnapshot: (snapshot: SimulationSnapshot) => void;
  getLastSnapshot: (decisionId: string) => SimulationSnapshot | undefined;
}

type RetinaStore = DecisionsSlice & AuditSlice & SimulationSlice;

export const useRetinaStore = create<RetinaStore>()(
  persist(
    (set, get) => ({
      // Decisions slice
      decisions: [],
      saveDecision: (decision: Decision) => {
        set((state) => {
          // Check if decision already exists (update instead of add)
          const existingIndex = state.decisions.findIndex(
            (d) => d.id === decision.id
          );
          if (existingIndex >= 0) {
            // Update existing decision
            const updated = [...state.decisions];
            updated[existingIndex] = decision;
            return { decisions: updated };
          }
          // Add new decision
          return {
            decisions: [...state.decisions, decision],
          };
        });
      },
      updateDecisionStatus: (id: string, status: DecisionStatus) => {
        set((state) => ({
          decisions: state.decisions.map((d) =>
            d.id === id ? { ...d, status } : d
          ),
        }));
      },
      saveClosedDecision: (decision: Decision) => {
        set((state) => ({
          decisions: [...state.decisions, { ...decision, status: "closed" }],
        }));
      },
      getDecisionsByTenant: (tenantId: string) => {
        return get().decisions.filter((d) => d.tenantId === tenantId);
      },
      getDecisionsByStatus: (tenantId: string, status: DecisionStatus) => {
        return get().decisions.filter(
          (d) => d.tenantId === tenantId && d.status === status
        );
      },
      setDecisions: (decisions: Decision[]) => {
        set({ decisions });
      },
      seedMockClosedDecisions: (tenantId: string) => {
        // Check if we already have seeded data
        const existing = get().decisions.filter(
          (d) => d.tenantId === tenantId && d.id.startsWith("seed-")
        );
        if (existing.length > 0) return; // Already seeded

        const now = Date.now();
        const thirtyFiveDaysAgo = now - 35 * 24 * 60 * 60 * 1000;
        const fortyFiveDaysAgo = now - 45 * 24 * 60 * 60 * 1000;
        const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

        const mockDecisions: Decision[] = [
          {
            id: "seed-001",
            tenantId,
            title: "Cloud Migration Strategy",
            description:
              "Evaluate cloud infrastructure options for enterprise migration",
            status: "closed",
            chosenOptionId: "opt-hybrid",
            options: [
              { id: "opt-hybrid", label: "Hybrid Cloud Approach", score: 0.92 },
              { id: "opt-full", label: "Full Cloud Migration", score: 0.78 },
              { id: "opt-multi", label: "Multi-Cloud Strategy", score: 0.85 },
            ],

            createdAt: thirtyFiveDaysAgo - 7 * 24 * 60 * 60 * 1000,
            closedAt: thirtyFiveDaysAgo,
            closedBy: "Admin User",
            metrics: {
              raroc: 0.085,
              ev: 1500,
              var95: -450,
              cvar95: -520,
              ce: 1250,
            },
            basisAtClose: "RAROC",
          },
          {
            id: "seed-002",
            tenantId,
            title: "Market Expansion Initiative",
            description: "Assess regional expansion opportunities",
            status: "closed",
            chosenOptionId: "opt-sea",
            options: [
              { id: "opt-sea", label: "Southeast Asia Entry", score: 0.88 },
              { id: "opt-latam", label: "Latin America Entry", score: 0.82 },
              { id: "opt-emea", label: "EMEA Expansion", score: 0.79 },
            ],

            createdAt: fortyFiveDaysAgo - 10 * 24 * 60 * 60 * 1000,
            closedAt: fortyFiveDaysAgo,
            closedBy: "Admin User",
            metrics: {
              raroc: 0.072,
              ev: 2200,
              var95: -680,
              cvar95: -750,
              ce: 1850,
            },
            basisAtClose: "RAROC",
          },
          {
            id: "seed-003",
            tenantId,
            title: "Product Line Extension",
            description: "Evaluate new product tier launch",
            status: "closed",
            chosenOptionId: "opt-premium",
            options: [
              { id: "opt-premium", label: "Premium Tier Launch", score: 0.91 },
              { id: "opt-budget", label: "Budget Tier Launch", score: 0.76 },
              { id: "opt-mid", label: "Mid-Tier Expansion", score: 0.83 },
            ],

            createdAt: sixtyDaysAgo - 5 * 24 * 60 * 60 * 1000,
            closedAt: sixtyDaysAgo,
            closedBy: "Admin User",
            metrics: {
              raroc: 0.0965,
              ev: 1800,
              var95: -420,
              cvar95: -480,
              ce: 1520,
            },
            basisAtClose: "RAROC",
          },
        ];

        set((state) => ({
          decisions: [...state.decisions, ...mockDecisions],
        }));
      },

      // Audit slice
      audit: [],
      addAudit: (eventType: string, payload: Record<string, any>) => {
        // Get current tenant and actor from context
        // In a real app, you'd get this from auth context
        const tenantId = localStorage.getItem("retina-tenant-id") || "t-demo";
        const actor = "Admin User"; // In real app, get from auth

        // Try to get actor role from auth store
        let actorRole: string | undefined;
        try {
          const authData = localStorage.getItem("retina:user");
          if (authData) {
            const user = JSON.parse(authData);
            actorRole = user.role;
          }
        } catch {
          actorRole = "admin";
        }

        const event: AuditEvent = {
          ts: Date.now(),
          tenantId,
          actor,
          actorRole,
          eventType,
          payload,
        };

        set((state) => ({
          audit: [...state.audit, event],
        }));
      },
      getAuditByTenant: (tenantId: string, limit = 50) => {
        return get()
          .audit.filter((e) => e.tenantId === tenantId)
          .sort((a, b) => b.ts - a.ts)
          .slice(0, limit);
      },

      // Simulation snapshots slice
      simulationSnapshots: [],
      saveSimulationSnapshot: (snapshot: SimulationSnapshot) => {
        set((state) => ({
          simulationSnapshots: [...state.simulationSnapshots, snapshot],
        }));
      },
      getLastSnapshot: (decisionId: string) => {
        const snapshots = get()
          .simulationSnapshots.filter((s) => s.decisionId === decisionId)
          .sort((a, b) => b.timestamp - a.timestamp);
        return snapshots[0];
      },
    }),
    {
      name: "retina-store",
    }
  )
);
