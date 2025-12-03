// Assumptions store with localStorage persistence per decision

export type AssumptionScope = "decision" | "option" | "variable";
export type AssumptionConfidence = 0 | 1 | 2; // 0=low, 1=medium, 2=high
export type AssumptionStatus = "open" | "validated" | "invalidated";

export interface Assumption {
  id: string;
  scope: AssumptionScope;
  linkId?: string; // optionId or variableId if scoped
  statement: string; // concise text
  evidenceUrl?: string; // optional link or doc id
  confidence: AssumptionConfidence; // 0=low, 1=medium, 2=high
  critical: boolean; // gate at close if true
  owner?: string;
  reviewBy?: string; // ISO date
  status: AssumptionStatus;
  updatedAt: string; // ISO date string
}

// Get storage key for a decision
function getStorageKey(decisionId: string): string {
  return `retina:assumptions:${decisionId}`;
}

// Load assumptions for a decision
export function loadAssumptions(decisionId: string): Assumption[] {
  try {
    const key = getStorageKey(decisionId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data) as Assumption[];
  } catch (error) {
    console.error("Failed to load assumptions:", error);
    return [];
  }
}

// Save assumptions for a decision
export function saveAssumptions(
  decisionId: string,
  assumptions: Assumption[]
): void {
  try {
    const key = getStorageKey(decisionId);
    localStorage.setItem(key, JSON.stringify(assumptions));
  } catch (error) {
    console.error("Failed to save assumptions:", error);
  }
}

// Add a new assumption
export function addAssumption(
  decisionId: string,
  assumption: Omit<Assumption, "id" | "updatedAt">
): Assumption {
  const assumptions = loadAssumptions(decisionId);
  const newAssumption: Assumption = {
    ...assumption,
    id: `asmp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    updatedAt: new Date().toISOString(),
  };
  assumptions.push(newAssumption);
  saveAssumptions(decisionId, assumptions);
  return newAssumption;
}

// Update an existing assumption
export function updateAssumption(
  decisionId: string,
  assumptionId: string,
  updates: Partial<Omit<Assumption, "id">>
): Assumption | null {
  const assumptions = loadAssumptions(decisionId);
  const index = assumptions.findIndex((a) => a.id === assumptionId);
  if (index === -1) return null;

  const updated: Assumption = {
    ...assumptions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  assumptions[index] = updated;
  saveAssumptions(decisionId, assumptions);
  return updated;
}

// Delete an assumption
export function deleteAssumption(
  decisionId: string,
  assumptionId: string
): boolean {
  const assumptions = loadAssumptions(decisionId);
  const filtered = assumptions.filter((a) => a.id !== assumptionId);
  if (filtered.length === assumptions.length) return false;
  saveAssumptions(decisionId, filtered);
  return true;
}

// Get assumptions by scope
export function getAssumptionsByScope(
  decisionId: string,
  scope: AssumptionScope,
  linkId?: string
): Assumption[] {
  const assumptions = loadAssumptions(decisionId);
  return assumptions.filter((a) => {
    if (a.scope !== scope) return false;
    if (linkId && a.linkId !== linkId) return false;
    return true;
  });
}

// Get critical open assumptions
export function getCriticalOpenAssumptions(decisionId: string): Assumption[] {
  const assumptions = loadAssumptions(decisionId);
  return assumptions.filter((a) => a.critical && a.status === "open");
}

// Get confidence label
export function getConfidenceLabel(confidence: AssumptionConfidence): string {
  switch (confidence) {
    case 0:
      return "Low";
    case 1:
      return "Medium";
    case 2:
      return "High";
    default:
      return "Unknown";
  }
}

// Get confidence color
export function getConfidenceColor(confidence: AssumptionConfidence): string {
  switch (confidence) {
    case 0:
      return "text-red-600 dark:text-red-400";
    case 1:
      return "text-yellow-600 dark:text-yellow-400";
    case 2:
      return "text-green-600 dark:text-green-400";
    default:
      return "text-muted-foreground";
  }
}

// Get status color
export function getStatusColor(status: AssumptionStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "validated":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "invalidated":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}
