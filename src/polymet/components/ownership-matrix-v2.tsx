import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoalsV2 } from "@/polymet/data/use-goals-v2";
import { useStakeholdersV2 } from "@/polymet/data/use-stakeholders-v2";
import type {
  GoalCategory,
  GoalStatus,
  TimeHorizon,
} from "@/polymet/data/goal-v2-schema";
import type { StakeholderGroup } from "@/polymet/data/stakeholder-v2-schema";
import { ArrowLeftIcon, UsersIcon } from "lucide-react";

export interface OwnershipMatrixV2Props {
  onGoalClick?: (goalId: string) => void;
  onStakeholderClick?: (stakeholderId: string) => void;
}

export function OwnershipMatrixV2({
  onGoalClick,
  onStakeholderClick,
}: OwnershipMatrixV2Props) {
  const { allGoals, loading: goalsLoading } = useGoalsV2();
  const { stakeholders, loading: stakeholdersLoading } = useStakeholdersV2();

  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<GoalStatus | "all">("all");
  const [timeHorizonFilter, setTimeHorizonFilter] = useState<
    TimeHorizon | "all"
  >("all");

  // Get unique stakeholder groups
  const stakeholderGroups = useMemo(() => {
    const groups = new Set(stakeholders.map((s) => s.group));
    return Array.from(groups).sort();
  }, [stakeholders]);

  // Filter goals
  const filteredGoals = useMemo(() => {
    return allGoals.filter((goal) => {
      if (categoryFilter !== "all" && goal.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && goal.status !== statusFilter) {
        return false;
      }
      if (
        timeHorizonFilter !== "all" &&
        goal.time_horizon !== timeHorizonFilter
      ) {
        return false;
      }
      return true;
    });
  }, [allGoals, categoryFilter, statusFilter, timeHorizonFilter]);

  // Build matrix data
  const matrixData = useMemo(() => {
    return filteredGoals.map((goal) => {
      const groupOwners = new Map<StakeholderGroup, string[]>();

      goal.owners.forEach((owner) => {
        const stakeholder = stakeholders.find(
          (s) => s.id === owner.stakeholder_id
        );
        if (stakeholder) {
          const group = stakeholder.group;
          if (!groupOwners.has(group)) {
            groupOwners.set(group, []);
          }
          groupOwners.get(group)!.push(stakeholder.name);
        }
      });

      return {
        goal,
        groupOwners,
      };
    });
  }, [filteredGoals, stakeholders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "draft":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "retired":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  if (goalsLoading || stakeholdersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading matrix...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/retina/stakeholders">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Directory
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">
              Stakeholder Ownership Matrix
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredGoals.length} goals × {stakeholderGroups.length} groups
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          value={categoryFilter}
          onValueChange={(value) =>
            setCategoryFilter(value as GoalCategory | "all")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Financial">Financial</SelectItem>
            <SelectItem value="Operational">Operational</SelectItem>
            <SelectItem value="Strategic">Strategic</SelectItem>
            <SelectItem value="Compliance">Compliance</SelectItem>
            <SelectItem value="Innovation">Innovation</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
            <SelectItem value="ESG">ESG</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as GoalStatus | "all")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={timeHorizonFilter}
          onValueChange={(value) =>
            setTimeHorizonFilter(value as TimeHorizon | "all")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by time horizon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Horizons</SelectItem>
            <SelectItem value="short">Short (0-1 year)</SelectItem>
            <SelectItem value="medium">Medium (1-3 years)</SelectItem>
            <SelectItem value="long">Long (3+ years)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Matrix */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />

            <p className="text-muted-foreground">No goals found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left text-sm font-medium min-w-[300px]">
                    Goal
                  </th>
                  {stakeholderGroups.map((group) => (
                    <th
                      key={group}
                      className="px-4 py-3 text-center text-sm font-medium min-w-[150px]"
                    >
                      {group}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrixData.map(({ goal, groupOwners }) => (
                  <tr
                    key={goal.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-background px-4 py-3">
                      <div className="space-y-1">
                        <div
                          className="text-sm font-medium cursor-pointer hover:text-primary"
                          onClick={() => onGoalClick?.(goal.id)}
                        >
                          {goal.statement}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {goal.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(goal.status)}`}
                          >
                            {goal.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {goal.time_horizon}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    {stakeholderGroups.map((group) => {
                      const owners = groupOwners.get(group) || [];
                      return (
                        <td key={group} className="px-4 py-3 text-center">
                          {owners.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="default" className="text-xs">
                                {owners.length}
                              </Badge>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {owners.slice(0, 2).map((name, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {name.split(" ")[0]}
                                  </Badge>
                                ))}
                                {owners.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{owners.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrix Summary</CardTitle>
          <CardDescription>
            Ownership distribution across stakeholder groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Goals</div>
              <div className="text-2xl font-bold">{filteredGoals.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Stakeholder Groups
              </div>
              <div className="text-2xl font-bold">
                {stakeholderGroups.length}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Owners</div>
              <div className="text-2xl font-bold">
                {filteredGoals.reduce(
                  (sum, goal) => sum + goal.owners.length,
                  0
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Avg Owners/Goal
              </div>
              <div className="text-2xl font-bold">
                {filteredGoals.length > 0
                  ? (
                      filteredGoals.reduce(
                        (sum, goal) => sum + goal.owners.length,
                        0
                      ) / filteredGoals.length
                    ).toFixed(1)
                  : 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
