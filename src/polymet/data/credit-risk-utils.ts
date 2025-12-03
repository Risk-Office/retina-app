import type { Partner } from "@/polymet/components/option-partners-section";

export interface CreditRiskResult {
  score: number; // 0-100
  level: "Low" | "Medium" | "High";
  totalExposure: number;
  averageDependency: number;
}

/**
 * Compute credit risk score for an option based on its partners
 * Formula: Normalize sum of (credit_exposure × dependency_score) and scale to 0–100
 */
export function computeCreditRiskScore(
  partners: Partner[] | undefined,
  allOptions: Array<{ partners?: Partner[] }>
): CreditRiskResult {
  if (!partners || partners.length === 0) {
    return {
      score: 0,
      level: "Low",
      totalExposure: 0,
      averageDependency: 0,
    };
  }

  // Calculate raw risk score (sum of exposure × dependency)
  const rawScore = partners.reduce((sum, partner) => {
    return sum + partner.credit_exposure * partner.dependency_score;
  }, 0);

  // Calculate total exposure and average dependency for metadata
  const totalExposure = partners.reduce((sum, p) => sum + p.credit_exposure, 0);
  const averageDependency =
    partners.reduce((sum, p) => sum + p.dependency_score, 0) / partners.length;

  // Find max possible score across all options for normalization
  const allRawScores = allOptions
    .map((opt) => {
      if (!opt.partners || opt.partners.length === 0) return 0;
      return opt.partners.reduce((sum, partner) => {
        return sum + partner.credit_exposure * partner.dependency_score;
      }, 0);
    })
    .filter((score) => score > 0);

  const maxRawScore = Math.max(...allRawScores, rawScore);

  // Normalize to 0-100 scale
  const normalizedScore = maxRawScore > 0 ? (rawScore / maxRawScore) * 100 : 0;

  // Determine risk level
  let level: "Low" | "Medium" | "High";
  if (normalizedScore < 33) {
    level = "Low";
  } else if (normalizedScore < 67) {
    level = "Medium";
  } else {
    level = "High";
  }

  return {
    score: Math.round(normalizedScore),
    level,
    totalExposure,
    averageDependency,
  };
}

/**
 * Get badge color class for credit risk level
 */
export function getCreditRiskBadgeColor(
  level: "Low" | "Medium" | "High"
): string {
  switch (level) {
    case "Low":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "Medium":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "High":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  }
}
