/**
 * Goal v2 Schema
 *
 * Authoritative schema for organizational goals and objectives.
 * Enforces SMART criteria and provides comprehensive goal management.
 */

export type GoalCategory =
  | "Financial"
  | "Operational"
  | "Strategic"
  | "Compliance & Regulatory"
  | "People & Culture"
  | "Resilience & Continuity"
  | "Technology & Digital"
  | "Sustainability & ESG"
  | "Customer & Market"
  | "Innovation & Learning";

export type KPIDirection = "higher_is_better" | "lower_is_better" | "range";

export type MeasurementFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually";

export type TimeHorizon = "short_term" | "mid_term" | "long_term";

export type TimeUnit = "days" | "weeks" | "months" | "quarters" | "years";

export interface TimeHorizonDetail {
  value: number;
  unit: TimeUnit;
  category: TimeHorizon; // Auto-computed based on value and unit
}

export type GoalStatus = "draft" | "active" | "paused" | "retired";

export type StakeholderRole = "owner" | "co_owner" | "contributor" | "consumer";

export interface KPI {
  id?: string;
  name: string;
  unit?: string;
  target?: number;
  range_min?: number;
  range_max?: number;
  direction: KPIDirection;
  measurement_freq: MeasurementFrequency;
}

export interface GoalOwner {
  stakeholder_id: string; // uuid
  role: StakeholderRole;
}

export interface GoalDependencies {
  depends_on: string[]; // uuid[]
  enables: string[]; // uuid[]
}

export interface GoalV2 {
  id: string; // uuid
  category: GoalCategory;
  statement: string; // 10-600 chars, SMART-validated
  description?: string;
  kpis: KPI[];
  priority: 1 | 2 | 3 | 4 | 5;
  time_horizon: TimeHorizon;
  time_horizon_detail?: TimeHorizonDetail; // Optional detailed time horizon
  owners: GoalOwner[];
  related_stakeholders: string[]; // uuid[]
  dependencies: GoalDependencies;
  tags: string[];
  status: GoalStatus;
  created_at: number; // timestamp
  updated_at: number; // timestamp
  created_by: string; // user id
  updated_by: string; // user id
}

/**
 * SMART Validation Rules
 */
