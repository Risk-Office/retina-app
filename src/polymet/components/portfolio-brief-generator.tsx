import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileTextIcon,
  DownloadIcon,
  MailIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";
import { PortfolioEmailDialog } from "@/polymet/components/portfolio-email-dialog";
import type { DecisionPortfolio } from "@/polymet/data/decision-portfolios";
import type { Decision } from "@/polymet/data/retina-store";

interface PortfolioDecisionSummary {
  decisionId: string;
  decisionTitle: string;
  chosenOption: string;
  metrics: {
    ev: number;
    var95: number;
    raroc: number;
    ce: number;
  };
  topSensitiveFactors?: Array<{
    paramName: string;
    impact: number;
  }>;
  creditRiskScore?: number;
}

interface PortfolioBriefData {
  portfolio: DecisionPortfolio;
  decisions: PortfolioDecisionSummary[];
  aggregateMetrics: {
    totalEV: number;
    portfolioVaR95: number;
    portfolioCVaR95: number;
    avgRAROC: number;
    diversificationIndex: number;
    antifragilityScore: number;
  };
  topPortfolioDrivers: Array<{
    paramName: string;
    impact: number;
    affectedDecisions: string[];
  }>;
  riskAssessment: {
    highRiskDecisions: string[];
    mediumRiskDecisions: string[];
    lowRiskDecisions: string[];
  };
}

