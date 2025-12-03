import type { GoalV2 } from "@/polymet/data/goal-v2-schema";

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate a single goal object
 */
export function validateGoal(
  goal: Partial<GoalV2>,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!goal.statement || goal.statement.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "statement",
      message: "Goal statement is required and cannot be empty",
      value: goal.statement,
    });
  }

  if (!goal.category) {
    errors.push({
      row: rowIndex,
      field: "category",
      message: "Category is required",
      value: goal.category,
    });
  } else {
    const validCategories = [
      "strategic",
      "operational",
      "financial",
      "customer",
      "learning",
      "compliance",
    ];

    if (!validCategories.includes(goal.category)) {
      errors.push({
        row: rowIndex,
        field: "category",
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        value: goal.category,
      });
    }
  }

  if (!goal.priority) {
    errors.push({
      row: rowIndex,
      field: "priority",
      message: "Priority is required",
      value: goal.priority,
    });
  } else {
    const validPriorities = ["critical", "high", "medium", "low"];
    if (!validPriorities.includes(goal.priority)) {
      errors.push({
        row: rowIndex,
        field: "priority",
        message: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
        value: goal.priority,
      });
    }
  }

  if (!goal.time_horizon) {
    errors.push({
      row: rowIndex,
      field: "time_horizon",
      message: "Time horizon is required",
      value: goal.time_horizon,
    });
  } else {
    const validHorizons = ["short", "medium", "long"];
    if (!validHorizons.includes(goal.time_horizon)) {
      errors.push({
        row: rowIndex,
        field: "time_horizon",
        message: `Invalid time horizon. Must be one of: ${validHorizons.join(", ")}`,
        value: goal.time_horizon,
      });
    }
  }

  if (!goal.status) {
    errors.push({
      row: rowIndex,
      field: "status",
      message: "Status is required",
      value: goal.status,
    });
  } else {
    const validStatuses = [
      "draft",
      "active",
      "on-hold",
      "completed",
      "archived",
    ];

    if (!validStatuses.includes(goal.status)) {
      errors.push({
        row: rowIndex,
        field: "status",
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        value: goal.status,
      });
    }
  }

  // Validate owners
  if (!goal.owners || goal.owners.length === 0) {
    errors.push({
      row: rowIndex,
      field: "owners",
      message: "At least one owner is required",
      value: goal.owners,
    });
  } else {
    goal.owners.forEach((owner, idx) => {
      if (!owner.stakeholder_id) {
        errors.push({
          row: rowIndex,
          field: `owners[${idx}].stakeholder_id`,
          message: "Owner stakeholder_id is required",
          value: owner,
        });
      }
      if (owner.ownership_percentage !== undefined) {
        if (
          owner.ownership_percentage < 0 ||
          owner.ownership_percentage > 100
        ) {
          errors.push({
            row: rowIndex,
            field: `owners[${idx}].ownership_percentage`,
            message: "Ownership percentage must be between 0 and 100",
            value: owner.ownership_percentage,
          });
        }
      }
    });

    // Check total ownership doesn't exceed 100%
    const totalOwnership = goal.owners.reduce(
      (sum, owner) => sum + (owner.ownership_percentage || 0),
      0
    );
    if (totalOwnership > 100) {
      errors.push({
        row: rowIndex,
        field: "owners",
        message: `Total ownership percentage (${totalOwnership}%) exceeds 100%`,
        value: totalOwnership,
      });
    }
  }

  // Validate KPIs
  if (!goal.kpis || goal.kpis.length === 0) {
    errors.push({
      row: rowIndex,
      field: "kpis",
      message: "At least one KPI is required",
      value: goal.kpis,
    });
  } else {
    goal.kpis.forEach((kpi, idx) => {
      if (!kpi.name || kpi.name.trim() === "") {
        errors.push({
          row: rowIndex,
          field: `kpis[${idx}].name`,
          message: "KPI name is required",
          value: kpi,
        });
      }
      if (!kpi.target_value) {
        errors.push({
          row: rowIndex,
          field: `kpis[${idx}].target_value`,
          message: "KPI target value is required",
          value: kpi,
        });
      }
      if (!kpi.unit) {
        errors.push({
          row: rowIndex,
          field: `kpis[${idx}].unit`,
          message: "KPI unit is required",
          value: kpi,
        });
      }
    });
  }

  // Validate dates
  if (goal.start_date && goal.target_date) {
    if (goal.start_date > goal.target_date) {
      errors.push({
        row: rowIndex,
        field: "dates",
        message: "Start date cannot be after target date",
        value: { start_date: goal.start_date, target_date: goal.target_date },
      });
    }
  }

  // Validate dependencies (check for circular references)
  if (goal.depends_on && goal.depends_on.length > 0 && goal.id) {
    if (goal.depends_on.includes(goal.id)) {
      errors.push({
        row: rowIndex,
        field: "depends_on",
        message: "Goal cannot depend on itself",
        value: goal.depends_on,
      });
    }
  }

  return errors;
}

