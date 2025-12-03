import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { TenantProvider } from "@/polymet/data/tenant-context";
import { ThemeProvider } from "@/polymet/components/theme-provider";
import { RetinaLayout } from "@/polymet/layouts/retina-layout";
import { RetinaDashboard } from "@/polymet/pages/retina-dashboard";
import { RetinaModulesIndex } from "@/polymet/pages/retina-modules-index";
import { RetinaIDecide } from "@/polymet/pages/retina-i-decide";
import { RetinaPortfolios } from "@/polymet/pages/retina-portfolios";
import { RetinaTenantDemo } from "@/polymet/pages/retina-tenant-demo";
import { RetinaAudit } from "@/polymet/pages/retina-audit";
import { RetinaAdmin } from "@/polymet/pages/retina-admin";
import { RetinaLearningFeed } from "@/polymet/pages/retina-learning-feed";
import { RetinaGoalsDashboard } from "@/polymet/pages/retina-goals-dashboard";
import { RetinaGoalsNew } from "@/polymet/pages/retina-goals-new";
import { RetinaGoalsMap } from "@/polymet/pages/retina-goals-map";
import { RetinaStakeholders } from "@/polymet/pages/retina-stakeholders";
import { RetinaGoalsMatrix } from "@/polymet/pages/retina-goals-matrix";
import { RetinaClosedDecisions } from "@/polymet/pages/retina-closed-decisions";
import { ThemeCheckPlayground } from "@/polymet/pages/theme-check-playground";
import { RetinaSettings } from "@/polymet/pages/retina-settings";
import { ModuleRouteGuard } from "@/polymet/components/module-route-guard";
import { useRetinaStore } from "@/polymet/data/retina-store";
import {
  startSignalMonitoring,
  seedMockSignalValues,
} from "@/polymet/data/signal-monitor";
import { onSignalUpdate } from "@/polymet/data/auto-refresh-engine";
import { RevaluationTagsDashboard } from "@/polymet/components/revaluation-tags-dashboard";

function AppWithMonitoring() {
  const { decisions } = useRetinaStore();

  useEffect(() => {
    // Seed mock signal values on app startup
    seedMockSignalValues();

    // Start signal monitoring service
    const cleanup = startSignalMonitoring(
      () => decisions,
      (tag) => {
        console.log("Re-evaluation tag created:", tag);

        // Trigger auto-refresh for decisions with signal updates
        if (tag.triggered_by && tag.triggered_by.length > 0) {
          const tenantId = localStorage.getItem("retina-tenant-id") || "t-demo";
          onSignalUpdate(tag.triggered_by, tenantId, (results) => {
            console.log("Auto-refresh completed:", results);
            // Results are automatically saved to store by auto-refresh engine
          });
        }
      }
    );

    // Cleanup on unmount
    return cleanup;
  }, [decisions]);

  return null;
}

