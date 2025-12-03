import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  XIcon,
  DownloadIcon,
  GripVerticalIcon,
  CheckCheckIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DecisionPortfolio } from "@/polymet/data/decision-portfolios";

interface PortfolioComparisonViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolios: DecisionPortfolio[];
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function PortfolioComparisonView({
  open,
  onOpenChange,
  portfolios,
  onAuditEvent,
}: PortfolioComparisonViewProps) {
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleTogglePortfolio = (
    portfolioId: string,
    index: number,
    event?: React.MouseEvent
  ) => {
    // Handle Shift+Click for range selection
    if (
      event?.shiftKey &&
      lastClickedIndex !== null &&
      lastClickedIndex !== index
    ) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const rangeIds = portfolios.slice(start, end + 1).map((p) => p.id);

      setSelectedPortfolios((prev) => {
        const newSelection = new Set(prev);
        rangeIds.forEach((id) => {
          if (newSelection.size < 4 || newSelection.has(id)) {
            newSelection.add(id);
          }
        });
        return Array.from(newSelection).slice(0, 4);
      });
      setLastClickedIndex(index);
      return;
    }

    setSelectedPortfolios((prev) => {
      if (prev.includes(portfolioId)) {
        return prev.filter((id) => id !== portfolioId);
      }
      // Limit to 4 portfolios for comparison
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, portfolioId];
    });
    setLastClickedIndex(index);
  };

  const handleSelectAll = () => {
    const firstFour = portfolios.slice(0, 4).map((p) => p.id);
    setSelectedPortfolios(firstFour);
    if (onAuditEvent) {
      onAuditEvent("portfolio.select_all", {
        portfolioIds: firstFour,
        count: firstFour.length,
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...selectedPortfolios];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);
    setSelectedPortfolios(newOrder);

    if (onAuditEvent) {
      onAuditEvent("portfolio.reordered", {
        from: draggedIndex,
        to: index,
        portfolioIds: newOrder,
      });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const exportToCSV = () => {
    const headers = [
      "Portfolio Name",
      "Description",
      "Owner",
      "Decisions",
      "Time Horizon (months)",
      "Total EV",
      "VaR95",
      "CVaR95",
      "Diversification Index",
      "Antifragility Score",
    ];

    const rows = selectedPortfolioData.map((p) => [
      p.portfolio_name,
      p.description,
      p.owner,
      p.decision_ids.length.toString(),
      p.time_horizon_months.toString(),
      p.metrics?.aggregate_expected_value.toFixed(2) || "N/A",
      p.metrics?.aggregate_var95.toFixed(2) || "N/A",
      p.metrics?.aggregate_cvar95.toFixed(2) || "N/A",
      p.metrics?.diversification_index.toFixed(4) || "N/A",
      p.metrics?.antifragility_score.toFixed(2) || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `portfolio-comparison-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onAuditEvent) {
      onAuditEvent("portfolio.comparison_exported", {
        format: "csv",
        portfolioIds: selectedPortfolios,
        count: selectedPortfolios.length,
      });
    }
  };

  const exportToPDF = () => {
    // Simple PDF export using browser print
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Portfolio Comparison Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .portfolio { margin-bottom: 30px; page-break-inside: avoid; }
            .portfolio h2 { color: #555; margin-bottom: 10px; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .metric { padding: 10px; background: #f5f5f5; border-radius: 4px; }
            .metric-label { font-size: 12px; color: #666; }
            .metric-value { font-size: 18px; font-weight: bold; color: #333; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Portfolio Comparison Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          ${selectedPortfolioData
            .map(
              (p) => `
            <div class="portfolio">
              <h2>${p.portfolio_name}</h2>
              <p><strong>Description:</strong> ${p.description}</p>
              <p><strong>Owner:</strong> ${p.owner}</p>
              <p><strong>Time Horizon:</strong> ${p.time_horizon_months} months</p>
              <p><strong>Decisions:</strong> ${p.decision_ids.length}</p>
              ${
                p.metrics
                  ? `
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-label">Total Expected Value</div>
                    <div class="metric-value">${p.metrics.aggregate_expected_value.toFixed(0)}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">VaR95</div>
                    <div class="metric-value">${p.metrics.aggregate_var95.toFixed(0)}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">CVaR95</div>
                    <div class="metric-value">${p.metrics.aggregate_cvar95.toFixed(0)}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Diversification Index</div>
                    <div class="metric-value">${(p.metrics.diversification_index * 100).toFixed(0)}%</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Antifragility Score</div>
                    <div class="metric-value">${p.metrics.antifragility_score.toFixed(0)}/100</div>
                  </div>
                </div>
              `
                  : "<p>No metrics available</p>"
              }
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    if (onAuditEvent) {
      onAuditEvent("portfolio.comparison_exported", {
        format: "pdf",
        portfolioIds: selectedPortfolios,
        count: selectedPortfolios.length,
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A: Select All (first 4)
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        handleSelectAll();
      }
      // Escape: Clear selection
      if (e.key === "Escape" && selectedPortfolios.length > 0) {
        e.preventDefault();
        setSelectedPortfolios([]);
      }
      // Ctrl/Cmd + E: Export to CSV
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        if (selectedPortfolios.length > 0) {
          exportToCSV();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedPortfolios, portfolios]);

  const selectedPortfolioData = portfolios.filter((p) =>
    selectedPortfolios.includes(p.id)
  );

  const getDiversificationLabel = (index: number) => {
    if (index >= 0.7) return { label: "High", color: "bg-green-500" };
    if (index >= 0.4) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Low", color: "bg-red-500" };
  };

  const compareMetric = (
    value1: number,
    value2: number,
    higherIsBetter: boolean
  ) => {
    const diff = value1 - value2;
    if (Math.abs(diff) < 0.01) {
      return { icon: MinusIcon, color: "text-muted-foreground", diff: 0 };
    }
    const isBetter = higherIsBetter ? diff > 0 : diff < 0;
    return {
      icon: isBetter ? TrendingUpIcon : TrendingDownIcon,
      color: isBetter
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400",
      diff,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Portfolio Comparison</DialogTitle>
          <DialogDescription>
            Compare up to 4 portfolios side-by-side
          </DialogDescription>
        </DialogHeader>

        {selectedPortfolios.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Select multiple portfolios to compare (up to 4):
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={portfolios.length === 0}
                  className="h-7"
                >
                  <CheckCheckIcon className="h-3 w-3 mr-1" />
                  Select All
                </Button>
              </div>
              <Badge variant="secondary">
                {selectedPortfolios.length} / 4 selected
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p>
                <strong>Keyboard shortcuts:</strong>
              </p>
              <p>
                •{" "}
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                  Shift + Click
                </kbd>{" "}
                - Range selection
              </p>
              <p>
                •{" "}
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                  Ctrl/Cmd + A
                </kbd>{" "}
                - Select all (first 4)
              </p>
              <p>
                •{" "}
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                  Ctrl/Cmd + E
                </kbd>{" "}
                - Export to CSV
              </p>
              <p>
                •{" "}
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                  Esc
                </kbd>{" "}
                - Clear selection
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
              {portfolios.map((portfolio, index) => {
                const isSelected = selectedPortfolios.includes(portfolio.id);
                const isDisabled =
                  selectedPortfolios.length >= 4 && !isSelected;

                return (
                  <div
                    key={portfolio.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : isDisabled
                          ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                          : "border-border hover:bg-accent/50 hover:border-primary/50"
                    }`}
                    onClick={(e) => {
                      if (!isDisabled) {
                        handleTogglePortfolio(portfolio.id, index, e);
                      }
                    }}
                  >
                    <Checkbox checked={isSelected} disabled={isDisabled} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">
                          {portfolio.portfolio_name}
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {portfolio.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          {portfolio.decision_ids.length} decisions
                        </Badge>
                        {portfolio.metrics && (
                          <Badge variant="outline" className="text-xs">
                            EV: $
                            {(
                              portfolio.metrics.aggregate_expected_value / 1000
                            ).toFixed(0)}
                            K
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedPortfolios.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {selectedPortfolios.length} portfolio
                  {selectedPortfolios.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPortfolios([])}
                  >
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Trigger comparison view
                      if (onAuditEvent) {
                        onAuditEvent("portfolio.comparison_started", {
                          portfolioIds: selectedPortfolios,
                          count: selectedPortfolios.length,
                        });
                      }
                    }}
                  >
                    Compare Selected
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Comparing {selectedPortfolios.length} portfolio
                {selectedPortfolios.length !== 1 ? "s" : ""}
                <span className="ml-2 text-xs">(Drag cards to reorder)</span>
              </p>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToCSV}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF}>
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPortfolios([])}
                >
                  Change Selection
                </Button>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedPortfolioData.map((portfolio, index) => {
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <Card
                    key={portfolio.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`relative transition-all ${
                      isDragging ? "opacity-50 scale-95" : ""
                    } ${isDragOver ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="absolute top-2 left-2 cursor-move">
                      <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => handleTogglePortfolio(portfolio.id, index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>

                    <CardHeader className="pb-3 pl-8">
                      <CardTitle className="text-sm pr-8">
                        {portfolio.portfolio_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {portfolio.decision_ids.length} decisions
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {portfolio.metrics ? (
                        <>
                          {/* Aggregate EV */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Total EV
                            </div>
                            <div className="font-bold text-lg">
                              $
                              {portfolio.metrics.aggregate_expected_value.toFixed(
                                0
                              )}
                            </div>
                            {index > 0 && selectedPortfolioData[0].metrics && (
                              <div className="flex items-center gap-1 mt-1">
                                {(() => {
                                  const comparison = compareMetric(
                                    portfolio.metrics.aggregate_expected_value,
                                    selectedPortfolioData[0].metrics!
                                      .aggregate_expected_value,
                                    true
                                  );
                                  const Icon = comparison.icon;
                                  return (
                                    <>
                                      <Icon
                                        className={`h-3 w-3 ${comparison.color}`}
                                      />

                                      <span
                                        className={`text-xs ${comparison.color}`}
                                      >
                                        {comparison.diff > 0 ? "+" : ""}
                                        {comparison.diff.toFixed(0)}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* VaR95 */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              VaR95
                            </div>
                            <div className="font-bold text-sm">
                              ${portfolio.metrics.aggregate_var95.toFixed(0)}
                            </div>
                            {index > 0 && selectedPortfolioData[0].metrics && (
                              <div className="flex items-center gap-1 mt-1">
                                {(() => {
                                  const comparison = compareMetric(
                                    portfolio.metrics.aggregate_var95,
                                    selectedPortfolioData[0].metrics!
                                      .aggregate_var95,
                                    false
                                  );
                                  const Icon = comparison.icon;
                                  return (
                                    <>
                                      <Icon
                                        className={`h-3 w-3 ${comparison.color}`}
                                      />

                                      <span
                                        className={`text-xs ${comparison.color}`}
                                      >
                                        {comparison.diff > 0 ? "+" : ""}
                                        {comparison.diff.toFixed(0)}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Diversification */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Diversification
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-sm">
                                {(
                                  portfolio.metrics.diversification_index * 100
                                ).toFixed(0)}
                                %
                              </div>
                              <Badge
                                className={
                                  getDiversificationLabel(
                                    portfolio.metrics.diversification_index
                                  ).color + " text-white"
                                }
                              >
                                {
                                  getDiversificationLabel(
                                    portfolio.metrics.diversification_index
                                  ).label
                                }
                              </Badge>
                            </div>
                          </div>

                          {/* Antifragility */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Antifragility
                            </div>
                            <div className="font-bold text-sm">
                              {portfolio.metrics.antifragility_score.toFixed(0)}
                              /100
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

                          {/* Owner & Horizon */}
                          <div className="pt-2 border-t border-border space-y-1">
                            <div className="text-xs">
                              <span className="text-muted-foreground">
                                Owner:
                              </span>{" "}
                              <span className="font-medium">
                                {portfolio.owner}
                              </span>
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">
                                Horizon:
                              </span>{" "}
                              <span className="font-medium">
                                {portfolio.time_horizon_months}mo
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-8">
                          No metrics computed
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Summary */}
            {selectedPortfolioData.length > 1 &&
              selectedPortfolioData.every((p) => p.metrics) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Comparison Summary
                    </CardTitle>
                    <CardDescription>
                      Key insights across selected portfolios
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Highest Total EV
                        </div>
                        <div className="font-semibold">
                          {
                            selectedPortfolioData.reduce((max, p) =>
                              p.metrics!.aggregate_expected_value >
                              max.metrics!.aggregate_expected_value
                                ? p
                                : max
                            ).portfolio_name
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Best Diversification
                        </div>
                        <div className="font-semibold">
                          {
                            selectedPortfolioData.reduce((max, p) =>
                              p.metrics!.diversification_index >
                              max.metrics!.diversification_index
                                ? p
                                : max
                            ).portfolio_name
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Lowest Risk (VaR95)
                        </div>
                        <div className="font-semibold">
                          {
                            selectedPortfolioData.reduce((min, p) =>
                              Math.abs(p.metrics!.aggregate_var95) <
                              Math.abs(min.metrics!.aggregate_var95)
                                ? p
                                : min
                            ).portfolio_name
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Highest Antifragility
                        </div>
                        <div className="font-semibold">
                          {
                            selectedPortfolioData.reduce((max, p) =>
                              p.metrics!.antifragility_score >
                              max.metrics!.antifragility_score
                                ? p
                                : max
                            ).portfolio_name
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