/**
 * Validate an array of goals
 */
export function validateGoals(goals: Partial<GoalV2>[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  goals.forEach((goal, index) => {
    const goalErrors = validateGoal(goal, index + 1);
    errors.push(...goalErrors);
  });

  // Check for duplicate IDs
  const idMap = new Map<string, number[]>();
  goals.forEach((goal, index) => {
    if (goal.id) {
      if (!idMap.has(goal.id)) {
        idMap.set(goal.id, []);
      }
      idMap.get(goal.id)!.push(index + 1);
    }
  });

  idMap.forEach((rows, id) => {
    if (rows.length > 1) {
      errors.push({
        row: rows[0],
        field: "id",
        message: `Duplicate ID "${id}" found in rows: ${rows.join(", ")}`,
        value: id,
      });
    }
  });

  // Check for duplicate statements within same category
  const statementMap = new Map<string, number[]>();
  goals.forEach((goal, index) => {
    if (goal.statement && goal.category) {
      const key = `${goal.category}:${goal.statement.toLowerCase().trim()}`;
      if (!statementMap.has(key)) {
        statementMap.set(key, []);
      }
      statementMap.get(key)!.push(index + 1);
    }
  });

  statementMap.forEach((rows, key) => {
    if (rows.length > 1) {
      const [category, statement] = key.split(":");
      warnings.push({
        row: rows[0],
        field: "statement",
        message: `Potential duplicate: "${statement}" in category "${category}" found in rows: ${rows.join(", ")}`,
        value: statement,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for circular dependencies
 */
export function detectCircularDependencies(
  goals: Partial<GoalV2>[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const goalMap = new Map<string, Partial<GoalV2>>();

  goals.forEach((goal) => {
    if (goal.id) {
      goalMap.set(goal.id, goal);
    }
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(goalId: string, path: string[]): boolean {
    if (recursionStack.has(goalId)) {
      return true;
    }
    if (visited.has(goalId)) {
      return false;
    }

    visited.add(goalId);
    recursionStack.add(goalId);

    const goal = goalMap.get(goalId);
    if (goal?.depends_on) {
      for (const depId of goal.depends_on) {
        if (hasCycle(depId, [...path, goalId])) {
          return true;
        }
      }
    }

    recursionStack.delete(goalId);
    return false;
  }

  goals.forEach((goal, index) => {
    if (goal.id && goal.depends_on && goal.depends_on.length > 0) {
      visited.clear();
      recursionStack.clear();

      if (hasCycle(goal.id, [])) {
        errors.push({
          row: index + 1,
          field: "depends_on",
          message: `Circular dependency detected for goal "${goal.statement}"`,
          value: goal.depends_on,
        });
      }
    }
  });

  return errors;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return "";

  const grouped = new Map<number, ValidationError[]>();
  errors.forEach((error) => {
    if (!grouped.has(error.row)) {
      grouped.set(error.row, []);
    }
    grouped.get(error.row)!.push(error);
  });

  const lines: string[] = [];
  grouped.forEach((rowErrors, row) => {
    lines.push(`Row ${row}:`);
    rowErrors.forEach((error) => {
      lines.push(`  • ${error.field}: ${error.message}`);
    });
  });

  return lines.join("\n");
}
