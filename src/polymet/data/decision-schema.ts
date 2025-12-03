/**
 * # Decision JSON Schema
 *
 * JSON Schema definition for Decision entity with validation rules.
 * Reflects current usage from retina-store with all fields including
 * bayesAtClose, copulaFroErrAtClose, achievedSpearmanAtClose, etc.
 */

export const DecisionSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://retina.ai/schemas/decision.json",
  title: "Decision",
  description:
    "A strategic decision with options, metrics, and lifecycle tracking",
  type: "object",
  required: ["id", "tenantId", "title", "status", "options", "createdAt"],
  properties: {
    id: {
      type: "string",
      description: "Unique decision identifier",
      pattern: "^[a-zA-Z0-9-_]+$",
      minLength: 1,
      maxLength: 100,
    },
    tenantId: {
      type: "string",
      description: "Tenant identifier for multi-tenancy",
      pattern: "^t-[a-zA-Z0-9-_]+$",
      minLength: 3,
      maxLength: 50,
    },
    title: {
      type: "string",
      description: "Decision title",
      minLength: 1,
      maxLength: 500,
    },
    description: {
      type: ["string", "null"],
      description: "Optional decision description",
      maxLength: 5000,
    },
    status: {
      type: "string",
      description: "Current decision status",
      enum: ["draft", "analyzing", "deciding", "closed"],
    },
    chosenOptionId: {
      type: ["string", "null"],
      description: "ID of chosen option (required when status is closed)",
    },
    options: {
      type: "array",
      description: "Decision options",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "label"],
        properties: {
          id: {
            type: "string",
            description: "Option identifier",
          },
          label: {
            type: "string",
            description: "Option label",
            minLength: 1,
            maxLength: 200,
          },
          score: {
            type: ["number", "null"],
            description: "Optional option score",
            minimum: 0,
            maximum: 1,
          },
        },
      },
    },
    linked_signals: {
      type: ["array", "null"],
      description: "Live signals affecting this decision",
      items: {
        type: "object",
        required: ["signal_id", "variable_name", "direction", "sensitivity"],
        properties: {
          signal_id: {
            type: "string",
            description: "Signal identifier",
          },
          variable_name: {
            type: "string",
            description: "Variable name linked to signal",
          },
          direction: {
            type: "string",
            enum: ["positive", "negative"],
            description: "Signal impact direction",
          },
          sensitivity: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Sensitivity score (0-1)",
          },
          signal_label: {
            type: ["string", "null"],
            description: "Human-readable signal label",
          },
          last_value: {
            type: ["number", "null"],
            description: "Last known value from signal",
          },
          last_updated: {
            type: ["number", "null"],
            description: "Timestamp of last update",
          },
        },
      },
    },
    incident_impact: {
      type: ["array", "null"],
      description: "Historical record of incidents affecting this decision",
      items: {
        type: "object",
        required: [
          "incident_id",
          "incident_title",
          "incident_type",
          "severity",
          "affected_signals",
          "impact_timestamp",
          "impact_description",
          "resolution_status",
        ],

        properties: {
          incident_id: {
            type: "string",
          },
          incident_title: {
            type: "string",
          },
          incident_type: {
            type: "string",
            enum: [
              "supply_failure",
              "cyber_event",
              "market_shock",
              "regulatory_change",
              "operational_disruption",
              "other",
            ],
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
          },
          affected_signals: {
            type: "array",
            items: { type: "string" },
          },
          impact_timestamp: {
            type: "number",
          },
          impact_description: {
            type: "string",
          },
          estimated_effect: {
            type: ["object", "null"],
            properties: {
              metric: { type: "string" },
              change_percent: { type: "number" },
            },
          },
          resolution_status: {
            type: "string",
            enum: ["ongoing", "mitigated", "resolved"],
          },
          resolution_date: {
            type: ["number", "null"],
          },
          notes: {
            type: ["string", "null"],
          },
        },
      },
    },
    createdAt: {
      type: "number",
      description: "Creation timestamp (Unix milliseconds)",
      minimum: 0,
    },
    closedAt: {
      type: ["number", "null"],
      description: "Closure timestamp (Unix milliseconds)",
      minimum: 0,
    },
    closedBy: {
      type: ["string", "null"],
      description: "User who closed the decision",
      maxLength: 200,
    },
    portfolio_id: {
      type: ["string", "null"],
      description: "Optional link to portfolio",
    },
    metrics: {
      type: ["object", "null"],
      description: "Simulation metrics",
      properties: {
        raroc: {
          type: ["number", "null"],
          description: "Risk-Adjusted Return on Capital",
        },
        ev: {
          type: ["number", "null"],
          description: "Expected Value",
        },
        var95: {
          type: ["number", "null"],
          description: "Value at Risk (95%)",
        },
        cvar95: {
          type: ["number", "null"],
          description: "Conditional Value at Risk (95%)",
        },
        ce: {
          type: ["number", "null"],
          description: "Certainty Equivalent",
        },
        tcor: {
          type: ["number", "null"],
          description: "Total Cost of Risk",
        },
      },
    },
    basisAtClose: {
      type: ["string", "null"],
      description: "Decision basis at closure",
      enum: ["RAROC", "CE", null],
    },
    horizonMonthsAtClose: {
      type: ["number", "null"],
      description: "Planning horizon in months at closure",
      minimum: 1,
      maximum: 240,
    },
    achievedSpearmanAtClose: {
      type: ["number", "null"],
      description: "Achieved Spearman correlation at closure",
      minimum: -1,
      maximum: 1,
    },
    bayesAtClose: {
      type: ["object", "null"],
      description: "Bayesian prior configuration at closure",
      properties: {
        varKey: {
          type: "string",
          description: "Variable key",
        },
        muN: {
          type: "number",
          description: "Posterior mean",
        },
        sigmaN: {
          type: "number",
          description: "Posterior standard deviation",
        },
        applied: {
          type: "boolean",
          description: "Whether Bayesian override was applied",
        },
      },
      required: ["varKey", "muN", "sigmaN", "applied"],
    },
    copulaFroErrAtClose: {
      type: ["number", "null"],
      description: "Copula Frobenius error at closure",
      minimum: 0,
    },
    criticalOpenAtClose: {
      type: ["number", "null"],
      description: "Count of critical open assumptions at closure",
      minimum: 0,
    },
    lockedAssumptions: {
      type: ["array", "null"],
      description: "Locked assumptions at closure",
      items: {
        type: "object",
        required: [
          "id",
          "scope",
          "statement",
          "status",
          "critical",
          "lockedAt",
        ],

        properties: {
          id: {
            type: "string",
          },
          scope: {
            type: "string",
            enum: ["decision", "option", "variable"],
          },
          statement: {
            type: "string",
            maxLength: 1000,
          },
          status: {
            type: "string",
            enum: ["open", "validated", "invalidated"],
          },
          critical: {
            type: "boolean",
          },
          lockedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
    },
    topSensitiveFactors: {
      type: ["array", "null"],
      description: "Top sensitive factors from sensitivity analysis",
      items: {
        type: "object",
        required: ["paramName", "impact"],
        properties: {
          paramName: {
            type: "string",
          },
          impact: {
            type: "number",
          },
        },
      },
    },
    creditRiskScore: {
      type: ["number", "null"],
      description: "Aggregated credit risk score",
      minimum: 0,
      maximum: 100,
    },
    last_refreshed_at: {
      type: ["number", "null"],
      description: "Timestamp of last auto-refresh",
    },
    // Simulation configuration for auto-refresh
    simulationResults: {
      type: ["array", "null"],
      description: "Cached simulation results",
    },
    scenarioVars: {
      type: ["array", "null"],
      description: "Scenario variables configuration",
    },
    seed: {
      type: ["number", "null"],
      description: "Random seed for simulation",
    },
    runs: {
      type: ["number", "null"],
      description: "Number of simulation runs",
      minimum: 100,
      maximum: 100000,
    },
    utilityParams: {
      type: ["object", "null"],
      description: "Utility function parameters",
    },
    tcorParams: {
      type: ["object", "null"],
      description: "TCOR parameters",
    },
    gameConfig: {
      type: ["object", "null"],
      description: "Game theory configuration",
    },
    optionStrategies: {
      type: ["array", "null"],
      description: "Option strategies for game theory",
    },
    dependenceConfig: {
      type: ["object", "null"],
      description: "Dependence configuration",
    },
    bayesianOverride: {
      type: ["object", "null"],
      description: "Bayesian override configuration",
    },
    copulaConfig: {
      type: ["object", "null"],
      description: "Copula matrix configuration",
    },
  },
  additionalProperties: false,
};

