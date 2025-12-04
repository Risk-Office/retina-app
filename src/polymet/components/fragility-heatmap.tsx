import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InfoIcon,
  FileTextIcon,
  ShieldCheckIcon,
  DownloadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResiliencePolicyTrigger } from "@/polymet/components/resilience-policy-drawer";
import { useTenant } from "@/polymet/data/tenant-context";

/**
 * # Fragility Heatmap Component
 *
 * ## Overview
 * Displays a grid heatmap showing portfolios vs fragility dimensions
 * (financial, operational, market, partner) to identify weak zones.
 *
 * ## Fragility Dimensions
 * - **Financial**: VaR95, RAROC, capital adequacy
 * - **Operational**: Process stability, execution risk
 * - **Market**: External volatility, demand shifts
 * - **Partner**: Counterparty risk, dependency scores
 *
 * ## Color Coding
 * - Red (High Fragility): 70-100 - Needs immediate attention
 * - Orange (Medium-High): 50-69 - Monitor closely
 * - Yellow (Medium): 30-49 - Some concerns
 * - Green (Low Fragility): 0-29 - Healthy zone
 */

export interface FragilityDimension {
  financial: number; // 0-100, higher = more fragile
  operational: number;
  market: number;
  partner: number;
}

export interface PortfolioFragility {
  portfolioId: string;
  portfolioName: string;
  dimensions: FragilityDimension;
  decisionCount: number;
}

