/**
 * # Narrative Generator
 *
 * ## Overview
 * Generates plain-language narrative briefs from recent journal entries.
 * Concatenates last 3-5 entries into a cohesive story for leadership updates.
 *
 * ## Features
 * - Keyword search (supplier, cost spike, guardrail, etc.)
 * - Configurable entry count (3-5 entries)
 * - Plain-language formatting
 * - Audit logging
 *
 * ## Plain-Language
 * - Label: "Quick summary for reports"
 * - Tooltip: "Turns recent events into a short story for leadership updates."
 */

import {
  getDecisionJournal,
  getAllJournals,
  getEntryTypeLabel,
  type DecisionJournalEntry,
  type JournalEntryType,
} from "@/polymet/data/decision-journal";

export interface NarrativeOptions {
  entryCount?: number; // Default: 5
  includeMetadata?: boolean; // Default: false
  keywords?: string[]; // Filter by keywords
  entryTypes?: JournalEntryType[]; // Filter by entry types
  startDate?: number; // Filter by date range
  endDate?: number;
}

export interface NarrativeBrief {
  decisionId: string;
  decisionTitle: string;
  narrative: string;
  entriesIncluded: number;
  generatedAt: number;
  keywords?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
}

/**
 * Generate narrative brief for a single decision
 */
export function generateDecisionNarrative(
  decisionId: string,
  tenantId: string,
  options: NarrativeOptions = {}
): NarrativeBrief | null {
  const {
    entryCount = 5,
    includeMetadata = false,
    keywords = [],
    entryTypes = [],
    startDate,
    endDate,
  } = options;

  const journal = getDecisionJournal(decisionId, tenantId);
  if (!journal || journal.entries.length === 0) {
    return null;
  }

  // Filter entries
  let filteredEntries = [...journal.entries];

  // Filter by keywords
  if (keywords.length > 0) {
    filteredEntries = filteredEntries.filter((entry) => {
      const text = entry.summary_text.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });
  }

  // Filter by entry types
  if (entryTypes.length > 0) {
    filteredEntries = filteredEntries.filter((entry) =>
      entryTypes.includes(entry.entry_type)
    );
  }

  // Filter by date range
  if (startDate) {
    filteredEntries = filteredEntries.filter(
      (entry) => entry.entry_date >= startDate
    );
  }
  if (endDate) {
    filteredEntries = filteredEntries.filter(
      (entry) => entry.entry_date <= endDate
    );
  }

  // Sort by date (newest first) and take last N entries
  const sortedEntries = filteredEntries
    .sort((a, b) => b.entry_date - a.entry_date)
    .slice(0, entryCount);

  if (sortedEntries.length === 0) {
    return null;
  }

  // Reverse to chronological order for narrative
  const chronologicalEntries = [...sortedEntries].reverse();

  // Build narrative
  const narrative = buildNarrative(
    journal.decision_title,
    chronologicalEntries,
    includeMetadata
  );

  // Calculate date range
  const dates = chronologicalEntries.map((e) => e.entry_date);
  const dateRange = {
    start: Math.min(...dates),
    end: Math.max(...dates),
  };

  return {
    decisionId,
    decisionTitle: journal.decision_title,
    narrative,
    entriesIncluded: chronologicalEntries.length,
    generatedAt: Date.now(),
    keywords: keywords.length > 0 ? keywords : undefined,
    dateRange,
  };
}

/**
 * Generate portfolio-level narrative
 */
export function generatePortfolioNarrative(
  tenantId: string,
  decisionIds: string[],
  options: NarrativeOptions = {}
): {
  portfolioNarrative: string;
  decisionNarratives: NarrativeBrief[];
  totalEntries: number;
  generatedAt: number;
} | null {
  const decisionNarratives: NarrativeBrief[] = [];

  // Generate narrative for each decision
  for (const decisionId of decisionIds) {
    const narrative = generateDecisionNarrative(decisionId, tenantId, options);
    if (narrative) {
      decisionNarratives.push(narrative);
    }
  }

  if (decisionNarratives.length === 0) {
    return null;
  }

  // Build portfolio narrative
  const portfolioNarrative = buildPortfolioNarrative(decisionNarratives);

  const totalEntries = decisionNarratives.reduce(
    (sum, n) => sum + n.entriesIncluded,
    0
  );

  return {
    portfolioNarrative,
    decisionNarratives,
    totalEntries,
    generatedAt: Date.now(),
  };
}

/**
 * Build narrative text from entries
 */
