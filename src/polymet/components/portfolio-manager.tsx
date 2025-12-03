import { useState, useEffect } from "react";
import {
  loadPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addDecisionToPortfolio,
  removeDecisionFromPortfolio,
  getPortfoliosForDecision,
  updatePortfolioMetrics,
  type DecisionPortfolio,
  type DecisionMetricsData,
} from "@/polymet/data/decision-portfolios";
import {
  PortfolioSummaryCard,
  getDiversificationLabel,
  getAntifragilityTrend,
  aggregateTopDrivers,
} from "@/polymet/components/portfolio-summary-card";
import { PortfolioBriefGenerator } from "@/polymet/components/portfolio-brief-generator";
import { PortfolioComparisonView } from "@/polymet/components/portfolio-comparison-view";
import { PortfolioNarrativeManager } from "@/polymet/components/portfolio-narrative-manager";
import { useTenant } from "@/polymet/data/tenant-context";
import { useRetinaStore } from "@/polymet/data/retina-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  FolderOpenIcon,
  InfoIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioManagerProps {
  tenantId: string;
  currentDecisionId?: string;
  currentDecisionTitle?: string;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function PortfolioManager({
  tenantId,
  currentDecisionId,
  currentDecisionTitle,
  onAuditEvent,
}: PortfolioManagerProps) {
  const { tenant } = useTenant();
  const { decisions } = useRetinaStore();
  const [portfolios, setPortfolios] = useState<DecisionPortfolio[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] =
    useState<DecisionPortfolio | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [computingMetrics, setComputingMetrics] = useState<string | null>(null);
  const [manageDecisionsDialogOpen, setManageDecisionsDialogOpen] =
    useState(false);
  const [managingPortfolio, setManagingPortfolio] =
    useState<DecisionPortfolio | null>(null);
  const [selectedDecisionsForPortfolio, setSelectedDecisionsForPortfolio] =
    useState<string[]>([]);
  const [briefDialogOpen, setBriefDialogOpen] = useState(false);
  const [selectedPortfolioForBrief, setSelectedPortfolioForBrief] =
    useState<DecisionPortfolio | null>(null);
  const [narrativeDialogOpen, setNarrativeDialogOpen] = useState(false);
  const [selectedPortfolioForNarrative, setSelectedPortfolioForNarrative] =
    useState<DecisionPortfolio | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "summary">("cards");
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    "name" | "ev" | "diversification" | "antifragility"
  >("name");
  const [filterBy, setFilterBy] = useState<"all" | "high" | "medium" | "low">(
    "all"
  );

  // Form state
  const [formData, setFormData] = useState({
    portfolio_name: "",
    description: "",
    owner: "Admin User",
    time_horizon_months: 12,
    goal_alignment: "",
  });

  const loadData = () => {
    const loaded = loadPortfolios(tenantId);
    setPortfolios(loaded);

    // Load selected portfolios for current decision
    if (currentDecisionId) {
      const decisionPortfolios = getPortfoliosForDecision(
        tenantId,
        currentDecisionId
      );
      setSelectedPortfolios(decisionPortfolios.map((p) => p.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId, currentDecisionId]);

  const resetForm = () => {
    setFormData({
      portfolio_name: "",
      description: "",
      owner: "Admin User",
      time_horizon_months: 12,
      goal_alignment: "",
    });
    setEditingPortfolio(null);
  };

  const handleCreate = () => {
    const newPortfolio = createPortfolio(tenantId, {
      ...formData,
      decision_ids: currentDecisionId ? [currentDecisionId] : [],
    });

    onAuditEvent?.("portfolio.created", {
      portfolioId: newPortfolio.id,
      portfolioName: newPortfolio.portfolio_name,
      initialDecisions: newPortfolio.decision_ids.length,
    });

    loadData();
    resetForm();
    setCreateDialogOpen(false);
  };

  const handleUpdate = () => {
    if (!editingPortfolio) return;

    const updated = updatePortfolio(tenantId, editingPortfolio.id, formData);

    if (updated) {
      onAuditEvent?.("portfolio.updated", {
        portfolioId: updated.id,
        portfolioName: updated.portfolio_name,
      });
    }

    loadData();
    resetForm();
    setCreateDialogOpen(false);
  };

  const handleDelete = (portfolioId: string, portfolioName: string) => {
    if (confirm(`Are you sure you want to delete "${portfolioName}"?`)) {
      deletePortfolio(tenantId, portfolioId);

      onAuditEvent?.("portfolio.deleted", {
        portfolioId,
        portfolioName,
      });

      loadData();
    }
  };

  const handleEdit = (portfolio: DecisionPortfolio) => {
    setEditingPortfolio(portfolio);
    setFormData({
      portfolio_name: portfolio.portfolio_name,
      description: portfolio.description,
      owner: portfolio.owner,
      time_horizon_months: portfolio.time_horizon_months,
      goal_alignment: portfolio.goal_alignment,
    });
    setCreateDialogOpen(true);
  };

  const handleAssignDecision = () => {
    if (!currentDecisionId) return;

    // Get current portfolios for decision
    const currentPortfolios = getPortfoliosForDecision(
      tenantId,
      currentDecisionId
    );
    const currentPortfolioIds = currentPortfolios.map((p) => p.id);

    // Find portfolios to add and remove
    const toAdd = selectedPortfolios.filter(
      (id) => !currentPortfolioIds.includes(id)
    );
    const toRemove = currentPortfolioIds.filter(
      (id) => !selectedPortfolios.includes(id)
    );

    // Add to new portfolios
    toAdd.forEach((portfolioId) => {
      addDecisionToPortfolio(tenantId, portfolioId, currentDecisionId);
    });

    // Remove from old portfolios
    toRemove.forEach((portfolioId) => {
      removeDecisionFromPortfolio(tenantId, portfolioId, currentDecisionId);
    });

    onAuditEvent?.("decision.portfolios.updated", {
      decisionId: currentDecisionId,
      decisionTitle: currentDecisionTitle,
      added: toAdd.length,
      removed: toRemove.length,
      totalPortfolios: selectedPortfolios.length,
    });

    loadData();
    setAssignDialogOpen(false);
  };

  const handleTogglePortfolio = (portfolioId: string) => {
    setSelectedPortfolios((prev) =>
      prev.includes(portfolioId)
        ? prev.filter((id) => id !== portfolioId)
        : [...prev, portfolioId]
    );
  };

  const handleOpenManageDecisions = (portfolio: DecisionPortfolio) => {
    setManagingPortfolio(portfolio);
    setSelectedDecisionsForPortfolio([...portfolio.decision_ids]);
    setManageDecisionsDialogOpen(true);
  };

  const handleSaveDecisionAssignments = () => {
    if (!managingPortfolio) return;

    // Find decisions to add and remove
    const toAdd = selectedDecisionsForPortfolio.filter(
      (id) => !managingPortfolio.decision_ids.includes(id)
    );
    const toRemove = managingPortfolio.decision_ids.filter(
      (id) => !selectedDecisionsForPortfolio.includes(id)
    );

    // Add new decisions
    toAdd.forEach((decisionId) => {
      addDecisionToPortfolio(tenantId, managingPortfolio.id, decisionId);
    });

    // Remove old decisions
    toRemove.forEach((decisionId) => {
      removeDecisionFromPortfolio(tenantId, managingPortfolio.id, decisionId);
    });

    onAuditEvent?.("portfolio.decisions.updated", {
      portfolioId: managingPortfolio.id,
      portfolioName: managingPortfolio.portfolio_name,
      added: toAdd.length,
      removed: toRemove.length,
      totalDecisions: selectedDecisionsForPortfolio.length,
    });

    loadData();
    setManageDecisionsDialogOpen(false);
    setManagingPortfolio(null);
  };

  const handleToggleDecisionForPortfolio = (decisionId: string) => {
    setSelectedDecisionsForPortfolio((prev) =>
      prev.includes(decisionId)
        ? prev.filter((id) => id !== decisionId)
        : [...prev, decisionId]
    );
  };

  const handleComputeMetrics = async (portfolio: DecisionPortfolio) => {
    setComputingMetrics(portfolio.id);

    try {
      // Get decision data for this portfolio
      const portfolioDecisions = decisions.filter(
        (d) =>
          portfolio.decision_ids.includes(d.id) &&
          d.status === "closed" &&
          d.metrics
      );

      if (portfolioDecisions.length === 0) {
        alert(
          "No closed decisions with metrics found in this portfolio. Close and simulate decisions first."
        );
        setComputingMetrics(null);
        return;
      }

      // Map to DecisionMetricsData format
      const metricsData: DecisionMetricsData[] = portfolioDecisions.map(
        (d) => ({
          decisionId: d.id,
          chosenOptionId: d.chosenOptionId || "",
          ev: d.metrics?.ev || 0,
          var95: d.metrics?.var95 || 0,
          cvar95: d.metrics?.cvar95 || 0,
          weight: 1, // Equal weight for now
        })
      );

      // Compute and update metrics
      const updated = updatePortfolioMetrics(
        tenantId,
        portfolio.id,
        metricsData
      );

      if (updated) {
        onAuditEvent?.("portfolio.metrics.computed", {
          portfolioId: portfolio.id,
          portfolioName: portfolio.portfolio_name,
          decisionsAnalyzed: metricsData.length,
          metrics: updated.metrics,
        });

        loadData();
      }
    } catch (error) {
      console.error("Failed to compute metrics:", error);
      alert("Failed to compute portfolio metrics. See console for details.");
    } finally {
      setComputingMetrics(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-5 h-5 text-primary" />

          <h3 className="text-lg font-semibold">Decision Portfolios</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Lets you view several decisions together — like an investment
                  or strategy bundle.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex gap-2">
          {currentDecisionId && (
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpenIcon className="w-4 h-4 mr-2" />
                  Assign to Portfolio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign to Portfolios</DialogTitle>
                  <DialogDescription>
                    Select portfolios for "{currentDecisionTitle}"
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {viewMode === "summary" && portfolios.length > 0 ? (
                    // Summary View with Portfolio Summary Cards
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {portfolios
                        .filter((portfolio) => {
                          // Apply diversification filter
                          if (filterBy === "all") return true;
                          if (!portfolio.metrics) return false;

                          const label = getDiversificationLabel(
                            portfolio.metrics.diversification_index
                          );

                          if (filterBy === "high") return label === "High";
                          if (filterBy === "medium") return label === "Medium";
                          if (filterBy === "low") return label === "Low";
                          return true;
                        })
                        .sort((a, b) => {
                          // Apply sorting
                          if (sortBy === "name") {
                            return a.portfolio_name.localeCompare(
                              b.portfolio_name
                            );
                          }
                          if (sortBy === "ev") {
                            const aEV =
                              a.metrics?.aggregate_expected_value || 0;
                            const bEV =
                              b.metrics?.aggregate_expected_value || 0;
                            return bEV - aEV; // Descending
                          }
                          if (sortBy === "diversification") {
                            const aDiv = a.metrics?.diversification_index || 0;
                            const bDiv = b.metrics?.diversification_index || 0;
                            return bDiv - aDiv; // Descending
                          }
                          if (sortBy === "antifragility") {
                            const aAnti = a.metrics?.antifragility_score || 0;
                            const bAnti = b.metrics?.antifragility_score || 0;
                            return bAnti - aAnti; // Descending
                          }
                          return 0;
                        })
                        .map((portfolio) => {
                          // Compute summary data for each portfolio
                          const portfolioDecisions = decisions.filter(
                            (d) =>
                              portfolio.decision_ids.includes(d.id) &&
                              d.status === "closed" &&
                              d.metrics
                          );

                          // Aggregate top drivers from decisions
                          const decisionDrivers = portfolioDecisions
                            .filter(
                              (d) =>
                                d.topSensitiveFactors &&
                                d.topSensitiveFactors.length > 0
                            )
                            .map((d) => ({
                              decisionId: d.id,
                              drivers: d.topSensitiveFactors || [],
                            }));

                          const topDrivers =
                            aggregateTopDrivers(decisionDrivers);

                          // Get diversification label
                          const diversificationLabel = portfolio.metrics
                            ? getDiversificationLabel(
                                portfolio.metrics.diversification_index
                              )
                            : ("Low" as const);

                          // Get antifragility trend using historical data
                          const antifragilityTrend = portfolio.metrics
                            ? getAntifragilityTrend(
                                portfolio.metrics.antifragility_score,
                                portfolio.metricsHistory
                              )
                            : ("stable" as const);

                          return (
                            <PortfolioSummaryCard
                              key={portfolio.id}
                              data={{
                                portfolio,
                                topDrivers,
                                diversificationLabel,
                                antifragilityTrend,
                              }}
                              onGenerateBrief={(portfolioId) => {
                                setSelectedPortfolioForBrief(portfolio);
                                setBriefDialogOpen(true);
                              }}
                            />
                          );
                        })}
                    </div>
                  ) : portfolios.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No portfolios yet. Create one first.
                    </p>
                  ) : (
                    portfolios.map((portfolio) => (
                      <div
                        key={portfolio.id}
                        className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleTogglePortfolio(portfolio.id)}
                      >
                        <Checkbox
                          checked={selectedPortfolios.includes(portfolio.id)}
                          onCheckedChange={() =>
                            handleTogglePortfolio(portfolio.id)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {portfolio.portfolio_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {portfolio.description}
                          </div>
                          <Badge variant="secondary" className="mt-1">
                            {portfolio.decision_ids.length} decisions
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAssignDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAssignDecision}>
                    Save Assignment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPortfolio ? "Edit Portfolio" : "Create Portfolio"}
                </DialogTitle>
                <DialogDescription>
                  Group related choices under one theme
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolio_name">Portfolio Name</Label>
                  <Input
                    id="portfolio_name"
                    value={formData.portfolio_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        portfolio_name: e.target.value,
                      })
                    }
                    placeholder="e.g., Cloud Migration Strategy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the purpose of this portfolio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">Owner</Label>
                    <Input
                      id="owner"
                      value={formData.owner}
                      onChange={(e) =>
                        setFormData({ ...formData, owner: e.target.value })
                      }
                      placeholder="Portfolio owner"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_horizon_months">
                      Time Horizon (months)
                    </Label>
                    <Input
                      id="time_horizon_months"
                      type="number"
                      value={formData.time_horizon_months}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          time_horizon_months: Number(e.target.value),
                        })
                      }
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal_alignment">Goal Alignment</Label>
                  <Textarea
                    id="goal_alignment"
                    value={formData.goal_alignment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goal_alignment: e.target.value,
                      })
                    }
                    placeholder="How does this portfolio align with organizational goals?"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingPortfolio ? handleUpdate : handleCreate}
                  disabled={!formData.portfolio_name || !formData.description}
                >
                  {editingPortfolio ? "Update" : "Create"} Portfolio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View Mode Toggle & Actions */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {viewMode === "summary" && (
            <>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="ev">Expected Value</SelectItem>
                  <SelectItem value="diversification">
                    Diversification
                  </SelectItem>
                  <SelectItem value="antifragility">Antifragility</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterBy}
                onValueChange={(value: any) => setFilterBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Portfolios</SelectItem>
                  <SelectItem value="high">High Diversification</SelectItem>
                  <SelectItem value="medium">Medium Diversification</SelectItem>
                  <SelectItem value="low">Low Diversification</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setComparisonDialogOpen(true)}
            disabled={portfolios.length < 2}
          >
            Compare Portfolios
          </Button>
          <Button
            size="sm"
            variant={viewMode === "cards" ? "default" : "outline"}
            onClick={() => setViewMode("cards")}
          >
            Detailed View
          </Button>
          <Button
            size="sm"
            variant={viewMode === "summary" ? "default" : "outline"}
            onClick={() => setViewMode("summary")}
          >
            Summary View
          </Button>
        </div>
      </div>

      {/* Portfolio List */}
      <div className="space-y-3">
        {portfolios.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FolderIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                No portfolios yet. Create one to group related decisions.
              </p>
            </CardContent>
          </Card>
        ) : (
          portfolios.map((portfolio) => {
            // Get decision titles for this portfolio
            const portfolioDecisions = decisions.filter((d) =>
              portfolio.decision_ids.includes(d.id)
            );
            const isAssigned =
              currentDecisionId &&
              portfolio.decision_ids.includes(currentDecisionId);

            return (
              <Card
                key={portfolio.id}
                className={isAssigned ? "border-primary" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {portfolio.portfolio_name}
                        </CardTitle>
                        {isAssigned && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{portfolio.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenManageDecisions(portfolio)
                              }
                              className="hover:bg-accent"
                            >
                              <FolderOpenIcon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manage Decisions</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(portfolio)}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(portfolio.id, portfolio.portfolio_name)
                        }
                      >
                        <TrashIcon className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Owner:</span>{" "}
                      <span className="font-medium">{portfolio.owner}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Time Horizon:
                      </span>{" "}
                      <span className="font-medium">
                        {portfolio.time_horizon_months} months
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Goal Alignment:
                    </span>
                    <p className="mt-1 text-foreground">
                      {portfolio.goal_alignment}
                    </p>
                  </div>

                  {/* Portfolio Metrics */}
                  {portfolio.metrics ? (
                    <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Portfolio Metrics
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoIcon className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                {portfolio.metrics.plain_language_label}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">
                            Aggregate EV
                          </div>
                          <div className="font-semibold text-sm">
                            $
                            {portfolio.metrics.aggregate_expected_value.toFixed(
                              0
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Aggregate VaR95
                          </div>
                          <div className="font-semibold text-sm">
                            ${portfolio.metrics.aggregate_var95.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Aggregate CVaR95
                          </div>
                          <div className="font-semibold text-sm">
                            ${portfolio.metrics.aggregate_cvar95.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Diversification
                          </div>
                          <div className="font-semibold text-sm">
                            {(
                              portfolio.metrics.diversification_index * 100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground text-xs">
                            Antifragility Score
                          </div>
                          <div className="font-bold text-sm">
                            {portfolio.metrics.antifragility_score.toFixed(0)}
                            /100
                          </div>
                        </div>
                        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${portfolio.metrics.antifragility_score}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground pt-1">
                        Computed{" "}
                        {new Date(
                          portfolio.metrics.computed_at
                        ).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        No metrics computed yet
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComputeMetrics(portfolio)}
                          disabled={computingMetrics === portfolio.id}
                        >
                          {computingMetrics === portfolio.id
                            ? "Computing..."
                            : "Compute Metrics"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPortfolioForNarrative(portfolio);
                            setNarrativeDialogOpen(true);
                          }}
                        >
                          Generate Narrative
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Decision List */}
                  {portfolioDecisions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Decisions in Portfolio
                      </div>
                      <div className="space-y-1">
                        {portfolioDecisions.map((decision) => (
                          <div
                            key={decision.id}
                            className="text-xs p-2 bg-muted/50 rounded border border-border"
                          >
                            <div className="font-medium">{decision.title}</div>
                            <div className="text-muted-foreground">
                              Closed{" "}
                              {new Date(decision.closedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {portfolio.decision_ids.length} decisions
                    </Badge>
                    <Badge variant="outline">
                      Created{" "}
                      {new Date(portfolio.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Manage Decisions Dialog */}
      <Dialog
        open={manageDecisionsDialogOpen}
        onOpenChange={(open) => {
          setManageDecisionsDialogOpen(open);
          if (!open) {
            setManagingPortfolio(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Decisions</DialogTitle>
            <DialogDescription>
              Select decisions to include in "
              {managingPortfolio?.portfolio_name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No closed decisions available. Close some decisions first.
              </p>
            ) : (
              decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleDecisionForPortfolio(decision.id)}
                >
                  <Checkbox
                    checked={selectedDecisionsForPortfolio.includes(
                      decision.id
                    )}
                    onCheckedChange={() =>
                      handleToggleDecisionForPortfolio(decision.id)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{decision.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Closed {new Date(decision.closedAt).toLocaleDateString()}{" "}
                      •{" "}
                      {
                        decision.options.find(
                          (o) => o.id === decision.chosenOptionId
                        )?.label
                      }
                    </div>
                    {decision.metrics && (
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          EV: ${decision.metrics.ev.toFixed(0)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          RAROC: {(decision.metrics.raroc * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManageDecisionsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDecisionAssignments}>
              Save ({selectedDecisionsForPortfolio.length} selected)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portfolio Brief Generator Dialog */}
      {selectedPortfolioForBrief && (
        <PortfolioBriefGenerator
          open={briefDialogOpen}
          onOpenChange={setBriefDialogOpen}
          portfolio={selectedPortfolioForBrief}
          decisions={decisions}
          onAuditEvent={onAuditEvent}
        />
      )}

      {/* Portfolio Comparison Dialog */}
      <PortfolioComparisonView
        open={comparisonDialogOpen}
        onOpenChange={setComparisonDialogOpen}
        portfolios={portfolios}
        onAuditEvent={onAuditEvent}
      />

      {/* Portfolio Narrative Manager Dialog */}
      {selectedPortfolioForNarrative && (
        <PortfolioNarrativeManager
          open={narrativeDialogOpen}
          onOpenChange={setNarrativeDialogOpen}
          portfolio={selectedPortfolioForNarrative}
          tenantId={tenantId}
          onAuditEvent={onAuditEvent}
        />
      )}
    </div>
  );
}
