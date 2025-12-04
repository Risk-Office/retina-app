import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/polymet/data/auth-store";
import {
  ClockIcon,
  UsersIcon,
  TrendingUpIcon,
  TagIcon,
  LinkIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
} from "lucide-react";
import type { GoalV2, GoalStatus } from "@/polymet/data/goal-v2-schema";
import type { StakeholderV2 } from "@/polymet/data/stakeholder-v2-schema";

interface GoalDetailDrawerV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: GoalV2 | null;
  stakeholders: StakeholderV2[];
  allGoals: GoalV2[];
  onEdit?: (goal: GoalV2) => void;
  onDelete?: (goalId: string) => void;
}

export function GoalDetailDrawerV2({
  open,
  onOpenChange,
  goal,
  stakeholders,
  allGoals,
  onEdit,
  onDelete,
}: GoalDetailDrawerV2Props) {
  const { canEdit, isReadOnly } = useAuthStore();

  if (!goal) return null;

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "retired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityBadge = (priority: number) => {
    const labels = ["", "Critical", "High", "Medium", "Low", "Minimal"];
    const colors = [
      "",
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    ];

    return { label: labels[priority], color: colors[priority] };
  };

  const priorityBadge = getPriorityBadge(goal.priority);

  const getDependentGoals = (goalId: string) => {
    return allGoals.filter((g) => g.dependencies.depends_on.includes(goalId));
  };

  const getEnabledGoals = (goalId: string) => {
    return allGoals.filter((g) => g.dependencies.enables.includes(goalId));
  };

  const dependsOnGoals = goal.dependencies.depends_on
    .map((id) => allGoals.find((g) => g.id === id))
    .filter(Boolean) as GoalV2[];

  const enablesGoals = goal.dependencies.enables
    .map((id) => allGoals.find((g) => g.id === id))
    .filter(Boolean) as GoalV2[];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getStatusColor(goal.status)}>
                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                </Badge>
                <Badge variant="outline">{goal.category}</Badge>
                <Badge className={priorityBadge.color}>
                  {priorityBadge.label}
                </Badge>
                <Badge variant="outline">
                  <ClockIcon className="w-3 h-3 mr-1" />

                  {goal.time_horizon_detail
                    ? `${goal.time_horizon_detail.value} ${goal.time_horizon_detail.unit}`
                    : goal.time_horizon.replace("_", " ")}
                </Badge>
              </div>
              <SheetTitle className="text-xl leading-tight">
                {goal.statement}
              </SheetTitle>
              {goal.description && (
                <SheetDescription className="text-sm">
                  {goal.description}
                </SheetDescription>
              )}
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(goal)}
                          disabled={isReadOnly()}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isReadOnly() && (
                      <TooltipContent>
                        <p>Read-only access</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              {onDelete && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this goal?"
                              )
                            ) {
                              onDelete(goal.id);
                              onOpenChange(false);
                            }
                          }}
                          disabled={isReadOnly()}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isReadOnly() && (
                      <TooltipContent>
                        <p>Read-only access</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* KPIs */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              Key Performance Indicators
            </h3>
            <div className="space-y-3">
              {goal.kpis.map((kpi, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{kpi.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {kpi.measurement_freq}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {kpi.target !== undefined && (
                      <div>
                        <span className="font-medium">Target:</span>{" "}
                        {kpi.target} {kpi.unit}
                      </div>
                    )}
                    {kpi.range_min !== undefined &&
                      kpi.range_max !== undefined && (
                        <div>
                          <span className="font-medium">Range:</span>{" "}
                          {kpi.range_min} - {kpi.range_max} {kpi.unit}
                        </div>
                      )}
                    <div>
                      <span className="font-medium">Direction:</span>{" "}
                      {kpi.direction.replace("_", " ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Owners */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Owners
            </h3>
            <div className="space-y-2">
              {goal.owners.map((owner, index) => {
                const stakeholder = stakeholders.find(
                  (s) => s.id === owner.stakeholder_id
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between border border-border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {stakeholder?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stakeholder?.group} • {stakeholder?.type}
                      </p>
                    </div>
                    <Badge variant="outline">{owner.role}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Related Stakeholders */}
          {goal.related_stakeholders.length > 0 && (
            <>
              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Related Stakeholders
                </h3>
                <div className="flex flex-wrap gap-2">
                  {goal.related_stakeholders.map((stakeholderId) => {
                    const stakeholder = stakeholders.find(
                      (s) => s.id === stakeholderId
                    );
                    return (
                      <Badge key={stakeholderId} variant="secondary">
                        {stakeholder?.name || "Unknown"}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Dependencies */}
          {(dependsOnGoals.length > 0 || enablesGoals.length > 0) && (
            <>
              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Dependencies
                </h3>
                <div className="space-y-4">
                  {dependsOnGoals.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Depends On:
                      </p>
                      <div className="space-y-2">
                        {dependsOnGoals.map((depGoal) => (
                          <div
                            key={depGoal.id}
                            className="text-sm border border-border rounded p-2"
                          >
                            {depGoal.statement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {enablesGoals.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Enables:
                      </p>
                      <div className="space-y-2">
                        {enablesGoals.map((enabledGoal) => (
                          <div
                            key={enabledGoal.id}
                            className="text-sm border border-border rounded p-2"
                          >
                            {enabledGoal.statement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {goal.tags.length > 0 && (
            <>
              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {goal.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Metadata
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(goal.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatDate(goal.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By:</span>
                <span>{goal.created_by}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated By:</span>
                <span>{goal.updated_by}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
