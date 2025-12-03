import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  TargetIcon,
  SearchIcon,
  XIcon,
  TrendingUpIcon,
  LinkIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useGoalsV2 } from "@/polymet/data/use-goals-v2";
import type { GoalV2, GoalCategory } from "@/polymet/data/goal-v2-schema";

export interface LinkedGoal {
  goal_id: string;
  goal_statement: string;
  goal_category: GoalCategory;
  linked_kpis: string[]; // KPI IDs
}

interface GoalSelectorProps {
  selectedGoals: LinkedGoal[];
  onGoalsChange: (goals: LinkedGoal[]) => void;
  className?: string;
}

export function GoalSelector({
  selectedGoals,
  onGoalsChange,
  className,
}: GoalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | "all">(
    "all"
  );
  const [tempSelectedGoals, setTempSelectedGoals] =
    useState<LinkedGoal[]>(selectedGoals);

  const { goals, loading } = useGoalsV2({
    status: "active",
  });

  // Filter goals based on search and category
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchesSearch =
        !searchQuery ||
        goal.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        categoryFilter === "all" || goal.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [goals, searchQuery, categoryFilter]);

  // Handle goal selection
  const handleToggleGoal = (goal: GoalV2) => {
    const existingIndex = tempSelectedGoals.findIndex(
      (g) => g.goal_id === goal.id
    );

    if (existingIndex >= 0) {
      // Remove goal
      setTempSelectedGoals(
        tempSelectedGoals.filter((g) => g.goal_id !== goal.id)
      );
    } else {
      // Add goal with all KPIs selected by default
      setTempSelectedGoals([
        ...tempSelectedGoals,
        {
          goal_id: goal.id,
          goal_statement: goal.statement,
          goal_category: goal.category,
          linked_kpis: goal.kpis.map((kpi) => kpi.id || kpi.name),
        },
      ]);
    }
  };

  // Handle KPI selection for a goal
  const handleToggleKPI = (goalId: string, kpiId: string) => {
    setTempSelectedGoals(
      tempSelectedGoals.map((linkedGoal) => {
        if (linkedGoal.goal_id === goalId) {
          const kpiIndex = linkedGoal.linked_kpis.indexOf(kpiId);
          if (kpiIndex >= 0) {
            // Remove KPI
            return {
              ...linkedGoal,
              linked_kpis: linkedGoal.linked_kpis.filter((id) => id !== kpiId),
            };
          } else {
            // Add KPI
            return {
              ...linkedGoal,
              linked_kpis: [...linkedGoal.linked_kpis, kpiId],
            };
          }
        }
        return linkedGoal;
      })
    );
  };

  // Handle apply
  const handleApply = () => {
    onGoalsChange(tempSelectedGoals);
    setOpen(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setTempSelectedGoals(selectedGoals);
    setOpen(false);
  };

  // Remove a selected goal
  const handleRemoveGoal = (goalId: string) => {
    onGoalsChange(selectedGoals.filter((g) => g.goal_id !== goalId));
  };

  const isGoalSelected = (goalId: string) => {
    return tempSelectedGoals.some((g) => g.goal_id === goalId);
  };

  const getLinkedGoal = (goalId: string) => {
    return tempSelectedGoals.find((g) => g.goal_id === goalId);
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Linked Goals & KPIs
            <Badge variant="destructive" className="ml-2">
              Required
            </Badge>
          </Label>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <TargetIcon className="w-4 h-4 mr-2" />

                {selectedGoals.length > 0
                  ? `${selectedGoals.length} Goal${selectedGoals.length > 1 ? "s" : ""} Linked`
                  : "Link Goals"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TargetIcon className="w-5 h-5" />
                  Link Decision to Goals & KPIs
                </DialogTitle>
                <DialogDescription>
                  Select strategic goals and specific KPIs that this decision
                  will impact. This creates an anchor for decision tracking and
                  outcome measurement.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      placeholder="Search goals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) =>
                      setCategoryFilter(value as GoalCategory | "all")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Strategic">Strategic</SelectItem>
                      <SelectItem value="Compliance & Regulatory">
                        Compliance & Regulatory
                      </SelectItem>
                      <SelectItem value="People & Culture">
                        People & Culture
                      </SelectItem>
                      <SelectItem value="Resilience & Continuity">
                        Resilience & Continuity
                      </SelectItem>
                      <SelectItem value="Technology & Digital">
                        Technology & Digital
                      </SelectItem>
                      <SelectItem value="Sustainability & ESG">
                        Sustainability & ESG
                      </SelectItem>
                      <SelectItem value="Customer & Market">
                        Customer & Market
                      </SelectItem>
                      <SelectItem value="Innovation & Learning">
                        Innovation & Learning
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Goals List */}
                <ScrollArea className="h-[400px] border border-border rounded-lg">
                  <div className="p-4 space-y-3">
                    {loading ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Loading goals...
                      </div>
                    ) : filteredGoals.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        {goals.length === 0
                          ? "No active goals found. Create goals in the Goals & Objectives module first."
                          : "No goals match your search criteria."}
                      </div>
                    ) : (
                      filteredGoals.map((goal) => {
                        const selected = isGoalSelected(goal.id);
                        const linkedGoal = getLinkedGoal(goal.id);

                        return (
                          <div
                            key={goal.id}
                            className={`p-4 border rounded-lg space-y-3 transition-colors ${
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => handleToggleGoal(goal)}
                                className="mt-1"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">
                                      {goal.statement}
                                    </div>
                                    {goal.description && (
                                      <div className="text-xs text-muted-foreground line-clamp-2">
                                        {goal.description}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="shrink-0">
                                    {goal.category}
                                  </Badge>
                                </div>

                                {/* KPIs */}
                                {selected && goal.kpis.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground">
                                      Select KPIs to track:
                                    </div>
                                    <div className="space-y-2">
                                      {goal.kpis.map((kpi) => {
                                        const kpiId = kpi.id || kpi.name;
                                        const kpiSelected =
                                          linkedGoal?.linked_kpis.includes(
                                            kpiId
                                          );

                                        return (
                                          <div
                                            key={kpiId}
                                            className="flex items-center gap-2 pl-4"
                                          >
                                            <Checkbox
                                              checked={kpiSelected}
                                              onCheckedChange={() =>
                                                handleToggleKPI(goal.id, kpiId)
                                              }
                                              className="shrink-0"
                                            />

                                            <div className="flex-1 text-xs">
                                              <span className="font-medium">
                                                {kpi.name}
                                              </span>
                                              {kpi.target && (
                                                <span className="text-muted-foreground ml-2">
                                                  (Target: {kpi.target}{" "}
                                                  {kpi.unit})
                                                </span>
                                              )}
                                            </div>
                                            <TrendingUpIcon className="w-3 h-3 text-muted-foreground" />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Selected Count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {tempSelectedGoals.length} goal
                    {tempSelectedGoals.length !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApply}
                      disabled={tempSelectedGoals.length === 0}
                    >
                      <CheckCircle2Icon className="w-4 h-4 mr-2" />
                      Apply Selection
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected Goals Display */}
        {selectedGoals.length > 0 ? (
          <div className="space-y-2">
            {selectedGoals.map((linkedGoal) => {
              const goal = goals.find((g) => g.goal_id === linkedGoal.goal_id);
              const kpiCount = linkedGoal.linked_kpis.length;

              return (
                <div
                  key={linkedGoal.goal_id}
                  className="p-3 border border-border rounded-lg bg-accent/30 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2Icon className="w-4 h-4 text-green-600 shrink-0" />

                        <span className="text-sm font-medium">
                          {linkedGoal.goal_statement}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {linkedGoal.goal_category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {kpiCount} KPI{kpiCount !== 1 ? "s" : ""} linked
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveGoal(linkedGoal.goal_id)}
                      className="shrink-0"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Show linked KPIs */}
                  {kpiCount > 0 && goal && (
                    <div className="pl-6 space-y-1">
                      {linkedGoal.linked_kpis.map((kpiId) => {
                        const kpi = goal.kpis.find(
                          (k) => (k.id || k.name) === kpiId
                        );
                        if (!kpi) return null;

                        return (
                          <div
                            key={kpiId}
                            className="text-xs text-muted-foreground flex items-center gap-2"
                          >
                            <TrendingUpIcon className="w-3 h-3" />

                            <span>
                              {kpi.name}
                              {kpi.target && (
                                <span className="ml-1">
                                  (Target: {kpi.target} {kpi.unit})
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 border border-dashed border-destructive/50 rounded-lg bg-destructive/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <TargetIcon className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-destructive mb-1">
                  No goals linked
                </div>
                <div className="text-xs text-muted-foreground">
                  Link this decision to strategic goals and KPIs to create an
                  anchor for tracking and measuring outcomes. This field is
                  required before confirming the decision.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
