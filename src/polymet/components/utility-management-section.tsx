import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUpIcon,
  TargetIcon,
  BarChart3Icon,
  PieChartIcon,
} from "lucide-react";
import { RiskToleranceCalibrator } from "@/polymet/components/risk-tolerance-calibrator";
import { UtilityComparisonReport } from "@/polymet/components/utility-comparison-report";
import { PortfolioOptimizer } from "@/polymet/components/portfolio-optimizer";
import {
  runSimulation,
  DEFAULT_SCENARIO_VARS,
  type SimulationResult,
} from "@/polymet/data/scenario-engine";
import type { UtilitySettings } from "@/polymet/data/tenant-settings";

interface UtilityManagementSectionProps {
  currentSettings: UtilitySettings;
  onUpdateSettings: (settings: UtilitySettings) => void;
  tenantId: string;
}

export function UtilityManagementSection({
  currentSettings,
  onUpdateSettings,
  tenantId,
}: UtilityManagementSectionProps) {
  const [activeTab, setActiveTab] = useState("calibration");

  // Generate sample simulation results for demonstration
  const mockOptions = [
    {
      id: "opt-1",
      label: "Conservative Strategy",
      expectedReturn: 100,
      cost: 50,
    },
    { id: "opt-2", label: "Balanced Approach", expectedReturn: 150, cost: 70 },
    { id: "opt-3", label: "Growth Strategy", expectedReturn: 200, cost: 90 },
    {
      id: "opt-4",
      label: "Aggressive Investment",
      expectedReturn: 300,
      cost: 120,
    },
  ];

  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[]
  >(() => {
    try {
      if (!currentSettings || !mockOptions || !DEFAULT_SCENARIO_VARS) {
        console.error("Missing required data for simulation");
        return [];
      }
      return runSimulation(mockOptions, DEFAULT_SCENARIO_VARS, 1000, 42, {
        mode: currentSettings.mode,
        a: currentSettings.a,
        scale: currentSettings.scale,
      });
    } catch (error) {
      console.error("Error initializing simulation:", error);
      return [];
    }
  });

  const handleSettingsUpdate = (settings: UtilitySettings) => {
    try {
      if (!settings || !mockOptions || !DEFAULT_SCENARIO_VARS) {
        console.error("Missing required data for settings update");
        return;
      }
      onUpdateSettings(settings);

      // Re-run simulation with new settings
      const newResults = runSimulation(
        mockOptions,
        DEFAULT_SCENARIO_VARS,
        1000,
        42,
        {
          mode: settings.mode,
          a: settings.a,
          scale: settings.scale,
        }
      );
      setSimulationResults(newResults);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const handleRefreshSimulation = () => {
    try {
      if (!currentSettings || !mockOptions || !DEFAULT_SCENARIO_VARS) {
        console.error("Missing required data for simulation refresh");
        return;
      }
      const newResults = runSimulation(
        mockOptions,
        DEFAULT_SCENARIO_VARS,
        1000,
        42,
        {
          mode: currentSettings.mode,
          a: currentSettings.a,
          scale: currentSettings.scale,
        }
      );
      setSimulationResults(newResults);
    } catch (error) {
      console.error("Error refreshing simulation:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                Advanced Utility Management
              </CardTitle>
              <CardDescription>
                Calibrate risk tolerance, compare utility functions, and
                optimize portfolios
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {currentSettings.mode} Mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="calibration"
                className="flex items-center gap-2"
              >
                <TargetIcon className="h-4 w-4" />
                Risk Calibration
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="flex items-center gap-2"
              >
                <BarChart3Icon className="h-4 w-4" />
                Utility Comparison
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="flex items-center gap-2"
              >
                <PieChartIcon className="h-4 w-4" />
                Portfolio Optimizer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calibration" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Risk Tolerance Calibration
                  </CardTitle>
                  <CardDescription>
                    Answer questions to determine your optimal risk aversion
                    coefficient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RiskToleranceCalibrator
                    currentSettings={currentSettings}
                    onApplySettings={handleSettingsUpdate}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Utility Function Comparison
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Compare how different utility modes evaluate the same
                    options
                  </p>
                </div>
                <Button
                  onClick={handleRefreshSimulation}
                  variant="outline"
                  size="sm"
                >
                  Refresh Simulation
                </Button>
              </div>

              <UtilityComparisonReport
                results={simulationResults}
                currentMode={currentSettings.mode}
                coefficient={currentSettings.a}
                scale={currentSettings.scale}
              />
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6 mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  Portfolio Optimization
                </h3>
                <p className="text-sm text-muted-foreground">
                  Optimize allocation across options using utility-based
                  optimization
                </p>
              </div>

              <PortfolioOptimizer
                results={simulationResults}
                utilityParams={{
                  mode: currentSettings.mode,
                  a: currentSettings.a,
                  scale: currentSettings.scale,
                }}
                totalBudget={1000000}
                onApplyAllocation={(allocation) => {
                  console.log("Applied allocation:", allocation);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Current Utility Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <span className="ml-2 font-medium">{currentSettings.mode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Risk Aversion (a):</span>
              <span className="ml-2 font-mono">
                {currentSettings.a.toExponential(2)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Outcome Scale:</span>
              <span className="ml-2 font-mono">
                {currentSettings.scale.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Use for Recommendation:
              </span>
              <span className="ml-2 font-medium">
                {currentSettings.useForRecommendation ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
