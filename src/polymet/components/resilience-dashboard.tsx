import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, ShieldIcon } from "lucide-react";
import { type SimulationResult } from "@/polymet/data/scenario-engine";
import { type RAROCThresholds } from "@/polymet/data/tenant-settings";
import { AntifragilityGauge } from "@/polymet/components/antifragility-gauge";
import {
  calculateResilienceMetrics,
  type ResilienceMetrics,
} from "@/polymet/components/resilience-metrics-card";

interface ResilienceDashboardProps {
  simulationResults: SimulationResult[];
  thresholds: RAROCThresholds;
  options?: Array<{
    id: string;
    label: string;
    partners?: Array<{
      id: string;
      name: string;
      creditExposure?: number;
      dependencyScore?: number;
    }>;
  }>;
  portfolioData?: {
    portfolioName: string;
    decisions: Array<{
      id: string;
      title: string;
      chosenOptionId: string;
      simulationResults: SimulationResult[];
    }>;
  };
}

interface BubbleData {
  optionId: string;
  optionLabel: string;
  downsideRisk: number; // VaR95
  shockBenefit: number; // ΔUtility (change in utility under stress)
  raroc: number; // Size of bubble
  creditRiskLevel: "Low" | "Medium" | "High" | "Critical"; // Color
  creditRiskScore: number;
}

// Compute credit risk level from partners
function computeCreditRiskLevel(
  partners?: Array<{
    creditExposure?: number;
    dependencyScore?: number;
  }>
): { level: "Low" | "Medium" | "High" | "Critical"; score: number } {
  if (!partners || partners.length === 0) {
    return { level: "Low", score: 0 };
  }

  // Simple scoring: sum of (creditExposure * dependencyScore)
  const totalScore = partners.reduce((sum, p) => {
    const exposure = p.creditExposure || 0;
    const dependency = p.dependencyScore || 0;
    return sum + exposure * dependency;
  }, 0);

  const avgScore = totalScore / partners.length;

  if (avgScore < 25) return { level: "Low", score: avgScore };
  if (avgScore < 50) return { level: "Medium", score: avgScore };
  if (avgScore < 75) return { level: "High", score: avgScore };
  return { level: "Critical", score: avgScore };
}

// Compute shock benefit (simplified: difference between CE and EV)
function computeShockBenefit(result: SimulationResult): number {
  // Positive value means option gains from uncertainty (convex payoff)
  // Negative value means option loses from uncertainty (concave payoff)
  return result.certaintyEquivalent - result.ev;
}

