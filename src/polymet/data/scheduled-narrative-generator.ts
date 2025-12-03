/**
 * # Scheduled Narrative Generator
 *
 * ## Overview
 * Automatic narrative generation on schedules (weekly, monthly, quarterly).
 * Integrates with email scheduler and AI narrative service.
 *
 * ## Features
 * - Scheduled portfolio narrative generation
 * - Automatic email distribution
 * - AI-enhanced or basic narratives
 * - Configurable schedules per portfolio
 * - Historical narrative tracking
 *
 * ## Integration
 * - Email Scheduler: Schedule management
 * - AI Narrative Service: Enhanced generation
 * - Narrative Generator: Basic generation
 * - Decision Journal: Source data
 */

import {
  createEmailSchedule,
  getEmailSchedules,
  getDueSchedules,
  markScheduleAsRun,
  type EmailSchedule,
  type ScheduleFrequency,
} from "@/polymet/data/email-scheduler";
import {
  generatePortfolioNarrative,
  type NarrativeBrief,
} from "@/polymet/data/narrative-generator";
import {
  generateAIPortfolioNarrative,
  isAIAvailable,
  type AIConfig,
} from "@/polymet/data/ai-narrative-service";
import {
  getDecisionJournal,
  type DecisionJournalEntry,
} from "@/polymet/data/decision-journal";
import {
  loadPortfolios,
  type DecisionPortfolio,
} from "@/polymet/data/decision-portfolios";

export interface NarrativeScheduleConfig {
  id: string;
  tenantId: string;
  portfolioId: string;
  portfolioName: string;

  // Schedule settings
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:MM

  // Generation settings
  useAI: boolean;
  aiConfig?: AIConfig;
  entryCount: number; // Number of recent entries per decision
  includeInsights: boolean;
  includeTrends: boolean;
  includeRecommendations: boolean;

  // Distribution settings
  recipients: string[];
  subject: string;
  includeAttachments: boolean;