export default function RetinaApp() {
  return (
    <TenantProvider>
      <Router>
        <ThemeProvider enableRouteThemes={true}>
          <AppWithMonitoring />

          <Routes>
            {/* Redirect root to /retina */}
            <Route path="/" element={<Navigate to="/retina" replace />} />

            {/* Dashboard */}
            <Route
              path="/retina"
              element={
                <RetinaLayout>
                  <RetinaDashboard />
                </RetinaLayout>
              }
            />

            {/* Modules Index */}
            <Route
              path="/retina/modules"
              element={
                <RetinaLayout>
                  <RetinaModulesIndex />
                </RetinaLayout>
              }
            />

            {/* i-Decide Module */}
            <Route
              path="/retina/modules/i-decide"
              element={
                <RetinaLayout>
                  <ModuleRouteGuard moduleKey="i-decide" moduleName="i-Decide">
                    <RetinaIDecide />
                  </ModuleRouteGuard>
                </RetinaLayout>
              }
            />

            {/* i-Decide Closed Decisions Sub-tab */}
            <Route
              path="/retina/modules/i-decide/closed"
              element={
                <RetinaLayout>
                  <ModuleRouteGuard moduleKey="i-decide" moduleName="i-Decide">
                    <RetinaClosedDecisions />
                  </ModuleRouteGuard>
                </RetinaLayout>
              }
            />

            {/* Portfolios */}
            <Route
              path="/retina/portfolios"
              element={
                <RetinaLayout>
                  <RetinaPortfolios />
                </RetinaLayout>
              }
            />

            {/* Learning Feed */}
            <Route
              path="/retina/learning-feed"
              element={
                <RetinaLayout>
                  <RetinaLearningFeed />
                </RetinaLayout>
              }
            />

            {/* Goals & Objectives */}
            <Route
              path="/retina/goals"
              element={
                <RetinaLayout>
                  <RetinaGoalsDashboard />
                </RetinaLayout>
              }
            />

            {/* New Goal Wizard */}
            <Route
              path="/retina/goals/new"
              element={
                <RetinaLayout>
                  <RetinaGoalsNew />
                </RetinaLayout>
              }
            />

            {/* Goals Dependency Map */}
            <Route
              path="/retina/goals/map"
              element={
                <RetinaLayout>
                  <RetinaGoalsMap />
                </RetinaLayout>
              }
            />

            {/* Goals Ownership Matrix */}
            <Route
              path="/retina/goals/matrix"
              element={
                <RetinaLayout>
                  <RetinaGoalsMatrix />
                </RetinaLayout>
              }
            />

            {/* Stakeholders Directory */}
            <Route
              path="/retina/stakeholders"
              element={
                <RetinaLayout>
                  <RetinaStakeholders />
                </RetinaLayout>
              }
            />

            {/* Re-evaluation Tags Dashboard */}
            <Route
              path="/retina/revaluation-tags"
              element={
                <RetinaLayout>
                  <RevaluationTagsDashboard />
                </RetinaLayout>
              }
            />

            {/* Theme Check Playground */}
            <Route
              path="/playground/theme-check"
              element={<ThemeCheckPlayground />}
            />

            {/* Placeholder routes for other modules */}
            <Route
              path="/retina/modules/i-scan"
              element={
                <RetinaLayout>
                  <ModuleRouteGuard moduleKey="i-scan" moduleName="i-Scan">
                    <div className="p-6">
                      <h1 className="text-3xl font-bold">i-Scan Module</h1>
                      <p className="text-muted-foreground mt-2">
                        Module placeholder - coming soon
                      </p>
                    </div>
                  </ModuleRouteGuard>
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/modules/i-event"
              element={
                <RetinaLayout>
                  <ModuleRouteGuard moduleKey="i-event" moduleName="i-Event">
                    <div className="p-6">
                      <h1 className="text-3xl font-bold">i-Event Module</h1>
                      <p className="text-muted-foreground mt-2">
                        Module placeholder - coming soon
                      </p>
                    </div>
                  </ModuleRouteGuard>
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/modules/i-audit"
              element={
                <RetinaLayout>
                  <ModuleRouteGuard moduleKey="i-audit" moduleName="i-Audit">
                    <div className="p-6">
                      <h1 className="text-3xl font-bold">i-Audit Module</h1>
                      <p className="text-muted-foreground mt-2">
                        Module placeholder - coming soon
                      </p>
                    </div>
                  </ModuleRouteGuard>
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/modules/fragile-i"
              element={
                <RetinaLayout>
                  <ModuleRouteGuard
                    moduleKey="fragile-i"
                    moduleName="Fragile-i"
                  >
                    <div className="p-6">
                      <h1 className="text-3xl font-bold">Fragile-i Module</h1>
                      <p className="text-muted-foreground mt-2">
                        Module placeholder - coming soon
                      </p>
                    </div>
                  </ModuleRouteGuard>
                </RetinaLayout>
              }
            />

            {/* Admin routes */}
            <Route
              path="/retina/admin"
              element={
                <RetinaLayout>
                  <RetinaAdmin />
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/audit"
              element={
                <RetinaLayout>
                  <RetinaAudit />
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/admin/tenant-demo"
              element={
                <RetinaLayout>
                  <RetinaTenantDemo />
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/admin/users"
              element={
                <RetinaLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground mt-2">
                      Admin section - coming soon
                    </p>
                  </div>
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/admin/settings"
              element={
                <RetinaLayout>
                  <RetinaSettings />
                </RetinaLayout>
              }
            />

            <Route
              path="/retina/admin/data"
              element={
                <RetinaLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold">Data Management</h1>
                    <p className="text-muted-foreground mt-2">
                      Admin section - coming soon
                    </p>
                  </div>
                </RetinaLayout>
              }
            />
          </Routes>
        </ThemeProvider>
      </Router>
    </TenantProvider>
  );
}
