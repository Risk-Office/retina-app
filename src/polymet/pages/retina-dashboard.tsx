import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUpIcon,
  UsersIcon,
  ActivityIcon,
  AlertTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BrainIcon,
  ArrowRightIcon,
  RefreshCwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/polymet/data/tenant-context";
import { useRetinaStore } from "@/polymet/data/retina-store";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { GuardrailAdjustmentWidget } from "@/polymet/components/guardrail-adjustment-widget";
import { AutoAdjustConfigDialog } from "@/polymet/components/auto-adjust-config-dialog";
import {
  PostDecisionSnapshot,
  createMockPostDecisionMetrics,
  type PostDecisionMetrics,
} from "@/polymet/components/post-decision-snapshot";
import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IncidentTrackerWidget } from "@/polymet/components/incident-tracker-widget";
import {
  seedMockIncidents,
  processIncidentImpact,
  getAllIncidents,
} from "@/polymet/data/incident-matcher";
import {
  ResilienceMetricsCard,
  calculateResilienceMetrics,
} from "@/polymet/components/resilience-metrics-card";
import { AntifragilityGauge } from "@/polymet/components/antifragility-gauge";
import { PortfolioTrendsWidget } from "@/polymet/components/portfolio-trends-widget";
import {
  AntifragilityOverviewCards,
  computeAntifragilityOverviewData,
} from "@/polymet/components/antifragility-overview-cards";
import { loadViolations } from "@/polymet/data/guardrail-violations";
import {
  FragilityHeatmap,
  type PortfolioFragility,
} from "@/polymet/components/fragility-heatmap";
import { loadPortfolios } from "@/polymet/data/decision-portfolios";
import {
  ResiliencePolicyDrawer,
  type ResilienceTrendData,
  type GuardrailRecommendation,
} from "@/polymet/components/resilience-policy-drawer";
import { KnowledgeGraphWidget } from "@/polymet/components/knowledge-graph-widget";
import { buildKnowledgeGraph } from "@/polymet/data/knowledge-graph";
import { loadGuardrails } from "@/polymet/data/decision-guardrails";

