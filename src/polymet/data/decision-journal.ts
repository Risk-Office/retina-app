/**
 * # Decision Journal
 *
 * ## Overview
 * Tracks the lifecycle of decisions with timestamped journal entries.
 * Records choices, updates, reflections, incidents, and guardrail adjustments.
 *
 * ## Entry Types
 * - **choice**: Initial decision selection
 * - **update**: Changes to decision parameters
 * - **reflection**: User insights and learnings
 * - **incident**: External events affecting decision
 * - **guardrail_adjustment**: Automatic threshold adjustments
 *
 * ## Storage
 * - localStorage key: `retina:decision-journal:{tenantId}`
 * - Per-tenant isolation
 * - Automatic timestamps
 * - Auto-generated flag for system entries
 *
 * ## Plain-Language
 * - Label: "Decision Journal"
 * - Tooltip: "Short notes that record why we chose, what changed, and what we learned."
 */

export type JournalEntryType =
  | "choice"
  | "update"
  | "reflection"
  | "incident"
  | "guardrail_adjustment";

export type JournalAuthor = "system" | "user";

export interface DecisionJournalEntry {
  id: string;
  decision_id: string;
  entry_date: number; // Unix timestamp
  entry_type: JournalEntryType;
  summary_text: string; // Max 500 characters
  auto_generated: boolean;
  author: JournalAuthor;
  metadata?: {
    // Optional context-specific data
    option_id?: string;
    option_label?: string;
    metric_name?: string;
    old_value?: number;
    new_value?: number;
    incident_id?: string;
    guardrail_id?: string;
    [key: string]: any;
  };
}

export interface DecisionJournal {
  decision_id: string;
  decision_title: string;
  entries: DecisionJournalEntry[];
  created_at: number;
  last_updated: number;
}

/**
 * Get storage key for decision journal
 */
function getStorageKey(tenantId: string): string {
  return `retina:decision-journal:${tenantId}`;
}

/**
 * Get all journals for a tenant
 */
export function getAllJournals(tenantId: string): DecisionJournal[] {
  try {
    const key = getStorageKey(tenantId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading decision journals:", error);
    return [];
  }
}

/**
 * Get journal for a specific decision
 */
export function getDecisionJournal(
  decisionId: string,
  tenantId: string
): DecisionJournal | null {
  const journals = getAllJournals(tenantId);
  return journals.find((j) => j.decision_id === decisionId) || null;
}

/**
 * Save journals to localStorage
 */
function saveJournals(tenantId: string, journals: DecisionJournal[]): void {
  try {
    const key = getStorageKey(tenantId);
    localStorage.setItem(key, JSON.stringify(journals));
  } catch (error) {
    console.error("Error saving decision journals:", error);
  }
}

/**
 * Add a journal entry
 */
export function addJournalEntry(
  decisionId: string,
  decisionTitle: string,
  tenantId: string,
  entry: Omit<DecisionJournalEntry, "id" | "entry_date">
): DecisionJournalEntry {
  // Validate summary text length
  if (entry.summary_text.length > 500) {
    throw new Error("Summary text must be 500 characters or less");
  }

  const journals = getAllJournals(tenantId);
  let journal = journals.find((j) => j.decision_id === decisionId);

  const newEntry: DecisionJournalEntry = {
    ...entry,
    id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entry_date: Date.now(),
  };

  if (!journal) {
    // Create new journal
    journal = {
      decision_id: decisionId,
      decision_title: decisionTitle,
      entries: [newEntry],
      created_at: Date.now(),
      last_updated: Date.now(),
    };
    journals.push(journal);
  } else {
    // Add entry to existing journal
    journal.entries.push(newEntry);
    journal.last_updated = Date.now();
  }

  saveJournals(tenantId, journals);
  return newEntry;
}

/**
 * Update a journal entry
 */
export function updateJournalEntry(
  decisionId: string,
  entryId: string,
  tenantId: string,
  updates: Partial<Pick<DecisionJournalEntry, "summary_text" | "metadata">>
): DecisionJournalEntry | null {
  const journals = getAllJournals(tenantId);
  const journal = journals.find((j) => j.decision_id === decisionId);

  if (!journal) return null;

  const entry = journal.entries.find((e) => e.id === entryId);
  if (!entry) return null;

  // Validate summary text length if updating
  if (updates.summary_text && updates.summary_text.length > 500) {
    throw new Error("Summary text must be 500 characters or less");
  }

  Object.assign(entry, updates);
  journal.last_updated = Date.now();

  saveJournals(tenantId, journals);
  return entry;
}

/**
 * Delete a journal entry
 */
export function deleteJournalEntry(
  decisionId: string,
  entryId: string,
  tenantId: string
): boolean {
  const journals = getAllJournals(tenantId);
  const journal = journals.find((j) => j.decision_id === decisionId);

  if (!journal) return false;

  const initialLength = journal.entries.length;
  journal.entries = journal.entries.filter((e) => e.id !== entryId);

  if (journal.entries.length === initialLength) return false;

  journal.last_updated = Date.now();
  saveJournals(tenantId, journals);
  return true;
}

/**
 * Get entries by type
 */
export function getEntriesByType(
  decisionId: string,
  tenantId: string,
  entryType: JournalEntryType
): DecisionJournalEntry[] {
  const journal = getDecisionJournal(decisionId, tenantId);
  if (!journal) return [];

  return journal.entries.filter((e) => e.entry_type === entryType);
}

/**
 * Get entries by author
 */
export function getEntriesByAuthor(
  decisionId: string,
  tenantId: string,
  author: JournalAuthor
): DecisionJournalEntry[] {
  const journal = getDecisionJournal(decisionId, tenantId);
  if (!journal) return [];

  return journal.entries.filter((e) => e.author === author);
}

/**
 * Get recent entries across all decisions
 */
export function getRecentEntries(
  tenantId: string,
  limit: number = 10
): Array<DecisionJournalEntry & { decision_title: string }> {
  const journals = getAllJournals(tenantId);
  const allEntries: Array<DecisionJournalEntry & { decision_title: string }> =
    [];

  journals.forEach((journal) => {
    journal.entries.forEach((entry) => {
      allEntries.push({
        ...entry,
        decision_title: journal.decision_title,
      });
    });
  });

  return allEntries.sort((a, b) => b.entry_date - a.entry_date).slice(0, limit);
}

/**
 * Get entry count by type for a decision
 */
export function getEntryCountByType(
  decisionId: string,
  tenantId: string
): Record<JournalEntryType, number> {
  const journal = getDecisionJournal(decisionId, tenantId);

  const counts: Record<JournalEntryType, number> = {
    choice: 0,
    update: 0,
    reflection: 0,
    incident: 0,
    guardrail_adjustment: 0,
  };

  if (!journal) return counts;

  journal.entries.forEach((entry) => {
    counts[entry.entry_type]++;
  });

  return counts;
}

/**
 * Search journal entries
 */
export function searchJournalEntries(
  tenantId: string,
  query: string
): Array<DecisionJournalEntry & { decision_title: string }> {
  const journals = getAllJournals(tenantId);
  const results: Array<DecisionJournalEntry & { decision_title: string }> = [];

  const lowerQuery = query.toLowerCase();

  journals.forEach((journal) => {
    journal.entries.forEach((entry) => {
      if (
        entry.summary_text.toLowerCase().includes(lowerQuery) ||
        entry.entry_type.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          ...entry,
          decision_title: journal.decision_title,
        });
      }
    });
  });

  return results.sort((a, b) => b.entry_date - a.entry_date);
}

