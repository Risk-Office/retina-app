export interface Term {
  tech: string;
  label: string;
  short?: string;
  help?: string;
  formula?: string;
}

export const TERMS: Record<string, Term> = {
  // Core metrics
  ev: {
    tech: "Expected Value (EV)",
    label: "Expected profit",
    short: "Avg result",
    help: "Average result across all what-ifs.",
    formula: "mean(outcomes)",
  },
  var95: {
    tech: "VaR 95%",
    label: "Loss in bad case (95%)",
    short: "Worst 1-in-20",
    help: "Threshold where only 5% of outcomes are worse.",
    formula: "5th percentile of outcomes",
  },
  cvar95: {
    tech: "CVaR 95%",
    label: "Average of bad cases",
    short: "Avg beyond VaR",
    help: "Average of outcomes worse than the 95% VaR.",
    formula: "mean(outcomes | <= VaR95)",
  },
  econCap: {
    tech: "Economic Capital",
    label: "Capital at risk",
    short: "Cushion needed",
    help: "Capital reserved to absorb severe losses.",
    formula: "≈ |CVaR95|",
  },
  raroc: {
    tech: "RAROC",
    label: "Return per risk capital",
    short: "Return ÷ risk",
    help: "Risk-adjusted return: value per unit of capital at risk.",
    formula: "EV / Capital at risk",
  },
  utility: {
    tech: "Utility",
    label: "Risk preference score",
    short: "Preference",
    help: "How much you value outcomes given risk attitude.",
  },
  ce: {
    tech: "Certainty Equivalent (CE)",
    label: "Risk-adjusted value (CE)",
    short: "Value after risk",
    help: "Sure amount as good as the risky outcome.",
    formula: "CARA CE from expected utility",
  },
  tcor: {
    tech: "Total Cost of Risk (TCOR)",
    label: "All-in risk cost",
    short: "All risk costs",
    help: "Expected loss + insurance + contingency + mitigation.",
  },

  // Simulation & scenario
  scenario: {
    tech: "Scenario",
    label: "What-if settings",
    short: "What-ifs",
    help: "Assumptions you tweak to see different outcomes.",
  },
  monteCarlo: {
    tech: "Monte Carlo simulation",
    label: "Random what-if runs",
    short: "What-if runs",
    help: "Many random trials to see a range of results.",
  },
  runs: {
    tech: "Runs",
    label: "Number of runs",
    short: "# runs",
  },
  seed: {
    tech: "Random seed",
    label: "Randomizer code",
    short: "Seed",
    help: "Use the same code to reproduce identical results.",
  },
  horizon: {
    tech: "Horizon",
    label: "Time window",
    short: "Time window",
    help: "How far ahead results are scaled.",
  },

  // Advanced features
  dependence: {
    tech: "Copula / Dependence",
    label: "Link between variables",
    short: "Variable link",
    help: "How strongly two inputs move together.",
  },
  spearman: {
    tech: "Spearman ρ",
    label: "Rank link strength (ρ)",
    short: "Link strength",
  },
  bayesPrior: {
    tech: "Bayesian prior",
    label: "Starting belief",
    short: "Start belief",
    help: "What you believed before new evidence.",
  },
  bayesPosterior: {
    tech: "Posterior",
    label: "Updated belief",
    short: "Updated belief",
    help: "Belief after combining evidence with prior.",
  },
  gameTheory: {
    tech: "Game theory",
    label: "Competitor response",
    short: "Competitor move",
  },
  tornado: {
    tech: "Tornado sensitivity",
    label: "What moves the result",
    short: "Sensitivity",
    help: "Shows which inputs change the result the most.",
  },

  // Other terms
  mitigation: {
    tech: "Mitigation cost",
    label: "Protection cost",
  },
  incidents: {
    tech: "Incidents",
    label: "Risk events",
  },
  signals: {
    tech: "Signals",
    label: "News & alerts",
  },
  featureFlags: {
    tech: "Feature flags",
    label: "Modules on/off",
  },
  closed: {
    tech: "Closed decision",
    label: "Decision finalized",
  },
  guardrails: {
    tech: "Guardrails",
    label: "Safety checks",
  },
  override: {
    tech: "Override",
    label: "Proceed anyway (give reason)",
  },
  assumptions: {
    tech: "Assumptions",
    label: "What you're taking for granted",
    short: "Assumptions",
  },
  options: {
    tech: "Options",
    label: "Choices to compare",
    short: "Choices",
  },
  simulate: {
    tech: "Simulate",
    label: "Run what-ifs",
    short: "Run",
  },
  recommend: {
    tech: "Recommend",
    label: "Suggest a choice",
    short: "Suggest",
  },
  close: {
    tech: "Close decision",
    label: "Finalize decision",
    short: "Finalize",
  },
  stressTest: {
    tech: "Stress test",
    label: "Test extreme cases",
    short: "Stress test",
  },
  copula: {
    tech: "Copula matrix",
    label: "Multi-variable links",
    short: "Variable links",
    help: "How multiple inputs move together.",
  },
  frobenius: {
    tech: "Frobenius error",
    label: "Link accuracy",
    short: "Link error",
    help: "How close the achieved links are to your target.",
  },
  partners: {
    tech: "Partners",
    label: "Who else is involved or depends on this?",
    short: "Partners",
    help: "External parties tied to this decision (customers, suppliers, financiers, etc.).",
  },
  creditRiskScore: {
    tech: "Credit Link Risk",
    label: "If they can't pay or fail, how much does it affect us?",
    short: "Credit risk",
    help: "Aggregate risk from all linked partners based on their credit exposure and dependency.",
    formula:
      "Normalized sum of (credit_exposure × dependency_score) scaled 0–100",
  },
  portfolio: {
    tech: "Decision Portfolio",
    label: "Group related choices under one theme",
    short: "Portfolio",
    help: "Lets you view several decisions together — like an investment or strategy bundle.",
  },
};

/**
 * Get the display label for a term based on plain-language setting
 */
export function getLabel(
  termKey: string,
  options?: { plain?: boolean; short?: boolean }
): string {
  const term = TERMS[termKey];
  if (!term) return termKey;

  const plain = options?.plain ?? true;
  const short = options?.short ?? false;

  if (!plain) {
    return term.tech;
  }

  return short && term.short ? term.short : term.label;
}

/**
 * Get full term information for tooltips
 */
export function getHelp(termKey: string): Term | undefined {
  return TERMS[termKey];
}

/**
 * Get CSV header with optional friendly alias
 */
export function getCsvHeader(termKey: string, includeFriendly = true): string {
  const term = TERMS[termKey];
  if (!term) return termKey;

  if (includeFriendly && term.label !== term.tech) {
    return `${term.tech} (${term.label})`;
  }

  return term.tech;
}