import { getOutcomes } from "@/polymet/data/guardrail-auto-adjust";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  description,
}: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <Card
      className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
      data-pol-id="n4okwq"
    >
      <CardHeader
        className="flex flex-row items-center justify-between space-y-0 pb-2"
        data-pol-id="umwoe1"
      >
        <CardTitle
          className="text-sm font-medium text-muted-foreground"
          data-pol-id="laoenp"
        >
          {title}
        </CardTitle>
        <div
          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
          data-pol-id="tkkyga"
        >
          <Icon className="w-5 h-5 text-primary" data-pol-id="l2jgxz" />
        </div>
      </CardHeader>
      <CardContent data-pol-id="i64kpl">
        <div
          className="text-3xl font-bold text-foreground mb-1"
          data-pol-id="ekfe9e"
        >
          {value}
        </div>
        <div className="flex items-center gap-2" data-pol-id="wtrb80">
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
            data-pol-id="096dxd"
          >
            {isPositive ? (
              <ArrowUpIcon className="w-3 h-3" data-pol-id="lm3q2b" />
            ) : (
              <ArrowDownIcon className="w-3 h-3" data-pol-id="hjqn7l" />
            )}
            <span data-pol-id="l5m65y">{Math.abs(change)}%</span>
          </div>
          {description && (
            <span
              className="text-xs text-muted-foreground"
              data-pol-id="qj3254"
            >
              {description}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RetinaDashboard() {
  const { tenant } = useTenant();
  const {
    getDecisionsByTenant,
    getDecisionsByStatus,
    addAudit,
    seedMockClosedDecisions,
    saveDecision,
  } = useRetinaStore();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [feedbackLoopOpen, setFeedbackLoopOpen] = useState(false);
  const [selectedDecisionForLoop, setSelectedDecisionForLoop] = useState<
    string | null
  >(null);
  const [resiliencePolicyOpen, setResiliencePolicyOpen] = useState(false);

  // Seed mock closed decisions for demo purposes (only runs once)
  React.useEffect(() => {
    seedMockClosedDecisions(tenant.tenantId);
    seedMockIncidents(tenant.tenantId);

    // Process any existing incidents against decisions
    const incidents = getAllIncidents(tenant.tenantId);
    const currentDecisions = getDecisionsByTenant(tenant.tenantId);

    incidents.forEach((incident) => {
      const updatedDecisions = processIncidentImpact(
        incident,
        currentDecisions,
        (eventType, payload) => addAudit(eventType, payload)
      );

      // Update decisions in store
      updatedDecisions.forEach((decision) => {
        saveDecision(decision);
      });
    });
  }, [tenant.tenantId, seedMockClosedDecisions]);

  // Get tenant-scoped decisions
  const allDecisions = getDecisionsByTenant(tenant.tenantId);

  // Calculate metrics
  const draftDecisions = getDecisionsByStatus(tenant.tenantId, "draft");
  const analyzingDecisions = getDecisionsByStatus(tenant.tenantId, "analyzing");
  const decidingDecisions = getDecisionsByStatus(tenant.tenantId, "deciding");
  const openDecisions =
    draftDecisions.length +
    analyzingDecisions.length +
    decidingDecisions.length;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;

  const closedDecisions = getDecisionsByStatus(tenant.tenantId, "closed");
  const closedLast30Days = closedDecisions.filter(
    (d) => d.closedAt && d.closedAt >= thirtyDaysAgo
  );
  const closedPrevious30Days = closedDecisions.filter(
    (d) =>
      d.closedAt && d.closedAt >= sixtyDaysAgo && d.closedAt < thirtyDaysAgo
  );

  // Calculate trend for closed decisions
  const closedTrend =
    closedPrevious30Days.length > 0
      ? ((closedLast30Days.length - closedPrevious30Days.length) /
          closedPrevious30Days.length) *
        100
      : closedLast30Days.length > 0
        ? 100
        : 0;

  // Calculate average RAROC from stored metrics
  const decisionsWithRAROC = closedLast30Days.filter(
    (d) => d.metrics?.raroc !== undefined
  );
  const avgRAROC =
    decisionsWithRAROC.length > 0
      ? decisionsWithRAROC.reduce(
          (sum, d) => sum + (d.metrics?.raroc || 0),
          0
        ) / decisionsWithRAROC.length
      : null;

  // Calculate RAROC trend
  const decisionsWithRAROCPrevious = closedPrevious30Days.filter(
    (d) => d.metrics?.raroc !== undefined
  );
  const avgRAROCPrevious =
    decisionsWithRAROCPrevious.length > 0
      ? decisionsWithRAROCPrevious.reduce(
          (sum, d) => sum + (d.metrics?.raroc || 0),
          0
        ) / decisionsWithRAROCPrevious.length
      : null;

  const rarocTrend =
    avgRAROC !== null && avgRAROCPrevious !== null
      ? ((avgRAROC - avgRAROCPrevious) / avgRAROCPrevious) * 100
      : avgRAROC !== null
        ? 100
        : 0;

  const hasData = allDecisions.length > 0;

  // Calculate resilience metrics from all decisions
  const resilienceMetrics = calculateResilienceMetrics(allDecisions);

  // Compute antifragility overview data
  // Collect all violations across all decisions
  const allViolations = allDecisions.flatMap((d) => {
    const violations = loadViolations(d.id);
    return violations.map((v) => ({
      timestamp: new Date(v.violatedAt).getTime(),
    }));
  });

  const antifragilityOverviewData = computeAntifragilityOverviewData(
    allDecisions.map((d) => ({
      id: d.id,
      antifragilityIndex: d.antifragilityIndex,
      learningTrace: d.learningTrace,
    })),
    allViolations
  );

  // Compute fragility heatmap data from portfolios
  const portfolios = loadPortfolios(tenant.tenantId);
  const portfolioFragilityData: PortfolioFragility[] = portfolios.map(
    (portfolio) => {
      const portfolioDecisions = allDecisions.filter((d) =>
        portfolio.decision_ids.includes(d.id)
      );

      // Calculate fragility scores for each dimension (0-100, higher = more fragile)
      // Financial: Based on VaR95 and RAROC
      const financialScores = portfolioDecisions
        .filter((d) => d.metrics?.var95 !== undefined)
        .map((d) => {
          const var95 = d.metrics?.var95 || 0;
          const raroc = d.metrics?.raroc || 0;
          // Higher VaR95 = more fragile, Lower RAROC = more fragile
          const var95Score = Math.min(100, Math.abs(var95) / 1000); // Normalize to 0-100
          const rarocScore = Math.max(0, 100 - raroc * 1000); // Invert RAROC
          return (var95Score + rarocScore) / 2;
        });
      const financialFragility =
        financialScores.length > 0
          ? financialScores.reduce((sum, s) => sum + s, 0) /
            financialScores.length
          : 50;

      // Operational: Based on guardrail breaches and stability
      const operationalScores = portfolioDecisions.map((d) => {
        const violations = loadViolations(d.id);
        const recentViolations = violations.filter(
          (v) => v.violatedAt >= Date.now() - 30 * 24 * 60 * 60 * 1000
        );
        // More violations = more fragile
        return Math.min(100, recentViolations.length * 10);
      });
      const operationalFragility =
        operationalScores.length > 0
          ? operationalScores.reduce((sum, s) => sum + s, 0) /
            operationalScores.length
          : 50;

      // Market: Based on antifragility index (inverted)
      const marketScores = portfolioDecisions
        .filter((d) => d.antifragilityIndex !== undefined)
        .map((d) => 100 - (d.antifragilityIndex || 50));
      const marketFragility =
        marketScores.length > 0
          ? marketScores.reduce((sum, s) => sum + s, 0) / marketScores.length
          : 50;

      // Partner: Based on partner credit exposure and dependency
      const partnerScores = portfolioDecisions.map((d) => {
        const partners = d.options.flatMap((o) => o.partners || []);
        if (partners.length === 0) return 30; // Low fragility if no partners

        const avgDependency =
          partners.reduce((sum, p) => sum + (p.dependencyScore || 0), 0) /
          partners.length;
        const avgExposure =
          partners.reduce((sum, p) => sum + (p.creditExposure || 0), 0) /
          partners.length;

        // Higher dependency and exposure = more fragile
        return Math.min(100, avgDependency * 10 + avgExposure / 100000);
      });
      const partnerFragility =
        partnerScores.length > 0
          ? partnerScores.reduce((sum, s) => sum + s, 0) / partnerScores.length
          : 50;

      return {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        dimensions: {
          financial: Math.round(financialFragility),
          operational: Math.round(operationalFragility),
          market: Math.round(marketFragility),
          partner: Math.round(partnerFragility),
        },
        decisionCount: portfolioDecisions.length,
      };
    }
  );

  // Get closed decisions that are 30+ days old for post-decision snapshots
  const eligibleForSnapshot = closedDecisions.filter(
    (d) => d.closedAt && d.closedAt <= thirtyDaysAgo
  );

  // Create post-decision metrics for eligible decisions
  const postDecisionMetrics: PostDecisionMetrics[] = eligibleForSnapshot.map(
    (decision) => {
      // In a real app, you'd fetch actual outcome data from your backend
      // For now, we'll create mock data based on stored metrics
      return createMockPostDecisionMetrics(
        decision.id,
        decision.title,
        decision.options.find((o) => o.id === decision.chosenOptionId)?.label ||
          "Unknown Option",
        decision.closedAt || Date.now(),
        // Randomly assign scenario for demo purposes
        Math.random() > 0.7
          ? "outperforming"
          : Math.random() > 0.5
            ? "tracking"
            : "underperforming"
      );
    }
  );

  const kpis = [
    {
      title: "Total Scans",
      value: "12,543",
      change: 12.5,
      icon: ActivityIcon,
      description: "from last month",
    },
    {
      title: "Active Users",
      value: "2,847",
      change: 8.2,
      icon: UsersIcon,
      description: "from last month",
    },
    {
      title: "System Health",
      value: "98.5%",
      change: 2.1,
      icon: TrendingUpIcon,
      description: "uptime",
    },
    {
      title: "Active Alerts",
      value: "23",
      change: -15.3,
      icon: AlertTriangleIcon,
      description: "from last week",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-pol-id="2r09rl">
      {/* Page Header */}
      <div data-pol-id="a1ikf3">
        <h1
          className="text-3xl font-bold text-foreground mb-2"
          data-pol-id="8xkkj7"
        >
          Dashboard
        </h1>
        <p className="text-muted-foreground" data-pol-id="zbd5w6">
          Welcome to Retina Intelligence Suite. Monitor your key metrics and
          system performance.
        </p>
      </div>

      {/* KPI Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        data-pol-id="m7ybsa"
      >
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} data-pol-id="eflxqa" />
        ))}
      </div>

      {/* i-Decide KPI Card */}
      <Card
        className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        data-pol-id="41ra8j"
      >
        <CardHeader
          className="flex flex-row items-center justify-between space-y-0 pb-2"
          data-pol-id="6gkjmg"
        >
          <div className="flex items-center gap-3" data-pol-id="icuhpw">
            <div
              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
              data-pol-id="84z6rr"
            >
              <BrainIcon
                className="w-6 h-6 text-primary"
                data-pol-id="aejp2q"
              />
            </div>
            <div data-pol-id="5uot8n">
              <CardTitle className="text-xl font-bold" data-pol-id="k7fvb3">
                i-Decide
              </CardTitle>
              <CardDescription data-pol-id="ib05b9">
                Decision Intelligence
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4" data-pol-id="kxe1rs">
          {!hasData ? (
            <div className="py-6 text-center space-y-3" data-pol-id="vhjv3o">
              <p className="text-sm text-muted-foreground" data-pol-id="011cz4">
                Run a simulation and close a decision to populate KPIs
              </p>
              <Link to="/retina/modules/i-decide" data-pol-id="a1wfx4">
                <Button data-pol-id="dsvfx8">
                  <BrainIcon className="w-4 h-4 mr-2" data-pol-id="fs5j5i" />
                  Open i-Decide
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4" data-pol-id="ebg5xu">
                {/* Open Decisions */}
                <Link
                  to="/retina/modules/i-decide?filter=open"
                  className="space-y-2 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  data-pol-id="i8egso"
                >
                  <div
                    className="text-2xl font-bold text-foreground"
                    data-pol-id="w0xy3f"
                  >
                    {openDecisions}
                  </div>
                  <div
                    className="text-xs text-muted-foreground mb-2"
                    data-pol-id="fjvp03"
                  >
                    Open Decisions
                  </div>
                  {openDecisions > 0 && (
                    <div className="flex flex-wrap gap-1" data-pol-id="jsowyp">
                      {draftDecisions.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          data-pol-id="kgpork"
                        >
                          {draftDecisions.length} draft
                        </Badge>
                      )}
                      {analyzingDecisions.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          data-pol-id="dwiewt"
                        >
                          {analyzingDecisions.length} analyzing
                        </Badge>
                      )}
                      {decidingDecisions.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          data-pol-id="4kn510"
                        >
                          {decidingDecisions.length} deciding
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>

                {/* Closed Decisions */}
                <Link
                  to="/retina/modules/i-decide?filter=closed&days=30"
                  className="space-y-2 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  data-pol-id="iqat5r"
                >
                  <div
                    className="text-2xl font-bold text-foreground"
                    data-pol-id="1f2hz0"
                  >
                    {closedLast30Days.length}
                  </div>
                  <div
                    className="text-xs text-muted-foreground mb-1"
                    data-pol-id="hj8dvq"
                  >
                    Closed (Last 30 days)
                  </div>
                  {closedPrevious30Days.length > 0 && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        closedTrend >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                      data-pol-id="6eke3h"
                    >
                      {closedTrend >= 0 ? (
                        <ArrowUpIcon className="w-3 h-3" data-pol-id="srdf5n" />
                      ) : (
                        <ArrowDownIcon
                          className="w-3 h-3"
                          data-pol-id="qanif6"
                        />
                      )}
                      <span data-pol-id="9awxsn">
                        {Math.abs(closedTrend).toFixed(1)}%
                      </span>
                      <span
                        className="text-muted-foreground"
                        data-pol-id="c31ugm"
                      >
                        vs prev 30d
                      </span>
                    </div>
                  )}
                </Link>

                {/* Average RAROC */}
                <Link
                  to="/retina/modules/i-decide?filter=closed&days=30&sort=raroc"
                  className="space-y-2 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  data-pol-id="kxjql2"
                >
                  <div
                    className="text-2xl font-bold text-foreground"
                    data-pol-id="cgb0tl"
                  >
                    {avgRAROC !== null ? avgRAROC.toFixed(4) : "N/A"}
                  </div>
                  <div
                    className="text-xs text-muted-foreground mb-1"
                    data-pol-id="kn7rgb"
                  >
                    Avg RAROC (Last 30 days)
                  </div>
                  {avgRAROC !== null && avgRAROCPrevious !== null && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        rarocTrend >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                      data-pol-id="zlmp1e"
                    >
                      {rarocTrend >= 0 ? (
                        <ArrowUpIcon className="w-3 h-3" data-pol-id="vj5jed" />
                      ) : (
                        <ArrowDownIcon
                          className="w-3 h-3"
                          data-pol-id="0dl5vx"
                        />
                      )}
                      <span data-pol-id="pl2s8e">
                        {Math.abs(rarocTrend).toFixed(1)}%
                      </span>
                      <span
                        className="text-muted-foreground"
                        data-pol-id="x35fes"
                      >
                        vs prev 30d
                      </span>
                    </div>
                  )}
                </Link>
              </div>
              <Link
                to="/retina/modules/i-decide"
                className="block"
                data-pol-id="oj4p32"
              >
                <Button className="w-full" data-pol-id="14yrqo">
                  Open i-Decide
                  <ArrowRightIcon
                    className="w-4 h-4 ml-2"
                    data-pol-id="zhsc1q"
                  />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Post-Decision Snapshots */}
      {postDecisionMetrics.length > 0 && (
        <div className="space-y-6" data-pol-id="5russu">
          <div data-pol-id="o8ha0u">
            <h2
              className="text-2xl font-bold text-foreground mb-2"
              data-pol-id="aar0hu"
            >
              Post-Decision Insights
            </h2>
            <p className="text-muted-foreground" data-pol-id="8qz8s9">
              Tracking actual outcomes vs expectations for decisions closed 30+
              days ago
            </p>
          </div>
          {postDecisionMetrics.map((metrics) => {
            const decision = closedDecisions.find(
              (d) => d.id === metrics.decisionId
            );

            return (
              <div
                key={metrics.decisionId}
                className="relative"
                data-pol-id="15ncz8"
              >
                {/* Feedback Loop Icon */}
                <TooltipProvider data-pol-id="j88o7t">
                  <Tooltip data-pol-id="mngmt6">
                    <TooltipTrigger asChild data-pol-id="kv3kg8">
                      <button
                        onClick={() => {
                          setSelectedDecisionForLoop(metrics.decisionId);
                          setFeedbackLoopOpen(true);
                        }}
                        className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center shadow-lg"
                        data-pol-id="bt4wba"
                      >
                        <RefreshCwIcon
                          className="w-5 h-5"
                          data-pol-id="wgfvki"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent data-pol-id="hesiym">
                      <p data-pol-id="ux9ky4">View feedback loop</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <PostDecisionSnapshot metrics={metrics} data-pol-id="tt3whe" />
              </div>
            );
          })}
        </div>
      )}

      {/* Incident Tracker Widget */}
      <IncidentTrackerWidget
        tenantId={tenant.tenantId}
        decisions={allDecisions}
        onDecisionsUpdate={(updatedDecisions) => {
          updatedDecisions.forEach((decision) => {
            saveDecision(decision);
          });
        }}
        onAuditEvent={(eventType, payload) => {
          addAudit(eventType, payload);
        }}
        data-pol-id="ec3pos"
      />

      {/* Antifragility Gauge and Resilience Metrics */}
      {hasData && (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          data-pol-id="j6t583"
        >
          {/* Antifragility Gauge - Takes 1 column */}
          <AntifragilityGauge
            value={resilienceMetrics.antifragility_index}
            data-pol-id="ajejil"
          />

          {/* Resilience Metrics - Takes 2 columns */}
          <div className="lg:col-span-2" data-pol-id="17iqkm">
            <ResilienceMetricsCard
              metrics={resilienceMetrics}
              data-pol-id="meu8jx"
            />
          </div>
        </div>
      )}

      {/* Antifragility Overview Cards */}
      {hasData && (
        <div className="space-y-4" data-pol-id="7fi9cm">
          <div data-pol-id="e9m7j2">
            <h2
              className="text-2xl font-bold text-foreground mb-2"
              data-pol-id="axl44z"
            >
              Antifragility Overview
            </h2>
            <p className="text-muted-foreground" data-pol-id="g2o64p">
              Quick snapshot of system-wide antifragility metrics
            </p>
          </div>
          <AntifragilityOverviewCards
            data={antifragilityOverviewData}
            data-pol-id="8pal5h"
          />
        </div>
      )}

      {/* Portfolio Trends Widget */}
      <PortfolioTrendsWidget detailed data-pol-id="zy4fld" />

      {/* Knowledge Graph Widget */}
      {hasData && (() => {
        // Build knowledge graph from system data
        const signals = allDecisions.flatMap((d) => 
          (d.linkedSignals || []).map((ls: any) => ({
            signalId: ls.signalId,
            name: ls.variableKey || ls.signalId,
            category: "Market",
            currentValue: 0,
            trend: "stable",
            lastUpdated: Date.now(),
          }))
        );

        const incidents = getAllIncidents(tenant.tenantId);

        const outcomes = allDecisions.flatMap((d) => {
          if (!d.learningTrace || d.learningTrace.length === 0) return [];
          return d.learningTrace.map((trace, idx) => ({
            id: `${d.id}-outcome-${idx}`,
            decisionId: d.id,
            actualValue: trace.utility,
            expectedValue: trace.utility * 0.9,
            variance: 0.1,
            loggedAt: trace.timestamp,
            triggeredAdjustment: trace.adjustmentCount > 0,
          }));
        });

        const guardrails = allDecisions.flatMap((d) => 
          loadGuardrails(d.id).map((g) => ({
            ...g,
            decisionId: d.id,
          }))
        );

        const graph = buildKnowledgeGraph(
          tenant.tenantId,
          allDecisions,
          signals,
          incidents,
          outcomes,
          guardrails
        );

        return (
          <KnowledgeGraphWidget
            graph={graph}
            onAuditEvent={(eventType, payload) => {
              addAudit(eventType, payload);
            }}
          />
        );
      })()}

      {/* Fragility Heatmap */}
      {portfolioFragilityData.length > 0 && (
        <FragilityHeatmap
          portfolios={portfolioFragilityData}
          onCellClick={(portfolioId, dimension) => {
            console.log(
              `Clicked portfolio ${portfolioId}, dimension ${dimension}`
            );
            addAudit("fragility_heatmap_cell_clicked", {
              portfolioId,
              dimension,
              timestamp: Date.now(),
            });
          }}
          onOpenResiliencePolicy={() => setResiliencePolicyOpen(true)}
          onAuditEvent={(eventType, payload) => {
            addAudit(eventType, payload);
          }}
          data-pol-id="hgxma1"
        />
      )}

      {/* Resilience Policy Drawer */}
      <ResiliencePolicyDrawer
        open={resiliencePolicyOpen}
        onOpenChange={setResiliencePolicyOpen}
        trendData={(() => {
          // Calculate trend data from current metrics
          const avgAI = resilienceMetrics.antifragility_index;
          const breachRate = 1 - resilienceMetrics.guardrail_breach_rate;
          const learningRate = resilienceMetrics.learning_rate;
          const adaptationScore = resilienceMetrics.shock_absorption * 100;

          // Determine trends based on historical comparison (simplified)
          const antifragilityTrend: "improving" | "declining" | "stable" =
            avgAI >= 60 ? "improving" : avgAI >= 40 ? "stable" : "declining";
          const breachTrend: "increasing" | "decreasing" | "stable" =
            breachRate <= 0.15
              ? "decreasing"
              : breachRate >= 0.25
                ? "increasing"
                : "stable";

          const trendData: ResilienceTrendData = {
            avgAntifragilityIndex: avgAI,
            antifragilityTrend,
            breachRate,
            breachTrend,
            learningRate,
            adaptationScore,
            totalDecisions: allDecisions.length,
            totalPortfolios: portfolios.length,
          };

          return trendData;
        })()}
        recommendations={(() => {
          // Generate recommendations based on fragility heatmap and resilience metrics
          const recommendations: GuardrailRecommendation[] = [];

          // Analyze high fragility areas and generate recommendations
          portfolioFragilityData.forEach((portfolio) => {
            // Partner fragility
            if (portfolio.dimensions.partner >= 70) {
              recommendations.push({
                id: `rec-partner-${portfolio.portfolioId}`,
                guardrailType: "Partner Dependency Score Max",
                currentThreshold: 80,
                recommendedThreshold: 70,
                direction: "tighten",
                confidence: 90,
                rationale: `${portfolio.portfolioName} shows high partner fragility (${portfolio.dimensions.partner}). Recommend tighter dependency controls.`,
                impactedDecisions: portfolio.decisionCount,
                riskLevel: "high",
              });
            }

            // Operational fragility
            if (portfolio.dimensions.operational >= 70) {
              recommendations.push({
                id: `rec-operational-${portfolio.portfolioId}`,
                guardrailType: "Operational Risk Threshold",
                currentThreshold: 0.25,
                recommendedThreshold: 0.2,
                direction: "tighten",
                confidence: 88,
                rationale: `${portfolio.portfolioName} shows elevated operational fragility (${portfolio.dimensions.operational}). Stricter controls needed.`,
                impactedDecisions: portfolio.decisionCount,
                riskLevel: "high",
              });
            }

            // Market fragility
            if (portfolio.dimensions.market >= 70) {
              recommendations.push({
                id: `rec-market-${portfolio.portfolioId}`,
                guardrailType: "Market Volatility Limit",
                currentThreshold: 0.3,
                recommendedThreshold: 0.25,
                direction: "tighten",
                confidence: 85,
                rationale: `${portfolio.portfolioName} shows high market fragility (${portfolio.dimensions.market}). Recommend tighter volatility limits.`,
                impactedDecisions: portfolio.decisionCount,
                riskLevel: "high",
              });
            }

            // Financial fragility - loosen if low
            if (portfolio.dimensions.financial <= 30) {
              recommendations.push({
                id: `rec-financial-${portfolio.portfolioId}`,
                guardrailType: "Financial Risk Threshold",
                currentThreshold: 1000000,
                recommendedThreshold: 1200000,
                direction: "loosen",
                confidence: 75,
                rationale: `${portfolio.portfolioName} shows low financial fragility (${portfolio.dimensions.financial}). Organization can handle higher thresholds.`,
                impactedDecisions: portfolio.decisionCount,
                riskLevel: "low",
              });
            }
          });

          // General recommendations based on overall resilience
          if (resilienceMetrics.antifragility_index >= 70) {
            recommendations.push({
              id: "rec-general-loosen-var",
              guardrailType: "VaR95 Threshold",
              currentThreshold: 1000000,
              recommendedThreshold: 1200000,
              direction: "loosen",
              confidence: 85,
              rationale: `Strong antifragility index (${resilienceMetrics.antifragility_index.toFixed(0)}). Organization shows effective adaptation to volatility.`,
              impactedDecisions: Math.floor(allDecisions.length * 0.6),
              riskLevel: "low",
            });
          }

          if (resilienceMetrics.guardrail_breach_rate >= 0.25) {
            recommendations.push({
              id: "rec-general-tighten-raroc",
              guardrailType: "RAROC Minimum",
              currentThreshold: 0.12,
              recommendedThreshold: 0.18,
              direction: "tighten",
              confidence: 92,
              rationale: `High breach rate (${(resilienceMetrics.guardrail_breach_rate * 100).toFixed(1)}%). Stricter risk-adjusted return requirements needed.`,
              impactedDecisions: Math.floor(allDecisions.length * 0.7),
              riskLevel: "high",
            });
          }

          return recommendations;
        })()}
        onApplyRecommendations={(selectedIds) => {
          console.log("Applying recommendations:", selectedIds);
          addAudit("resilience_policy_applied", {
            tenantId: tenant.tenantId,
            timestamp: Date.now(),
            recommendationCount: selectedIds.length,
          });
        }}
        onAuditEvent={(eventType, payload) => {
          addAudit(eventType, payload);
        }}
        data-pol-id="vjx6ab"
      />

      {/* Guardrail Auto-Adjustment Widget */}
      <GuardrailAdjustmentWidget
        onConfigureClick={() => setConfigDialogOpen(true)}
        data-pol-id="5pzwuq"
      />

      {/* Auto-Adjust Configuration Dialog */}
      <AutoAdjustConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onAuditEvent={(eventType, payload) => {
          addAudit(eventType, payload);
        }}
        data-pol-id="j2293k"
      />

      {/* Feedback Loop Modal */}
      {selectedDecisionForLoop &&
        (() => {
          const decision = closedDecisions.find(
            (d) => d.id === selectedDecisionForLoop
          );
          if (!decision) return null;

          const chosenOption = decision.options.find(
            (o) => o.id === decision.chosenOptionId
          );

          // Mock outcome and adjustment data (in real app, fetch from backend)
          const hasOutcome = Math.random() > 0.3; // 70% chance of having outcome
          const hasAdjustments = hasOutcome && Math.random() > 0.4; // 60% chance of adjustments if outcome exists

          return (
            <FeedbackLoopModal
              open={feedbackLoopOpen}
              onOpenChange={setFeedbackLoopOpen}
              decisionTitle={decision.title}
              decisionDate={decision.closedAt || Date.now()}
              chosenOption={chosenOption?.label || "Unknown Option"}
              outcomeData={
                hasOutcome
                  ? {
                      logged: true,
                      date:
                        (decision.closedAt || Date.now()) +
                        15 * 24 * 60 * 60 * 1000,
                      summary:
                        Math.random() > 0.5
                          ? "Performance exceeded expectations"
                          : "Results tracking close to projections",
                    }
                  : {
                      logged: false,
                    }
              }
              adjustmentData={
                hasAdjustments
                  ? {
                      count: Math.floor(Math.random() * 3) + 1,
                      lastAdjustment: "Tightened VaR95 threshold by 5%",
                      date:
                        (decision.closedAt || Date.now()) +
                        20 * 24 * 60 * 60 * 1000,
                    }
                  : {
                      count: 0,
                    }
              }
              data-pol-id="89silw"
            />
          );
        })()}

      {/* Additional Content Placeholder */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        data-pol-id="mws9u4"
      >
        <Card className="rounded-2xl shadow-sm" data-pol-id="lvew6r">
          <CardHeader data-pol-id="bq9vxm">
            <CardTitle data-pol-id="egbx49">Recent Activity</CardTitle>
            <CardDescription data-pol-id="ooknz2">
              Latest events across all modules
            </CardDescription>
          </CardHeader>
          <CardContent data-pol-id="x34948">
            <div className="space-y-4" data-pol-id="qgwnvw">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                  data-pol-id="c2t4dh"
                >
                  <div
                    className="w-2 h-2 rounded-full bg-primary mt-2"
                    data-pol-id="qld72q"
                  />

                  <div className="flex-1 min-w-0" data-pol-id="kh3aq0">
                    <p
                      className="text-sm font-medium text-foreground"
                      data-pol-id="mfy4qn"
                    >
                      Activity {i}
                    </p>
                    <p
                      className="text-xs text-muted-foreground"
                      data-pol-id="cfckkj"
                    >
                      Placeholder event description
                    </p>
                  </div>
                  <span
                    className="text-xs text-muted-foreground whitespace-nowrap"
                    data-pol-id="mdrz3h"
                  >
                    {i}h ago
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm" data-pol-id="5od4b8">
          <CardHeader data-pol-id="808t1p">
            <CardTitle data-pol-id="pe46bf">Module Status</CardTitle>
            <CardDescription data-pol-id="3yyz8f">
              Current operational status
            </CardDescription>
          </CardHeader>
          <CardContent data-pol-id="4384ku">
            <div className="space-y-3" data-pol-id="d9z0xv">
              {["i-Scan", "i-Event", "i-Audit", "Fragile-i", "i-Decide"].map(
                (module) => (
                  <div
                    key={module}
                    className="flex items-center justify-between"
                    data-pol-id="u4p9ge"
                  >
                    <span
                      className="text-sm font-medium text-foreground"
                      data-pol-id="oa6bmw"
                    >
                      {module}
                    </span>
                    <div
                      className="flex items-center gap-2"
                      data-pol-id="6543gz"
                    >
                      <div
                        className="w-2 h-2 rounded-full bg-green-500"
                        data-pol-id="iacsjg"
                      />

                      <span
                        className="text-xs text-muted-foreground"
                        data-pol-id="goc0hy"
                      >
                        Operational
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