interface PortfolioBriefGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: DecisionPortfolio;
  decisions: Decision[];
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function PortfolioBriefGenerator({
  open,
  onOpenChange,
  portfolio,
  decisions,
  onAuditEvent,
}: PortfolioBriefGeneratorProps) {
  const { tenant } = useTenant();
  const [briefData, setBriefData] = useState<PortfolioBriefData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      generateBriefData();
    }
  }, [open, portfolio, decisions]);

  const generateBriefData = () => {
    setIsGenerating(true);

    try {
      // Filter decisions in this portfolio
      const portfolioDecisions = decisions.filter(
        (d) =>
          portfolio.decision_ids.includes(d.id) &&
          d.status === "closed" &&
          d.metrics
      );

      if (portfolioDecisions.length === 0) {
        setBriefData(null);
        setIsGenerating(false);
        return;
      }

      // Build decision summaries
      const decisionSummaries: PortfolioDecisionSummary[] =
        portfolioDecisions.map((d) => {
          const chosenOption = d.options.find((o) => o.id === d.chosenOptionId);

          return {
            decisionId: d.id,
            decisionTitle: d.title,
            chosenOption: chosenOption?.label || "Unknown",
            metrics: {
              ev: d.metrics?.ev || 0,
              var95: d.metrics?.var95 || 0,
              raroc: d.metrics?.raroc || 0,
              ce: d.metrics?.ce || 0,
            },
            topSensitiveFactors: d.topSensitiveFactors || [],
            creditRiskScore: d.creditRiskScore,
          };
        });

      // Aggregate metrics
      const totalEV = decisionSummaries.reduce(
        (sum, d) => sum + d.metrics.ev,
        0
      );
      const avgRAROC =
        decisionSummaries.reduce((sum, d) => sum + d.metrics.raroc, 0) /
        decisionSummaries.length;

      // Use portfolio metrics if available, otherwise compute simple aggregates
      const portfolioVaR95 = portfolio.metrics?.aggregate_var95 || 0;
      const portfolioCVaR95 = portfolio.metrics?.aggregate_cvar95 || 0;
      const diversificationIndex =
        portfolio.metrics?.diversification_index || 0;
      const antifragilityScore = portfolio.metrics?.antifragility_score || 0;

      // Aggregate top drivers across all decisions
      const driverMap = new Map<
        string,
        { totalImpact: number; decisions: Set<string> }
      >();

      decisionSummaries.forEach((d) => {
        d.topSensitiveFactors?.forEach((factor) => {
          const existing = driverMap.get(factor.paramName) || {
            totalImpact: 0,
            decisions: new Set<string>(),
          };
          existing.totalImpact += Math.abs(factor.impact);
          existing.decisions.add(d.decisionTitle);
          driverMap.set(factor.paramName, existing);
        });
      });

      const topPortfolioDrivers = Array.from(driverMap.entries())
        .map(([paramName, { totalImpact, decisions }]) => ({
          paramName,
          impact: totalImpact,
          affectedDecisions: Array.from(decisions),
        }))
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 5);

      // Risk assessment
      const highRiskDecisions = decisionSummaries
        .filter((d) => d.metrics.raroc < 0.1)
        .map((d) => d.decisionTitle);
      const mediumRiskDecisions = decisionSummaries
        .filter((d) => d.metrics.raroc >= 0.1 && d.metrics.raroc < 0.15)
        .map((d) => d.decisionTitle);
      const lowRiskDecisions = decisionSummaries
        .filter((d) => d.metrics.raroc >= 0.15)
        .map((d) => d.decisionTitle);

      setBriefData({
        portfolio,
        decisions: decisionSummaries,
        aggregateMetrics: {
          totalEV,
          portfolioVaR95,
          portfolioCVaR95,
          avgRAROC,
          diversificationIndex,
          antifragilityScore,
        },
        topPortfolioDrivers,
        riskAssessment: {
          highRiskDecisions,
          mediumRiskDecisions,
          lowRiskDecisions,
        },
      });

      onAuditEvent?.("portfolio.brief.generated", {
        portfolioId: portfolio.id,
        portfolioName: portfolio.portfolio_name,
        decisionsIncluded: decisionSummaries.length,
        totalEV,
        avgRAROC,
      });
    } catch (error) {
      console.error("Failed to generate portfolio brief:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!briefData) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Portfolio Brief", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(16);
      doc.text(portfolio.portfolio_name, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 15;

      // Summary Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Portfolio Metrics", 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const metricsData = [
        [
          "Total Expected Value",
          `${briefData.aggregateMetrics.totalEV.toFixed(0)}`,
        ],

        [
          "Portfolio VaR95",
          `${briefData.aggregateMetrics.portfolioVaR95.toFixed(0)}`,
        ],

        [
          "Portfolio CVaR95",
          `${briefData.aggregateMetrics.portfolioCVaR95.toFixed(0)}`,
        ],

        [
          "Average RAROC",
          `${(briefData.aggregateMetrics.avgRAROC * 100).toFixed(1)}%`,
        ],

        [
          "Diversification Index",
          `${(briefData.aggregateMetrics.diversificationIndex * 100).toFixed(0)}%`,
        ],

        [
          "Antifragility Score",
          `${briefData.aggregateMetrics.antifragilityScore.toFixed(0)}/100`,
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Metric", "Value"]],
        body: metricsData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Top Drivers Section
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Top Portfolio Drivers", 14, yPos);
      yPos += 8;

      if (briefData.topPortfolioDrivers.length > 0) {
        const driversData = briefData.topPortfolioDrivers.map((driver) => [
          driver.paramName,
          `${Math.abs(driver.impact).toFixed(1)}%`,
          driver.affectedDecisions.join(", "),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Parameter", "Impact", "Affected Decisions"]],
          body: driversData,
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Decisions Section
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Decision Breakdown", 14, yPos);
      yPos += 8;

      const decisionsData = briefData.decisions.map((d) => [
        d.decisionTitle,
        d.chosenOption,
        `${d.metrics.ev.toFixed(0)}`,
        `${d.metrics.var95.toFixed(0)}`,
        `${(d.metrics.raroc * 100).toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Decision", "Chosen Option", "EV", "VaR95", "RAROC"]],
        body: decisionsData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save PDF
      doc.save(
        `portfolio-brief-${portfolio.portfolio_name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`
      );

      onAuditEvent?.("portfolio.brief.exported", {
        portfolioId: portfolio.id,
        portfolioName: portfolio.portfolio_name,
        format: "pdf",
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. See console for details.");
    }
  };

  const handleSendEmail = async (
    recipients: string[],
    subject: string,
    message: string,
    template: string
  ) => {
    // In production, this would call an API endpoint
    console.log("Sending email:", {
      recipients,
      subject,
      message,
      template,
      portfolio: portfolio.portfolio_name,
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onAuditEvent?.("portfolio.brief.emailed", {
      portfolioId: portfolio.id,
      portfolioName: portfolio.portfolio_name,
      recipients: recipients.length,
      template,
    });

    alert(`Email sent to ${recipients.length} recipient(s)!`);
  };

  if (!briefData && !isGenerating) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Portfolio Brief</DialogTitle>
            <DialogDescription>
              No data available for {portfolio.portfolio_name}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground text-center py-8">
            <p>
              No closed decisions with metrics found in this portfolio. Close
              and simulate decisions first.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">
                Portfolio Brief: {portfolio.portfolio_name}
              </DialogTitle>
              <DialogDescription>
                Quick take for the Board • {briefData?.decisions.length || 0}{" "}
                decisions analyzed
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                disabled={isGenerating}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEmailDialogOpen(true)}
                disabled={isGenerating}
              >
                <MailIcon className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isGenerating ? (
          <div className="py-12 text-center">
            <div className="text-muted-foreground">Generating brief...</div>
          </div>
        ) : briefData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="drivers">Top Drivers</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Portfolio Metrics</CardTitle>
                  <CardDescription>
                    Aggregated performance across all decisions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Total Expected Value
                      </div>
                      <div className="text-2xl font-bold">
                        ${briefData.aggregateMetrics.totalEV.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Portfolio VaR95
                      </div>
                      <div className="text-2xl font-bold">
                        ${briefData.aggregateMetrics.portfolioVaR95.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Avg RAROC
                      </div>
                      <div className="text-2xl font-bold">
                        {(briefData.aggregateMetrics.avgRAROC * 100).toFixed(1)}
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Diversification
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">
                          {(
                            briefData.aggregateMetrics.diversificationIndex *
                            100
                          ).toFixed(0)}
                          %
                        </div>
                        <Badge
                          variant={
                            briefData.aggregateMetrics.diversificationIndex >=
                            0.7
                              ? "default"
                              : briefData.aggregateMetrics
                                    .diversificationIndex >= 0.4
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {briefData.aggregateMetrics.diversificationIndex >=
                          0.7
                            ? "High"
                            : briefData.aggregateMetrics.diversificationIndex >=
                                0.4
                              ? "Medium"
                              : "Low"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Antifragility Score
                      </div>
                      <div className="text-2xl font-bold">
                        {briefData.aggregateMetrics.antifragilityScore.toFixed(
                          0
                        )}
                        /100
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Decisions
                      </div>
                      <div className="text-2xl font-bold">
                        {briefData.decisions.length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Portfolio Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Description
                    </div>
                    <div className="text-sm">{portfolio.description}</div>
                  </div>
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
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Goal Alignment
                    </div>
                    <div className="text-sm">{portfolio.goal_alignment}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Drivers Tab */}
            <TabsContent value="drivers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Top Portfolio Drivers
                  </CardTitle>
                  <CardDescription>
                    Combined sensitivity factors across all decisions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {briefData.topPortfolioDrivers.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No sensitivity data available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {briefData.topPortfolioDrivers.map((driver, index) => (
                        <div
                          key={driver.paramName}
                          className="p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {index + 1}
                              </div>
                              <div className="font-semibold">
                                {driver.paramName}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {driver.impact > 0 ? (
                                <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <TrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                              )}
                              <div className="text-sm font-semibold">
                                {Math.abs(driver.impact).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Affects {driver.affectedDecisions.length} decision
                            {driver.affectedDecisions.length !== 1
                              ? "s"
                              : ""}: {driver.affectedDecisions.join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Decisions Tab */}
            <TabsContent value="decisions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Decision Breakdown
                  </CardTitle>
                  <CardDescription>
                    Individual decision metrics and chosen options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {briefData.decisions.map((decision) => (
                      <div
                        key={decision.decisionId}
                        className="p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {decision.decisionTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Chosen: {decision.chosenOption}
                            </div>
                          </div>
                          <Badge
                            variant={
                              decision.metrics.raroc >= 0.15
                                ? "default"
                                : decision.metrics.raroc >= 0.1
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            RAROC: {(decision.metrics.raroc * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-muted-foreground">EV</div>
                            <div className="font-semibold">
                              ${decision.metrics.ev.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">VaR95</div>
                            <div className="font-semibold">
                              ${decision.metrics.var95.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">CE</div>
                            <div className="font-semibold">
                              ${decision.metrics.ce.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk Assessment Tab */}
            <TabsContent value="risks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Assessment</CardTitle>
                  <CardDescription>
                    Portfolio risk breakdown by RAROC thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* High Risk */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />

                      <div className="font-semibold text-sm">
                        High Risk (RAROC {"<"} 10%)
                      </div>
                      <Badge variant="destructive">
                        {briefData.riskAssessment.highRiskDecisions.length}
                      </Badge>
                    </div>
                    {briefData.riskAssessment.highRiskDecisions.length > 0 ? (
                      <div className="pl-6 space-y-1">
                        {briefData.riskAssessment.highRiskDecisions.map(
                          (title) => (
                            <div
                              key={title}
                              className="text-xs text-muted-foreground"
                            >
                              • {title}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="pl-6 text-xs text-muted-foreground italic">
                        No high-risk decisions
                      </div>
                    )}
                  </div>

                  {/* Medium Risk */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />

                      <div className="font-semibold text-sm">
                        Medium Risk (RAROC 10-15%)
                      </div>
                      <Badge variant="secondary">
                        {briefData.riskAssessment.mediumRiskDecisions.length}
                      </Badge>
                    </div>
                    {briefData.riskAssessment.mediumRiskDecisions.length > 0 ? (
                      <div className="pl-6 space-y-1">
                        {briefData.riskAssessment.mediumRiskDecisions.map(
                          (title) => (
                            <div
                              key={title}
                              className="text-xs text-muted-foreground"
                            >
                              • {title}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="pl-6 text-xs text-muted-foreground italic">
                        No medium-risk decisions
                      </div>
                    )}
                  </div>

                  {/* Low Risk */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />

                      <div className="font-semibold text-sm">
                        Low Risk (RAROC ≥ 15%)
                      </div>
                      <Badge variant="default">
                        {briefData.riskAssessment.lowRiskDecisions.length}
                      </Badge>
                    </div>
                    {briefData.riskAssessment.lowRiskDecisions.length > 0 ? (
                      <div className="pl-6 space-y-1">
                        {briefData.riskAssessment.lowRiskDecisions.map(
                          (title) => (
                            <div
                              key={title}
                              className="text-xs text-muted-foreground"
                            >
                              • {title}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="pl-6 text-xs text-muted-foreground italic">
                        No low-risk decisions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Email Dialog */}
      <PortfolioEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        portfolioName={portfolio.portfolio_name}
        onSendEmail={handleSendEmail}
        onAuditEvent={onAuditEvent}
      />
    </Dialog>
  );
}
