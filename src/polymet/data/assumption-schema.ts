/**
 * # Assumption JSON Schema
 *
 * JSON Schema definition for Assumption entity.
 * Tracks assumptions with scope, status, critical flag, and timestamps.
 */

export const AssumptionSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://retina.ai/schemas/assumption.json",
  title: "Assumption",
  description: "An assumption with scope, status, and criticality tracking",
  type: "object",
  required: [
    "id",
    "decisionId",
    "tenantId",
    "scope",
    "statement",
    "confidence",
    "critical",
    "status",
    "createdAt",
    "updatedAt",
  ],

  properties: {
    id: {
      type: "string",
      description: "Unique assumption identifier",
      pattern: "^asmp-[a-zA-Z0-9-_]+$",
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
    scope: {
      type: "string",
      description: "Assumption scope",
      enum: ["decision", "option", "variable"],
    },
    linkId: {
      type: ["string", "null"],
      description: "Optional link to option or variable ID",
    },
    statement: {
      type: "string",
      description: "Assumption statement",
      minLength: 1,
      maxLength: 1000,
    },
    evidenceUrl: {
      type: ["string", "null"],
      description: "Optional link to supporting evidence",
      format: "uri",
    },
    confidence: {
      type: "number",
      description: "Confidence level: 0=low, 1=medium, 2=high",
      enum: [0, 1, 2],
    },
    critical: {
      type: "boolean",
      description: "Whether assumption is critical (gates decision closure)",
    },
    owner: {
      type: ["string", "null"],
      description: "Assumption owner",
      maxLength: 200,
    },
    reviewBy: {
      type: ["string", "null"],
      description: "Review deadline (ISO date)",
      format: "date",
    },
    status: {
      type: "string",
      description: "Assumption status",
      enum: ["open", "validated", "invalidated"],
    },
    createdAt: {
      type: "string",
      description: "Creation timestamp (ISO 8601)",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      description: "Last update timestamp (ISO 8601)",
      format: "date-time",
    },
    validatedAt: {
      type: ["string", "null"],
      description: "Validation timestamp (ISO 8601)",
      format: "date-time",
    },
    validatedBy: {
      type: ["string", "null"],
      description: "User who validated the assumption",
      maxLength: 200,
    },
    notes: {
      type: ["string", "null"],
      description: "Additional notes",
      maxLength: 2000,
    },
  },
  additionalProperties: false,
};

/**
 * TypeScript type derived from schema
 */
export type AssumptionSchemaType = {
  id: string;
  decisionId: string;
  tenantId: string;
  scope: "decision" | "option" | "variable";
  linkId?: string | null;
  statement: string;
  evidenceUrl?: string | null;
  confidence: 0 | 1 | 2;
  critical: boolean;
  owner?: string | null;
  reviewBy?: string | null;
  status: "open" | "validated" | "invalidated";
  createdAt: string;
  updatedAt: string;
  validatedAt?: string | null;
  validatedBy?: string | null;
  notes?: string | null;
};

/**
 * Validate assumption against schema
 */
export function validateAssumption(assumption: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!assumption.id) errors.push("id is required");
  if (!assumption.decisionId) errors.push("decisionId is required");
  if (!assumption.tenantId) errors.push("tenantId is required");
  if (!assumption.scope) errors.push("scope is required");
  if (!assumption.statement) errors.push("statement is required");
  if (assumption.confidence === undefined || assumption.confidence === null)
    errors.push("confidence is required");
  if (assumption.critical === undefined || assumption.critical === null)
    errors.push("critical is required");
  if (!assumption.status) errors.push("status is required");
  if (!assumption.createdAt) errors.push("createdAt is required");
  if (!assumption.updatedAt) errors.push("updatedAt is required");

  // ID format validation
  if (assumption.id && !assumption.id.startsWith("asmp-")) {
    errors.push("id must start with 'asmp-'");
  }

  // Tenant ID format
  if (assumption.tenantId && !assumption.tenantId.startsWith("t-")) {
    errors.push("tenantId must start with 't-'");
  }

  // Scope validation
  if (
    assumption.scope &&
    !["decision", "option", "variable"].includes(assumption.scope)
  ) {
    errors.push("scope must be one of: decision, option, variable");
  }

  // Statement length validation
  if (assumption.statement) {
    if (assumption.statement.length === 0) {
      errors.push("statement cannot be empty");
    }
    if (assumption.statement.length > 1000) {
      errors.push("statement must be 1000 characters or less");
    }
  }

  // Confidence validation
  if (
    assumption.confidence !== undefined &&
    assumption.confidence !== null &&
    ![0, 1, 2].includes(assumption.confidence)
  ) {
    errors.push("confidence must be 0, 1, or 2");
  }

  // Status validation
  if (
    assumption.status &&
    !["open", "validated", "invalidated"].includes(assumption.status)
  ) {
    errors.push("status must be one of: open, validated, invalidated");
  }

  // Date format validation (basic check)
  if (assumption.createdAt) {
    try {
      new Date(assumption.createdAt);
    } catch {
      errors.push("createdAt must be a valid ISO 8601 date");
    }
  }

  if (assumption.updatedAt) {
    try {
      new Date(assumption.updatedAt);
    } catch {
      errors.push("updatedAt must be a valid ISO 8601 date");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get confidence label
 */
export function getConfidenceLabel(confidence: 0 | 1 | 2): string {
  const labels = {
    0: "Low",
    1: "Medium",
    2: "High",
  };
  return labels[confidence];
}

/**
 * Get confidence color
 */
export function getConfidenceColor(confidence: 0 | 1 | 2): string {
  const colors = {
    0: "text-red-600 dark:text-red-400",
    1: "text-yellow-600 dark:text-yellow-400",
    2: "text-green-600 dark:text-green-400",
  };
  return colors[confidence];
}

/**
 * Get status color
 */
export function getStatusColor(
  status: "open" | "validated" | "invalidated"
): string {
  const colors = {
    open: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    validated:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    invalidated:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  };
  return colors[status];
}

/**
 * Get scope label
 */
export function getScopeLabel(
  scope: "decision" | "option" | "variable"
): string {
  const labels = {
    decision: "Decision-level",
    option: "Option-specific",
    variable: "Variable-specific",
  };
  return labels[scope];
}
