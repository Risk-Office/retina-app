import { useState, useEffect, useCallback, useMemo } from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import type {
  GoalV2,
  GoalCategory,
  GoalStatus,
  TimeHorizon,
} from "@/polymet/data/goal-v2-schema";

export interface UseGoalsV2Filters {
  category?: GoalCategory;
  stakeholder_id?: string;
  status?: GoalStatus;
  time_horizon?: TimeHorizon;
  q?: string;
}

/**
 * Custom hook for managing goals v2 with filtering support
 */
export function useGoalsV2(filters?: UseGoalsV2Filters) {
  const { tenantId } = useTenant();
  const [goals, setGoals] = useState<GoalV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load goals from localStorage (simulating API)
  const loadGoals = useCallback(() => {
    try {
      setLoading(true);
      const key = `retina_goals_v2_${tenantId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGoals(parsed);
      } else {
        setGoals([]);
      }
      setError(null);
    } catch (err) {
      setError("Failed to load goals");
      console.error("Error loading goals:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Save goals to localStorage
  const saveGoals = useCallback(
    (updatedGoals: GoalV2[]) => {
      try {
        const key = `retina_goals_v2_${tenantId}`;
        localStorage.setItem(key, JSON.stringify(updatedGoals));
        setGoals(updatedGoals);
      } catch (err) {
        console.error("Error saving goals:", err);
        throw new Error("Failed to save goals");
      }
    },
    [tenantId]
  );

  // Create a new goal
  const createGoal = useCallback(
    async (
      goal: Omit<
        GoalV2,
        "id" | "created_at" | "updated_at" | "created_by" | "updated_by"
      >
    ): Promise<GoalV2> => {
      try {
        // Load latest goals from localStorage to avoid stale data
        const key = `retina_goals_v2_${tenantId}`;
        const stored = localStorage.getItem(key);
        const currentGoals = stored ? JSON.parse(stored) : [];

        const now = Date.now();
        const newGoal: GoalV2 = {
          ...goal,
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now,
          created_by: "current-user", // TODO: Get from auth context
          updated_by: "current-user", // TODO: Get from auth context
        };

        const updatedGoals = [...currentGoals, newGoal];
        saveGoals(updatedGoals);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        return newGoal;
      } catch (err) {
        console.error("Error creating goal:", err);
        throw new Error("Failed to create goal");
      }
    },
    [tenantId, saveGoals]
  );

  // Update an existing goal
  const updateGoal = useCallback(
    async (id: string, updates: Partial<GoalV2>): Promise<GoalV2> => {
      try {
        // Load latest goals from localStorage to avoid stale data
        const key = `retina_goals_v2_${tenantId}`;
        const stored = localStorage.getItem(key);
        const currentGoals = stored ? JSON.parse(stored) : [];

        const updatedGoals = currentGoals.map((goal: GoalV2) =>
          goal.id === id
            ? { ...goal, ...updates, updated_at: Date.now() }
            : goal
        );
        saveGoals(updatedGoals);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updatedGoal = updatedGoals.find((g: GoalV2) => g.id === id);
        if (!updatedGoal) throw new Error("Goal not found");

        return updatedGoal;
      } catch (err) {
        console.error("Error updating goal:", err);
        throw new Error("Failed to update goal");
      }
    },
    [tenantId, saveGoals]
  );

  // Delete a goal
  const deleteGoal = useCallback(
    async (id: string): Promise<void> => {
      try {
        // Load latest goals from localStorage to avoid stale data
        const key = `retina_goals_v2_${tenantId}`;
        const stored = localStorage.getItem(key);
        const currentGoals = stored ? JSON.parse(stored) : [];

        const updatedGoals = currentGoals.filter(
          (goal: GoalV2) => goal.id !== id
        );
        saveGoals(updatedGoals);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error("Error deleting goal:", err);
        throw new Error("Failed to delete goal");
      }
    },
    [tenantId, saveGoals]
  );

  // Get goals by status
  const getGoalsByStatus = useCallback(
    (status: GoalV2["status"]) => {
      return goals.filter((goal) => goal.status === status);
    },
    [goals]
  );

  // Get goals by category
  const getGoalsByCategory = useCallback(
    (category: GoalV2["category"]) => {
      return goals.filter((goal) => goal.category === category);
    },
    [goals]
  );

  // Get active goals (for dependency selection)
  const getActiveGoals = useCallback(() => {
    return goals.filter(
      (goal) => goal.status === "active" || goal.status === "draft"
    );
  }, [goals]);

  // Search goals
  const searchGoals = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return goals.filter(
        (goal) =>
          goal.statement.toLowerCase().includes(lowerQuery) ||
          goal.description?.toLowerCase().includes(lowerQuery) ||
          goal.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [goals]
  );

  // Load goals on mount or tenant change
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Apply filters
  const filteredGoals = useMemo(() => {
    if (!filters) return goals;

    return goals.filter((goal) => {
      // Category filter
      if (filters.category && goal.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && goal.status !== filters.status) {
        return false;
      }

      // Time horizon filter
      if (filters.time_horizon && goal.time_horizon !== filters.time_horizon) {
        return false;
      }

      // Stakeholder filter (check owners and related stakeholders)
      if (filters.stakeholder_id) {
        const isOwner = goal.owners.some(
          (owner) => owner.stakeholder_id === filters.stakeholder_id
        );
        const isRelated = goal.related_stakeholders.includes(
          filters.stakeholder_id
        );
        if (!isOwner && !isRelated) {
          return false;
        }
      }

      // Search query
      if (filters.q) {
        const query = filters.q.toLowerCase();
        const matchesStatement = goal.statement.toLowerCase().includes(query);
        const matchesDescription = goal.description
          ?.toLowerCase()
          .includes(query);
        const matchesTags = goal.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        const matchesKPIs = goal.kpis.some((kpi) =>
          kpi.name.toLowerCase().includes(query)
        );
        if (
          !matchesStatement &&
          !matchesDescription &&
          !matchesTags &&
          !matchesKPIs
        ) {
          return false;
        }
      }

      return true;
    });
  }, [goals, filters]);

  return {
    goals: filteredGoals,
    allGoals: goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalsByStatus,
    getGoalsByCategory,
    getActiveGoals,
    searchGoals,
    refetch: loadGoals,
  };
}
