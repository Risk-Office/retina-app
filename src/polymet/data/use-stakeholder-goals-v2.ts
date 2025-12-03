import { useMemo } from "react";
import { useGoalsV2 } from "@/polymet/data/use-goals-v2";
import type { GoalV2 } from "@/polymet/data/goal-v2-schema";

export interface StakeholderGoalRelationship {
  goal: GoalV2;
  relationshipType: "owner" | "co-owner" | "contributor" | "consumer";
  ownershipPercentage?: number;
}

export interface StakeholderGoalsData {
  owns: GoalV2[];
  coOwns: GoalV2[];
  contributes: GoalV2[];
  consumes: GoalV2[];
  all: StakeholderGoalRelationship[];
  totalCount: number;
}

/**
 * Custom hook for fetching goals related to a specific stakeholder
 */
export function useStakeholderGoalsV2(
  stakeholderId: string
): StakeholderGoalsData {
  const { allGoals } = useGoalsV2();

  const stakeholderGoals = useMemo(() => {
    const owns: GoalV2[] = [];
    const coOwns: GoalV2[] = [];
    const contributes: GoalV2[] = [];
    const consumes: GoalV2[] = [];
    const all: StakeholderGoalRelationship[] = [];

    allGoals.forEach((goal) => {
      // Check if stakeholder is an owner
      const ownerEntry = goal.owners.find(
        (owner) => owner.stakeholder_id === stakeholderId
      );

      if (ownerEntry) {
        if (goal.owners.length === 1) {
          // Sole owner
          owns.push(goal);
          all.push({
            goal,
            relationshipType: "owner",
            ownershipPercentage: 100,
          });
        } else {
          // Co-owner
          coOwns.push(goal);
          all.push({
            goal,
            relationshipType: "co-owner",
            ownershipPercentage: ownerEntry.ownership_percentage,
          });
        }
      } else if (goal.related_stakeholders.includes(stakeholderId)) {
        // Related stakeholder - determine if contributor or consumer
        // For now, we'll use a simple heuristic:
        // - If goal has dependencies, stakeholder is likely a consumer
        // - Otherwise, stakeholder is a contributor
        if (goal.depends_on && goal.depends_on.length > 0) {
          consumes.push(goal);
          all.push({
            goal,
            relationshipType: "consumer",
          });
        } else {
          contributes.push(goal);
          all.push({
            goal,
            relationshipType: "contributor",
          });
        }
      }
    });

    return {
      owns,
      coOwns,
      contributes,
      consumes,
      all,
      totalCount: all.length,
    };
  }, [allGoals, stakeholderId]);

  return stakeholderGoals;
}

/**
 * Get all stakeholders with their goal counts
 */
export function useStakeholdersWithGoalCounts() {
  const { allGoals } = useGoalsV2();

  const stakeholderGoalCounts = useMemo(() => {
    const counts = new Map<
      string,
      {
        owns: number;
        coOwns: number;
        contributes: number;
        consumes: number;
        total: number;
      }
    >();

    allGoals.forEach((goal) => {
      // Process owners
      goal.owners.forEach((owner) => {
        const current = counts.get(owner.stakeholder_id) || {
          owns: 0,
          coOwns: 0,
          contributes: 0,
          consumes: 0,
          total: 0,
        };

        if (goal.owners.length === 1) {
          current.owns += 1;
        } else {
          current.coOwns += 1;
        }
        current.total += 1;

        counts.set(owner.stakeholder_id, current);
      });

      // Process related stakeholders
      goal.related_stakeholders.forEach((stakeholderId) => {
        // Skip if already counted as owner
        if (goal.owners.some((o) => o.stakeholder_id === stakeholderId)) {
          return;
        }

        const current = counts.get(stakeholderId) || {
          owns: 0,
          coOwns: 0,
          contributes: 0,
          consumes: 0,
          total: 0,
        };

        if (goal.depends_on && goal.depends_on.length > 0) {
          current.consumes += 1;
        } else {
          current.contributes += 1;
        }
        current.total += 1;

        counts.set(stakeholderId, current);
      });
    });

    return counts;
  }, [allGoals]);

  return stakeholderGoalCounts;
}