/**
 * Clear all journal entries for a decision
 */
export function clearDecisionJournal(
  decisionId: string,
  tenantId: string
): boolean {
  const journals = getAllJournals(tenantId);
  const initialLength = journals.length;

  const updatedJournals = journals.filter((j) => j.decision_id !== decisionId);

  if (updatedJournals.length === initialLength) return false;

  saveJournals(tenantId, updatedJournals);
  return true;
}

/**
 * Get journal statistics for a decision
 */
export function getJournalStatistics(
  decisionId: string,
  tenantId: string
): {
  total_entries: number;
  by_type: Record<JournalEntryType, number>;
  by_author: Record<JournalAuthor, number>;
  auto_generated_count: number;
  user_generated_count: number;
  first_entry_date: number | null;
  last_entry_date: number | null;
} {
  const journal = getDecisionJournal(decisionId, tenantId);

  const stats = {
    total_entries: 0,
    by_type: {
      choice: 0,
      update: 0,
      reflection: 0,
      incident: 0,
      guardrail_adjustment: 0,
    } as Record<JournalEntryType, number>,
    by_author: {
      system: 0,
      user: 0,
    } as Record<JournalAuthor, number>,
    auto_generated_count: 0,
    user_generated_count: 0,
    first_entry_date: null as number | null,
    last_entry_date: null as number | null,
  };

  if (!journal || journal.entries.length === 0) return stats;

  stats.total_entries = journal.entries.length;

  journal.entries.forEach((entry) => {
    stats.by_type[entry.entry_type]++;
    stats.by_author[entry.author]++;

    if (entry.auto_generated) {
      stats.auto_generated_count++;
    } else {
      stats.user_generated_count++;
    }
  });

  const sortedEntries = [...journal.entries].sort(
    (a, b) => a.entry_date - b.entry_date
  );
  stats.first_entry_date = sortedEntries[0].entry_date;
  stats.last_entry_date = sortedEntries[sortedEntries.length - 1].entry_date;

  return stats;
}

/**
 * Export journal to JSON
 */
export function exportJournalToJSON(
  decisionId: string,
  tenantId: string
): string {
  const journal = getDecisionJournal(decisionId, tenantId);
  if (!journal) {
    throw new Error("Journal not found");
  }

  return JSON.stringify(journal, null, 2);
}

/**
 * Get entry type label
 */
export function getEntryTypeLabel(entryType: JournalEntryType): string {
  const labels: Record<JournalEntryType, string> = {
    choice: "Choice",
    update: "Update",
    reflection: "Reflection",
    incident: "Incident",
    guardrail_adjustment: "Guardrail Adjustment",
  };

  return labels[entryType];
}

/**
 * Get entry type color
 */
export function getEntryTypeColor(
  entryType: JournalEntryType
): "default" | "secondary" | "outline" {
  const colors: Record<JournalEntryType, "default" | "secondary" | "outline"> =
    {
      choice: "default",
      update: "secondary",
      reflection: "outline",
      incident: "default",
      guardrail_adjustment: "secondary",
    };

  return colors[entryType];
}
