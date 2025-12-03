import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoMicroTip } from "@/polymet/components/info-micro-tip";
import { ScenarioVariableCard } from "@/polymet/components/scenario-variable-card";
import type { ScenarioVar } from "@/polymet/data/scenario-engine";
import { intermediateTheme } from "@/polymet/data/theme-tokens";

export interface RiskMapPanelProps {
  /**
   * Scenario variables
   */
  variables: ScenarioVar[];
  /**
   * Update variable handler
   */
  onUpdateVariable: (id: string, updates: Partial<ScenarioVar>) => void;
  /**
   * Update variable parameter handler
   */
  onUpdateVarParam: (varId: string, paramKey: string, value: number) => void;
  /**
   * Add variable handler
   */
  onAddVariable: () => void;
  /**
   * Remove variable handler
   */
  onRemoveVariable: (id: string) => void;
  /**
   * Optional className
   */
  className?: string;
}

/**
 * RiskMapPanel Component
 *
 * Grid layout with side info panel for risk mapping and scenario modeling.
 * Uses intermediate theme tokens for professional, data-driven interface.
 * Implements Carbon Design System accessibility patterns.
 */
export function RiskMapPanel({
  variables,
  onUpdateVariable,
  onUpdateVarParam,
  onAddVariable,
  onRemoveVariable,
  className = "",
}: RiskMapPanelProps) {
  const [isVariablesExpanded, setIsVariablesExpanded] = useState(true);
  const [isInfoPanelExpanded, setIsInfoPanelExpanded] = useState(true);

  // Calculate statistics
  const returnVars = variables.filter((v) => v.appliesTo === "return");
  const costVars = variables.filter((v) => v.appliesTo === "cost");
  const totalWeight = variables.reduce((sum, v) => sum + (v.weight || 1), 0);

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${className}`}
      style={{
        fontSize: intermediateTheme.typography.fontSize.base,
        fontFamily: intermediateTheme.typography.fontFamily,
      }}
    >
      {/* Main Content Area - 8 columns */}
      <div className="lg:col-span-8 space-y-4">
        {/* Variables Section - Collapsible */}
        <Card
          className="border-border/50"
          style={{
            borderRadius: intermediateTheme.radius.lg,
            boxShadow: intermediateTheme.elevation.md,
          }}
        >
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setIsVariablesExpanded(!isVariablesExpanded)}
            role="button"
            aria-expanded={isVariablesExpanded}
            aria-controls="variables-content"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsVariablesExpanded(!isVariablesExpanded);
              }
            }}
            style={{
              padding: intermediateTheme.spacing.lg,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-primary" />

                <CardTitle
                  className="text-lg font-semibold"
                  style={{
                    fontSize: intermediateTheme.typography.fontSize["2xl"],
                  }}
                >
                  Scenario Variables
                </CardTitle>
                <InfoMicroTip
                  content="Define variables that model uncertainty in your decision. Each variable represents a source of risk or opportunity."
                  ariaLabel="Learn more about scenario variables"
                />

                <Badge variant="secondary" className="ml-2">
                  {variables.length}
                </Badge>
              </div>
              {isVariablesExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>

          {isVariablesExpanded && (
            <CardContent
              id="variables-content"
              role="region"
              aria-labelledby="variables-heading"
              style={{
                padding: intermediateTheme.spacing.lg,
                paddingTop: 0,
              }}
            >
              <div className="space-y-4">
                {/* Variables Grid */}
                {variables.length > 0 ? (
                  <div
                    className="grid grid-cols-1 xl:grid-cols-2 gap-3"
                    role="list"
                    aria-label="Scenario variables list"
                  >
                    {variables.map((variable, index) => (
                      <div key={variable.id} role="listitem">
                        <ScenarioVariableCard
                          variable={variable}
                          index={index}
                          onUpdate={(updates) =>
                            onUpdateVariable(variable.id, updates)
                          }
                          onUpdateParam={(paramKey, value) =>
                            onUpdateVarParam(variable.id, paramKey, value)
                          }
                          onRemove={() => onRemoveVariable(variable.id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <TrendingUpIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No variables defined yet
                    </p>
                  </div>
                )}

                {/* Add Variable Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddVariable}
                  className="w-full"
                  style={{
                    borderRadius: intermediateTheme.radius.md,
                    padding: `${intermediateTheme.spacing.sm} ${intermediateTheme.spacing.md}`,
                  }}
                >
                  <TrendingUpIcon className="w-4 h-4 mr-2" />
                  Add Variable
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Side Info Panel - 4 columns */}
      <div className="lg:col-span-4 space-y-4">
        <Card
          className="border-border/50 sticky top-4"
          style={{
            borderRadius: intermediateTheme.radius.lg,
            boxShadow: intermediateTheme.elevation.md,
          }}
        >
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setIsInfoPanelExpanded(!isInfoPanelExpanded)}
            role="button"
            aria-expanded={isInfoPanelExpanded}
            aria-controls="info-panel-content"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsInfoPanelExpanded(!isInfoPanelExpanded);
              }
            }}
            style={{
              padding: intermediateTheme.spacing.lg,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <InfoIcon className="w-5 h-5 text-primary" />

                <CardTitle
                  className="text-lg font-semibold"
                  style={{
                    fontSize: intermediateTheme.typography.fontSize.xl,
                  }}
                >
                  Risk Summary
                </CardTitle>
              </div>
              {isInfoPanelExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>

          {isInfoPanelExpanded && (
            <CardContent
              id="info-panel-content"
              role="region"
              aria-labelledby="info-panel-heading"
              style={{
                padding: intermediateTheme.spacing.lg,
                paddingTop: 0,
              }}
            >
              <div className="space-y-4">
                {/* Statistics */}
                <div
                  className="space-y-3"
                  role="list"
                  aria-label="Risk statistics"
                >
                  <div
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    role="listitem"
                    style={{
                      borderRadius: intermediateTheme.radius.md,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{
                          fontSize: intermediateTheme.typography.fontSize.sm,
                        }}
                      >
                        Total Variables
                      </span>
                      <InfoMicroTip
                        content="Number of uncertainty sources modeled"
                        ariaLabel="Learn more about total variables"
                      />
                    </div>
                    <Badge variant="secondary">{variables.length}</Badge>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    role="listitem"
                    style={{
                      borderRadius: intermediateTheme.radius.md,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{
                          fontSize: intermediateTheme.typography.fontSize.sm,
                        }}
                      >
                        Return Variables
                      </span>
                      <InfoMicroTip
                        content="Variables affecting expected returns"
                        ariaLabel="Learn more about return variables"
                      />
                    </div>
                    <Badge variant="outline">{returnVars.length}</Badge>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    role="listitem"
                    style={{
                      borderRadius: intermediateTheme.radius.md,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{
                          fontSize: intermediateTheme.typography.fontSize.sm,
                        }}
                      >
                        Cost Variables
                      </span>
                      <InfoMicroTip
                        content="Variables affecting costs and expenses"
                        ariaLabel="Learn more about cost variables"
                      />
                    </div>
                    <Badge variant="outline">{costVars.length}</Badge>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    role="listitem"
                    style={{
                      borderRadius: intermediateTheme.radius.md,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{
                          fontSize: intermediateTheme.typography.fontSize.sm,
                        }}
                      >
                        Total Weight
                      </span>
                      <InfoMicroTip
                        content="Sum of all variable weights (impact strength)"
                        ariaLabel="Learn more about total weight"
                      />
                    </div>
                    <Badge variant="outline">{totalWeight.toFixed(1)}</Badge>
                  </div>
                </div>

                {/* Distribution Breakdown */}
                {variables.length > 0 && (
                  <div className="space-y-2">
                    <h3
                      className="text-sm font-medium flex items-center gap-2"
                      style={{
                        fontSize: intermediateTheme.typography.fontSize.sm,
                      }}
                    >
                      Distribution Types
                      <InfoMicroTip
                        content="Statistical distributions used to model uncertainty"
                        ariaLabel="Learn more about distribution types"
                      />
                    </h3>
                    <div className="space-y-2">
                      {["normal", "lognormal", "triangular", "uniform"].map(
                        (dist) => {
                          const count = variables.filter(
                            (v) => v.dist === dist
                          ).length;
                          if (count === 0) return null;
                          return (
                            <div
                              key={dist}
                              className="flex items-center justify-between text-xs"
                              style={{
                                fontSize:
                                  intermediateTheme.typography.fontSize.xs,
                              }}
                            >
                              <span className="text-muted-foreground capitalize">
                                {dist}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Help Text */}
                <div
                  className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md"
                  role="note"
                  aria-label="Help information"
                  style={{
                    borderRadius: intermediateTheme.radius.md,
                  }}
                >
                  <p
                    className="text-xs text-blue-700 dark:text-blue-400"
                    style={{
                      fontSize: intermediateTheme.typography.fontSize.xs,
                      lineHeight:
                        intermediateTheme.typography.lineHeight.relaxed,
                    }}
                  >
                    <strong>Tip:</strong> Start with 2-3 key variables that have
                    the most impact on your decision. You can add more variables
                    as needed for deeper analysis.
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
