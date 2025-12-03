import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  AlertCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useGoalsV2 } from "@/polymet/data/use-goals-v2";
import { useStakeholdersV2 } from "@/polymet/data/use-stakeholders-v2";
import {
  validateSMART,
  getSMARTSuggestions,
} from "@/polymet/data/smart-validator-v2";
import {
  validateDependencies,
  type GoalDependency,
} from "@/polymet/data/dependency-cycle-v2";
import type { GoalV2, TimeUnit } from "@/polymet/data/goal-v2-schema";
import { computeTimeHorizonCategory } from "@/polymet/data/goal-v2-schema";
import { GoalFormV2 } from "@/polymet/components/goal-form-v2";
import { GoalTemplatesDialog } from "@/polymet/components/goal-templates-dialog";
import type { GoalTemplate } from "@/polymet/data/industry-goal-templates";

interface GoalWizardV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onSuccess?: () => void;
}

export function GoalWizardV2({
  open,
  onOpenChange,
  tenantId,
  onSuccess,
}: GoalWizardV2Props) {
  // Toast notifications
  const { createGoal, goals } = useGoalsV2();
  const { stakeholders } = useStakeholdersV2();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<GoalV2>>({
    category: undefined,
    statement: "",
    description: "",
    status: "draft",
    priority: 3,
    time_horizon: undefined,
    kpis: [],
    owners: [],
    related_stakeholders: [],
    dependencies: { depends_on: [], enables: [] },
    tags: [],
  });

  // Load template from URL if provided
  useEffect(() => {
    const templateParam = searchParams.get("template");
    if (templateParam) {
      try {
        const { template, industry } = JSON.parse(
          decodeURIComponent(templateParam)
        );
        applyTemplate(template, industry);
        // Remove template param from URL
        searchParams.delete("template");
        setSearchParams(searchParams);
      } catch (error) {
        console.error("Failed to parse template:", error);
      }
    }
  }, []);

  // Apply template to form
  const applyTemplate = (template: GoalTemplate, industry: string) => {
    // Parse timeframe (e.g., "12 months" -> 12, "2 years" -> 2)
    const timeframeMatch = template.timeframe.match(/(\d+)\s*(\w+)/);
    const timeframeValue = timeframeMatch ? parseInt(timeframeMatch[1]) : 12;
    const timeframeUnitStr = timeframeMatch
      ? timeframeMatch[2].toLowerCase()
      : "months";

    // Map timeframe unit string to TimeUnit
    let timeframeUnit: TimeUnit = "months";
    if (timeframeUnitStr.includes("day")) timeframeUnit = "days";
    else if (timeframeUnitStr.includes("week")) timeframeUnit = "weeks";
    else if (timeframeUnitStr.includes("month")) timeframeUnit = "months";
    else if (timeframeUnitStr.includes("quarter")) timeframeUnit = "quarters";
    else if (timeframeUnitStr.includes("year")) timeframeUnit = "years";

    const timeHorizon = computeTimeHorizonCategory(
      timeframeValue,
      timeframeUnit
    );

    setFormData({
      category: template.category,
      statement: template.title,
      description: template.description,
      status: "draft",
      priority: 3,
      time_horizon: timeHorizon,
      time_horizon_detail: {
        value: timeframeValue,
        unit: timeframeUnit,
        category: timeHorizon,
      },
      kpis: template.metrics.map((metric, index) => ({
        id: `kpi-${Date.now()}-${index}`,
        name: metric,
        target: 100,
        current: 0,
        unit: "%",
      })),
      owners: [],
      related_stakeholders: [],
      dependencies: { depends_on: [], enables: [] },
      tags: [industry, "template"],
    });

    toast.success("Template Applied", {
      description: `${template.title} template has been loaded. Review and customize as needed.`,
    });
  };

  // Handle template selection
  const handleTemplateSelect = (template: GoalTemplate, industry: string) => {
    applyTemplate(template, industry);
    setIsTemplatesOpen(false);
  };

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Validation for each step
  const validateStep = (step: number): { isValid: boolean; error?: string } => {
    switch (step) {
      case 1: // Category
        if (!formData.category) {
          return { isValid: false, error: "Please select a category" };
        }
        return { isValid: true };

      case 2: // Statement & Description
        if (!formData.statement || formData.statement.length < 10) {
          return {
            isValid: false,
            error: "Statement must be at least 10 characters",
          };
        }

        // Validate SMART criteria for step 2 (only S, A, T)
        const smartValidation = validateSMART({
          statement: formData.statement || "",
          description: formData.description,
          kpis: formData.kpis || [],
          owners: formData.owners || [],
          time_horizon: formData.time_horizon,
          category: formData.category,
          currentStep: 2, // Pass current step for context-aware validation
        });

        // Require minimum SMART score of 60 to proceed
        if (smartValidation.score < 60) {
          return {
            isValid: false,
            error: `SMART score too low (${smartValidation.score}/100). Please improve your goal statement to meet SMART criteria (minimum 60/100 required).`,
          };
        }

        return { isValid: true };

      case 3: // KPIs
        if (!formData.kpis || formData.kpis.length === 0) {
          return { isValid: false, error: "At least one KPI is required" };
        }
        return { isValid: true };

      case 4: // Owners
        if (!formData.owners || formData.owners.length === 0) {
          return { isValid: false, error: "At least one owner is required" };
        }
        const hasOwner = formData.owners.some((o) => o.role === "owner");
        if (!hasOwner) {
          return {
            isValid: false,
            error: "At least one stakeholder must be assigned as owner",
          };
        }
        return { isValid: true };

      case 5: // Dependencies
        // Validate dependencies for cycles
        if (formData.dependencies && formData.dependencies.length > 0) {
          const existingDeps: GoalDependency[] = goals.map((g) => ({
            goalId: g.id,
            dependsOn:
              g.dependencies
                ?.filter((d) => d.type === "depends_on")
                .map((d) => d.goalId) || [],
            enables:
              g.dependencies
                ?.filter((d) => d.type === "enables")
                .map((d) => d.goalId) || [],
          }));

          const dependsOn = formData.dependencies
            .filter((d) => d.type === "depends_on")
            .map((d) => d.goalId);
          const enables = formData.dependencies
            .filter((d) => d.type === "enables")
            .map((d) => d.goalId);

          const validation = validateDependencies(
            "new-goal",
            dependsOn,
            enables,
            existingDeps
          );
          if (!validation.isValid) {
            return { isValid: false, error: validation.error };
          }
        }
        return { isValid: true };

      case 6: // Review
        // Final SMART validation (all criteria)
        const smartResult = validateSMART({
          statement: formData.statement || "",
          description: formData.description,
          kpis: formData.kpis || [],
          owners: formData.owners || [],
          time_horizon: formData.time_horizon,
          category: formData.category,
          currentStep: 6, // Full validation for final step
        });

        // Require minimum SMART score of 80 for final save
        if (smartResult.score < 80) {
          return {
            isValid: false,
            error: `SMART score must be at least 80/100 to create goal (current: ${smartResult.score}/100). Please review and improve your goal.`,
          };
        }

        if (!smartResult.isValid) {
          return { isValid: false, error: smartResult.errors.join(", ") };
        }
        return { isValid: true };

      default:
        return { isValid: true };
    }
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      toast.error(validation.error, {
        description: "Please fix the validation errors before proceeding",
      });
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    const validation = validateStep(6);
    if (!validation.isValid) {
      toast.error(validation.error, {
        description: "Please fix the validation errors before saving",
      });
      return;
    }

    try {
      setSaving(true);

      // Create the goal
      await createGoal({
        category: formData.category!,
        statement: formData.statement!,
        description: formData.description,
        status: "active", // Set to active on save
        priority: formData.priority || 3,
        time_horizon: formData.time_horizon!,
        kpis: formData.kpis || [],
        owners: formData.owners || [],
        related_stakeholders: formData.related_stakeholders || [],
        dependencies: formData.dependencies || { depends_on: [], enables: [] },
        tags: formData.tags || [],
      });

      toast.success("Goal Created", {
        description: "Your goal has been successfully created",
      });

      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to create goal", {
        description: "Please try again or contact support",
      });
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = [
    "Category",
    "Statement & Description",
    "KPIs & Targets",
    "Owners & Stakeholders",
    "Dependencies",
    "Review & Save",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              Create New Goal - {stepTitles[currentStep - 1]}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplatesOpen(true)}
              disabled={saving}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Browse Templates
            </Button>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={stepNumber}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckIcon className="w-4 h-4" /> : stepNumber}
                </div>
                <span className="text-xs text-center text-muted-foreground hidden md:block">
                  {title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <GoalFormV2
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            stakeholders={stakeholders}
            goals={goals}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || saving}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" asChild disabled={saving}>
              <Link to="/retina/goals">Cancel</Link>
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={saving}>
                Next
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Create Goal"}
                <CheckIcon className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Templates Dialog */}
        <GoalTemplatesDialog
          open={isTemplatesOpen}
          onOpenChange={setIsTemplatesOpen}
          onSelectTemplate={handleTemplateSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
