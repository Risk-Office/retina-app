/**
 * # Simulation Snapshot JSON Schema
 *
 * JSON Schema definition for SimulationSnapshot entity.
 * Captures complete simulation state including metrics, copula preview,
 * assumptions snapshot, sensitivity baseline, and run fingerprint.
 */

export const SimulationSnapshotSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://retina.ai/schemas/simulation-snapshot.json",
  title: "SimulationSnapshot",
  description:
    "A snapshot of simulation results with complete configuration and metrics",
  type: "object",
  required: [
    "runId",
    "decisionId",
    "tenantId",
    "seed",
    "runs",
    "timestamp",
    "metricsByOption",
  ],

  properties: {
    runId: {
      type: "string",
      description: "Unique run identifier (fingerprint)",
      pattern: "^run-[a-f0-9]{64}$",
    },
    decisionId: {
      type: "string",
      description: "Associated decision ID",
    },
    tenantId: {
      type: "string",
      description: "Tenant identifier",
      pattern: "^t-[a-zA-Z0-9-_]+$",
    },
    seed: {
      type: "number",
      description: "Random seed used for simulation",
      minimum: 0,
    },
    runs: {
      type: "number",
      description: "Number of Monte Carlo runs",
      minimum: 100,
      maximum: 100000,
    },
    timestamp: {
      type: "number",
      description: "Snapshot creation timestamp (Unix milliseconds)",
      minimum: 0,
    },
    achievedSpearman: {
      type: ["number", "null"],
      description: "Achieved Spearman rank correlation",
      minimum: -1,
      maximum: 1,
    },
    bayes: {
      type: ["object", "null"],
      description: "Bayesian prior configuration",
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
          minimum: 0,
        },
        applied: {
          type: "boolean",
          description: "Whether Bayesian override was applied",
        },
      },
      required: ["varKey", "muN", "sigmaN", "applied"],
    },
    assumptions: {
      type: ["object", "null"],
      description: "Assumptions snapshot at time of simulation",
      properties: {
        count: {
          type: "number",
          description: "Total number of assumptions",
          minimum: 0,
        },
        criticalOpen: {
          type: "number",
          description: "Number of critical open assumptions",
          minimum: 0,
        },
        list: {
          type: "array",
          description: "List of assumptions",
          items: {
            type: "object",
            required: ["id", "scope", "statement", "status"],
            properties: {
              id: {
                type: "string",
                description: "Assumption identifier",
              },
              scope: {
                type: "string",
                enum: ["decision", "option", "variable"],
                description: "Assumption scope",
              },
              statement: {
                type: "string",
                description: "Assumption statement",
                maxLength: 1000,
              },
              status: {
                type: "string",
                enum: ["open", "validated", "invalidated"],
                description: "Assumption status",
              },
            },
          },
        },
      },
      required: ["count", "criticalOpen", "list"],
    },
    copula: {
      type: ["object", "null"],
      description: "Copula matrix configuration and preview",
      properties: {
        k: {
          type: "number",
          description: "Matrix dimension (number of variables)",
          minimum: 2,
        },
        targetSet: {
          type: "boolean",
          description: "Whether target correlation matrix was set",
        },
        froErr: {
          type: ["number", "null"],
          description: "Frobenius error (distance from target)",
          minimum: 0,
        },
        achievedPreview: {
          type: ["array", "null"],
          description: "3x3 preview of achieved correlation matrix",
          items: {
            type: "array",
            items: {
              type: "number",
              minimum: -1,
              maximum: 1,
            },
            minItems: 3,
            maxItems: 3,
          },
          minItems: 3,
          maxItems: 3,
        },
      },
      required: ["k", "targetSet"],
    },
    horizonMonths: {
      type: ["number", "null"],
      description: "Planning horizon in months",
      minimum: 1,
      maximum: 240,
    },
    sensitivityBaseline: {
      type: ["object", "null"],
      description: "Baseline for sensitivity analysis",
      properties: {
        basis: {
          type: "string",
          enum: ["RAROC", "CE"],
          description: "Metric used as basis for sensitivity",
        },
        optionId: {
          type: "string",
          description: "Option ID used as baseline",
        },
      },
      required: ["basis", "optionId"],
    },
    metricsByOption: {
      type: "object",
      description: "Metrics keyed by option ID",
      patternProperties: {
        "^.*$": {
          type: "object",
          required: [
            "optionLabel",
            "ev",
            "var95",
            "cvar95",
            "economicCapital",
            "raroc",
          ],

          properties: {
            optionLabel: {
              type: "string",
              description: "Human-readable option label",
            },
            ev: {
              type: "number",
              description: "Expected Value",
            },
            var95: {
              type: "number",
              description: "Value at Risk (95%)",
            },
            cvar95: {
              type: "number",
              description: "Conditional Value at Risk (95%)",
            },
            economicCapital: {
              type: "number",
              description: "Economic Capital requirement",
              minimum: 0,
            },
            raroc: {
              type: "number",
              description: "Risk-Adjusted Return on Capital",
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
      },
      minProperties: 1,
    },
  },
  additionalProperties: false,
};

/**
 * TypeScript type derived from schema
 */
export type SimulationSnapshotSchemaType = {
  runId: string;
  decisionId: string;
  tenantId: string;
  seed: number;
  runs: number;
  timestamp: number;
  achievedSpearman?: number | null;
  bayes?: {
    varKey: string;
    muN: number;
    sigmaN: number;
    applied: boolean;
  } | null;
  assumptions?: {
    count: number;
    criticalOpen: number;
    list: Array<{
      id: string;
      scope: "decision" | "option" | "variable";
      statement: string;
      status: "open" | "validated" | "invalidated";
    }>;
  } | null;
  copula?: {
    k: number;
    targetSet: boolean;
    froErr?: number | null;
    achievedPreview?: number[][] | null;
  } | null;
  horizonMonths?: number | null;
  sensitivityBaseline?: {
    basis: "RAROC" | "CE";
    optionId: string;
  } | null;
  metricsByOption: Record<
    string,
    {
      optionLabel: string;
      ev: number;
      var95: number;
      cvar95: number;
      economicCapital: number;
      raroc: number;
      ce?: number | null;
      tcor?: number | null;
    }
  >;
};

/**
 * Validate simulation snapshot against schema
 */
export function validateSimulationSnapshot(snapshot: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!snapshot.runId) errors.push("runId is required");
  if (!snapshot.decisionId) errors.push("decisionId is required");
  if (!snapshot.tenantId) errors.push("tenantId is required");
  if (snapshot.seed === undefined || snapshot.seed === null)
    errors.push("seed is required");
  if (!snapshot.runs) errors.push("runs is required");
  if (!snapshot.timestamp) errors.push("timestamp is required");
  if (!snapshot.metricsByOption) errors.push("metricsByOption is required");

  // RunId format validation
  if (snapshot.runId && !snapshot.runId.startsWith("run-")) {
    errors.push("runId must start with 'run-'");
  }

  // Tenant ID format
  if (snapshot.tenantId && !snapshot.tenantId.startsWith("t-")) {
    errors.push("tenantId must start with 't-'");
  }

  // Runs validation
  if (snapshot.runs && (snapshot.runs < 100 || snapshot.runs > 100000)) {
    errors.push("runs must be between 100 and 100000");
  }

  // Spearman validation
  if (
    snapshot.achievedSpearman !== null &&
    snapshot.achievedSpearman !== undefined
  ) {
    if (snapshot.achievedSpearman < -1 || snapshot.achievedSpearman > 1) {
      errors.push("achievedSpearman must be between -1 and 1");
    }
  }

  // Bayes validation
  if (snapshot.bayes) {
    if (!snapshot.bayes.varKey) errors.push("bayes.varKey is required");
    if (snapshot.bayes.muN === undefined) errors.push("bayes.muN is required");
    if (snapshot.bayes.sigmaN === undefined)
      errors.push("bayes.sigmaN is required");
    if (snapshot.bayes.applied === undefined)
      errors.push("bayes.applied is required");
    if (snapshot.bayes.sigmaN < 0)
      errors.push("bayes.sigmaN must be non-negative");
  }

  // Assumptions validation
  if (snapshot.assumptions) {
    if (snapshot.assumptions.count === undefined)
      errors.push("assumptions.count is required");
    if (snapshot.assumptions.criticalOpen === undefined)
      errors.push("assumptions.criticalOpen is required");
    if (!Array.isArray(snapshot.assumptions.list))
      errors.push("assumptions.list must be an array");
  }

  // Copula validation
  if (snapshot.copula) {
    if (!snapshot.copula.k) errors.push("copula.k is required");
    if (snapshot.copula.targetSet === undefined)
      errors.push("copula.targetSet is required");
    if (snapshot.copula.k < 2) errors.push("copula.k must be at least 2");
    if (
      snapshot.copula.froErr !== null &&
      snapshot.copula.froErr !== undefined
    ) {
      if (snapshot.copula.froErr < 0)
        errors.push("copula.froErr must be non-negative");
    }
  }

  // MetricsByOption validation
  if (snapshot.metricsByOption) {
    if (typeof snapshot.metricsByOption !== "object") {
      errors.push("metricsByOption must be an object");
    } else {
      const optionIds = Object.keys(snapshot.metricsByOption);
      if (optionIds.length === 0) {
        errors.push("metricsByOption must have at least one option");
      }
      optionIds.forEach((optionId) => {
        const metrics = snapshot.metricsByOption[optionId];
        if (!metrics.optionLabel)
          errors.push(`metricsByOption[${optionId}].optionLabel is required`);
        if (metrics.ev === undefined)
          errors.push(`metricsByOption[${optionId}].ev is required`);
        if (metrics.var95 === undefined)
          errors.push(`metricsByOption[${optionId}].var95 is required`);
        if (metrics.cvar95 === undefined)
          errors.push(`metricsByOption[${optionId}].cvar95 is required`);
        if (metrics.economicCapital === undefined)
          errors.push(
            `metricsByOption[${optionId}].economicCapital is required`
          );
        if (metrics.raroc === undefined)
          errors.push(`metricsByOption[${optionId}].raroc is required`);
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate run fingerprint from simulation configuration
 */
export function generateRunFingerprint(config: {
  decisionId: string;
  seed: number;
  runs: number;
  scenarioVars?: any[];
  utilityParams?: any;
  tcorParams?: any;
  gameConfig?: any;
  dependenceConfig?: any;
  bayesianOverride?: any;
  copulaConfig?: any;
}): string {
  // In a real implementation, this would use crypto.subtle.digest
  // For now, we'll create a deterministic hash-like string
  const configStr = JSON.stringify(config);
  let hash = 0;
  for (let i = 0; i < configStr.length; i++) {
    const char = configStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Create a 64-character hex string
  const hashStr = Math.abs(hash).toString(16).padStart(16, "0");
  const fingerprint = hashStr.repeat(4).substring(0, 64);

  return `run-${fingerprint}`;
}