export interface FragilityHeatmapProps {
  portfolios: PortfolioFragility[];
  className?: string;
  onCellClick?: (
    portfolioId: string,
    dimension: keyof FragilityDimension
  ) => void;
  onOpenResiliencePolicy?: () => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

/**
 * Get color based on fragility score (0-100)
 */
function getFragilityColor(score: number): string {
  if (score >= 70) return "bg-red-500 dark:bg-red-600"; // High fragility
  if (score >= 50) return "bg-orange-500 dark:bg-orange-600"; // Medium-high
  if (score >= 30) return "bg-yellow-500 dark:bg-yellow-600"; // Medium
  return "bg-green-500 dark:bg-green-600"; // Low fragility
}

/**
 * Get text color for contrast
 */
function getTextColor(score: number): string {
  return "text-white";
}

/**
 * Get fragility level label
 */
function getFragilityLevel(score: number): string {
  if (score >= 70) return "High";
  if (score >= 50) return "Medium-High";
  if (score >= 30) return "Medium";
  return "Low";
}

const DIMENSION_LABELS: Record<keyof FragilityDimension, string> = {
  financial: "Financial",
  operational: "Operational",
  market: "Market",
  partner: "Partner",
};

const DIMENSION_DESCRIPTIONS: Record<keyof FragilityDimension, string> = {
  financial: "VaR95, RAROC, capital adequacy",
  operational: "Process stability, execution risk",
  market: "External volatility, demand shifts",
  partner: "Counterparty risk, dependency scores",
};

export function FragilityHeatmap({
  portfolios,
  className = "",
  onCellClick,
  onOpenResiliencePolicy,
  onAuditEvent,
}: FragilityHeatmapProps) {
  const { tenant } = useTenant();
  const tenantId = tenant.tenantId;
  const [hoveredCell, setHoveredCell] = useState<{
    portfolioId: string;
    dimension: keyof FragilityDimension;
  } | null>(null);

  /**
   * Export to Board Brief (PDF + CSV)
   */
  const handleExportBoardBrief = (format: "pdf" | "csv") => {
    const timestamp = new Date().toISOString();
    const filename = `board-brief-fragility-${timestamp.split("T")[0]}.${format}`;

    if (format === "csv") {
      // Generate CSV content
      const headers = [
        "Portfolio",
        "Financial",
        "Operational",
        "Market",
        "Partner",
        "Decision Count",
      ];

      const rows = portfolios.map((p) => [
        p.portfolioName,
        p.dimensions.financial.toString(),
        p.dimensions.operational.toString(),
        p.dimensions.market.toString(),
        p.dimensions.partner.toString(),
        p.decisionCount.toString(),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      // PDF export (simplified - in production, use jsPDF or similar)
      console.log("PDF export would generate comprehensive board brief");
      alert(`Board Brief PDF export initiated: ${filename}`);
    }

    // Audit log
    onAuditEvent?.("antifragility_dashboard_exported", {
      tenantId,
      exportType: "board_brief",
      format,
      portfolioCount: portfolios.length,
      timestamp,
    });
  };

  /**
   * Export Regulatory Readiness Report (PDF + CSV)
   */
  const handleExportRegulatoryReport = (format: "pdf" | "csv") => {
    const timestamp = new Date().toISOString();
    const filename = `regulatory-readiness-${timestamp.split("T")[0]}.${format}`;

    if (format === "csv") {
      // Generate CSV with regulatory focus
      const headers = [
        "Portfolio",
        "Financial Risk",
        "Operational Risk",
        "Market Risk",
        "Partner Risk",
        "Overall Risk Level",
        "Compliance Status",
        "Decision Count",
      ];

      const rows = portfolios.map((p) => {
        const avgFragility =
          (p.dimensions.financial +
            p.dimensions.operational +
            p.dimensions.market +
            p.dimensions.partner) /
          4;
        const complianceStatus =
          avgFragility >= 70
            ? "High Risk - Review Required"
            : avgFragility >= 50
              ? "Medium Risk - Monitor"
              : "Acceptable";

        return [
          p.portfolioName,
          getFragilityLevel(p.dimensions.financial),
          getFragilityLevel(p.dimensions.operational),
          getFragilityLevel(p.dimensions.market),
          getFragilityLevel(p.dimensions.partner),
          getFragilityLevel(avgFragility),
          complianceStatus,
          p.decisionCount.toString(),
        ];
      });

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      // PDF export (simplified - in production, use jsPDF or similar)
      console.log("PDF export would generate regulatory readiness report");
      alert(`Regulatory Readiness Report PDF export initiated: ${filename}`);
    }

    // Audit log
    onAuditEvent?.("antifragility_dashboard_exported", {
      tenantId,
      exportType: "regulatory_readiness",
      format,
      portfolioCount: portfolios.length,
      timestamp,
    });
  };

  const dimensions: (keyof FragilityDimension)[] = [
    "financial",
    "operational",
    "market",
    "partner",
  ];

  if (portfolios.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Where fragility still hides</CardTitle>
              <CardDescription>
                Bright areas = more fragile zones needing attention
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Bright areas = more fragile zones needing attention. Red
                    indicates high fragility requiring immediate focus.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No portfolio data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Where fragility still hides</CardTitle>
            <CardDescription>
              Bright areas = more fragile zones needing attention
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Export to Board Brief */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  Export to Board Brief
                  <DownloadIcon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportBoardBrief("pdf")}>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportBoardBrief("csv")}>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Regulatory Readiness Report */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ShieldCheckIcon className="h-4 w-4" />
                  Regulatory Readiness Report
                  <DownloadIcon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleExportRegulatoryReport("pdf")}
                >
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportRegulatoryReport("csv")}
                >
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onOpenResiliencePolicy && (
              <ResiliencePolicyTrigger onClick={onOpenResiliencePolicy} />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Bright areas = more fragile zones needing attention. Red
                    indicates high fragility requiring immediate focus.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header Row */}
              <div
                className="grid gap-2 mb-2"
                style={{
                  gridTemplateColumns: `200px repeat(${dimensions.length}, 1fr)`,
                }}
              >
                <div className="font-medium text-sm text-muted-foreground">
                  Portfolio
                </div>
                {dimensions.map((dim) => (
                  <TooltipProvider key={dim}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-medium text-sm text-center text-muted-foreground cursor-help">
                          {DIMENSION_LABELS[dim]}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {DIMENSION_DESCRIPTIONS[dim]}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>

              {/* Data Rows */}
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.portfolioId}
                  className="grid gap-2 mb-2"
                  style={{
                    gridTemplateColumns: `200px repeat(${dimensions.length}, 1fr)`,
                  }}
                >
                  {/* Portfolio Name */}
                  <div className="flex items-center text-sm font-medium truncate">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate cursor-help">
                            {portfolio.portfolioName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{portfolio.portfolioName}</p>
                          <p className="text-xs text-muted-foreground">
                            {portfolio.decisionCount} decision
                            {portfolio.decisionCount !== 1 ? "s" : ""}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Dimension Cells */}
                  {dimensions.map((dim) => {
                    const score = portfolio.dimensions[dim];
                    const isHovered =
                      hoveredCell?.portfolioId === portfolio.portfolioId &&
                      hoveredCell?.dimension === dim;

                    return (
                      <TooltipProvider key={dim}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                flex items-center justify-center h-16 rounded-md
                                ${getFragilityColor(score)} ${getTextColor(score)}
                                transition-all duration-200 cursor-pointer
                                ${isHovered ? "ring-2 ring-primary ring-offset-2" : ""}
                                hover:scale-105
                              `}
                              onMouseEnter={() =>
                                setHoveredCell({
                                  portfolioId: portfolio.portfolioId,
                                  dimension: dim,
                                })
                              }
                              onMouseLeave={() => setHoveredCell(null)}
                              onClick={() =>
                                onCellClick?.(portfolio.portfolioId, dim)
                              }
                            >
                              <div className="text-center">
                                <div className="text-lg font-bold">{score}</div>
                                <div className="text-xs opacity-90">
                                  {getFragilityLevel(score)}
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {portfolio.portfolioName} -{" "}
                                {DIMENSION_LABELS[dim]}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {DIMENSION_DESCRIPTIONS[dim]}
                              </p>
                              <p className="text-sm">
                                Fragility Score:{" "}
                                <span className="font-bold">{score}</span> (
                                {getFragilityLevel(score)})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Click to view details
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground font-medium">
              Fragility Level:
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />

              <span className="text-xs">Low (0-29)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />

              <span className="text-xs">Medium (30-49)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />

              <span className="text-xs">Medium-High (50-69)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />

              <span className="text-xs">High (70-100)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
