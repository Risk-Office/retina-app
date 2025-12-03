import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTenant } from "@/polymet/data/tenant-context";
import { useAuthStore } from "@/polymet/data/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TargetIcon,
  PlusIcon,
  NetworkIcon,
  TrendingUpIcon,
  ClockIcon,
  AlertCircleIcon,
  DownloadIcon,
  UploadIcon,
  SparklesIcon,
} from "lucide-react";
import {
  ImportExportPanelV2,
  type DedupStrategy,
} from "@/polymet/components/import-export-panel-v2";
import {
  GoalsFiltersBarV2,
  type GoalsFilters,
} from "@/polymet/components/goals-filters-bar-v2";
import { GoalsTableV2 } from "@/polymet/components/goals-table-v2";
import { GoalDetailDrawerV2 } from "@/polymet/components/goal-detail-drawer-v2";
import {
  loadGoalsV2,
  saveGoalsV2,
  deleteGoalV2 as deleteGoalFromSchema,
  seedDefaultGoals,
  type GoalV2,
} from "@/polymet/data/goal-v2-schema";
import {
  loadStakeholdersV2,
  seedDefaultStakeholders,
  type StakeholderV2,
} from "@/polymet/data/stakeholder-v2-schema";
import { GoalTemplatesDialog } from "@/polymet/components/goal-templates-dialog";
import type { GoalTemplate } from "@/polymet/data/industry-goal-templates";

export function GoalsDashboardV2() {
  const { tenant } = useTenant();
  const { canEdit, isReadOnly } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load data
  const [goals, setGoals] = useState<GoalV2[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderV2[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalV2 | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Load goals and stakeholders
  useEffect(() => {
    // Seed default stakeholders first
    seedDefaultStakeholders(tenant.tenantId);
    const loadedStakeholders = loadStakeholdersV2(tenant.tenantId);

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
    seedDefaultGoals(tenant.tenantId, { cfo, coo, ceo, cro });

    // Load the data
    const loadedGoals = loadGoalsV2(tenant.tenantId);
    setGoals(loadedGoals);
    setStakeholders(loadedStakeholders);
  }, [tenant.tenantId]);

  // Parse filters from URL
  const filters: GoalsFilters = useMemo(() => {
    return {
      category: (searchParams.get("category") as any) || undefined,
      stakeholder_id: searchParams.get("stakeholder_id") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      time_horizon: (searchParams.get("time_horizon") as any) || undefined,
      q: searchParams.get("q") || undefined,
    };
  }, [searchParams]);

  // Update URL when filters change
  const handleFiltersChange = (newFilters: GoalsFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
    setPage(0); // Reset to first page when filters change
  };

  // Filter goals based on filters
  const filteredGoals = useMemo(() => {
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

  // Handle row click
  const handleRowClick = (goal: GoalV2) => {
    setSelectedGoal(goal);
    setIsDrawerOpen(true);
  };

  // Handle delete
  const handleDelete = (goalId: string) => {
    const updatedGoals = goals.filter((g) => g.id !== goalId);
    setGoals(updatedGoals);
    saveGoalsV2(tenant.tenantId, updatedGoals);
  };

  // Handle edit
  const handleEdit = (goal: GoalV2) => {
    // Navigate to wizard with goal ID for editing
    navigate(`/retina/goals/new?edit=${goal.id}`);
  };

  // Handle template selection
  const handleTemplateSelect = (template: GoalTemplate, industry: string) => {
    // Navigate to wizard with template data
    const templateData = encodeURIComponent(
      JSON.stringify({ template, industry })
    );
    navigate(`/retina/goals/new?template=${templateData}`);
  };

  // Handle import
  const handleImport = async (
    importedGoals: GoalV2[],
    dedupStrategy: DedupStrategy
  ) => {
    let updatedGoals = [...goals];

    importedGoals.forEach((importGoal) => {
      const existingIndex = updatedGoals.findIndex(
        (g) =>
          g.id === importGoal.id ||
          (g.statement.toLowerCase() === importGoal.statement.toLowerCase() &&
            g.category === importGoal.category)
      );

      if (existingIndex !== -1) {
        // Handle duplicate based on strategy
        if (dedupStrategy === "replace") {
          updatedGoals[existingIndex] = importGoal;
        } else if (dedupStrategy === "merge") {
          updatedGoals[existingIndex] = {
            ...updatedGoals[existingIndex],
            ...importGoal,
            id: updatedGoals[existingIndex].id, // Keep original ID
            updated_at: Date.now(),
          };
        }
        // skip: do nothing
      } else {
        // New goal
        updatedGoals.push({
          ...importGoal,
          tenant_id: tenant.tenantId,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    });

    setGoals(updatedGoals);
    saveGoalsV2(tenant.tenantId, updatedGoals);
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: goals.length,
      active: goals.filter((g) => g.status === "active").length,
      draft: goals.filter((g) => g.status === "draft").length,
      highPriority: goals.filter((g) => g.priority <= 2).length,
    };
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TargetIcon className="w-8 h-8" />
            Goals & Objectives
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage organizational goals with SMART validation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTemplatesOpen(true)}>
            <SparklesIcon className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={() => setIsImportExportOpen(true)}
                    disabled={isReadOnly()}
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Import/Export
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
          <Button variant="outline" asChild>
            <Link to="/retina/goals/map">
              <NetworkIcon className="w-4 h-4 mr-2" />
              Dependency Map
            </Link>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled={isReadOnly()} asChild={canEdit()}>
                    {canEdit() ? (
                      <Link to="/retina/goals/new">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Goal
                      </Link>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Goal
                      </>
                    )}
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <TargetIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {stats.active}
                </p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold mt-1 text-gray-600">
                  {stats.draft}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {stats.highPriority}
                </p>
              </div>
              <AlertCircleIcon className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <GoalsFiltersBarV2
            filters={filters}
            onFiltersChange={handleFiltersChange}
            stakeholders={stakeholders}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <GoalsTableV2
            goals={filteredGoals}
            stakeholders={stakeholders}
            onRowClick={handleRowClick}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <GoalDetailDrawerV2
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        goal={selectedGoal}
        stakeholders={stakeholders}
        allGoals={goals}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Import/Export Panel */}
      <ImportExportPanelV2
        open={isImportExportOpen}
        onOpenChange={setIsImportExportOpen}
        goals={goals}
        onImport={handleImport}
        onAuditEvent={(eventType, payload) => {
          console.log("Audit event:", eventType, payload);
        }}
      />

      {/* Templates Dialog */}
      <GoalTemplatesDialog
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
}
