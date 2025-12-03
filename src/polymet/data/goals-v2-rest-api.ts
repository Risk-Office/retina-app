/**
 * REST API for Goals & Objectives v2
 * All endpoints validate against goal_v2.json & stakeholder_v2.json schemas
 */

import {
  validateGoalV2,
  validateStakeholderV2,
  type GoalV2,
  type StakeholderV2,
  type KPI,
  type GoalOwner,
} from "@/polymet/data/goal-v2-schema";
import { validateStakeholderV2 as validateStakeholder } from "@/polymet/data/stakeholder-v2-schema";

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GoalQueryParams {
  category?: string;
  stakeholder_id?: string;
  status?: string;
  time_horizon?: string;
  q?: string;
}

export interface DependencyGraphNode {
  id: string;
  statement: string;
  category: string;
  status: string;
  dependencies: {
    depends_on: string[];
    enables: string[];
  };
}

// ============================================================================
// GOALS ENDPOINTS
// ============================================================================

/**
 * POST /v2/goals
 * Create a new goal with SMART validation
 */
export async function createGoal(
  goal: Omit<GoalV2, "id" | "created_at" | "updated_at">,
  tenantId: string,
  userId: string
): Promise<ApiResponse<GoalV2>> {
  try {
    // Validate SMART criteria
    const validation = validateGoalV2(goal as GoalV2);
    if (!validation.valid) {
      return {
        success: false,
        error: `SMART validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Create goal with generated ID
    const newGoal: GoalV2 = {
      ...goal,
      id: crypto.randomUUID(),
      created_at: Date.now(),
      updated_at: Date.now(),
      created_by: userId,
      updated_by: userId,
    };

    // TODO: Insert into database
    // await db.query('INSERT INTO goals_v2 ...');

    return {
      success: true,
      data: newGoal,
      message: "Goal created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create goal",
    };
  }
}

/**
 * GET /v2/goals?category=&stakeholder_id=&status=&time_horizon=&q=
 * List goals with filtering
 */
export async function listGoals(
  params: GoalQueryParams,
  tenantId: string
): Promise<ApiResponse<GoalV2[]>> {
  try {
    // TODO: Query database with filters
    // const query = buildGoalsQuery(params, tenantId);
    // const goals = await db.query(query);

    const goals: GoalV2[] = []; // Placeholder

    return {
      success: true,
      data: goals,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list goals",
    };
  }
}

/**
 * GET /v2/goals/{id}
 * Get a single goal with all relationships
 */
export async function getGoal(
  goalId: string,
  tenantId: string
): Promise<ApiResponse<GoalV2>> {
  try {
    // TODO: Query database with JOINs for KPIs, owners, dependencies, tags
    // const goal = await db.query('SELECT ... FROM goals_v2 WHERE id = ? AND tenant_id = ?');

    return {
      success: true,
      data: {} as GoalV2, // Placeholder
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get goal",
    };
  }
}

/**
 * PATCH /v2/goals/{id}
 * Update goal (merges arrays)
 */
export async function updateGoal(
  goalId: string,
  updates: Partial<GoalV2>,
  tenantId: string,
  userId: string
): Promise<ApiResponse<GoalV2>> {
  try {
    // Fetch existing goal
    const existing = await getGoal(goalId, tenantId);
    if (!existing.success || !existing.data) {
      return { success: false, error: "Goal not found" };
    }

    // Merge arrays (kpis, owners, related_stakeholders, tags, dependencies)
    const merged: GoalV2 = {
      ...existing.data,
      ...updates,
      kpis: updates.kpis
        ? [...(existing.data.kpis || []), ...updates.kpis]
        : existing.data.kpis,
      tags: updates.tags
        ? [...new Set([...(existing.data.tags || []), ...updates.tags])]
        : existing.data.tags,
      updated_at: Date.now(),
      updated_by: userId,
    };

    // Validate after merge
    const validation = validateGoalV2(merged);
    if (!validation.valid) {
      return {
        success: false,
        error: `SMART validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // TODO: Update database
    // await db.query('UPDATE goals_v2 SET ... WHERE id = ? AND tenant_id = ?');

    return {
      success: true,
      data: merged,
      message: "Goal updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update goal",
    };
  }
}

/**
 * POST /v2/goals/{id}/owners
 * Add owners to a goal
 */
export async function addGoalOwners(
  goalId: string,
  owners: GoalOwner[],
  tenantId: string
): Promise<ApiResponse<GoalOwner[]>> {
  try {
    // Validate stakeholder IDs exist
    for (const owner of owners) {
      // TODO: Check stakeholder exists
      // const exists = await db.query('SELECT 1 FROM stakeholders_v2 WHERE id = ?');
    } // TODO: Insert into goal_owners_v2
    // await db.query('INSERT INTO goal_owners_v2 (goal_id, stakeholder_id, role) VALUES ...');
    return {
      success: true,
      data: owners,
      message: "Owners added successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add owners",
    };
  }
}

/**
 * POST /v2/goals/{id}/dependencies
 * Add dependencies (with cycle detection)
 */
export async function addGoalDependencies(
  goalId: string,
  dependencies: { depends_on?: string[]; enables?: string[] },
  tenantId: string
): Promise<ApiResponse<{ depends_on: string[]; enables: string[] }>> {
  try {
    // Check for cycles
    for (const depId of dependencies.depends_on || []) {
      // TODO: Call check_goal_dependency_cycle function
      // const hasCycle = await db.query('SELECT check_goal_dependency_cycle(?, ?)', [goalId, depId]);
      const hasCycle = false; // Placeholder

      if (hasCycle) {
        return {
          success: false,
          error: `Adding dependency to goal ${depId} would create a circular dependency. Please review your goal relationships.`,
        };
      }
    }

    // TODO: Insert dependencies
    // await db.query('INSERT INTO goal_dependencies_v2 ...');

    return {
      success: true,
      data: dependencies,
      message: "Dependencies added successfully",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add dependencies",
    };
  }
}

/**
 * GET /v2/goals/dependency-graph
 * Get full dependency graph for visualization
 */
export async function getDependencyGraph(
  tenantId: string
): Promise<ApiResponse<DependencyGraphNode[]>> {
  try {
    // TODO: Query all goals with their dependencies
    // const graph = await db.query(`
    //   SELECT g.id, g.statement, g.category, g.status,
    //          array_agg(DISTINCT gd1.depends_on_goal_id) as depends_on,
    //          array_agg(DISTINCT gd2.enables_goal_id) as enables
    //   FROM goals_v2 g
    //   LEFT JOIN goal_dependencies_v2 gd1 ON g.id = gd1.goal_id AND gd1.depends_on_goal_id IS NOT NULL
    //   LEFT JOIN goal_dependencies_v2 gd2 ON g.id = gd2.goal_id AND gd2.enables_goal_id IS NOT NULL
    //   WHERE g.tenant_id = ?
    //   GROUP BY g.id
    // `);

    const graph: DependencyGraphNode[] = []; // Placeholder

    return {
      success: true,
      data: graph,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get dependency graph",
    };
  }
}

// ============================================================================
// STAKEHOLDERS ENDPOINTS
// ============================================================================

/**
 * POST /v2/stakeholders
 * Create a new stakeholder
 */
export async function createStakeholder(
  stakeholder: Omit<StakeholderV2, "id" | "created_at" | "updated_at">,
  tenantId: string
): Promise<ApiResponse<StakeholderV2>> {
  try {
    const validation = validateStakeholder(stakeholder as StakeholderV2);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }

    const newStakeholder: StakeholderV2 = {
      ...stakeholder,
      id: crypto.randomUUID(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    // TODO: Insert into database
    // await db.query('INSERT INTO stakeholders_v2 ...');

    return {
      success: true,
      data: newStakeholder,
      message: "Stakeholder created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create stakeholder",
    };
  }
}

/**
 * GET /v2/stakeholders?q=&group=
 * List stakeholders with filtering
 */
export async function listStakeholders(
  params: { q?: string; group?: string },
  tenantId: string
): Promise<ApiResponse<StakeholderV2[]>> {
  try {
    // TODO: Query database with filters
    // const stakeholders = await db.query('SELECT * FROM stakeholders_v2 WHERE tenant_id = ? ...');

    const stakeholders: StakeholderV2[] = []; // Placeholder

    return {
      success: true,
      data: stakeholders,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list stakeholders",
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build SQL query with filters
 */
function buildGoalsQuery(params: GoalQueryParams, tenantId: string): string {
  const conditions = [`tenant_id = '${tenantId}'`];

  if (params.category) conditions.push(`category = '${params.category}'`);
  if (params.status) conditions.push(`status = '${params.status}'`);
  if (params.time_horizon)
    conditions.push(`time_horizon = '${params.time_horizon}'`);
  if (params.q) conditions.push(`statement ILIKE '%${params.q}%'`);
  if (params.stakeholder_id) {
    conditions.push(`id IN (
      SELECT goal_id FROM goal_owners_v2 WHERE stakeholder_id = '${params.stakeholder_id}'
    )`);
  }

  return `SELECT * FROM goals_v2 WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
}

export const API_ROUTES = {
  goals: {
    create: "POST /v2/goals",
    list: "GET /v2/goals",
    get: "GET /v2/goals/:id",
    update: "PATCH /v2/goals/:id",
    addOwners: "POST /v2/goals/:id/owners",
    addDependencies: "POST /v2/goals/:id/dependencies",
    dependencyGraph: "GET /v2/goals/dependency-graph",
  },
  stakeholders: {
    create: "POST /v2/stakeholders",
    list: "GET /v2/stakeholders",
  },
};
