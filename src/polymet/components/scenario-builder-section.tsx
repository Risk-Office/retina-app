import React from "react";
import { LayeredFrame } from "@/polymet/components/layered-frame";
import { DensityBox, DensityGrid } from "@/polymet/components/density-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUpIcon, PlusIcon, TrashIcon, Loader2Icon } from "lucide-react";
import { getLabel } from "@/polymet/data/terms";
import {
  formatParamSummary,
  getDistParamLabels,
  type ScenarioVar,
  type DistributionType,
} from "@/polymet/data/scenario-engine";
import { ScenarioTemplates } from "@/polymet/components/scenario-templates";
import { formatRunId } from "@/polymet/data/run-fingerprint";

export interface ScenarioBuilderSectionProps {
  scenarioVars: ScenarioVar[];
  simRuns: number;
  simSeed: number;
  isSimulating: boolean;
  currentRunId?: string;
  plainLanguage: boolean;
  tenantId: string;
  onAddScenarioVar: () => void;
  onRemoveScenarioVar: (id: string) => void;
  onUpdateScenarioVar: (id: string, updates: Partial<ScenarioVar>) => void;
  onUpdateVarParam: (varId: string, paramKey: string, value: number) => void;
  onSimRunsChange: (runs: number) => void;
  onSimSeedChange: (seed: number) => void;
  onRunSimulation: () => void;
  onApplyTemplate: (variables: ScenarioVar[], templateName: string) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

/**
 * Scenario Builder Section (Layer 4)
 *
 * Risk mapping and scenario modeling with Monte Carlo simulation
 */
export function ScenarioBuilderSection({
  scenarioVars,
  simRuns,
  simSeed,
  isSimulating,
  currentRunId,
  plainLanguage,
  tenantId,
  onAddScenarioVar,
  onRemoveScenarioVar,
  onUpdateScenarioVar,
  onUpdateVarParam,
  onSimRunsChange,
  onSimSeedChange,
  onRunSimulation,
  onApplyTemplate,
  onAuditEvent,
}: ScenarioBuilderSectionProps) {
  return (
    <LayeredFrame
      sectionTitle="Scenario Builder"
      helpTip="Build risk scenarios by defining variables that affect your decision outcomes. Use Monte Carlo simulation to model uncertainty and understand potential outcomes across thousands of scenarios."
      variant="bordered"
    >
      <DensityBox>
        {/* Scenario Templates */}
        <ScenarioTemplates
          currentVariables={scenarioVars}
          onApplyTemplate={onApplyTemplate}
          tenantId={tenantId}
          onAuditEvent={onAuditEvent}
        />

        {/* Simulation Settings */}
        <div>
          <Label className="mb-3 block">Simulation Settings</Label>
          <DensityGrid columns={2}>
            <div>
              <Label htmlFor="sim-runs" className="text-sm">
                {getLabel("runs", { plain: plainLanguage })}
              </Label>
              <Input
                id="sim-runs"
                type="number"
                value={simRuns}
                onChange={(e) => onSimRunsChange(Number(e.target.value))}
                min={100}
                max={50000}
              />
            </div>
            <div>
              <Label htmlFor="sim-seed" className="text-sm">
                {getLabel("seed", { plain: plainLanguage })}
              </Label>
              <Input
                id="sim-seed"
                type="number"
                value={simSeed}
                onChange={(e) => onSimSeedChange(Number(e.target.value))}
              />
            </div>
          </DensityGrid>
        </div>

        {/* Scenario Variables */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>
              {getLabel("scenario", { plain: plainLanguage })} Variables
            </Label>
            <Button variant="outline" size="sm" onClick={onAddScenarioVar}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Variable
            </Button>
          </div>

          <DensityBox>
            {scenarioVars.map((variable) => (
              <div
                key={variable.id}
                className="p-3 border border-border rounded-lg"
              >
                <DensityBox spacing="tight">
                  {/* Variable Name */}
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      value={variable.name}
                      onChange={(e) =>
                        onUpdateScenarioVar(variable.id, {
                          name: e.target.value,
                        })
                      }
                      className="h-8 font-medium"
                      placeholder="Variable name"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveScenarioVar(variable.id)}
                      className="shrink-0"
                    >
                      <TrashIcon className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Applies To & Distribution */}
                  <DensityGrid columns={2}>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Applies To
                      </Label>
                      <Select
                        value={variable.appliesTo}
                        onValueChange={(value: "return" | "cost") =>
                          onUpdateScenarioVar(variable.id, {
                            appliesTo: value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="return">Return</SelectItem>
                          <SelectItem value="cost">Cost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Distribution
                      </Label>
                      <Select
                        value={variable.dist}
                        onValueChange={(value: DistributionType) =>
                          onUpdateScenarioVar(variable.id, { dist: value })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="lognormal">Lognormal</SelectItem>
                          <SelectItem value="triangular">Triangular</SelectItem>
                          <SelectItem value="uniform">Uniform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </DensityGrid>

                  {/* Distribution Parameters */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Parameters: {formatParamSummary(variable)}
                    </Label>
                    <DensityGrid columns={3}>
                      {getDistParamLabels(variable.dist).map((paramKey) => (
                        <div key={paramKey}>
                          <Label className="text-xs text-muted-foreground">
                            {paramKey}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variable.params[paramKey] ?? 0}
                            onChange={(e) =>
                              onUpdateVarParam(
                                variable.id,
                                paramKey,
                                Number(e.target.value)
                              )
                            }
                            className="h-8"
                          />
                        </div>
                      ))}
                    </DensityGrid>
                  </div>

                  {/* Weight */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Weight (multiplier strength)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={variable.weight ?? 1}
                      onChange={(e) =>
                        onUpdateScenarioVar(variable.id, {
                          weight: Number(e.target.value),
                        })
                      }
                      className="h-8"
                    />
                  </div>
                </DensityBox>
              </div>
            ))}
          </DensityBox>
        </div>

        {/* Simulate Button */}
        <div>
          <Button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="w-full"
          >
            {isSimulating ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <TrendingUpIcon className="w-4 h-4 mr-2" />

                {getLabel("simulate", { plain: plainLanguage })}
              </>
            )}
          </Button>
          {currentRunId && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
              <Badge variant="outline" className="font-mono">
                {formatRunId(currentRunId)}
              </Badge>
            </div>
          )}
        </div>
      </DensityBox>
    </LayeredFrame>
  );
}

export default ScenarioBuilderSection;