/**
 * TypeScript type derived from schema
 */
export type DecisionSchemaType = {
  id: string;
  tenantId: string;
  title: string;
  description?: string | null;
  status: "draft" | "analyzing" | "deciding" | "closed";
  chosenOptionId?: string | null;
  options: Array<{
    id: string;
    label: string;
    score?: number | null;
  }>;
  linked_signals?: Array<{
    signal_id: string;
    variable_name: string;
    direction: "positive" | "negative";
    sensitivity: number;
    signal_label?: string | null;
    last_value?: number | null;
    last_updated?: number | null;
  }> | null;
  incident_impact?: Array<{
    incident_id: string;
    incident_title: string;
    incident_type: string;
    severity: string;
    affected_signals: string[];
    impact_timestamp: number;
    impact_description: string;
    estimated_effect?: {
      metric: string;
      change_percent: number;
    } | null;
    resolution_status: string;
    resolution_date?: number | null;
    notes?: string | null;
  }> | null;
  createdAt: number;
  closedAt?: number | null;
  closedBy?: string | null;
  portfolio_id?: string | null;
  metrics?: {
    raroc?: number | null;
    ev?: number | null;
    var95?: number | null;
    cvar95?: number | null;
    ce?: number | null;
    tcor?: number | null;
  } | null;
  basisAtClose?: "RAROC" | "CE" | null;
  horizonMonthsAtClose?: number | null;
  achievedSpearmanAtClose?: number | null;
  bayesAtClose?: {
    varKey: string;
    muN: number;
    sigmaN: number;
    applied: boolean;
  } | null;
  copulaFroErrAtClose?: number | null;
  criticalOpenAtClose?: number | null;
  lockedAssumptions?: Array<{
    id: string;
    scope: "decision" | "option" | "variable";
    statement: string;
    status: "open" | "validated" | "invalidated";
    critical: boolean;
    lockedAt: string;
  }> | null;
  topSensitiveFactors?: Array<{
    paramName: string;
    impact: number;
  }> | null;
  creditRiskScore?: number | null;
  last_refreshed_at?: number | null;
  simulationResults?: any[] | null;
  scenarioVars?: any[] | null;
  seed?: number | null;
  runs?: number | null;
  utilityParams?: any | null;
  tcorParams?: any | null;
  gameConfig?: any | null;
  optionStrategies?: any[] | null;
  dependenceConfig?: any | null;
  bayesianOverride?: any | null;
  copulaConfig?: any | null;
};