  // Status
  enabled: boolean;
  lastGenerated?: string; // ISO date
  nextScheduled?: string; // ISO date

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface GeneratedNarrativeHistory {
  id: string;
  scheduleId: string;
  portfolioId: string;
  tenantId: string;
  generatedAt: string;
  narrative: string;
  executiveSummary?: string;
  decisionsIncluded: number;
  entriesAnalyzed: number;
  aiGenerated: boolean;
  sentTo: string[];
}

// Storage keys
const SCHEDULE_PREFIX = "retina:narrative-schedules";
const HISTORY_PREFIX = "retina:narrative-history";

/**
 * Create a narrative schedule for a portfolio
 */
export function createNarrativeSchedule(
  tenantId: string,
  portfolioId: string,
  portfolioName: string,
  frequency: ScheduleFrequency,
  recipients: string[],
  createdBy: string,
  options: Partial<NarrativeScheduleConfig> = {}
): NarrativeScheduleConfig {
  const now = new Date();

  const schedule: NarrativeScheduleConfig = {
    id: `narr-sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    portfolioId,
    portfolioName,
    frequency,
    dayOfWeek: options.dayOfWeek,
    dayOfMonth: options.dayOfMonth,
    time: options.time || "09:00",
    useAI: options.useAI ?? false,
    aiConfig: options.aiConfig,
    entryCount: options.entryCount || 5,
    includeInsights: options.includeInsights ?? true,
    includeTrends: options.includeTrends ?? true,
    includeRecommendations: options.includeRecommendations ?? true,
    recipients,
    subject:
      options.subject || `${portfolioName} - ${frequency} Narrative Report`,
    includeAttachments: options.includeAttachments ?? true,
    enabled: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy,
  };

  // Calculate next scheduled time
  schedule.nextScheduled = calculateNextScheduledTime(schedule);

  saveNarrativeSchedule(schedule);

  // Create corresponding email schedule
  createEmailSchedule(
    tenantId,
    `Narrative: ${portfolioName}`,
    frequency,
    recipients,
    schedule.subject,
    "narrative-report",
    createdBy,
    {
      startDate: now.toISOString(),
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      includeAttachments: schedule.includeAttachments,
    }
  );

  return schedule;
}

/**
 * Get all narrative schedules for a tenant
 */
export function getNarrativeSchedules(
  tenantId: string
): NarrativeScheduleConfig[] {
  const storageKey = `${SCHEDULE_PREFIX}:${tenantId}`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get narrative schedules for a specific portfolio
 */
export function getPortfolioNarrativeSchedules(
  tenantId: string,
  portfolioId: string
): NarrativeScheduleConfig[] {
  const schedules = getNarrativeSchedules(tenantId);
  return schedules.filter((s) => s.portfolioId === portfolioId);
}

/**
 * Save narrative schedule
 */
export function saveNarrativeSchedule(schedule: NarrativeScheduleConfig): void {
  const schedules = getNarrativeSchedules(schedule.tenantId);
  const existingIndex = schedules.findIndex((s) => s.id === schedule.id);

  const updated = {
    ...schedule,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    schedules[existingIndex] = updated;
  } else {
    schedules.push(updated);
  }

  const storageKey = `${SCHEDULE_PREFIX}:${schedule.tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(schedules));
}

/**
 * Delete narrative schedule
 */
export function deleteNarrativeSchedule(
  tenantId: string,
  scheduleId: string
): void {
  const schedules = getNarrativeSchedules(tenantId);
  const filtered = schedules.filter((s) => s.id !== scheduleId);

  const storageKey = `${SCHEDULE_PREFIX}:${tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(filtered));
}

/**
 * Toggle schedule enabled status
 */
export function toggleNarrativeSchedule(
  tenantId: string,
  scheduleId: string
): void {
  const schedules = getNarrativeSchedules(tenantId);
  const schedule = schedules.find((s) => s.id === scheduleId);

  if (schedule) {
    schedule.enabled = !schedule.enabled;
    saveNarrativeSchedule(schedule);
  }
}

/**
 * Calculate next scheduled time
 */
function calculateNextScheduledTime(schedule: NarrativeScheduleConfig): string {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(":").map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case "once":
      return nextRun.toISOString();

    case "daily":
      if (nextRun < now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      if (schedule.dayOfWeek !== undefined) {
        while (nextRun.getDay() !== schedule.dayOfWeek || nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;

    case "monthly":
      if (schedule.dayOfMonth !== undefined) {
        while (nextRun.getDate() !== schedule.dayOfMonth || nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;

    case "quarterly":
      const currentMonth = nextRun.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      nextRun.setMonth(quarterStartMonth);
      nextRun.setDate(1);

      if (nextRun < now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
  }

  return nextRun.toISOString();
}

/**
 * Generate narrative for a schedule
 */
export async function generateScheduledNarrative(
  schedule: NarrativeScheduleConfig
): Promise<GeneratedNarrativeHistory | null> {
  try {
    // Load portfolio
    const portfolios = loadPortfolios(schedule.tenantId);
    const portfolio = portfolios.find((p) => p.id === schedule.portfolioId);

    if (!portfolio) {
      console.error("Portfolio not found:", schedule.portfolioId);
      return null;
    }

    // Get journal entries for all decisions in portfolio
    const decisionNarratives: Array<{
      decisionTitle: string;
      entries: DecisionJournalEntry[];
    }> = [];

    for (const decisionId of portfolio.decision_ids) {
      const journal = getDecisionJournal(decisionId, schedule.tenantId);
      if (journal && journal.entries.length > 0) {
        // Get recent entries
        const recentEntries = journal.entries
          .sort((a, b) => b.entry_date - a.entry_date)
          .slice(0, schedule.entryCount);

        decisionNarratives.push({
          decisionTitle: journal.decision_title,
          entries: recentEntries,
        });
      }
    }

    if (decisionNarratives.length === 0) {
      console.warn(
        "No journal entries found for portfolio:",
        portfolio.portfolio_name
      );
      return null;
    }

    let narrative: string;
    let executiveSummary: string | undefined;
    let aiGenerated = false;

    // Generate narrative (AI or basic)
    if (
      schedule.useAI &&
      schedule.aiConfig &&
      isAIAvailable(schedule.aiConfig)
    ) {
      const aiResult = await generateAIPortfolioNarrative(
        portfolio.portfolio_name,
        decisionNarratives,
        schedule.aiConfig
      );

      if (aiResult) {
        narrative = aiResult.portfolioNarrative;
        executiveSummary = aiResult.executiveSummary;
        aiGenerated = true;
      } else {
        // Fallback to basic generation
        const basicResult = generatePortfolioNarrative(
          schedule.tenantId,
          portfolio.decision_ids,
          { entryCount: schedule.entryCount }
        );

        if (!basicResult) return null;

        narrative = basicResult.portfolioNarrative;
      }
    } else {
      // Basic generation
      const basicResult = generatePortfolioNarrative(
        schedule.tenantId,
        portfolio.decision_ids,
        { entryCount: schedule.entryCount }
      );

      if (!basicResult) return null;

      narrative = basicResult.portfolioNarrative;
    }

    // Create history entry
    const history: GeneratedNarrativeHistory = {
      id: `narr-hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scheduleId: schedule.id,
      portfolioId: schedule.portfolioId,
      tenantId: schedule.tenantId,
      generatedAt: new Date().toISOString(),
      narrative,
      executiveSummary,
      decisionsIncluded: decisionNarratives.length,
      entriesAnalyzed: decisionNarratives.reduce(
        (sum, d) => sum + d.entries.length,
        0
      ),
      aiGenerated,
      sentTo: schedule.recipients,
    };

    saveNarrativeHistory(history);

    // Update schedule
    schedule.lastGenerated = history.generatedAt;
    schedule.nextScheduled = calculateNextScheduledTime(schedule);
    saveNarrativeSchedule(schedule);

    return history;
  } catch (error) {
    console.error("Failed to generate scheduled narrative:", error);
    return null;
  }
}

