import type { GuardrailInput } from "@/polymet/data/decision-guardrails";

export interface GuardrailTemplate {
  id: string;
  name: string;
  description: string;
  category: "risk" | "financial" | "credit" | "operational";
  guardrails: Omit<GuardrailInput, "thresholdValue">[];
  defaultThresholds: Record<string, (baseValue: number) => number>;
}

// Built-in guardrail templates
export const GUARDRAIL_TEMPLATES: GuardrailTemplate[] = [
  {
    id: "conservative-risk",
    name: "Conservative Risk Profile",
    description:
      "Strict limits for risk-averse organizations with tight VaR and CVaR controls",
    category: "risk",
    guardrails: [
      {
        metricName: "VaR95",
        direction: "below",
        alertLevel: "critical",
      },
      {
        metricName: "CVaR95",
        direction: "below",
        alertLevel: "critical",
      },
      {
        metricName: "RAROC",
        direction: "above",
        alertLevel: "caution",
      },
    ],

    defaultThresholds: {
      VaR95: (base) => base * 1.1, // 10% buffer
      CVaR95: (base) => base * 1.15, // 15% buffer
      RAROC: () => 0.12, // Minimum 12% RAROC
    },
  },
  {
    id: "balanced-risk",
    name: "Balanced Risk Profile",
    description:
      "Moderate limits balancing risk and return with standard thresholds",
    category: "risk",
    guardrails: [
      {
        metricName: "VaR95",
        direction: "below",
        alertLevel: "critical",
      },
      {
        metricName: "CVaR95",
        direction: "below",
        alertLevel: "caution",
      },
      {
        metricName: "RAROC",
        direction: "above",
        alertLevel: "info",
      },
    ],

    defaultThresholds: {
      VaR95: (base) => base * 1.2, // 20% buffer
      CVaR95: (base) => base * 1.25, // 25% buffer
      RAROC: () => 0.08, // Minimum 8% RAROC
    },
  },
  {
    id: "aggressive-growth",
    name: "Aggressive Growth Profile",
    description:
      "Flexible limits for growth-focused strategies with higher risk tolerance",
    category: "risk",
    guardrails: [
      {
        metricName: "VaR95",
        direction: "below",
        alertLevel: "caution",
      },
      {
        metricName: "RAROC",
        direction: "above",
        alertLevel: "info",
      },
      {
        metricName: "EV",
        direction: "above",
        alertLevel: "caution",
      },
    ],

    defaultThresholds: {
      VaR95: (base) => base * 1.5, // 50% buffer
      RAROC: () => 0.05, // Minimum 5% RAROC
      EV: (base) => base * 0.8, // 80% of expected value
    },
  },
  {
    id: "credit-focused",
    name: "Credit Risk Management",
    description:
      "Focused on credit exposure and partner dependency with strict credit limits",
    category: "credit",
    guardrails: [
      {
        metricName: "Credit Risk Score",
        direction: "above",
        alertLevel: "critical",
      },
      {
        metricName: "VaR95",
        direction: "below",
        alertLevel: "caution",
      },
    ],

    defaultThresholds: {
      "Credit Risk Score": () => 70, // Max 70 credit risk score
      VaR95: (base) => base * 1.2, // 20% buffer
    },
  },
  {
    id: "capital-preservation",
    name: "Capital Preservation",
    description:
      "Strict limits to protect capital with minimal downside risk tolerance",
    category: "financial",
    guardrails: [
      {
        metricName: "VaR95",
        direction: "below",
        alertLevel: "critical",
      },
      {
        metricName: "CVaR95",
        direction: "below",
        alertLevel: "critical",
      },
      {
        metricName: "EV",
        direction: "above",
        alertLevel: "critical",
      },
      {
        metricName: "Economic Capital",
        direction: "below",
        alertLevel: "caution",
      },
    ],

    defaultThresholds: {
      VaR95: (base) => base * 1.05, // 5% buffer
      CVaR95: (base) => base * 1.1, // 10% buffer
      EV: (base) => base * 0.95, // Must maintain 95% of EV
      "Economic Capital": (base) => base * 1.15, // 15% buffer
    },
  },
  {
    id: "regulatory-compliance",
    name: "Regulatory Compliance",
    description:
      "Guardrails aligned with regulatory requirements and capital adequacy",
    category: "operational",
    guardrails: [
      {
        metricName: "VaR95",
        direction: "below",
        alertLevel: "critical",
      },
      {
        metricName: "Economic Capital",
        direction: "below",
        alertLevel: "critical",
      },
      {
        metricName: "RAROC",
        direction: "above",
        alertLevel: "critical",
      },
      {
        metricName: "Credit Risk Score",
        direction: "above",
        alertLevel: "caution",
      },
    ],

    defaultThresholds: {
      VaR95: (base) => base * 1.1, // 10% buffer
      "Economic Capital": (base) => base * 1.2, // 20% buffer
      RAROC: () => 0.1, // Minimum 10% RAROC
      "Credit Risk Score": () => 75, // Max 75 credit risk score
    },
  },
];

// Get template by ID
export function getTemplate(templateId: string): GuardrailTemplate | undefined {
  return GUARDRAIL_TEMPLATES.find((t) => t.id === templateId);
}

// Get templates by category
export function getTemplatesByCategory(
  category: GuardrailTemplate["category"]
): GuardrailTemplate[] {
  return GUARDRAIL_TEMPLATES.filter((t) => t.category === category);
}

// Apply template to generate guardrails with actual threshold values
export function applyTemplate(
  template: GuardrailTemplate,
  currentMetrics: Record<string, number>
): Array<GuardrailInput & { metricName: string }> {
  return template.guardrails.map((guardrail) => {
    const baseValue = currentMetrics[guardrail.metricName] || 0;
    const thresholdFn = template.defaultThresholds[guardrail.metricName];
    const thresholdValue = thresholdFn ? thresholdFn(baseValue) : baseValue;

    return {
      ...guardrail,
      thresholdValue,
    };
  });
}

// Get storage key for user templates
const getUserTemplatesKey = (tenantId: string) => {
  return `retina:guardrail-templates:${tenantId}`;
};

// Load user-created templates
export function loadUserTemplates(tenantId: string): GuardrailTemplate[] {
  const key = getUserTemplatesKey(tenantId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse user templates:", error);
    return [];
  }
}

// Save user template
export function saveUserTemplate(
  tenantId: string,
  template: GuardrailTemplate
): void {
  const templates = loadUserTemplates(tenantId);
  const existingIndex = templates.findIndex((t) => t.id === template.id);

  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }

  const key = getUserTemplatesKey(tenantId);
  localStorage.setItem(key, JSON.stringify(templates));
}

// Delete user template
export function deleteUserTemplate(
  tenantId: string,
  templateId: string
): boolean {
  const templates = loadUserTemplates(tenantId);
  const filtered = templates.filter((t) => t.id !== templateId);

  if (filtered.length === templates.length) return false;

  const key = getUserTemplatesKey(tenantId);
  localStorage.setItem(key, JSON.stringify(filtered));
  return true;
}

// Get all templates (built-in + user)
export function getAllTemplates(tenantId: string): GuardrailTemplate[] {
  const userTemplates = loadUserTemplates(tenantId);
  return [...GUARDRAIL_TEMPLATES, ...userTemplates];
}
