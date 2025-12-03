import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  WizardStepIndicator,
  type WizardStep,
} from "@/polymet/components/wizard-step-indicator";
import { WizardStepWrapper } from "@/polymet/components/wizard-step-wrapper";
import { GlossaryTooltip } from "@/polymet/components/glossary-tooltip";
import {
  GoalSelector,
  type LinkedGoal,
} from "@/polymet/components/goal-selector";
import { PlusIcon, TrashIcon, SparklesIcon } from "lucide-react";
import { basicTheme } from "@/polymet/data/theme-tokens";
import type { ScenarioVar } from "@/polymet/data/scenario-engine";

export interface DecisionOption {
  id: string;
  label: string;
  expectedReturn?: number;
  cost?: number;
}

export interface WizardFormData {
  title: string;
  description: string;
  linkedGoals: LinkedGoal[];
  options: DecisionOption[];
  scenarioVars: ScenarioVar[];
}

export interface DecisionWizardProps {
  /**
   * Initial form data (for editing existing decisions)
   */
  initialData?: Partial<WizardFormData>;
  /**
   * Callback when wizard is completed
   */
  onComplete: (data: WizardFormData) => void;
  /**
   * Callback when wizard is cancelled
   */
  onCancel: () => void;
  /**
   * Tenant ID for goal selector
   */
  tenantId: string;
}

/**
 * Decision Wizard Component
 *
 * Friendly, low-cognitive-load wizard that guides users to their first simulation in ≤6 interactions:
 * 1. Decision Title & Description
 * 2. Options (minimum 2)
 * 3. Link to Goals (optional, can skip)
 * 4. Quick Financials (optional, can skip)
 * 5. Risk Variables (optional, can skip)
 * 6. Run Simulation
 */
