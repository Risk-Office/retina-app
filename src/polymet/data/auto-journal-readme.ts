/**
 * # Automatic Journal Entry Generation System
 *
 * ## Overview
 * Automatically generates plain-language journal entries on key decision triggers
 * to maintain a clear audit trail and context for decision-making.
 *
 * ## Plain-Language Header
 * "What just happened?"
 *
 * ## Tooltip
 * "Creates short summaries automatically so we don't forget context."
 *
 * ---
 *
 * ## Key Features
 *
 * ### 1. Automatic Entry Generation ✅
 * - **Decision Finalization**: Records chosen option with key metrics
 * - **Signal Refresh**: Tracks signal changes and metric impacts
 * - **Guardrail Adjustment**: Documents threshold changes and reasons
 * - **Incident Link**: Captures incident impacts on decisions
 *
 * ### 2. Plain-Language Summaries ✅
 * - Maximum 500 characters per entry
 * - Context-aware descriptions
 * - Metric changes in plain language
 * - Severity and impact indicators
 *
 * ### 3. Rich Metadata ✅
 * - Structured metadata for each entry type
 * - Traceability to source events
 * - Searchable and filterable
 * - Export-ready format
 *
 * ---
 *
 * ## Entry Types
 *
 * ### Choice
 * **When**: Decision is finalized
 * **Example**: "Chose 'Supplier A' with RAROC 0.18, EV $125,000, and VaR95 $45,000. Rationale: Best balance of cost and reliability."
 * **Metadata**: option_id, option_label, raroc, ev, var95, rationale
 *
 * ### Update
 * **When**: Signals refresh and metrics change
 * **Example**: "When Cost Volatility Index increased by 15%, the expected value fell by 2% but guardrails held steady."
 * **Metadata**: signal_updates, metric_changes, max_signal_change
 *
 * ### Guardrail Adjustment
 * **When**: Guardrail is auto-adjusted
 * **Example**: "Value at Risk guardrail auto-adjusted due to moderate breach. Threshold tightened 10% from $50,000 to $45,000 after 2 repeated breaches."
 * **Metadata**: guardrail_id, old_value, new_value, adjustment_percent, severity, breach_count
 *
 * ### Incident
 * **When**: Incident is linked to decision
 * **Example**: "HIGH Supply Chain Disruption: 'Port Congestion Delays' affected 2 linked signals. Estimated 9% decrease in Expected Value. Incident ongoing, monitoring impact."
 * **Metadata**: incident_id, incident_type, severity, affected_signal_count, estimated_effect
 *
 * ### Reflection
 * **When**: User adds manual note
 * **Example**: User-provided insights and learnings
 * **Metadata**: Custom user data
 *
 * ---
 *
 * ## Integration Points
 *
 * ### 1. Decision Finalization
 * **File**: `@/polymet/components/decision-close-dialog`
 * **Trigger**: When user confirms decision closure
 * **Function**: `generateDecisionFinalizedEntry()`
 *
 * ```typescript
 * import { generateDecisionFinalizedEntry } from "@/polymet/data/auto-journal-generator";
 *
 * // In handleConfirm()
 * if (chosenResult) {
 *   generateDecisionFinalizedEntry(
 *     decisionId,
 *     decisionTitle,
 *     tenantId,
 *     chosenOptionId,
 *     chosenOptionLabel,
 *     chosenResult,
 *     rationale || overrideReason
 *   );
 * }
 * ```
 *
 * ### 2. Signal Refresh
 * **File**: `@/polymet/data/auto-refresh-engine`
 * **Trigger**: After auto-refresh completes successfully
 * **Function**: `generateSignalRefreshEntry()`
 *
 * ```typescript
 * import { generateSignalRefreshEntry } from "@/polymet/data/auto-journal-generator";
 *
 * // In logAutoRefreshEvent()
 * if (comparisons.length > 0) {
 *   generateSignalRefreshEntry(
 *     result.decisionId,
 *     result.decisionTitle,
 *     tenantId,
 *     result.triggeredBy,
 *     comparisons
 *   );
 * }
 * ```
 *
 * ### 3. Guardrail Adjustment
 * **File**: `@/polymet/data/guardrail-auto-adjust`
 * **Trigger**: When guardrail threshold is auto-adjusted
 * **Function**: `generateGuardrailAdjustmentEntry()`
 *
 * ```typescript
 * import { generateGuardrailAdjustmentEntry } from "@/polymet/data/auto-journal-generator";
 *
 * // In autoAdjustGuardrail()
 * if (decisionTitle) {
 *   generateGuardrailAdjustmentEntry(
 *     decisionId,
 *     decisionTitle,
 *     tenantId,
 *     adjustmentRecord
 *   );
 * }
 * ```
 *
 * ### 4. Incident Link
 * **File**: `@/polymet/data/incident-matcher`
 * **Trigger**: When incident is matched to decision
 * **Function**: `generateIncidentLinkEntry()`
 *
 * ```typescript
 * import { generateIncidentLinkEntry } from "@/polymet/data/auto-journal-generator";
 *
 * // In processIncidentImpact()
 * generateIncidentLinkEntry(
 *   decision.id,
 *   decision.title || "Untitled Decision",
 *   decision.tenantId,
 *   incident,
 *   impact.affected_signals.length,
 *   impact.estimated_effect
 * );
 * ```
 *
 * ---
 *
 * ## UI Components
 *
 * ### Decision Journal Panel
 * **File**: `@/polymet/components/decision-journal-panel`
 * **Features**:
 * - Display all journal entries for a decision
 * - Filter by entry type (choice, update, reflection, incident, guardrail_adjustment)
 * - Filter by author (system, user)
 * - Search entries by text
 * - Add manual journal entries
 * - View entry metadata
 * - Statistics dashboard
 *
 * **Usage**:
 * ```tsx
 * import { DecisionJournalPanel } from "@/polymet/components/decision-journal-panel";
 *
 * <DecisionJournalPanel
 *   decisionId={decisionId}
 *   decisionTitle={decisionTitle}
 *   onAuditEvent={handleAuditEvent}
 * />
 * ```
 *
 * ---
 *
 * ## Example Journal Entries
 *
 * ### Decision Finalized
 * ```
 * Chose "Supplier A" with RAROC 0.18, EV $125,000, and VaR95 $45,000.
 * Rationale: Supplier A offers the best balance of cost and reliability
 * based on historical performance.
 * ```
 *
 * ### Signal Refresh
 * ```
 * When Cost Volatility Index increased by 15%, the expected value fell
 * by 2% but guardrails held steady.
 * ```
 *
 * ### Guardrail Adjustment
 * ```
 * Value at Risk guardrail auto-adjusted due to moderate breach. Threshold
 * tightened 10% from $50,000 to $45,000 after 2 repeated breaches. Last
 * breach exceeded threshold by 12%.
 * ```
 *
 * ### Incident Link
 * ```
 * HIGH Supply Chain Disruption: "Port Congestion Delays" affected 2 linked
 * signals. Estimated 9% decrease in Expected Value. Incident ongoing,
 * monitoring impact.
 * ```
 *
 * ---
 *
 * ## Data Flow
 *
 * ```
 * Trigger Event
 *     ↓
 * Auto-Journal Generator
 *     ↓
 * Generate Plain-Language Summary (≤500 chars)
 *     ↓
 * Capture Structured Metadata
 *     ↓
 * addJournalEntry()
 *     ↓
 * localStorage: retina:decision-journal:{tenantId}
 *     ↓
 * Decision Journal Panel (UI)
 * ```
 *
 * ---
 *
 * ## Storage Schema
 *
 * ### localStorage Key
 * ```
 * retina:decision-journal:{tenantId}
 * ```
 *
 * ### Data Structure
 * ```typescript
 * interface DecisionJournal {
 *   decision_id: string;
 *   decision_title: string;
 *   entries: DecisionJournalEntry[];
 *   created_at: number;
 *   last_updated: number;
 * }
 *
 * interface DecisionJournalEntry {
 *   id: string;
 *   decision_id: string;
 *   entry_date: number;
 *   entry_type: "choice" | "update" | "reflection" | "incident" | "guardrail_adjustment";
 *   summary_text: string; // Max 500 characters
 *   auto_generated: boolean;
 *   author: "system" | "user";
 *   metadata?: Record<string, any>;
 * }
 * ```
 *
 * ---
 *
 * ## API Functions
 *
 * ### Core Generation Functions
 * ```typescript
 * // Decision finalization
 * generateDecisionFinalizedEntry(
 *   decisionId: string,
 *   decisionTitle: string,
 *   tenantId: string,
 *   chosenOptionId: string,
 *   chosenOptionLabel: string,
 *   simulationResult: SimulationResult,
 *   rationale?: string
 * ): void
 *
 * // Signal refresh
 * generateSignalRefreshEntry(
 *   decisionId: string,
 *   decisionTitle: string,
 *   tenantId: string,
 *   signalUpdates: SignalUpdate[],
 *   metricComparisons: MetricComparison[]
 * ): void
 *
 * // Guardrail adjustment
 * generateGuardrailAdjustmentEntry(
 *   decisionId: string,
 *   decisionTitle: string,
 *   tenantId: string,
 *   adjustment: AutoAdjustmentRecord
 * ): void
 *
 * // Incident link
 * generateIncidentLinkEntry(
 *   decisionId: string,
 *   decisionTitle: string,
 *   tenantId: string,
 *   incident: Incident,
 *   affectedSignalCount: number,
 *   estimatedEffect?: { metric: string; change_percent: number }
 * ): void
 * ```
 *
 * ### Helper Functions
 * ```typescript
 * // Get plain-language metric label
 * getMetricLabel(metricName: string): string
 *
 * // Format threshold value based on metric type
 * formatThresholdValue(value: number, metricName: string): string
 *
 * // Get plain-language incident type label
 * getIncidentTypeLabel(type: Incident["type"]): string
 * ```
 *
 * ---
 *
 * ## Benefits
 *
 * ### 1. Context Preservation
 * - Automatic capture of decision context
 * - No manual note-taking required
 * - Complete audit trail
 *
 * ### 2. Plain-Language Communication
 * - Non-technical stakeholders can understand
 * - Clear cause-and-effect relationships
 * - Actionable insights
 *
 * ### 3. Traceability
 * - Link entries to source events
 * - Track decision evolution over time
 * - Support compliance and auditing
 *
 * ### 4. Learning & Improvement
 * - Review past decisions
 * - Identify patterns
 * - Improve future decision-making
 *
 * ---
 *
 * ## Future Enhancements
 *
 * ### 1. AI-Powered Insights
 * - Summarize journal entries
 * - Identify decision patterns
 * - Suggest improvements
 *
 * ### 2. Export & Reporting
 * - PDF export of journal
 * - Timeline visualization
 * - Decision history reports
 *
 * ### 3. Collaboration
 * - Share journal entries
 * - Comment on entries
 * - Tag team members
 *
 * ### 4. Integration
 * - Email notifications for key entries
 * - Slack/Teams integration
 * - API for external systems
 *
 * ---
 *
 * ## Testing
 *
 * ### Manual Testing
 * 1. Navigate to i-Decide page
 * 2. Create a decision with options
 * 3. Run simulation
 * 4. Close decision → Check for "choice" entry
 * 5. Link signals → Trigger refresh → Check for "update" entry
 * 6. Set guardrails → Trigger breach → Check for "guardrail_adjustment" entry
 * 7. Create incident → Link to decision → Check for "incident" entry
 *
 * ### Automated Testing
 * ```typescript
 * import { generateDecisionFinalizedEntry } from "@/polymet/data/auto-journal-generator";
 * import { getDecisionJournal } from "@/polymet/data/decision-journal";
 *
 * // Test decision finalized entry
 * generateDecisionFinalizedEntry(...);
 * const journal = getDecisionJournal(decisionId, tenantId);
 * expect(journal.entries).toHaveLength(1);
 * expect(journal.entries[0].entry_type).toBe("choice");
 * expect(journal.entries[0].auto_generated).toBe(true);
 * ```
 *
 * ---
 *
 * ## Summary
 *
 * The Automatic Journal Entry Generation System provides:
 * - ✅ Automatic context capture on 4 key triggers
 * - ✅ Plain-language summaries (≤500 chars)
 * - ✅ Rich structured metadata
 * - ✅ UI component for viewing and filtering
 * - ✅ Manual entry support
 * - ✅ Search and filter capabilities
 * - ✅ Complete audit trail
 *
 * This system ensures that critical decision context is never lost and
 * provides a clear, plain-language history of decision evolution.
 */

export default "Auto-Journal System Documentation";
