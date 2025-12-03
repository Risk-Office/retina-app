export type AlertLevel = "info" | "caution" | "critical";
export type Direction = "above" | "below";

export interface Guardrail {
  id: string;
  decisionId: string;
  optionId: string;
  metricName: string;
  thresholdValue: number;
  direction: Direction;
  alertLevel: AlertLevel;
  createdAt: string;
  updatedAt: string;
}

export interface GuardrailInput {
  metricName: string;
  thresholdValue: number;
  direction: Direction;
  alertLevel: AlertLevel;
}

// Get all guardrails across all options for a decision
export function getAllGuardrailsForDecision(decisionId: string): Guardrail[] {
  return loadGuardrails(decisionId);
}

// Default guardrails for VaR95 and Credit Risk Score
export const DEFAULT_GUARDRAILS: Omit<GuardrailInput, "thresholdValue">[] = [
  {
    metricName: "VaR95",
    direction: "below",
    alertLevel: "critical",
  },
  {
    metricName: "Credit Risk Score",
    direction: "above",
    alertLevel: "caution",
  },
];

// Generate UUID v4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get storage key for decision guardrails
const getStorageKey = (decisionId: string) => {
  return `retina:guardrails:${decisionId}`;
};

// Load all guardrails for a decision
export function loadGuardrails(decisionId: string): Guardrail[] {
  const key = getStorageKey(decisionId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse guardrails:", error);
    return [];
  }
}

// Load guardrails for a specific option
export function loadGuardrailsForOption(
  decisionId: string,
  optionId: string
): Guardrail[] {
  const allGuardrails = loadGuardrails(decisionId);
  return allGuardrails.filter((g) => g.optionId === optionId);
}

// Save guardrails for a decision
function saveGuardrails(decisionId: string, guardrails: Guardrail[]): void {
  const key = getStorageKey(decisionId);
  localStorage.setItem(key, JSON.stringify(guardrails));
}

// Add a new guardrail
export function addGuardrail(
  decisionId: string,
  optionId: string,
  input: GuardrailInput
): Guardrail {
  const guardrails = loadGuardrails(decisionId);

  const newGuardrail: Guardrail = {
    id: generateUUID(),
    decisionId,
    optionId,
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  guardrails.push(newGuardrail);
  saveGuardrails(decisionId, guardrails);

  return newGuardrail;
}

// Update an existing guardrail
export function updateGuardrail(
  decisionId: string,
  guardrailId: string,
  updates: Partial<GuardrailInput>
): Guardrail | null {
  const guardrails = loadGuardrails(decisionId);
  const index = guardrails.findIndex((g) => g.id === guardrailId);

  if (index === -1) return null;

  guardrails[index] = {
    ...guardrails[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveGuardrails(decisionId, guardrails);
  return guardrails[index];
}

// Delete a guardrail
export function deleteGuardrail(
  decisionId: string,
  guardrailId: string
): boolean {
  const guardrails = loadGuardrails(decisionId);
  const filtered = guardrails.filter((g) => g.id !== guardrailId);

  if (filtered.length === guardrails.length) return false;

  saveGuardrails(decisionId, filtered);
  return true;
}

// Initialize default guardrails for an option
export function initializeDefaultGuardrails(
  decisionId: string,
  optionId: string,
  var95Value: number,
  creditRiskScore: number
): Guardrail[] {
  const existingGuardrails = loadGuardrailsForOption(decisionId, optionId);

  // Only initialize if no guardrails exist for this option
  if (existingGuardrails.length > 0) {
    return existingGuardrails;
  }

  const defaultGuardrails: Guardrail[] = [
    {
      id: generateUUID(),
      decisionId,
      optionId,
      metricName: "VaR95",
      thresholdValue: var95Value * 1.2, // 20% buffer
      direction: "below",
      alertLevel: "critical",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateUUID(),
      decisionId,
      optionId,
      metricName: "Credit Risk Score",
      thresholdValue: creditRiskScore > 0 ? creditRiskScore * 0.8 : 50, // 20% buffer or default to 50
      direction: "above",
      alertLevel: "caution",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const allGuardrails = loadGuardrails(decisionId);
  const updatedGuardrails = [...allGuardrails, ...defaultGuardrails];
  saveGuardrails(decisionId, updatedGuardrails);

  return defaultGuardrails;
}

// Check if a guardrail is violated
export function checkGuardrailViolation(
  guardrail: Guardrail,
  currentValue: number
): boolean {
  if (guardrail.direction === "above") {
    return currentValue > guardrail.thresholdValue;
  } else {
    return currentValue < guardrail.thresholdValue;
  }
}

// Get all violated guardrails for an option
export function getViolatedGuardrails(
  decisionId: string,
  optionId: string,
  metrics: Record<string, number>
): Guardrail[] {
  const guardrails = loadGuardrailsForOption(decisionId, optionId);

  return guardrails.filter((guardrail) => {
    const currentValue = metrics[guardrail.metricName];
    if (currentValue === undefined) return false;

    return checkGuardrailViolation(guardrail, currentValue);
  });
}

// Get alert level color
export function getAlertLevelColor(level: AlertLevel): string {
  switch (level) {
    case "info":
      return "text-blue-600 dark:text-blue-400";
    case "caution":
      return "text-yellow-600 dark:text-yellow-400";
    case "critical":
      return "text-red-600 dark:text-red-400";
  }
}

// Get alert level badge variant
export function getAlertLevelBadgeVariant(
  level: AlertLevel
): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "info":
      return "secondary";
    case "caution":
      return "outline";
    case "critical":
      return "destructive";
  }
}