export interface SMARTValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSMARTGoal(
  goal: Partial<GoalV2>
): SMARTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Statement length check (10-600 chars)
  if (!goal.statement || goal.statement.length < 10) {
    errors.push("Statement must be at least 10 characters long");
  }
  if (goal.statement && goal.statement.length > 600) {
    errors.push("Statement must not exceed 600 characters");
  }

  // At least 1 KPI with target or range
  if (!goal.kpis || goal.kpis.length === 0) {
    errors.push("At least one KPI is required");
  } else {
    const hasValidKPI = goal.kpis.some(
      (kpi) =>
        kpi.target !== undefined ||
        (kpi.range_min !== undefined && kpi.range_max !== undefined)
    );
    if (!hasValidKPI) {
      errors.push(
        "At least one KPI must have a target or range (range_min & range_max)"
      );
    }

    // Validate range KPIs
    goal.kpis.forEach((kpi, index) => {
      if (kpi.direction === "range") {
        if (kpi.range_min === undefined || kpi.range_max === undefined) {
          errors.push(
            `KPI "${kpi.name}" has direction "range" but missing range_min or range_max`
          );
        } else if (kpi.range_min >= kpi.range_max) {
          errors.push(
            `KPI "${kpi.name}" range_min must be less than range_max`
          );
        }
      }
    });
  }

  // At least 1 owner
  if (!goal.owners || goal.owners.length === 0) {
    errors.push("At least one owner is required");
  } else {
    const hasOwner = goal.owners.some(
      (o) => o.role === "owner" || o.role === "co_owner"
    );
    if (!hasOwner) {
      warnings.push(
        "No owner or co_owner assigned (only contributors/consumers)"
      );
    }
  }

  // Time horizon must be set
  if (!goal.time_horizon) {
    errors.push("Time horizon must be set");
  }

  // Validate time_horizon_detail if provided
  if (goal.time_horizon_detail) {
    if (
      !goal.time_horizon_detail.value ||
      goal.time_horizon_detail.value <= 0
    ) {
      errors.push("Time horizon value must be greater than 0");
    }
    if (!goal.time_horizon_detail.unit) {
      errors.push("Time horizon unit must be specified");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Goal v2 Schema Registry
 */
export const GOAL_V2_SCHEMA_VERSION = "2.0.0";

export const GOAL_V2_SCHEMA = {
  version: GOAL_V2_SCHEMA_VERSION,
  name: "goal_v2",
  description:
    "Authoritative schema for organizational goals and objectives with SMART validation",
  enforces_smart: true,
  created_at: Date.now(),
};

/**
 * LocalStorage key for goals
 */
export const GOALS_V2_STORAGE_KEY = "retina_goals_v2";

/**
 * Load goals from localStorage
 */
export function loadGoalsV2(tenantId: string): GoalV2[] {
  try {
    const stored = localStorage.getItem(`${GOALS_V2_STORAGE_KEY}_${tenantId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load goals v2:", error);
    return [];
  }
}

/**
 * Save goals to localStorage
 */
export function saveGoalsV2(tenantId: string, goals: GoalV2[]): void {
  try {
    localStorage.setItem(
      `${GOALS_V2_STORAGE_KEY}_${tenantId}`,
      JSON.stringify(goals)
    );
  } catch (error) {
    console.error("Failed to save goals v2:", error);
  }
}

/**
 * Create a new goal with defaults
 */
export function createGoalV2(partial: Partial<GoalV2>, userId: string): GoalV2 {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    category: partial.category || "Strategic",
    statement: partial.statement || "",
    description: partial.description,
    kpis: partial.kpis || [],
    priority: partial.priority || 3,
    time_horizon: partial.time_horizon || "mid_term",
    owners: partial.owners || [],
    related_stakeholders: partial.related_stakeholders || [],
    dependencies: partial.dependencies || { depends_on: [], enables: [] },
    tags: partial.tags || [],
    status: partial.status || "draft",
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
  };
}

/**
 * Update an existing goal
 */
export function updateGoalV2(
  goal: GoalV2,
  updates: Partial<GoalV2>,
  userId: string
): GoalV2 {
  return {
    ...goal,
    ...updates,
    id: goal.id, // Prevent ID change
    created_at: goal.created_at, // Prevent created_at change
    created_by: goal.created_by, // Prevent created_by change
    updated_at: Date.now(),
    updated_by: userId,
  };
}

/**
 * Get goal by ID
 */
export function getGoalV2ById(
  tenantId: string,
  goalId: string
): GoalV2 | undefined {
  const goals = loadGoalsV2(tenantId);
  return goals.find((g) => g.id === goalId);
}

/**
 * Delete goal
 */
export function deleteGoalV2(tenantId: string, goalId: string): void {
  const goals = loadGoalsV2(tenantId);
  const filtered = goals.filter((g) => g.id !== goalId);
  saveGoalsV2(tenantId, filtered);
}

/**
 * Get goals by category
 */
export function getGoalsByCategory(
  tenantId: string,
  category: GoalCategory
): GoalV2[] {
  const goals = loadGoalsV2(tenantId);
  return goals.filter((g) => g.category === category);
}

/**
 * Get goals by status
 */
export function getGoalsByStatus(
  tenantId: string,
  status: GoalStatus
): GoalV2[] {
  const goals = loadGoalsV2(tenantId);
  return goals.filter((g) => g.status === status);
}

/**
 * Get goals by stakeholder
 */
export function getGoalsByStakeholder(
  tenantId: string,
  stakeholderId: string
): GoalV2[] {
  const goals = loadGoalsV2(tenantId);
  return goals.filter(
    (g) =>
      g.owners.some((o) => o.stakeholder_id === stakeholderId) ||
      g.related_stakeholders.includes(stakeholderId)
  );
}

/**
 * Compute time horizon category based on value and unit
 * Short-term: <= 12 months
 * Mid-term: 12-36 months
 * Long-term: > 36 months
 */
export function computeTimeHorizonCategory(
  value: number,
  unit: TimeUnit
): TimeHorizon {
  // Convert to months
  let months = 0;
  switch (unit) {
    case "days":
      months = value / 30;
      break;
    case "weeks":
      months = value / 4;
      break;
    case "months":
      months = value;
      break;
    case "quarters":
      months = value * 3;
      break;
    case "years":
      months = value * 12;
      break;
  }

  if (months <= 12) return "short_term";
  if (months <= 36) return "mid_term";
  return "long_term";
}

/**
 * Format time horizon detail for display
 */
export function formatTimeHorizonDetail(detail: TimeHorizonDetail): string {
  return `${detail.value} ${detail.unit}`;
}

/**
 * Seed default goals for a tenant
 * This creates sample goals to demonstrate the system
 */
export function seedDefaultGoals(
  tenantId: string,
  stakeholders: { cfo?: string; coo?: string; ceo?: string; cro?: string }
): void {
  const existing = loadGoalsV2(tenantId);
  if (existing.length > 0) {
    return; // Already has goals
  }

  const now = Date.now();
  const userId = "system";

  const defaultGoals: GoalV2[] = [];

  // Financial Goal - Cash Buffer
  if (stakeholders.cfo) {
    defaultGoals.push({
      id: crypto.randomUUID(),
      category: "Financial",
      statement: "Maintain 6 months cash buffer by Q4",
      description:
        "Ensure sufficient cash reserves to cover 6 months of operational expenses as a financial safety net",
      kpis: [
        {
          id: crypto.randomUUID(),
          name: "Cash buffer days",
          unit: "days",
          target: 180,
          direction: "higher_is_better",
          measurement_freq: "monthly",
        },
      ],

      priority: 5,
      time_horizon: "mid_term",
      owners: [{ stakeholder_id: stakeholders.cfo, role: "owner" }],
      related_stakeholders: [],
      dependencies: { depends_on: [], enables: [] },
      tags: ["financial-stability", "cash-management"],
      status: "active",
      created_at: now,
      updated_at: now,
      created_by: userId,
      updated_by: userId,
    });
  }

  // Operational Goal - Cycle Time
  if (stakeholders.coo && defaultGoals.length > 0) {
    defaultGoals.push({
      id: crypto.randomUUID(),
      category: "Operational",
      statement: "Reduce order cycle time to ≤ 48h in 6 months",
      description:
        "Streamline order processing to achieve maximum 48-hour cycle time from order placement to fulfillment",
      kpis: [
        {
          id: crypto.randomUUID(),
          name: "Cycle time",
          unit: "hours",
          target: 48,
          direction: "lower_is_better",
          measurement_freq: "weekly",
        },
      ],

      priority: 3,
      time_horizon: "mid_term",
      owners: [{ stakeholder_id: stakeholders.coo, role: "owner" }],
      related_stakeholders: [],
      dependencies: { depends_on: [defaultGoals[0].id], enables: [] },
      tags: ["operational-efficiency", "process-improvement"],
      status: "active",
      created_at: now,
      updated_at: now,
      created_by: userId,
      updated_by: userId,
    });

    // Update the first goal's enables array
    defaultGoals[0].dependencies.enables.push(defaultGoals[1].id);
  }

  // Strategic Goal - Market Expansion
  if (stakeholders.ceo) {
    defaultGoals.push({
      id: crypto.randomUUID(),
      category: "Strategic",
      statement: "Expand into 3 new markets by end of year",
      description:
        "Identify and successfully launch operations in three new geographic or vertical markets to drive growth",
      kpis: [
        {
          id: crypto.randomUUID(),
          name: "New markets entered",
          unit: "markets",
          target: 3,
          direction: "higher_is_better",
          measurement_freq: "quarterly",
        },
        {
          id: crypto.randomUUID(),
          name: "Market revenue",
          unit: "USD",
          target: 500000,
          direction: "higher_is_better",
          measurement_freq: "quarterly",
        },
      ],

      priority: 2,
      time_horizon: "mid_term",
      owners: [{ stakeholder_id: stakeholders.ceo, role: "owner" }],
      related_stakeholders: stakeholders.cfo ? [stakeholders.cfo] : [],
      dependencies: { depends_on: [], enables: [] },
      tags: ["growth", "market-expansion", "strategic-initiative"],
      status: "active",
      created_at: now,
      updated_at: now,
      created_by: userId,
      updated_by: userId,
    });
  }

  // Compliance Goal
  if (stakeholders.cro) {
    defaultGoals.push({
      id: crypto.randomUUID(),
      category: "Compliance & Regulatory",
      statement: "Achieve 100% compliance audit score in annual review",
      description:
        "Maintain full compliance with all regulatory requirements and achieve perfect score in annual compliance audit",
      kpis: [
        {
          id: crypto.randomUUID(),
          name: "Compliance score",
          unit: "%",
          target: 100,
          direction: "higher_is_better",
          measurement_freq: "quarterly",
        },
        {
          id: crypto.randomUUID(),
          name: "Open findings",
          unit: "findings",
          target: 0,
          direction: "lower_is_better",
          measurement_freq: "monthly",
        },
      ],

      priority: 1,
      time_horizon: "short_term",
      owners: [{ stakeholder_id: stakeholders.cro, role: "owner" }],
      related_stakeholders: [],
      dependencies: { depends_on: [], enables: [] },
      tags: ["compliance", "audit", "regulatory"],
      status: "active",
      created_at: now,
      updated_at: now,
      created_by: userId,
      updated_by: userId,
    });
  }

  if (defaultGoals.length > 0) {
    saveGoalsV2(tenantId, defaultGoals);
  }
}
