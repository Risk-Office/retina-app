import React from "react";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { basicTheme } from "@/polymet/data/theme-tokens";

export interface WizardStep {
  id: string;
  label: string;
  optional?: boolean;
}

export interface WizardStepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

/**
 * Wizard Step Indicator Component
 *
 * Shows progress through wizard steps with:
 * - Large, clear step numbers
 * - Success checkmarks for completed steps
 * - Visual progress line
 * - Optional step labels
 */
export function WizardStepIndicator({
  steps,
  currentStep,
  completedSteps,
  className = "",
}: WizardStepIndicatorProps) {
  const tokens = basicTheme;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="relative mb-8">
        {/* Background line */}
        <div
          className="absolute top-5 left-0 right-0 h-1 bg-border"
          style={{
            borderRadius: tokens.radius.full,
          }}
        />

        {/* Progress line */}
        <div
          className="absolute top-5 left-0 h-1 bg-primary transition-all duration-500"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            borderRadius: tokens.radius.full,
          }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center"
                style={{ width: `${100 / steps.length}%` }}
              >
                {/* Circle/Checkmark */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    transition-all duration-300 relative z-10
                    ${
                      isCompleted || isPast
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-background border-2 border-border text-muted-foreground"
                    }
                  `}
                  style={{
                    borderRadius: tokens.radius.full,
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                  }}
                >
                  {isCompleted || isPast ? (
                    <CheckCircle2Icon className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div
                  className={`
                    mt-3 text-center transition-colors duration-300
                    ${
                      isCurrent
                        ? "text-foreground font-semibold"
                        : isCompleted || isPast
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }
                  `}
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: isCurrent
                      ? tokens.typography.fontWeight.semibold
                      : tokens.typography.fontWeight.medium,
                  }}
                >
                  <div>{step.label}</div>
                  {step.optional && (
                    <div
                      className="text-muted-foreground mt-1"
                      style={{
                        fontSize: tokens.typography.fontSize.xs,
                        fontWeight: tokens.typography.fontWeight.normal,
                      }}
                    >
                      (optional)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
