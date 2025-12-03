/**
 * # Learning Trace & Antifragility Scoring System
 *
 * ## Overview
 * The Learning Trace system tracks how decision utility changes after each auto-refresh event,
 * computing a time-series of ΔUtility values that reveal whether decisions improve or degrade
 * under stress. This data feeds into an antifragility score that quantifies resilience.
 *
 * ## Plain-Language Tooltip
 * "Tracks how well decisions bounce back or improve after shocks."
 *
 * ---
 *
 * ## Core Concepts
 *
 * ### 1. Learning Trace
 * A time-series array that records utility changes after each auto-refresh:
 * - **Timestamp**: When the refresh occurred
 * - **Previous Utility**: Utility before signal change
 * - **New Utility**: Utility after signal change
 * - **ΔUtility**: Change in utility (new - previous)
 * - **Shock Magnitude**: Maximum absolute % change from triggering signals
 * - **Recovery Ratio**: ΔUtility / Shock Magnitude
 *
 * ### 2. Antifragility Score
 * A single metric computed from the learning trace:
 * - **Positive score**: Decision improves under stress (antifragile)
 * - **Zero score**: Decision maintains performance (robust)
 * - **Negative score**: Decision degrades under stress (fragile)
 *
 * ### 3. Recovery Ratio
 * The key metric for antifragility:
 * ```
 * Recovery Ratio = ΔUtility / Shock Magnitude
 * ```
 * - **Positive**: Utility increased despite shock (antifragile)
 * - **Zero**: Utility unchanged (robust)
 * - **Negative**: Utility decreased (fragile)
 *
 * ---
 *
 * ## Data Flow
 *
 * ```
 * Signal Update Detected
 *     ↓
 * Auto-Refresh Triggered
 *     ↓
 * Metrics Recomputed (including Utility)
 *     ↓
 * Compare Previous vs New Utility
 *     ↓
 * Compute ΔUtility and Recovery Ratio
 *     ↓
 * Append to Learning Trace
 *     ↓
 * Recompute Antifragility Score
 *     ↓
 * Store in localStorage
 *     ↓
 * Audit Event: "Learning trace updated."
 * ```
 *
 * ---
 *
 * ## Implementation Details
 *
 * ### Storage Structure
 * ```typescript
 * // localStorage key pattern
 * retina:learning-trace:{tenantId}:{decisionId}
 *
 * // Data structure
 * {
 *   decisionId: string;
 *   entries: LearningTraceEntry[];
 *   antifragilityScore: number;
 *   lastUpdated: number;
 * }
 * ```
 *
 * ### Learning Trace Entry
 * ```typescript
 * {
 *   timestamp: number;
 *   decisionId: string;
 *   optionId: string;
 *   optionLabel: string;
 *   previousUtility: number;
 *   newUtility: number;
 *   deltaUtility: number;
 *   deltaPercent: number;
 *   triggeredBy: SignalUpdate[];
 *   shockMagnitude: number;
 *   recoveryRatio: number;
 * }
 * ```
 *
 * ### Antifragility Score Calculation
 * ```typescript
 * // Average of all recovery ratios
 * antifragilityScore = sum(recoveryRatios) / count(entries)
 * ```
 *
 * ---
 *
 * ## Classification Thresholds
 *
 * | Score Range | Label | Description |
 * |-------------|-------|-------------|
 * | ≥ 0.5 | Highly Antifragile | Consistently improves under stress |
 * | 0.1 to 0.5 | Antifragile | Generally benefits from volatility |
 * | -0.1 to 0.1 | Robust | Maintains performance under stress |
 * | -0.5 to -0.1 | Fragile | Degrades under stress |
 * | < -0.5 | Highly Fragile | Severely impacted by volatility |
 *
 * ---
 *
 * ## API Functions
 *
 * ### Core Functions
 * ```typescript
 * // Get learning trace for a decision
 * getLearningTrace(decisionId: string, tenantId: string): LearningTrace | null
 *
 * // Get all learning traces for a tenant
 * getAllLearningTraces(tenantId: string): LearningTrace[]
 *
 * // Update learning trace with new utility comparison
 * updateLearningTrace(
 *   decisionId: string,
 *   tenantId: string,
 *   comparisons: MetricComparison[],
 *   signalUpdates: SignalUpdate[]
 * ): LearningTrace
 *
 * // Get antifragility score
 * getAntifragilityScore(decisionId: string, tenantId: string): number | null
 *
 * // Classify antifragility score
 * classifyAntifragility(score: number): {
 *   label: string;
 *   color: string;
 *   description: string;
 * }
 *
 * // Clear learning trace
 * clearLearningTrace(decisionId: string, tenantId: string): void
 * ```
 *
 * ---
 *
 * ## Integration Points
 *
 * ### 1. Auto-Refresh Engine
 * **File**: `@/polymet/data/auto-refresh-engine`
 *
 * **Integration**:
 * - After each successful auto-refresh, `logAutoRefreshEvent()` checks for utility data
 * - If utility comparisons exist, calls `updateLearningTrace()`
 * - Logs audit event: `"decision.learning_trace_updated"`
 *
 * **Code**:
 * ```typescript
 * // In logAutoRefreshEvent()
 * const hasUtilityData = comparisons.some((c) => c.utility !== undefined);
 * if (hasUtilityData) {
 *   updateLearningTrace(decisionId, tenantId, comparisons, triggeredBy);
 *   store.addAudit("decision.learning_trace_updated", { ... });
 * }
 * ```
 *
 * ### 2. Learning Trace Panel
 * **File**: `@/polymet/components/learning-trace-panel`
 *
 * **Features**:
 * - Displays antifragility score with classification badge
 * - Shows utility trend chart over time
 * - Shows recovery ratio chart (positive = antifragile)
 * - Lists recent refresh events with details
 * - Option selector for multi-option decisions
 * - Clear trace functionality with confirmation dialog
 *
 * **Usage**:
 * ```tsx
 * <LearningTracePanel
 *   decisionId="dec-123"
 *   decisionTitle="Supply Chain Strategy"
 *   onAuditEvent={(eventType, payload) => { ... }}
 * />
 * ```
 *
 * ### 3. Auto-Refresh Status
 * **File**: `@/polymet/components/auto-refresh-status`
 *
 * **Enhancements**:
 * - Shows count of decisions with learning traces
 * - Displays average antifragility score across all decisions
 * - Classification badge for portfolio-level antifragility
 *
 * ---
 *
 * ## Audit Events
 *
 * ### 1. Learning Trace Updated
 * **Event Type**: `"decision.learning_trace_updated"`
 *
 * **Payload**:
 * ```typescript
 * {
 *   decisionId: string;
 *   decisionTitle: string;
 *   tenantId: string;
 *   timestamp: number;
 *   utilityChanges: Array<{
 *     optionId: string;
 *     optionLabel: string;
 *     deltaUtility: number;
 *     deltaPercent: number;
 *   }>;
 *   message: "Learning trace updated.";
 * }
 * ```
 *
 * ### 2. Learning Trace Cleared
 * **Event Type**: `"decision.learning_trace_cleared"`
 *
 * **Payload**:
 * ```typescript
 * {
 *   decisionId: string;
 *   decisionTitle: string;
 *   tenantId: string;
 *   timestamp: number;
 * }
 * ```
 *
 * ---
 *
 * ## Use Cases
 *
 * ### 1. Portfolio Antifragility Analysis
 * **Scenario**: Assess which decisions in a portfolio are most resilient
 *
 * **Implementation**:
 * ```typescript
 * const traces = getAllLearningTraces(tenantId);
 * const sortedByAntifragility = traces
 *   .sort((a, b) => (b.antifragilityScore ?? 0) - (a.antifragilityScore ?? 0));
 *
 * // Most antifragile decisions
 * const topAntifragile = sortedByAntifragility.slice(0, 5);
 *
 * // Most fragile decisions
 * const topFragile = sortedByAntifragility.slice(-5).reverse();
 * ```
 *
 * ### 2. Decision Resilience Dashboard
 * **Scenario**: Show real-time resilience metrics on dashboard
 *
 * **Implementation**:
 * ```tsx
 * const avgScore = getAllLearningTraces(tenantId)
 *   .reduce((sum, t) => sum + (t.antifragilityScore ?? 0), 0) / traces.length;
 *
 * const classification = classifyAntifragility(avgScore);
 *
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Portfolio Antifragility</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <div className="text-3xl font-bold">{avgScore.toFixed(3)}</div>
 *     <Badge className={classification.color}>{classification.label}</Badge>
 *   </CardContent>
 * </Card>
 * ```
 *
 * ### 3. Stress Test Validation
 * **Scenario**: Validate that stress tests accurately predict real-world resilience
 *
 * **Implementation**:
 * ```typescript
 * // Compare stress test predictions with actual learning trace
 * const trace = getLearningTrace(decisionId, tenantId);
 * const actualAntifragility = trace?.antifragilityScore ?? 0;
 *
 * // Get stress test results
 * const stressTestScore = computeStressTestResilience(decision);
 *
 * // Compare
 * const accuracy = 1 - Math.abs(actualAntifragility - stressTestScore);
 * ```
 *
 * ### 4. Early Warning System
 * **Scenario**: Alert when decisions become increasingly fragile
 *
 * **Implementation**:
 * ```typescript
 * const trace = getLearningTrace(decisionId, tenantId);
 * if (!trace) return;
 *
 * // Get recent entries (last 5)
 * const recentEntries = trace.entries.slice(-5);
 * const recentAvg = recentEntries.reduce((sum, e) => sum + e.recoveryRatio, 0) / recentEntries.length;
 *
 * // Compare to overall average
 * const overallAvg = trace.antifragilityScore ?? 0;
 *
 * if (recentAvg < overallAvg - 0.2) {
 *   // Decision is becoming more fragile
 *   createAlert({
 *     type: "warning",
 *     message: "Decision resilience declining",
 *     decisionId,
 *   });
 * }
 * ```
 *
 * ---
 *
 * ## Best Practices
 *
 * ### 1. Ensure Utility is Computed
 * Learning traces require utility data. Make sure:
 * - Utility parameters are configured for decisions
 * - Utility is computed during simulation
 * - Utility is included in simulation results
 *
 * ### 2. Monitor Trace Quality
 * - Require minimum number of entries (e.g., 5) before showing score
 * - Flag decisions with insufficient data
 * - Consider time decay for older entries
 *
 * ### 3. Contextualize Scores
 * - Compare scores within similar decision types
 * - Consider industry benchmarks
 * - Account for decision complexity
 *
 * ### 4. Regular Cleanup
 * - Keep last 100 entries per decision (automatic)
 * - Archive old traces for historical analysis
 * - Clear traces when decisions are fundamentally changed
 *
 * ---
 *
 * ## Future Enhancements (Set 13)
 *
 * ### 1. Advanced Analytics
 * - Trend analysis (improving vs declining resilience)
 * - Correlation with decision characteristics
 * - Predictive modeling for future resilience
 *
 * ### 2. Portfolio-Level Metrics
 * - Portfolio antifragility score
 * - Diversification benefit analysis
 * - Correlation between decision resilience
 *
 * ### 3. Visualization Enhancements
 * - Heatmap of antifragility across portfolio
 * - Time-series animation of resilience changes
 * - Comparative analysis charts
 *
 * ### 4. Integration with Resilience Dashboard
 * - Combine learning trace data with stress test results
 * - Show actual vs predicted resilience
 * - Validate antifragility assumptions
 *
 * ---
 *
 * ## Technical Notes
 *
 * ### Performance Considerations
 * - Learning traces stored in localStorage (per-tenant, per-decision)
 * - Maximum 100 entries per trace (automatic pruning)
 * - Scores computed on-demand (not pre-computed)
 * - Efficient filtering for portfolio-level queries
 *
 * ### Data Persistence
 * - localStorage key pattern: `retina:learning-trace:{tenantId}:{decisionId}`
 * - JSON serialization for storage
 * - Automatic migration for schema changes
 * - Export/import functionality for backup
 *
 * ### Error Handling
 * - Graceful degradation if utility data missing
 * - Validation of recovery ratio calculations
 * - Fallback to null for invalid scores
 * - Logging of computation errors
 *
 * ---
 *
 * ## Example Workflow
 *
 * ```typescript
 * // 1. Signal update detected
 * const signalUpdates = [
 *   {
 *     signal_id: "sig-cost-index",
 *     signal_label: "Cost Index (CPI)",
 *     old_value: 285.2,
 *     new_value: 302.8,
 *     change_percent: 0.062, // 6.2% increase
 *     timestamp: Date.now(),
 *   }
 * ];
 *
 * // 2. Auto-refresh triggered
 * onSignalUpdate(signalUpdates, "t-demo", (results) => {
 *   // 3. Metrics recomputed
 *   for (const result of results) {
 *     if (result.success && result.previousResults && result.newResults) {
 *       // 4. Compare utilities
 *       const comparisons = compareMetrics(result.previousResults, result.newResults);
 *
 *       // 5. Update learning trace
 *       const trace = updateLearningTrace(
 *         result.decisionId,
 *         "t-demo",
 *         comparisons,
 *         signalUpdates
 *       );
 *
 *       // 6. Check antifragility
 *       console.log("Antifragility Score:", trace.antifragilityScore);
 *       console.log("Classification:", classifyAntifragility(trace.antifragilityScore));
 *     }
 *   }
 * });
 *
 * // 7. View in UI
 * <LearningTracePanel
 *   decisionId="dec-123"
 *   decisionTitle="Supply Chain Strategy"
 * />
 * ```
 *
 * ---
 *
 * ## Summary
 *
 * The Learning Trace system provides a quantitative measure of decision resilience by tracking
 * utility changes after signal updates. The antifragility score reveals whether decisions improve
 * or degrade under stress, enabling proactive risk management and portfolio optimization.
 *
 * **Key Benefits**:
 * - Quantifies decision resilience with a single metric
 * - Tracks performance over time with time-series data
 * - Identifies fragile decisions before they fail
 * - Validates stress test predictions with real-world data
 * - Enables portfolio-level antifragility analysis
 *
 * **Integration**:
 * - Automatic tracking via auto-refresh engine
 * - Visual dashboard via learning trace panel
 * - Portfolio metrics via auto-refresh status
 * - Audit logging for compliance and analysis
 */

export default {
  name: "Learning Trace & Antifragility Scoring System",
  version: "1.0.0",
  documentation:
    "Complete implementation with time-series tracking and scoring",
};