export function DecisionWizard({
  initialData,
  onComplete,
  onCancel,
  tenantId,
}: DecisionWizardProps) {
  const tokens = basicTheme;

  // Wizard steps
  const steps: WizardStep[] = [
    { id: "title", label: "Decision" },
    { id: "options", label: "Options" },
    { id: "goals", label: "Goals", optional: true },
    { id: "financials", label: "Financials", optional: true },
    { id: "risks", label: "Risk Factors", optional: true },
    { id: "simulate", label: "Simulate" },
  ];

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<WizardFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    linkedGoals: initialData?.linkedGoals || [],
    options: initialData?.options || [
      { id: "opt-1", label: "", expectedReturn: 100, cost: 50 },
      { id: "opt-2", label: "", expectedReturn: 120, cost: 70 },
    ],

    scenarioVars: initialData?.scenarioVars || [],
  });

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Title
        return formData.title.trim().length > 0;
      case 1: // Options
        return (
          formData.options.length >= 2 &&
          formData.options.every((opt) => opt.label.trim().length > 0)
        );

      case 2: // Goals (optional)
        return true;
      case 3: // Financials (optional)
        return true;
      case 4: // Risks (optional)
        return true;
      case 5: // Simulate
        return true;
      default:
        return false;
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete wizard
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  // Option handlers
  const handleAddOption = () => {
    const newId = `opt-${formData.options.length + 1}`;
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {
          id: newId,
          label: "",
          expectedReturn: 100,
          cost: 50,
        },
      ],
    });
  };

  const handleRemoveOption = (id: string) => {
    if (formData.options.length > 2) {
      setFormData({
        ...formData,
        options: formData.options.filter((opt) => opt.id !== id),
      });
    }
  };

  const handleUpdateOption = (
    id: string,
    field: keyof DecisionOption,
    value: string | number
  ) => {
    setFormData({
      ...formData,
      options: formData.options.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      ),
    });
  };

  // Risk variable handlers
  const handleAddRiskVar = () => {
    const newId = `var-${Date.now()}`;
    setFormData({
      ...formData,
      scenarioVars: [
        ...formData.scenarioVars,
        {
          id: newId,
          name: "",
          appliesTo: "return",
          dist: "normal",
          params: { mean: 0, sd: 0.1 },
          weight: 1,
        },
      ],
    });
  };

  const handleRemoveRiskVar = (id: string) => {
    setFormData({
      ...formData,
      scenarioVars: formData.scenarioVars.filter((v) => v.id !== id),
    });
  };

  const handleUpdateRiskVar = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      scenarioVars: formData.scenarioVars.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Title & Description
        return (
          <WizardStepWrapper
            title="What are you deciding?"
            description="Give your decision a clear, descriptive title"
            tip="A good title helps you and your team quickly understand what this decision is about. For example: 'Choose new office location' or 'Select marketing agency'"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Decision Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Choose new office location"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="text-lg h-12"
                  style={{
                    borderRadius: tokens.radius.md,
                    fontSize: tokens.typography.fontSize.lg,
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add any context or details..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  style={{
                    borderRadius: tokens.radius.md,
                    fontSize: tokens.typography.fontSize.base,
                  }}
                />
              </div>
            </div>
          </WizardStepWrapper>
        );

      case 1: // Options
        return (
          <WizardStepWrapper
            title="What are your options?"
            description="List the choices you're considering (minimum 2)"
            tip="Think of these as the different paths you could take. You'll compare them in the next steps."
          >
            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder={`Option ${index + 1} (e.g., Downtown office, Suburban office)`}
                      value={option.label}
                      onChange={(e) =>
                        handleUpdateOption(option.id, "label", e.target.value)
                      }
                      className="text-base h-12"
                      style={{
                        borderRadius: tokens.radius.md,
                        fontSize: tokens.typography.fontSize.base,
                      }}
                    />
                  </div>
                  {formData.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(option.id)}
                      className="shrink-0 h-12 w-12"
                    >
                      <TrashIcon className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={handleAddOption}
                className="w-full h-12"
                style={{
                  borderRadius: tokens.radius.md,
                  fontSize: tokens.typography.fontSize.base,
                }}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Another Option
              </Button>
            </div>
          </WizardStepWrapper>
        );

      case 2: // Link to Goals
        return (
          <WizardStepWrapper
            title="Link to strategic goals"
            description="Connect this decision to your organization's goals (optional)"
            tip="Linking to goals helps track how decisions contribute to your strategic objectives. You can skip this step and add goals later."
          >
            <div className="space-y-4">
              <GoalSelector
                selectedGoals={formData.linkedGoals}
                onGoalsChange={(goals) =>
                  setFormData({ ...formData, linkedGoals: goals })
                }
              />

              {formData.linkedGoals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No goals linked yet. Click "Link Goal" above to connect this
                  decision to your strategic goals.
                </p>
              )}
            </div>
          </WizardStepWrapper>
        );

      case 3: // Quick Financials
        return (
          <WizardStepWrapper
            title="Add financial estimates"
            description="Quick numbers for each option (optional)"
            tip="These estimates help compare options financially. Don't worry about being exact - rough estimates work fine. You can skip this step if you don't have numbers yet."
          >
            <div className="space-y-6">
              {formData.options.map((option) => (
                <div
                  key={option.id}
                  className="p-4 border border-border rounded-lg space-y-4"
                  style={{
                    borderRadius: tokens.radius.md,
                    padding: tokens.spacing.lg,
                  }}
                >
                  <div className="font-semibold text-base">
                    {option.label || "Unnamed option"}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`return-${option.id}`}
                          className="text-sm"
                        >
                          Expected Return
                        </Label>
                        <GlossaryTooltip term="expectedReturn" />
                      </div>
                      <Input
                        id={`return-${option.id}`}
                        type="number"
                        placeholder="100"
                        value={option.expectedReturn || ""}
                        onChange={(e) =>
                          handleUpdateOption(
                            option.id,
                            "expectedReturn",
                            Number(e.target.value)
                          )
                        }
                        style={{
                          borderRadius: tokens.radius.md,
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`cost-${option.id}`}
                          className="text-sm"
                        >
                          Cost
                        </Label>
                        <GlossaryTooltip term="cost" />
                      </div>
                      <Input
                        id={`cost-${option.id}`}
                        type="number"
                        placeholder="50"
                        value={option.cost || ""}
                        onChange={(e) =>
                          handleUpdateOption(
                            option.id,
                            "cost",
                            Number(e.target.value)
                          )
                        }
                        style={{
                          borderRadius: tokens.radius.md,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </WizardStepWrapper>
        );

      case 4: // Risk Variables
        return (
          <WizardStepWrapper
            title="Add risk factors"
            description="What uncertainties might affect your decision? (optional)"
            tip="Risk factors are things that could vary and impact your results - like market demand, costs, or competitor actions. Add 1-2 key factors, or skip this step to use defaults."
          >
            <div className="space-y-4">
              {formData.scenarioVars.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    No risk factors added yet. We'll use default market
                    uncertainty factors.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleAddRiskVar}
                    style={{
                      borderRadius: tokens.radius.md,
                    }}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add a Risk Factor
                  </Button>
                </div>
              ) : (
                <>
                  {formData.scenarioVars.map((variable) => (
                    <div
                      key={variable.id}
                      className="p-4 border border-border rounded-lg space-y-3"
                      style={{
                        borderRadius: tokens.radius.md,
                        padding: tokens.spacing.lg,
                      }}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="e.g., Market demand variability"
                            value={variable.name}
                            onChange={(e) =>
                              handleUpdateRiskVar(
                                variable.id,
                                "name",
                                e.target.value
                              )
                            }
                            style={{
                              borderRadius: tokens.radius.md,
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRiskVar(variable.id)}
                        >
                          <TrashIcon className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={handleAddRiskVar}
                    className="w-full"
                    style={{
                      borderRadius: tokens.radius.md,
                    }}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Another Risk Factor
                  </Button>
                </>
              )}
            </div>
          </WizardStepWrapper>
        );

      case 5: // Run Simulation
        return (
          <WizardStepWrapper
            title="Ready to simulate!"
            description="Review your decision and run the simulation"
            tip="The simulation will analyze your options using advanced risk modeling. This takes just a few seconds."
          >
            <div className="space-y-6">
              {/* Summary */}
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Decision
                  </div>
                  <div className="text-lg font-semibold">{formData.title}</div>
                  {formData.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {formData.description}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Options
                  </div>
                  <div className="space-y-1">
                    {formData.options.map((option, index) => (
                      <div key={option.id} className="text-base">
                        {index + 1}. {option.label}
                      </div>
                    ))}
                  </div>
                </div>
                {formData.linkedGoals.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Linked Goals
                    </div>
                    <div className="text-sm">
                      {formData.linkedGoals.length} goal(s) linked
                    </div>
                  </div>
                )}
              </div>

              {/* Success message */}
              <div
                className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg"
                style={{
                  borderRadius: tokens.radius.md,
                  padding: tokens.spacing.lg,
                }}
              >
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />

                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      Great work!
                    </div>
                    <div className="text-sm text-green-800 dark:text-green-200">
                      You've completed the setup in just{" "}
                      {completedSteps.length + 1} steps. Click "Run Simulation"
                      to see your results.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </WizardStepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Step Indicator */}
      <WizardStepIndicator
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <div
        className="flex items-center justify-between gap-4"
        style={{
          paddingTop: tokens.spacing.lg,
        }}
      >
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handleBack}
          className="h-12 px-8"
          style={{
            borderRadius: tokens.radius.md,
            fontSize: tokens.typography.fontSize.base,
          }}
        >
          {currentStep === 0 ? "Cancel" : "Back"}
        </Button>

        <div className="flex gap-3">
          {/* Skip button for optional steps */}
          {steps[currentStep].optional && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="h-12 px-6"
              style={{
                borderRadius: tokens.radius.md,
                fontSize: tokens.typography.fontSize.base,
              }}
            >
              Skip for now
            </Button>
          )}

          {/* Next/Complete button */}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="h-12 px-8"
            style={{
              borderRadius: tokens.radius.md,
              fontSize: tokens.typography.fontSize.base,
            }}
          >
            {currentStep === steps.length - 1 ? "Run Simulation" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