/**
 * Process due narrative schedules
 */
export async function processDueNarrativeSchedules(
  tenantId: string
): Promise<GeneratedNarrativeHistory[]> {
  const schedules = getNarrativeSchedules(tenantId);
  const now = new Date();

  const dueSchedules = schedules.filter((schedule) => {
    if (!schedule.enabled) return false;
    if (!schedule.nextScheduled) return false;

    const nextRun = new Date(schedule.nextScheduled);
    return nextRun <= now;
  });

  const results: GeneratedNarrativeHistory[] = [];

  for (const schedule of dueSchedules) {
    const history = await generateScheduledNarrative(schedule);
    if (history) {
      results.push(history);

      // TODO: Send email with narrative
      console.log("Narrative generated and ready to send:", {
        portfolio: schedule.portfolioName,
        recipients: schedule.recipients,
      });
    }
  }

  return results;
}

/**
 * Save narrative history
 */
function saveNarrativeHistory(history: GeneratedNarrativeHistory): void {
  const storageKey = `${HISTORY_PREFIX}:${history.tenantId}`;
  const stored = localStorage.getItem(storageKey);
  const histories: GeneratedNarrativeHistory[] = stored
    ? JSON.parse(stored)
    : [];

  histories.push(history);

  // Keep only last 100 entries per tenant
  if (histories.length > 100) {
    histories.splice(0, histories.length - 100);
  }

  localStorage.setItem(storageKey, JSON.stringify(histories));
}

/**
 * Get narrative history for a portfolio
 */
export function getNarrativeHistory(
  tenantId: string,
  portfolioId?: string
): GeneratedNarrativeHistory[] {
  const storageKey = `${HISTORY_PREFIX}:${tenantId}`;
  const stored = localStorage.getItem(storageKey);
  const histories: GeneratedNarrativeHistory[] = stored
    ? JSON.parse(stored)
    : [];

  if (portfolioId) {
    return histories.filter((h) => h.portfolioId === portfolioId);
  }

  return histories;
}

/**
 * Get latest narrative for a portfolio
 */
export function getLatestNarrative(
  tenantId: string,
  portfolioId: string
): GeneratedNarrativeHistory | null {
  const histories = getNarrativeHistory(tenantId, portfolioId);

  if (histories.length === 0) return null;

  return histories.sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )[0];
}

/**
 * Get narrative statistics
 */
export function getNarrativeStatistics(tenantId: string): {
  totalSchedules: number;
  activeSchedules: number;
  totalGenerated: number;
  aiGenerated: number;
  lastGenerated?: string;
} {
  const schedules = getNarrativeSchedules(tenantId);
  const histories = getNarrativeHistory(tenantId);

  const activeSchedules = schedules.filter((s) => s.enabled).length;
  const aiGenerated = histories.filter((h) => h.aiGenerated).length;

  const lastGenerated =
    histories.length > 0
      ? histories.sort(
          (a, b) =>
            new Date(b.generatedAt).getTime() -
            new Date(a.generatedAt).getTime()
        )[0].generatedAt
      : undefined;

  return {
    totalSchedules: schedules.length,
    activeSchedules,
    totalGenerated: histories.length,
    aiGenerated,
    lastGenerated,
  };
}

/**
 * Validate schedule configuration
 */
export function validateNarrativeSchedule(
  schedule: Partial<NarrativeScheduleConfig>
): string[] {
  const errors: string[] = [];

  if (!schedule.portfolioId) {
    errors.push("Portfolio is required");
  }

  if (!schedule.recipients || schedule.recipients.length === 0) {
    errors.push("At least one recipient is required");
  }

  if (!schedule.frequency) {
    errors.push("Frequency is required");
  }

  if (schedule.frequency === "weekly" && schedule.dayOfWeek === undefined) {
    errors.push("Day of week is required for weekly schedules");
  }

  if (schedule.frequency === "monthly" && schedule.dayOfMonth === undefined) {
    errors.push("Day of month is required for monthly schedules");
  }

  if (schedule.useAI && !schedule.aiConfig) {
    errors.push("AI configuration is required when AI is enabled");
  }

  if (
    schedule.entryCount &&
    (schedule.entryCount < 1 || schedule.entryCount > 10)
  ) {
    errors.push("Entry count must be between 1 and 10");
  }

  return errors;
}