/**
 * Validate decision against schema
 */
export function validateDecision(decision: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!decision.id) errors.push("id is required");
  if (!decision.tenantId) errors.push("tenantId is required");
  if (!decision.title) errors.push("title is required");
  if (!decision.status) errors.push("status is required");
  if (!decision.options || !Array.isArray(decision.options))
    errors.push("options array is required");
  if (!decision.createdAt) errors.push("createdAt is required");

  // Status validation
  if (
    decision.status &&
    !["draft", "analyzing", "deciding", "closed"].includes(decision.status)
  ) {
    errors.push("status must be one of: draft, analyzing, deciding, closed");
  }

  // Closed decision validation
  if (decision.status === "closed") {
    if (!decision.chosenOptionId)
      errors.push("chosenOptionId is required when status is closed");
    if (!decision.closedAt)
      errors.push("closedAt is required when status is closed");
    if (!decision.closedBy)
      errors.push("closedBy is required when status is closed");
  }

  // Options validation
  if (Array.isArray(decision.options)) {
    if (decision.options.length === 0) {
      errors.push("options array must have at least one option");
    }
    decision.options.forEach((opt: any, idx: number) => {
      if (!opt.id) errors.push(`options[${idx}].id is required`);
      if (!opt.label) errors.push(`options[${idx}].label is required`);
    });
  }

  // Tenant ID format
  if (decision.tenantId && !decision.tenantId.startsWith("t-")) {
    errors.push("tenantId must start with 't-'");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
