import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  NetworkIcon,
  PlusIcon,
  FilterIcon,
  LayoutGridIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTenant } from "@/polymet/data/tenant-context";
import { useGoalGraphV2 } from "@/polymet/data/use-goal-graph-v2";
import { useGoalsV2 } from "@/polymet/data/use-goals-v2";
import { useStakeholdersV2 } from "@/polymet/data/use-stakeholders-v2";
import { DependencyGraphV2 } from "@/polymet/components/dependency-graph-v2";
import {
  GoalsFiltersBarV2,
  type GoalsFilters,
} from "@/polymet/components/goals-filters-bar-v2";
import { GoalDetailDrawerV2 } from "@/polymet/components/goal-detail-drawer-v2";
import type { GoalV2 } from "@/polymet/data/goal-v2-schema";
import { seedDefaultGoals, loadGoalsV2 } from "@/polymet/data/goal-v2-schema";
import {
  seedDefaultStakeholders,
  loadStakeholdersV2,
} from "@/polymet/data/stakeholder-v2-schema";

export function RetinaGoalsMap() {
  const { tenantId } = useTenant();
  const [filters, setFilters] = useState<GoalsFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Seed default data on mount
  React.useEffect(() => {
    // Seed default stakeholders first
    seedDefaultStakeholders(tenantId);
    const loadedStakeholders = loadStakeholdersV2(tenantId);

    // Find key stakeholder IDs for seeding goals
    const cfo = loadedStakeholders.find(
      (s) => s.group === "CFO & Finance" && s.type === "individual"
    )?.id;
    const coo = loadedStakeholders.find(
      (s) => s.group === "COO & Operations" && s.type === "individual"
    )?.id;
    const ceo = loadedStakeholders.find(
      (s) => s.group === "CEO" && s.type === "individual"
    )?.id;
    const cro = loadedStakeholders.find(
      (s) => s.group === "CRO / Risk" && s.type === "individual"
    )?.id;

    // Seed default goals with stakeholder references
    seedDefaultGoals(tenantId, { cfo, coo, ceo, cro });
  }, [tenantId]);

  // Fetch data
  const { graph, loading: graphLoading, stats } = useGoalGraphV2(filters);
  const { allGoals } = useGoalsV2();
  const { stakeholders } = useStakeholdersV2();

  // Find selected goal
  const selectedGoal = selectedGoalId
    ? allGoals.find((g) => g.id === selectedGoalId) || null
    : null;

  const handleNodeClick = (node: any) => {
    setSelectedGoalId(node.id);
  };

  const handleCloseDrawer = () => {
    setSelectedGoalId(null);
  };

  const handleEditGoal = (goal: GoalV2) => {
    // TODO: Implement edit functionality
    console.log("Edit goal:", goal);
  };

  const handleDeleteGoal = (goalId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete goal:", goalId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <NetworkIcon className="w-6 h-6" />

            <h1 className="text-3xl font-bold">Goals Dependency Map</h1>
          </div>
          <p className="text-muted-foreground">
            Visualize goal relationships and dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/retina/goals">
              <LayoutGridIcon className="w-4 h-4 mr-2" />
              Table View
            </Link>
          </Button>
          <Button asChild>
            <Link to="/retina/goals/new">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Goal
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Goals</p>
          <p className="text-2xl font-bold">{stats.nodeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Dependencies</p>
          <p className="text-2xl font-bold">{stats.edgeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Depends On</p>
          <p className="text-2xl font-bold">{stats.dependsOnCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Enables</p>
          <p className="text-2xl font-bold">{stats.enablesCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Root Goals</p>
          <p className="text-2xl font-bold">{stats.rootNodeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Leaf Goals</p>
          <p className="text-2xl font-bold">{stats.leafNodeCount}</p>
        </Card>
      </div>

      {/* Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon className="w-4 h-4 mr-2" />
          {showFilters ? "Hide" : "Show"} Filters
        </Button>
        {Object.keys(filters).length > 0 && (
          <p className="text-sm text-muted-foreground">
            {Object.keys(filters).length} filter(s) active
          </p>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <GoalsFiltersBarV2
            filters={filters}
            onFiltersChange={setFilters}
            stakeholders={stakeholders}
          />
        </Card>
      )}

      <Separator />

      {/* Graph */}
      {graphLoading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />

              <p className="text-sm text-muted-foreground">Loading graph...</p>
            </div>
          </div>
        </Card>
      ) : (
        <DependencyGraphV2 graph={graph} onNodeClick={handleNodeClick} />
      )}

      {/* Detail Drawer */}
      <GoalDetailDrawerV2
        open={!!selectedGoal}
        onOpenChange={handleCloseDrawer}
        goal={selectedGoal}
        stakeholders={stakeholders}
        allGoals={allGoals}
        onEdit={handleEditGoal}
        onDelete={handleDeleteGoal}
      />
    </div>
  );
}
