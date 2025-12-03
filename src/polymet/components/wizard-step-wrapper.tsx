import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, LightbulbIcon } from "lucide-react";
import { basicTheme } from "@/polymet/data/theme-tokens";

export interface WizardStepWrapperProps {
  /**
   * Step title - large, prominent heading
   */
  title: string;
  /**
   * Step description - explains what user needs to do
   */
  description?: string;
  /**
   * Contextual tip - helpful guidance for the step
   */
  tip?: string;
  /**
   * Step content
   */
  children: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Wizard Step Wrapper Component
 *
 * Provides consistent styling for wizard steps:
 * - Large, clear headings
 * - Contextual tips with icons
 * - Generous spacing from basic theme tokens
 * - Card-based layout with elevation
 */
export function WizardStepWrapper({
  title,
  description,
  tip,
  children,
  className = "",
}: WizardStepWrapperProps) {
  const tokens = basicTheme;

  return (
    <Card
      className={`w-full ${className}`}
      style={{
        borderRadius: tokens.radius.lg,
        boxShadow: tokens.elevation.md,
      }}
    >
      <CardHeader
        style={{
          padding: tokens.spacing.xl,
          paddingBottom: tokens.spacing.lg,
        }}
      >
        {/* Title */}
        <h2
          className="text-foreground font-bold leading-tight"
          style={{
            fontSize: tokens.typography.fontSize["3xl"],
            fontWeight: tokens.typography.fontWeight.bold,
            lineHeight: tokens.typography.lineHeight.tight,
            marginBottom: description ? tokens.spacing.sm : 0,
          }}
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p
            className="text-muted-foreground"
            style={{
              fontSize: tokens.typography.fontSize.lg,
              lineHeight: tokens.typography.lineHeight.relaxed,
            }}
          >
            {description}
          </p>
        )}

        {/* Contextual Tip */}
        {tip && (
          <Alert
            className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
            style={{
              borderRadius: tokens.radius.md,
              padding: tokens.spacing.md,
            }}
          >
            <LightbulbIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />

            <AlertDescription
              className="text-blue-900 dark:text-blue-100"
              style={{
                fontSize: tokens.typography.fontSize.sm,
                lineHeight: tokens.typography.lineHeight.relaxed,
              }}
            >
              {tip}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent
        style={{
          padding: tokens.spacing.xl,
          paddingTop: 0,
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