export function ResilienceDashboard({
  simulationResults,
  thresholds,
  options = [],
  portfolioData,
}: ResilienceDashboardProps) {
  const [activeTab, setActiveTab] = useState<"single" | "portfolio">("single");

  // Prepare bubble data for single decision
  const singleDecisionBubbles: BubbleData[] = simulationResults.map(
    (result) => {
      const option = options.find((o) => o.id === result.optionId);
      const creditRisk = computeCreditRiskLevel(option?.partners);

      return {
        optionId: result.optionId,
        optionLabel: result.optionLabel,
        downsideRisk: result.var95,
        shockBenefit: computeShockBenefit(result),
        raroc: result.raroc,
        creditRiskLevel: creditRisk.level,
        creditRiskScore: creditRisk.score,
      };
    }
  );

  // Prepare bubble data for portfolio (aggregate across decisions)
  const portfolioBubbles: BubbleData[] = portfolioData
    ? portfolioData.decisions.flatMap((decision) =>
        decision.simulationResults.map((result) => {
          const creditRisk = computeCreditRiskLevel();

          return {
            optionId: `${decision.id}-${result.optionId}`,
            optionLabel: `${decision.title} - ${result.optionLabel}`,
            downsideRisk: result.var95,
            shockBenefit: computeShockBenefit(result),
            raroc: result.raroc,
            creditRiskLevel: creditRisk.level,
            creditRiskScore: creditRisk.score,
          };
        })
      )
    : [];

  const activeBubbles =
    activeTab === "single" ? singleDecisionBubbles : portfolioBubbles;

  // Calculate chart dimensions and scales
  const maxDownsideRisk = Math.max(...activeBubbles.map((b) => b.downsideRisk));
  const minDownsideRisk = Math.min(...activeBubbles.map((b) => b.downsideRisk));
  const maxShockBenefit = Math.max(...activeBubbles.map((b) => b.shockBenefit));
  const minShockBenefit = Math.min(...activeBubbles.map((b) => b.shockBenefit));
  const maxRaroc = Math.max(...activeBubbles.map((b) => b.raroc));
  const minRaroc = Math.min(...activeBubbles.map((b) => b.raroc));

  // Add padding to scales
  const xPadding = (maxDownsideRisk - minDownsideRisk) * 0.1 || 10;
  const yPadding = (maxShockBenefit - minShockBenefit) * 0.1 || 10;

  const xMin = minDownsideRisk - xPadding;
  const xMax = maxDownsideRisk + xPadding;
  const yMin = minShockBenefit - yPadding;
  const yMax = maxShockBenefit + yPadding;

  // Scale functions
  const scaleX = (value: number) => {
    return ((value - xMin) / (xMax - xMin)) * 100;
  };

  const scaleY = (value: number) => {
    return 100 - ((value - yMin) / (yMax - yMin)) * 100;
  };

  const scaleSize = (raroc: number) => {
    const normalized = (raroc - minRaroc) / (maxRaroc - minRaroc || 1);
    return 20 + normalized * 40; // Size between 20 and 60
  };

  // Color mapping for credit risk
  const creditRiskColors = {
    Low: "hsl(var(--chart-2))", // Green
    Medium: "hsl(var(--chart-4))", // Yellow
    High: "hsl(var(--chart-1))", // Orange
    Critical: "hsl(var(--destructive))", // Red
  };

  // Calculate resilience metrics for antifragility gauge
  // For single decision, use simulation results
  // For portfolio, aggregate across all decisions
  const mockDecisions = simulationResults.map((result, idx) => ({
    id: result.optionId,
    metrics: {
      raroc: result.raroc,
    },
    incidentImpacts: [],
    guardrailViolations: 0,
  }));

  const resilienceMetrics: ResilienceMetrics =
    calculateResilienceMetrics(mockDecisions);

  return (
    <div className="space-y-6">
      {/* Antifragility Gauge */}
      <AntifragilityGauge
        value={resilienceMetrics.antifragility_index}
        size="lg"
      />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-5 h-5 text-primary" />

              <div>
                <CardTitle>Resilience Dashboard</CardTitle>
                <CardDescription>
                  Compare how each choice holds up when things change
                </CardDescription>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <InfoIcon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Shows which decisions lose least — or even gain — from
                    surprises. Bubble size = RAROC, color = Credit Risk Level.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Decision</TabsTrigger>
              <TabsTrigger
                value="portfolio"
                disabled={
                  !portfolioData || portfolioData.decisions.length === 0
                }
              >
                Portfolio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              {singleDecisionBubbles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Run simulation to see resilience analysis</p>
                </div>
              ) : (
                <ResilienceScatterPlot
                  bubbles={activeBubbles}
                  scaleX={scaleX}
                  scaleY={scaleY}
                  scaleSize={scaleSize}
                  creditRiskColors={creditRiskColors}
                  xMin={xMin}
                  xMax={xMax}
                  yMin={yMin}
                  yMax={yMax}
                />
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              {portfolioBubbles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No portfolio data available</p>
                </div>
              ) : (
                <ResilienceScatterPlot
                  bubbles={activeBubbles}
                  scaleX={scaleX}
                  scaleY={scaleY}
                  scaleSize={scaleSize}
                  creditRiskColors={creditRiskColors}
                  xMin={xMin}
                  xMax={xMax}
                  yMin={yMin}
                  yMax={yMax}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-muted-foreground">
                Credit Risk:
              </div>
              {(["Low", "Medium", "High", "Critical"] as const).map((level) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: creditRiskColors[level] }}
                  />

                  <span className="text-xs text-muted-foreground">{level}</span>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Bubble size = RAROC
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ResilienceScatterPlotProps {
  bubbles: BubbleData[];
  scaleX: (value: number) => number;
  scaleY: (value: number) => number;
  scaleSize: (raroc: number) => number;
  creditRiskColors: Record<string, string>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function ResilienceScatterPlot({
  bubbles,
  scaleX,
  scaleY,
  scaleSize,
  creditRiskColors,
  xMin,
  xMax,
  yMin,
  yMax,
}: ResilienceScatterPlotProps) {
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative w-full aspect-[4/3] bg-muted/20 rounded-lg border border-border p-8">
        {/* Y-axis label */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground whitespace-nowrap">
          Shock Benefit (ΔUtility)
        </div>

        {/* X-axis label */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
          Downside Risk (VaR95)
        </div>

        {/* Grid lines */}
        <svg className="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)]">
          {/* Vertical grid lines */}
          {[0, 25, 50, 75, 100].map((x) => (
            <line
              key={`v-${x}`}
              x1={`${x}%`}
              y1="0%"
              x2={`${x}%`}
              y2="100%"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={`h-${y}`}
              x1="0%"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Zero lines (if in range) */}
          {yMin < 0 && yMax > 0 && (
            <line
              x1="0%"
              y1={`${scaleY(0)}%`}
              x2="100%"
              y2={`${scaleY(0)}%`}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              opacity="0.3"
            />
          )}
        </svg>

        {/* Bubbles */}
        <div className="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)]">
          {bubbles.map((bubble) => {
            const x = scaleX(bubble.downsideRisk);
            const y = scaleY(bubble.shockBenefit);
            const size = scaleSize(bubble.raroc);
            const isHovered = hoveredBubble === bubble.optionId;

            return (
              <TooltipProvider key={bubble.optionId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute rounded-full cursor-pointer transition-all duration-200"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        backgroundColor:
                          creditRiskColors[bubble.creditRiskLevel],
                        transform: "translate(-50%, -50%)",
                        opacity: isHovered ? 1 : 0.7,
                        zIndex: isHovered ? 10 : 1,
                        boxShadow: isHovered
                          ? "0 4px 12px rgba(0,0,0,0.2)"
                          : "none",
                      }}
                      onMouseEnter={() => setHoveredBubble(bubble.optionId)}
                      onMouseLeave={() => setHoveredBubble(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <div className="font-semibold">{bubble.optionLabel}</div>
                      <div className="text-xs space-y-0.5">
                        <div>
                          Downside Risk (VaR95):{" "}
                          <span className="font-medium">
                            ${bubble.downsideRisk.toFixed(0)}
                          </span>
                        </div>
                        <div>
                          Shock Benefit:{" "}
                          <span className="font-medium">
                            ${bubble.shockBenefit.toFixed(0)}
                          </span>
                        </div>
                        <div>
                          RAROC:{" "}
                          <span className="font-medium">
                            {(bubble.raroc * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          Credit Risk:{" "}
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor:
                                creditRiskColors[bubble.creditRiskLevel],
                              color: creditRiskColors[bubble.creditRiskLevel],
                            }}
                          >
                            {bubble.creditRiskLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Axis labels with values */}
        <div className="absolute bottom-0 left-8 right-8 flex justify-between text-xs text-muted-foreground">
          <span>${xMin.toFixed(0)}</span>
          <span>${xMax.toFixed(0)}</span>
        </div>
        <div className="absolute top-8 bottom-8 left-0 flex flex-col justify-between text-xs text-muted-foreground">
          <span className="pl-1">${yMax.toFixed(0)}</span>
          <span className="pl-1">${yMin.toFixed(0)}</span>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Resilient */}
        {(() => {
          const mostResilient = bubbles.reduce((best, current) =>
            current.shockBenefit > best.shockBenefit ? current : best
          );
          return (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Most Resilient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="font-semibold text-sm">
                    {mostResilient.optionLabel}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gains ${mostResilient.shockBenefit.toFixed(0)} from
                    uncertainty
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Lowest Risk */}
        {(() => {
          const lowestRisk = bubbles.reduce((best, current) =>
            current.downsideRisk < best.downsideRisk ? current : best
          );
          return (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lowest Downside
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="font-semibold text-sm">
                    {lowestRisk.optionLabel}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    VaR95: ${lowestRisk.downsideRisk.toFixed(0)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Best RAROC */}
        {(() => {
          const bestRaroc = bubbles.reduce((best, current) =>
            current.raroc > best.raroc ? current : best
          );
          return (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Best RAROC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="font-semibold text-sm">
                    {bestRaroc.optionLabel}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    RAROC: {(bestRaroc.raroc * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}