function buildNarrative(
  decisionTitle: string,
  entries: DecisionJournalEntry[],
  includeMetadata: boolean
): string {
  const lines: string[] = [];

  // Header
  lines.push(`**${decisionTitle}**\n`);

  // Add entries
  entries.forEach((entry, index) => {
    const date = new Date(entry.entry_date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const typeLabel = getEntryTypeLabel(entry.entry_type);
    const prefix = entry.auto_generated ? "🤖" : "👤";

    lines.push(
      `${index + 1}. **${typeLabel}** (${date}) ${prefix}: ${entry.summary_text}`
    );

    // Add metadata if requested
    if (includeMetadata && entry.metadata) {
      const metadataStr = formatMetadata(entry.metadata);
      if (metadataStr) {
        lines.push(`   _${metadataStr}_`);
      }
    }

    lines.push(""); // Empty line between entries
  });

  // Footer
  lines.push(
    `\n_Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}_`
  );

  return lines.join("\n");
}

/**
 * Build portfolio narrative
 */
function buildPortfolioNarrative(narratives: NarrativeBrief[]): string {
  const lines: string[] = [];

  // Header
  lines.push("# Portfolio Decision Summary\n");
  lines.push(
    `This brief covers ${narratives.length} decision(s) with ${narratives.reduce((sum, n) => sum + n.entriesIncluded, 0)} recent events.\n`
  );

  // Add each decision narrative
  narratives.forEach((narrative, index) => {
    lines.push(`## ${index + 1}. ${narrative.decisionTitle}\n`);

    // Extract individual entries from narrative
    const entryLines = narrative.narrative
      .split("\n")
      .filter((line) => line.match(/^\d+\./));

    entryLines.forEach((line) => {
      lines.push(line);
    });

    lines.push(""); // Empty line between decisions
  });

  // Footer
  lines.push(
    `\n_Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}_`
  );

  return lines.join("\n");
}

/**
 * Format metadata for display
 */
function formatMetadata(metadata: Record<string, any>): string {
  const parts: string[] = [];

  if (metadata.option_label) {
    parts.push(`Option: ${metadata.option_label}`);
  }

  if (metadata.metric_name) {
    parts.push(`Metric: ${metadata.metric_name}`);
  }

  if (metadata.old_value !== undefined && metadata.new_value !== undefined) {
    parts.push(`Changed from ${metadata.old_value} to ${metadata.new_value}`);
  }

  if (metadata.incident_id) {
    parts.push(`Incident: ${metadata.incident_id}`);
  }

  if (metadata.guardrail_id) {
    parts.push(`Guardrail: ${metadata.guardrail_id}`);
  }

  return parts.join(" • ");
}

/**
 * Search keywords in journal entries
 */
export function searchNarrativeKeywords(
  tenantId: string,
  keywords: string[]
): Array<{
  decisionId: string;
  decisionTitle: string;
  matchingEntries: DecisionJournalEntry[];
  matchCount: number;
}> {
  const journals = getAllJournals(tenantId);
  const results: Array<{
    decisionId: string;
    decisionTitle: string;
    matchingEntries: DecisionJournalEntry[];
    matchCount: number;
  }> = [];

  journals.forEach((journal) => {
    const matchingEntries = journal.entries.filter((entry) => {
      const text = entry.summary_text.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });

    if (matchingEntries.length > 0) {
      results.push({
        decisionId: journal.decision_id,
        decisionTitle: journal.decision_title,
        matchingEntries: matchingEntries.sort(
          (a, b) => b.entry_date - a.entry_date
        ),
        matchCount: matchingEntries.length,
      });
    }
  });

  return results.sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * Get common keywords from entries
 */
export function extractCommonKeywords(
  entries: DecisionJournalEntry[],
  topN: number = 10
): Array<{ keyword: string; count: number }> {
  // Common decision-related keywords to look for
  const targetKeywords = [
    "supplier",
    "cost",
    "spike",
    "guardrail",
    "risk",
    "revenue",
    "profit",
    "loss",
    "incident",
    "adjustment",
    "breach",
    "threshold",
    "partner",
    "vendor",
    "customer",
    "market",
    "demand",
    "supply",
    "price",
    "quality",
    "delay",
    "issue",
    "problem",
    "opportunity",
    "improvement",
    "change",
    "update",
    "decision",
    "option",
    "alternative",
  ];

  const keywordCounts = new Map<string, number>();

  entries.forEach((entry) => {
    const text = entry.summary_text.toLowerCase();

    targetKeywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      }
    });
  });

  return Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Export narrative to plain text
 */
export function exportNarrativeToText(narrative: NarrativeBrief): string {
  return narrative.narrative;
}

/**
 * Export narrative to markdown
 */
export function exportNarrativeToMarkdown(narrative: NarrativeBrief): string {
  const lines: string[] = [];

  lines.push(`# ${narrative.decisionTitle}\n`);
  lines.push(
    `**Generated:** ${new Date(narrative.generatedAt).toLocaleString()}\n`
  );
  lines.push(`**Entries Included:** ${narrative.entriesIncluded}\n`);

  if (narrative.keywords && narrative.keywords.length > 0) {
    lines.push(`**Keywords:** ${narrative.keywords.join(", ")}\n`);
  }

  if (narrative.dateRange) {
    lines.push(
      `**Date Range:** ${new Date(narrative.dateRange.start).toLocaleDateString()} - ${new Date(narrative.dateRange.end).toLocaleDateString()}\n`
    );
  }

  lines.push("---\n");
  lines.push(narrative.narrative);

  return lines.join("\n");
}

/**
 * Get narrative statistics
 */
export function getNarrativeStatistics(narrative: NarrativeBrief): {
  wordCount: number;
  characterCount: number;
  entryCount: number;
  dateSpan: number; // in days
} {
  const wordCount = narrative.narrative.split(/\s+/).length;
  const characterCount = narrative.narrative.length;
  const entryCount = narrative.entriesIncluded;

  let dateSpan = 0;
  if (narrative.dateRange) {
    const span = narrative.dateRange.end - narrative.dateRange.start;
    dateSpan = Math.ceil(span / (1000 * 60 * 60 * 24));
  }

  return {
    wordCount,
    characterCount,
    entryCount,
    dateSpan,
  };
}
