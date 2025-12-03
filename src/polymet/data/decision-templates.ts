import { ScenarioVar } from "@/polymet/data/scenario-engine";

export interface DecisionTemplate {
  id: string;
  name: string;
  description: string;
  options: Array<{
    label: string;
  }>;
  scenarioVars: ScenarioVar[];
  isBuiltIn?: boolean;
}

export const BUILT_IN_TEMPLATES: DecisionTemplate[] = [
  {
    id: "pilot-before-launch",
    name: "Pilot before full launch",
    description: "Test with a pilot program before committing to full launch",
    options: [
      { label: "Pilot now" },
      { label: "Full launch" },
      { label: "Wait & see" },
    ],

    scenarioVars: [
      {
        id: "demand-var",
        name: "Demand",
        appliesTo: "return",
        dist: "triangular",
        params: { min: -0.2, mode: 0.0, max: 0.4 },
        weight: 1,
      },
      {
        id: "cost-inflation-var",
        name: "Cost inflation",
        appliesTo: "cost",
        dist: "normal",
        params: { mean: 0.05, sd: 0.03 },
        weight: 1,
      },
    ],

    isBuiltIn: true,
  },
  {
    id: "switch-supplier",
    name: "Switch supplier",
    description: "Evaluate switching to a new supplier partially or fully",
    options: [
      { label: "Switch 50%" },
      { label: "Switch 100%" },
      { label: "Stay" },
    ],

    scenarioVars: [
      {
        id: "fx-move-var",
        name: "FX move",
        appliesTo: "cost",
        dist: "normal",
        params: { mean: 0, sd: 0.06 },
        weight: 1,
      },
      {
        id: "supply-delay-var",
        name: "Supply delay",
        appliesTo: "cost",
        dist: "lognormal",
        params: { mu: 0, sigma: 0.25 },
        weight: 1,
      },
    ],

    isBuiltIn: true,
  },
  {
    id: "add-capacity",
    name: "Add capacity",
    description: "Expand capacity with different investment levels",
    options: [
      { label: "Add small" },
      { label: "Add medium" },
      { label: "Add big" },
    ],

    scenarioVars: [
      {
        id: "demand-var",
        name: "Demand",
        appliesTo: "return",
        dist: "triangular",
        params: { min: -0.2, mode: 0.0, max: 0.4 },
        weight: 1,
      },
      {
        id: "cost-inflation-var",
        name: "Cost inflation",
        appliesTo: "cost",
        dist: "normal",
        params: { mean: 0.05, sd: 0.03 },
        weight: 1,
      },
    ],

    isBuiltIn: true,
  },
  {
    id: "pricing-change",
    name: "Pricing change",
    description: "Adjust pricing strategy and evaluate demand impact",
    options: [
      { label: "+3% price" },
      { label: "+5% price" },
      { label: "No change" },
    ],

    scenarioVars: [
      {
        id: "demand-sensitivity-var",
        name: "Demand sensitivity to price",
        appliesTo: "return",
        dist: "normal",
        params: { mean: -0.03, sd: 0.02 },
        weight: 1,
      },
    ],

    isBuiltIn: true,
  },
];

// Get storage key for user templates
function getStorageKey(tenantId: string): string {
  return `retina:templates:${tenantId}`;
}

// Load user templates from localStorage
export function loadUserTemplates(tenantId: string): DecisionTemplate[] {
  try {
    const key = getStorageKey(tenantId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load user templates:", error);
    return [];
  }
}

// Save user template to localStorage
export function saveUserTemplate(
  tenantId: string,
  template: Omit<DecisionTemplate, "id" | "isBuiltIn">
): DecisionTemplate {
  const templates = loadUserTemplates(tenantId);
  const newTemplate: DecisionTemplate = {
    ...template,
    id: `user-${Date.now()}`,
    isBuiltIn: false,
  };
  templates.push(newTemplate);

  const key = getStorageKey(tenantId);
  localStorage.setItem(key, JSON.stringify(templates));

  return newTemplate;
}

// Delete user template from localStorage
export function deleteUserTemplate(tenantId: string, templateId: string): void {
  const templates = loadUserTemplates(tenantId);
  const filtered = templates.filter((t) => t.id !== templateId);

  const key = getStorageKey(tenantId);
  localStorage.setItem(key, JSON.stringify(filtered));
}

// Get all templates (built-in + user)
export function getAllTemplates(tenantId: string): DecisionTemplate[] {
  const userTemplates = loadUserTemplates(tenantId);
  return [...BUILT_IN_TEMPLATES, ...userTemplates];
}
