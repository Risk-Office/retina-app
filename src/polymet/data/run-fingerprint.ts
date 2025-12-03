import type { ScenarioVar } from "@/polymet/data/scenario-engine";

interface DecisionOption {
  id: string;
  label: string;
  cost?: number;
  expectedReturn?: number;
}

interface FingerprintInput {
  seed: number;
  runs: number;
  options: Array<{
    label: string;
    cost: number;
    expectedReturn: number;
  }>;
  scenarioVars: Array<{
    name: string;
    appliesTo: string;
    dist: string;
    params: Record<string, number>;
    weight: number;
  }>;
}

/**
 * Compute SHA-256 hash of simulation inputs to create a unique run fingerprint
 * @param seed Random seed
 * @param runs Number of simulation runs
 * @param options Decision options with financials
 * @param scenarioVars Scenario variables
 * @returns runId - first 12 characters of hex hash
 */
export async function computeRunFingerprint(
  seed: number,
  runs: number,
  options: DecisionOption[],
  scenarioVars: ScenarioVar[]
): Promise<string> {
  // Build canonical JSON with stable key order
  const fingerprintInput: FingerprintInput = {
    seed,
    runs,
    options: options
      .map((opt) => ({
        label: opt.label,
        cost: opt.cost ?? 0,
        expectedReturn: opt.expectedReturn ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)), // Stable sort by label
    scenarioVars: scenarioVars
      .map((v) => ({
        name: v.name,
        appliesTo: v.appliesTo,
        dist: v.dist,
        params: v.params,
        weight: v.weight ?? 1,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)), // Stable sort by name
  };

  // Convert to canonical JSON string
  const canonicalJson = JSON.stringify(
    fingerprintInput,
    Object.keys(fingerprintInput).sort()
  );

  // Compute SHA-256 hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalJson);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Return first 12 characters as runId
  return hashHex.substring(0, 12);
}

/**
 * Format runId for display
 */
export function formatRunId(runId: string): string {
  return `Run ID: ${runId}`;
}

/**
 * Check if two fingerprints match
 */
export function fingerprintsMatch(runId1: string, runId2: string): boolean {
  return runId1 === runId2;
}
