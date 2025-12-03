/**
 * SMART Validation for Goals V2
 * Validates goals against SMART criteria with detailed feedback
 */

export interface SMARTValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
  criteria: {
    specific: boolean;
    measurable: boolean;
    achievable: boolean;
    relevant: boolean;
    timeBound: boolean;
  };
}

export interface GoalValidationInput {
  statement: string;
  description?: string;
  kpis: Array<{
    name: string;
    target?: number;
    rangeMin?: number;
    rangeMax?: number;
  }>;
  owners: Array<{ stakeholder_id?: string; id?: string; role: string }>;
  time_horizon?: string; // snake_case for consistency with GoalV2 schema
  timeHorizon?: string; // camelCase for backward compatibility
  category?: string;
  /**
   * Current wizard step (1-6) - used to determine which criteria to validate
   * Step 1: Category
   * Step 2: Statement & Description (S, A, T only)
   * Step 3: KPIs (M)
   * Step 4: Owners (R)
   * Step 5: Dependencies
   * Step 6: Full validation
   */
  currentStep?: number;
}

/**
 * Validate goal against SMART criteria
 * If currentStep is provided, only validates criteria relevant to that step
 */
export function validateSMART(
  input: GoalValidationInput
): SMARTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const criteria = {
    specific: false,
    measurable: false,
    achievable: false,
    relevant: false,
    timeBound: false,
  };

  // Determine which criteria to validate based on current step
  const step = input.currentStep || 6; // Default to full validation
  const shouldValidateSpecific = step >= 2;
  const shouldValidateMeasurable = step >= 3;
  const shouldValidateAchievable = step >= 2;
  const shouldValidateRelevant = step >= 4;
  const shouldValidateTimeBound = step >= 2;

  // S - Specific: Statement must be at least 10 characters and contain action words
  if (shouldValidateSpecific) {
    if (input.statement.length < 10) {
      errors.push("Statement must be at least 10 characters long");
    } else {
      criteria.specific = true;

      // Check for action words
      const actionWords = [
        "increase",
        "decrease",
        "improve",
        "reduce",
        "achieve",
        "develop",
        "implement",
        "establish",
        "enhance",
        "optimize",
        "deliver",
        "launch",
        "build",
        "create",
        "grow",
      ];

      const hasActionWord = actionWords.some((word) =>
        input.statement.toLowerCase().includes(word)
      );

      if (!hasActionWord) {
        warnings.push(
          "Consider using action words (e.g., increase, improve, achieve) for clarity"
        );
      }
    }
  } else {
    // Not validating yet, mark as true to not penalize score
    criteria.specific = true;
  }

  // M - Measurable: At least one KPI required
  if (shouldValidateMeasurable) {
    if (input.kpis.length === 0) {
      errors.push("At least one KPI is required");
    } else {
      criteria.measurable = true;

      // Check if KPIs have targets or ranges
      const kpisWithTargets = input.kpis.filter(
        (kpi) =>
          kpi.target !== undefined ||
          (kpi.rangeMin !== undefined && kpi.rangeMax !== undefined)
      );

      if (kpisWithTargets.length === 0) {
        warnings.push(
          "KPIs should have targets or ranges for better measurability"
        );
      }
    }
  } else {
    // Not validating yet, mark as true to not penalize score
    criteria.measurable = true;
  }

  // A - Achievable: Check if description provides context
  if (shouldValidateAchievable) {
    if (input.description && input.description.length > 20) {
      criteria.achievable = true;
    } else {
      warnings.push("Add a description to explain how this goal is achievable");
    }
  } else {
    // Not validating yet, mark as true to not penalize score
    criteria.achievable = true;
  }

  // R - Relevant: Check if category is set and owners are assigned
  if (shouldValidateRelevant) {
    if (input.category && input.owners.length > 0) {
      criteria.relevant = true;
    } else {
      if (!input.category) {
        warnings.push(
          "Select a category to show relevance to organizational objectives"
        );
      }
      if (input.owners.length === 0) {
        errors.push("At least one owner is required");
      }
    }
  } else {
    // Not validating yet, mark as true to not penalize score
    criteria.relevant = true;
  }

  // T - Time-bound: Time horizon must be set
  if (shouldValidateTimeBound) {
    const timeHorizon = input.time_horizon || input.timeHorizon; // Support both naming conventions
    if (!timeHorizon) {
      errors.push("Time horizon is required");
    } else {
      criteria.timeBound = true;
    }
  } else {
    // Not validating yet, mark as true to not penalize score
    criteria.timeBound = true;
  }

  // Calculate score
  const criteriaScore = Object.values(criteria).filter(Boolean).length * 20;
  const hasNoErrors = errors.length === 0;
  const score = hasNoErrors
    ? criteriaScore
    : Math.max(0, criteriaScore - errors.length * 10);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
    criteria,
  };
}

/**
 * Get SMART helper text for each criterion
 */
export function getSMARTHelperText() {
  return {
    specific:
      "Be clear and specific about what you want to achieve. Use action words like 'increase', 'improve', or 'develop'.",
    measurable:
      "Define Key Performance Indicators (KPIs) with concrete targets or ranges so you can track progress objectively.",
    achievable:
      "Explain in the description how this goal can be realistically accomplished with the resources you have.",
    relevant:
      "Make sure the goal matters to your business by selecting the right category and assigning owners.",
    timeBound:
      "Set a clear deadline (Short/Mid/Long Term) so everyone knows when this should be done.",
  };
}

/**
 * Get suggestions for improving SMART score
 */
export function getSMARTSuggestions(result: SMARTValidationResult): string[] {
  const suggestions: string[] = [];

  if (!result.criteria.specific) {
    suggestions.push(
      "Make your statement more specific by including what, who, and why."
    );
  }

  if (!result.criteria.measurable) {
    suggestions.push(
      "Add at least one way to measure success with a target number or range."
    );
  }

  if (!result.criteria.achievable) {
    suggestions.push(
      "Add a description explaining how you'll accomplish this with the resources you have."
    );
  }

  if (!result.criteria.relevant) {
    suggestions.push(
      "Pick a category and assign owners to show this goal matters to your business."
    );
  }

  if (!result.criteria.timeBound) {
    suggestions.push(
      "Choose a deadline (Short/Mid/Long Term) so everyone knows when this should be done."
    );
  }

  return suggestions;
}
