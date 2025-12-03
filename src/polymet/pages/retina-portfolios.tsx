import { useState, useEffect } from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  fetchPortfolios,
  createPortfolioAPI,
  updatePortfolioAPI,
  deletePortfolioAPI,
  addDecisionToPortfolioAPI,
  removeDecisionFromPortfolioAPI,
} from "@/polymet/data/api-portfolios";
import type { DecisionPortfolio } from "@/polymet/data/decision-portfolios";
import { useRetinaStore } from "@/polymet/data/retina-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FolderIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignalRefreshBanner } from "@/polymet/components/signal-refresh-banner";
import { PortfolioAntifragilityCard } from "@/polymet/components/portfolio-antifragility-card";
import type { DecisionAntifragilityData } from "@/polymet/components/antifragility-comparison-view";
import { getDecisionHistory } from "@/polymet/data/antifragility-history";
import { TenantBenchmarkingPanel } from "@/polymet/components/tenant-benchmarking-panel";
// Toast notifications using simple alerts for now
const useToast = () => ({
  toast: ({
    title,
    description,
    variant,
  }: {
    title: string;
    description?: string;
    variant?: string;
  }) => {
    const message = description ? `${title}: ${description}` : title;
    if (variant === "destructive") {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  },
});

interface PortfolioFormData {
  portfolio_name: string;
  description: string;
  owner: string;
  time_horizon_months: number;
  goal_alignment: string;
}

export function RetinaPortfolios() {
  const { tenant } = useTenant();
  const { decisions } = useRetinaStore();
  const { toast } = useToast();
  const [portfolios, setPortfolios] = useState<DecisionPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manageDecisionsDialogOpen, setManageDecisionsDialogOpen] =
    useState(false);
  const [selectedPortfolio, setSelectedPortfolio] =
    useState<DecisionPortfolio | null>(null);
  const [formData, setFormData] = useState<PortfolioFormData>({
    portfolio_name: "",
    description: "",
    owner: "",
    time_horizon_months: 12,
    goal_alignment: "",
  });

  // Load portfolios
  const loadPortfolios = async () => {
    setLoading(true);
    const response = await fetchPortfolios(tenant.tenantId);
    if (response.success && response.data) {
      setPortfolios(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPortfolios();
  }, [tenant.tenantId]);

  // Handle create portfolio
  const handleCreate = async () => {
    if (!formData.portfolio_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Portfolio name is required",
        variant: "destructive",
      });
      return;
    }

    const response = await createPortfolioAPI(
      tenant.tenantId,
      {
        ...formData,
        decision_ids: [],
      },
      "Current User"
    );

    if (response.success) {
      toast({
        title: "Success",
        description: response.message || "Portfolio created successfully",
      });
      setCreateDialogOpen(false);
      setFormData({
        portfolio_name: "",
        description: "",
        owner: "",
        time_horizon_months: 12,
        goal_alignment: "",
      });
      loadPortfolios();
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to create portfolio",
        variant: "destructive",
      });
    }
  };

  // Handle update portfolio
  const handleUpdate = async () => {
    if (!selectedPortfolio) return;

    if (!formData.portfolio_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Portfolio name is required",
        variant: "destructive",
      });
      return;
    }

    const response = await updatePortfolioAPI(
      tenant.tenantId,
      selectedPortfolio.id,
      formData,
      "Current User"
    );

    if (response.success) {
      toast({
        title: "Success",
        description: response.message || "Portfolio updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedPortfolio(null);
      loadPortfolios();
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to update portfolio",
        variant: "destructive",
      });
    }
  };

  // Handle delete portfolio
  const handleDelete = async () => {
    if (!selectedPortfolio) return;

    const response = await deletePortfolioAPI(
      tenant.tenantId,
      selectedPortfolio.id,
      "Current User"
    );

    if (response.success) {
      toast({
        title: "Success",
        description: response.message || "Portfolio deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedPortfolio(null);
      loadPortfolios();
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to delete portfolio",
        variant: "destructive",
      });
    }
  };

  // Handle add decision to portfolio
  const handleAddDecision = async (decisionId: string) => {
    if (!selectedPortfolio) return;

    const response = await addDecisionToPortfolioAPI(
      tenant.tenantId,
      selectedPortfolio.id,
      decisionId,
      "Current User"
    );

    if (response.success) {
      toast({
        title: "Success",
        description: "Decision added to portfolio",
      });
      loadPortfolios();
      // Update selected portfolio
      if (response.data) {
        setSelectedPortfolio(response.data);
      }
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to add decision",
        variant: "destructive",
      });
    }
  };

  // Handle remove decision from portfolio
  const handleRemoveDecision = async (decisionId: string) => {
    if (!selectedPortfolio) return;

    const response = await removeDecisionFromPortfolioAPI(
      tenant.tenantId,
      selectedPortfolio.id,
      decisionId,
      "Current User"
    );

    if (response.success) {
      toast({
        title: "Success",
        description: "Decision removed from portfolio",
      });
      loadPortfolios();
      // Update selected portfolio
      if (response.data) {
        setSelectedPortfolio(response.data);
      }
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to remove decision",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (portfolio: DecisionPortfolio) => {
    setSelectedPortfolio(portfolio);
    setFormData({
      portfolio_name: portfolio.portfolio_name,
      description: portfolio.description,
      owner: portfolio.owner,
      time_horizon_months: portfolio.time_horizon_months,
      goal_alignment: portfolio.goal_alignment,
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (portfolio: DecisionPortfolio) => {
    setSelectedPortfolio(portfolio);
    setDeleteDialogOpen(true);
  };

  // Open manage decisions dialog
  const openManageDecisionsDialog = (portfolio: DecisionPortfolio) => {
    setSelectedPortfolio(portfolio);
    setManageDecisionsDialogOpen(true);
  };

  // Get tenant decisions
  const tenantDecisions = decisions.filter(
    (d) => d.tenantId === tenant.tenantId
  );

  // Calculate overall tenant metrics for benchmarking
  const calculateTenantMetrics = () => {
    if (portfolios.length === 0) {
      return {
        antifragilityIndex: 50,
        learningRate: 0.15,
        stabilityRatio: 0.7,
        shockAbsorption: 0.6,
        guardrailBreachRate: 0.15,
        decisionCount: tenantDecisions.length,
      };
    }

    // Calculate average antifragility across all portfolios
    const avgAntifragility =
      portfolios.reduce(
        (sum, p) => sum + calculatePortfolioAntifragility(p),
        0
      ) / portfolios.length;

    // Mock learning rate based on portfolio count and decision count
    const learningRate = Math.min(
      0.4,
      0.15 + portfolios.length * 0.02 + tenantDecisions.length * 0.001
    );

    // Mock stability ratio based on closed decisions
    const closedCount = tenantDecisions.filter(
      (d) => d.status === "closed"
    ).length;
    const stabilityRatio =
      tenantDecisions.length > 0
        ? Math.min(0.95, 0.6 + (closedCount / tenantDecisions.length) * 0.3)
        : 0.7;

    // Mock shock absorption
    const shockAbsorption = Math.min(0.9, avgAntifragility / 100 + 0.1);

    // Mock guardrail breach rate (inverse of stability)
    const guardrailBreachRate = Math.max(0.05, 0.25 - stabilityRatio * 0.2);

    return {
      antifragilityIndex: avgAntifragility,
      learningRate,
      stabilityRatio,
      shockAbsorption,
      guardrailBreachRate,
      decisionCount: tenantDecisions.length,
    };
  };

  const tenantMetrics = calculateTenantMetrics();

  // Calculate portfolio antifragility index
  const calculatePortfolioAntifragility = (
    portfolio: DecisionPortfolio
  ): number => {
    if (portfolio.decision_ids.length === 0) return 0;

    const portfolioDecisions = portfolio.decision_ids
      .map((id) => tenantDecisions.find((d) => d.id === id))
      .filter((d) => d !== undefined);

    if (portfolioDecisions.length === 0) return 0;

    // Mock calculation - in real app, this would use actual resilience metrics
    // For now, use a simple average based on decision status and age
    const indices = portfolioDecisions.map((decision) => {
      const baseIndex = decision.status === "closed" ? 60 : 50;
      const ageBonus = Math.min(
        20,
        Math.floor((Date.now() - decision.createdAt) / (1000 * 60 * 60 * 24))
      );
      return baseIndex + ageBonus;
    });

    return indices.reduce((sum, idx) => sum + idx, 0) / indices.length;
  };

  // Get decision antifragility data for comparison
  const getDecisionAntifragilityData = (
    portfolio: DecisionPortfolio
  ): DecisionAntifragilityData[] => {
    return portfolio.decision_ids
      .map((id) => {
        const decision = tenantDecisions.find((d) => d.id === id);
        if (!decision) return null;

        const history = getDecisionHistory(tenant.tenantId, id);
        const currentValue =
          history?.snapshots[history.snapshots.length - 1]?.value || 50;
        const previousValue =
          history?.snapshots[history.snapshots.length - 2]?.value;

        return {
          decisionId: decision.id,
          decisionTitle: decision.title,
          antifragilityIndex: currentValue,
          status: decision.status,
          chosenOption: decision.chosenOptionLabel,
          trend: previousValue
            ? {
                direction:
                  currentValue > previousValue + 2
                    ? ("up" as const)
                    : currentValue < previousValue - 2
                      ? ("down" as const)
                      : ("stable" as const),
                change: currentValue - previousValue,
                previousValue,
              }
            : undefined,
        };
      })
      .filter((d) => d !== null) as DecisionAntifragilityData[];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Signal Refresh Banner */}
      <SignalRefreshBanner tenantId={tenant.tenantId} className="mb-6" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Portfolios</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircleIcon className="w-5 h-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Tracks every time decisions are grouped or reorganized.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground mt-1">
            Group related decisions under one theme
          </p>
        </div>
        <div className="flex gap-2">
          <TenantBenchmarkingPanel
            tenantId={tenant.tenantId}
            currentMetrics={tenantMetrics}
            industry="Financial Services"
            size="medium"
            onAuditEvent={(eventType, payload) => {
              console.log("Benchmarking audit:", eventType, payload);
            }}
          />

          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Portfolio
          </Button>
        </div>
      </div>

      {/* Portfolios Grid with Antifragility Cards */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading portfolios...</p>
        </div>
      ) : portfolios.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FolderIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />

            <p className="text-muted-foreground mb-4">
              No portfolios yet. Create one to get started.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Your First Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {portfolios.map((portfolio) => {
            const antifragilityIndex =
              calculatePortfolioAntifragility(portfolio);
            const decisionData = getDecisionAntifragilityData(portfolio);

            return (
              <div key={portfolio.id} className="space-y-4">
                {/* Portfolio Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <FolderIcon className="w-5 h-5 text-primary" />

                        <CardTitle className="text-lg">
                          {portfolio.portfolio_name}
                        </CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(portfolio)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(portfolio)}
                        >
                          <TrashIcon className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {portfolio.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Owner:</span>
                        <p className="font-medium truncate">
                          {portfolio.owner}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Horizon:</span>
                        <p className="font-medium">
                          {portfolio.time_horizon_months} months
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <Badge variant="secondary">
                        {portfolio.decision_ids.length} decision
                        {portfolio.decision_ids.length !== 1 ? "s" : ""}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openManageDecisionsDialog(portfolio)}
                      >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Antifragility Card */}
                <PortfolioAntifragilityCard
                  portfolioId={portfolio.id}
                  portfolioName={portfolio.portfolio_name}
                  tenantId={tenant.tenantId}
                  currentIndex={antifragilityIndex}
                  decisions={decisionData}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Create Portfolio Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Portfolio</DialogTitle>
            <DialogDescription>
              Group related decisions under one theme
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Portfolio Name *</Label>
              <Input
                id="name"
                value={formData.portfolio_name}
                onChange={(e) =>
                  setFormData({ ...formData, portfolio_name: e.target.value })
                }
                placeholder="e.g., Cloud Migration Strategy"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this portfolio"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) =>
                    setFormData({ ...formData, owner: e.target.value })
                  }
                  placeholder="e.g., CTO Office"
                />
              </div>
              <div>
                <Label htmlFor="horizon">Time Horizon (months)</Label>
                <Input
                  id="horizon"
                  type="number"
                  value={formData.time_horizon_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time_horizon_months: parseInt(e.target.value) || 12,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="alignment">Goal Alignment</Label>
              <Textarea
                id="alignment"
                value={formData.goal_alignment}
                onChange={(e) =>
                  setFormData({ ...formData, goal_alignment: e.target.value })
                }
                placeholder="How does this portfolio align with organizational goals?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Portfolio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Portfolio Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>Update portfolio information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Portfolio Name *</Label>
              <Input
                id="edit-name"
                value={formData.portfolio_name}
                onChange={(e) =>
                  setFormData({ ...formData, portfolio_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-owner">Owner</Label>
                <Input
                  id="edit-owner"
                  value={formData.owner}
                  onChange={(e) =>
                    setFormData({ ...formData, owner: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-horizon">Time Horizon (months)</Label>
                <Input
                  id="edit-horizon"
                  type="number"
                  value={formData.time_horizon_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time_horizon_months: parseInt(e.target.value) || 12,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-alignment">Goal Alignment</Label>
              <Textarea
                id="edit-alignment"
                value={formData.goal_alignment}
                onChange={(e) =>
                  setFormData({ ...formData, goal_alignment: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Portfolio Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this portfolio?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              Portfolio: <strong>{selectedPortfolio?.portfolio_name}</strong>
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Deleting this portfolio will unlink{" "}
                {selectedPortfolio?.decision_ids.length || 0} decision(s), but
                the decisions themselves will NOT be deleted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Decisions Dialog */}
      <Dialog
        open={manageDecisionsDialogOpen}
        onOpenChange={setManageDecisionsDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Decisions</DialogTitle>
            <DialogDescription>
              Add or remove decisions from {selectedPortfolio?.portfolio_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Decisions */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Current Decisions ({selectedPortfolio?.decision_ids.length || 0}
                )
              </h3>
              {selectedPortfolio &&
              selectedPortfolio.decision_ids.length > 0 ? (
                <div className="space-y-2">
                  {selectedPortfolio.decision_ids.map((decisionId) => {
                    const decision = tenantDecisions.find(
                      (d) => d.id === decisionId
                    );
                    if (!decision) return null;
                    return (
                      <div
                        key={decisionId}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{decision.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {decision.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDecision(decisionId)}
                        >
                          <TrashIcon className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No decisions in this portfolio yet
                </p>
              )}
            </div>

            {/* Available Decisions */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Available Decisions
              </h3>
              {tenantDecisions.filter(
                (d) => !selectedPortfolio?.decision_ids.includes(d.id)
              ).length > 0 ? (
                <div className="space-y-2">
                  {tenantDecisions
                    .filter(
                      (d) => !selectedPortfolio?.decision_ids.includes(d.id)
                    )
                    .map((decision) => (
                      <div
                        key={decision.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{decision.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {decision.description}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddDecision(decision.id)}
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  All decisions are already in this portfolio
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setManageDecisionsDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
