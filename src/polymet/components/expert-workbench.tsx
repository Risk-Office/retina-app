import React, { useState } from "react";
import {
  SplitPaneContainer,
  TripleSplitPaneContainer,
} from "@/polymet/components/split-pane-container";
import { ExpertPanelWrapper } from "@/polymet/components/expert-panel-wrapper";
import {
  ExpertMatrixTable,
  MatrixColumn,
} from "@/polymet/components/expert-matrix-table";
import { CorrelationHeatmap } from "@/polymet/components/correlation-heatmap";
import { GameInteractionPanel } from "@/polymet/components/game-interaction-panel";
import { BayesianPriorPanel } from "@/polymet/components/bayesian-prior-panel";
import { CopulaMatrixPanel } from "@/polymet/components/copula-matrix-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { advancedTheme } from "@/polymet/data/theme-tokens";
import {
  LayoutGridIcon,
  Columns2Icon,
  Columns3Icon,
  MaximizeIcon,
} from "lucide-react";
import type { ScenarioVar } from "@/polymet/data/scenario-engine";

export interface ExpertWorkbenchProps {
  /**
   * Decision ID
   */
  decisionId: string;
  /**
   * Tenant ID
   */
  tenantId: string;
  /**
   * Decision options
   */
  options: Array<{
    id: string;
    label: string;
  }>;
  /**
   * Scenario variables
   */
  scenarioVars: ScenarioVar[];
  /**
   * Simulation runs
   */
  runs: number;
  /**
   * Callback when configuration changes
   */
  onConfigChange?: (config: any) => void;
  /**
   * Callback for audit events
   */
  onAuditEvent?: (eventType: string, payload: any) => void;
  /**
   * Toast notification callback
   */
  onToast?: (message: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

type LayoutMode = "single" | "dual" | "triple";
type PanelType = "game" | "bayesian" | "copula" | "correlation" | "variables";

/**
 * Expert workbench with split panes for advanced analysis
 * Optimized for 1440×900 with 2-3 panels visible simultaneously
 */
export function ExpertWorkbench({
  decisionId,
  tenantId,
  options,
  scenarioVars,
  runs,
  onConfigChange,
  onAuditEvent,
  onToast,
}: ExpertWorkbenchProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("dual");
  const [expertMode, setExpertMode] = useState(true);
  const [leftPanel, setLeftPanel] = useState<PanelType>("game");
  const [centerPanel, setCenterPanel] = useState<PanelType>("bayesian");
  const [rightPanel, setRightPanel] = useState<PanelType>("copula");

  // Game Interaction state
  const [gameConfig, setGameConfig] = useState<any>(undefined);
  const [optionStrategies, setOptionStrategies] = useState<any>(undefined);

  // Bayesian Prior state
  const [bayesianConfig, setBayesianConfig] = useState<any>(undefined);

  // Copula Matrix state
  const [copulaConfig, setCopulaConfig] = useState<any>(undefined);
  const [achievedCopulaMatrix, setAchievedCopulaMatrix] = useState<
    number[][] | undefined
  >(undefined);
  const [copulaFrobeniusError, setCopulaFrobeniusError] = useState<
    number | undefined
  >(undefined);

  // Render panel content
  const renderPanel = (panelType: PanelType) => {
    switch (panelType) {
      case "game":
        return (
          <ExpertPanelWrapper
            title="Game Interaction (2×2)"
            description="Strategy-based multipliers for decision simulation"
            badge="Advanced"
            config={gameConfig}
            onConfigImport={(config) => {
              setGameConfig(config);
              onToast?.({
                title: "Configuration imported",
                description: "Game interaction config loaded",
              });
            }}
            onReset={() => {
              setGameConfig(undefined);
              setOptionStrategies(undefined);
              onToast?.({
                title: "Reset to defaults",
                description: "Game interaction config cleared",
              });
            }}
            expertMode={expertMode}
            onExpertModeChange={setExpertMode}
            className="h-full"
          >
            <GameInteractionPanel
              decisionId={decisionId}
              tenantId={tenantId}
              options={options}
              onConfigChange={(config, strategies) => {
                setGameConfig(config);
                setOptionStrategies(strategies);
                onConfigChange?.({ game: config, strategies });
              }}
              onAuditEvent={onAuditEvent || (() => {})}
            />
          </ExpertPanelWrapper>
        );

      case "bayesian":
        return (
          <ExpertPanelWrapper
            title="Bayesian Prior"
            description="Conjugate Normal-Normal updating with posterior computation"
            badge="Advanced"
            config={bayesianConfig}
            onConfigImport={(config) => {
              setBayesianConfig(config);
              onToast?.({
                title: "Configuration imported",
                description: "Bayesian prior config loaded",
              });
            }}
            onReset={() => {
              setBayesianConfig(undefined);
              onToast?.({
                title: "Reset to defaults",
                description: "Bayesian prior config cleared",
              });
            }}
            expertMode={expertMode}
            onExpertModeChange={setExpertMode}
            className="h-full"
          >
            <BayesianPriorPanel
              scenarioVars={scenarioVars}
              onConfigChange={(config) => {
                setBayesianConfig(config);
                onConfigChange?.({ bayesian: config });
              }}
              onAuditEvent={onAuditEvent || (() => {})}
              onToast={onToast || (() => {})}
            />
          </ExpertPanelWrapper>
        );

      case "copula":
        return (
          <ExpertPanelWrapper
            title="Copula Matrix"
            description="k×k correlation matrix with Iman-Conover reordering"
            badge="Beta"
            config={copulaConfig}
            onConfigImport={(config) => {
              setCopulaConfig(config);
              onToast?.({
                title: "Configuration imported",
                description: "Copula matrix config loaded",
              });
            }}
            onReset={() => {
              setCopulaConfig(undefined);
              setAchievedCopulaMatrix(undefined);
              setCopulaFrobeniusError(undefined);
              onToast?.({
                title: "Reset to defaults",
                description: "Copula matrix config cleared",
              });
            }}
            expertMode={expertMode}
            onExpertModeChange={setExpertMode}
            className="h-full"
          >
            <CopulaMatrixPanel
              scenarioVars={scenarioVars}
              onConfigChange={(config) => {
                setCopulaConfig(config);
                onConfigChange?.({ copula: config });
              }}
              achievedMatrix={achievedCopulaMatrix}
              frobeniusError={copulaFrobeniusError}
              onAuditEvent={onAuditEvent || (() => {})}
              runs={runs}
              onToast={onToast || (() => {})}
            />
          </ExpertPanelWrapper>
        );

      case "correlation":
        // Generate sample correlation matrix from achieved copula or random
        const k = scenarioVars.length;
        const correlationMatrix =
          achievedCopulaMatrix ||
          Array.from({ length: k }, (_, i) =>
            Array.from({ length: k }, (_, j) =>
              i === j ? 1 : Math.random() * 0.6 - 0.3
            )
          );

        return (
          <ExpertPanelWrapper
            title="Correlation Heatmap"
            description="Visual correlation matrix with interactive cells"
            badge="Visualization"
            expertMode={expertMode}
            onExpertModeChange={setExpertMode}
            className="h-full"
          >
            <CorrelationHeatmap
              labels={scenarioVars.map((v) => v.name)}
              matrix={correlationMatrix}
              showValues={true}
              cellSize={60}
              onCellClick={(row, col, value) => {
                console.log(
                  `Correlation: ${scenarioVars[row].name} × ${scenarioVars[col].name} = ${value.toFixed(3)}`
                );
              }}
            />
          </ExpertPanelWrapper>
        );

      case "variables":
        // Create matrix table for scenario variables
        const columns: MatrixColumn<ScenarioVar>[] = [
          {
            id: "name",
            label: "Variable",
            accessor: "name",
            sortable: true,
            width: 150,
            parameterId: "var_name",
          },
          {
            id: "appliesTo",
            label: "Applies To",
            accessor: "appliesTo",
            sortable: true,
            width: 120,
            parameterId: "applies_to",
            cell: (value) => <Badge variant="outline">{value}</Badge>,
          },
          {
            id: "dist",
            label: "Distribution",
            accessor: "dist",
            sortable: true,
            width: 120,
            parameterId: "dist_type",
            cell: (value) => <Badge variant="secondary">{value}</Badge>,
          },
          {
            id: "weight",
            label: "Weight",
            accessor: "weight",
            sortable: true,
            width: 100,
            align: "right",
            parameterId: "weight_val",
            cell: (value) => value?.toFixed(2) || "1.00",
          },
        ];

        return (
          <ExpertPanelWrapper
            title="Scenario Variables"
            description="Matrix view of all scenario variables"
            badge="Data"
            expertMode={expertMode}
            onExpertModeChange={setExpertMode}
            className="h-full"
          >
            <ExpertMatrixTable
              columns={columns}
              data={scenarioVars}
              expertMode={expertMode}
              resizable={true}
              sortable={true}
              onRowClick={(row) => {
                console.log("Selected variable:", row);
              }}
            />
          </ExpertPanelWrapper>
        );

      default:
        return <div className="p-4 text-muted-foreground">Select a panel</div>;
    }
  };

  // Panel selector
  const PanelSelector = ({
    value,
    onChange,
    label,
  }: {
    value: PanelType;
    onChange: (value: PanelType) => void;
    label: string;
  }) => (
    <div className="space-y-1">
      <Label
        style={{
          fontSize: advancedTheme.typography.fontSize.xs,
        }}
      >
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as PanelType)}>
        <SelectTrigger
          style={{
            fontSize: advancedTheme.typography.fontSize.sm,
            padding: `${advancedTheme.spacing.sm} ${advancedTheme.spacing.md}`,
          }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="game">Game Interaction</SelectItem>
          <SelectItem value="bayesian">Bayesian Prior</SelectItem>
          <SelectItem value="copula">Copula Matrix</SelectItem>
          <SelectItem value="correlation">Correlation Heatmap</SelectItem>
          <SelectItem value="variables">Scenario Variables</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg"
        style={{
          fontSize: advancedTheme.typography.fontSize.sm,
          padding: advancedTheme.spacing.md,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">Expert Workbench</span>
          <Badge variant="secondary">Advanced</Badge>
        </div>

        {/* Layout Mode Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={layoutMode === "single" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayoutMode("single")}
          >
            <MaximizeIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={layoutMode === "dual" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayoutMode("dual")}
          >
            <Columns2Icon className="w-4 h-4" />
          </Button>
          <Button
            variant={layoutMode === "triple" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayoutMode("triple")}
          >
            <Columns3Icon className="w-4 h-4" />
          </Button>
        </div>

        {/* Panel Selectors */}
        <div className="flex items-center gap-3">
          {layoutMode !== "single" && (
            <PanelSelector
              value={leftPanel}
              onChange={setLeftPanel}
              label="Left"
            />
          )}
          {layoutMode === "triple" && (
            <PanelSelector
              value={centerPanel}
              onChange={setCenterPanel}
              label="Center"
            />
          )}
          {layoutMode !== "single" && (
            <PanelSelector
              value={layoutMode === "dual" ? rightPanel : rightPanel}
              onChange={setRightPanel}
              label="Right"
            />
          )}
        </div>
      </div>

      {/* Workbench Content */}
      <div className="flex-1 min-h-0">
        {layoutMode === "single" && (
          <div className="h-full">{renderPanel(leftPanel)}</div>
        )}

        {layoutMode === "dual" && (
          <SplitPaneContainer
            direction="horizontal"
            initialSplit={50}
            minSize={400}
            leftPane={renderPanel(leftPanel)}
            rightPane={renderPanel(rightPanel)}
            className="h-full"
          />
        )}

        {layoutMode === "triple" && (
          <TripleSplitPaneContainer
            direction="horizontal"
            initialSplits={[33, 33]}
            minSize={350}
            firstPane={renderPanel(leftPanel)}
            secondPane={renderPanel(centerPanel)}
            thirdPane={renderPanel(rightPanel)}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
