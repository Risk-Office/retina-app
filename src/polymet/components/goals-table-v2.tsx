import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  UsersIcon,
} from "lucide-react";
import type { GoalV2, GoalStatus } from "@/polymet/data/goal-v2-schema";
import type { StakeholderV2 } from "@/polymet/data/stakeholder-v2-schema";

interface GoalsTableV2Props {
  goals: GoalV2[];
  stakeholders: StakeholderV2[];
  onRowClick: (goal: GoalV2) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function GoalsTableV2({
  goals,
  stakeholders,
  onRowClick,
  page,
  pageSize,
  onPageChange,
}: GoalsTableV2Props) {
  const totalPages = Math.ceil(goals.length / pageSize);
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, goals.length);
  const paginatedGoals = goals.slice(startIndex, endIndex);

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

  const getOwnerNames = (goal: GoalV2) => {
    return goal.owners
      .map((owner) => {
        const stakeholder = stakeholders.find(
          (s) => s.id === owner.stakeholder_id
        );
        return stakeholder?.name || "Unknown";
      })
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[140px]">Category</TableHead>
              <TableHead className="min-w-[300px]">Statement</TableHead>
              <TableHead className="w-[200px]">KPI(s)</TableHead>
              <TableHead className="w-[120px]">Target</TableHead>
              <TableHead className="w-[120px]">Priority</TableHead>
              <TableHead className="w-[180px]">Owners</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGoals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No goals found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedGoals.map((goal) => {
                const priorityBadge = getPriorityBadge(goal.priority);
                const ownerNames = getOwnerNames(goal);
                const firstKPI = goal.kpis[0];
                const kpiCount = goal.kpis.length;

                return (
                  <TableRow
                    key={goal.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onRowClick(goal)}
                  >
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {goal.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium line-clamp-2">
                          {goal.statement}
                        </p>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {firstKPI ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{firstKPI.name}</p>
                          {kpiCount > 1 && (
                            <p className="text-xs text-muted-foreground">
                              +{kpiCount - 1} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No KPIs
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {firstKPI?.target !== undefined ? (
                        <span className="text-sm font-medium">
                          {firstKPI.target} {firstKPI.unit}
                        </span>
                      ) : firstKPI?.range_min !== undefined &&
                        firstKPI?.range_max !== undefined ? (
                        <span className="text-sm font-medium">
                          {firstKPI.range_min}-{firstKPI.range_max}{" "}
                          {firstKPI.unit}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityBadge.color}>
                        {priorityBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <UsersIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />

                        <span className="truncate" title={ownerNames}>
                          {ownerNames || "No owners"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status.charAt(0).toUpperCase() +
                          goal.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of {goals.length} goals
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(0)}
              disabled={page === 0}
            >
              <ChevronsLeftIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronsRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
