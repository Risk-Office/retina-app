/**
 * # Auto-Refresh Engine System
 *
 * ## Overview
 * The Auto-Refresh Engine automatically recomputes decision metrics (EV, VaR95, CVaR95, Utility)
 * when linked signals update beyond a configurable threshold. This ensures decisions always
 * reflect current market conditions without manual intervention.
 *
 * ## Plain-Language Description
 * **"When conditions shift, results refresh automatically — no manual rerun needed."**
 *
 * ---
 *
 * ## Architecture
 *
 * ### Components
 *
 * 1. **Auto-Refresh Engine** (`@/polymet/data/auto-refresh-engine`)
 *    - Core recomputation logic
 *    - Signal change detection
 *    - Batch processing
 *    - Metric comparison
 *    - Audit logging
 *
 * 2. **Signal Monitor** (`@/polymet/data/signal-monitor`)
 *    - Periodic signal polling
 *    - Change detection
 *    - Decision tagging
 *    - Notification generation
 *
 * 3. **Auto-Refresh Status Component** (`@/polymet/components/auto-refresh-status`)
 *    - Status display
 *    - Configuration UI
 *    - Activity history
 *
 * 4. **Retina Store** (`@/polymet/data/retina-store`)
 *    - Decision storage with `last_refreshed_at` timestamp
 *    - Audit event logging
 *    - Batch update support
 *
 * ### Data Flow
 *
 * ```
 * Signal Update → Signal Monitor → Auto-Refresh Engine → Recompute Metrics → Update Store → Log Audit
 *                       ↓
 *                 Tag Decision
 *                       ↓
 *                 Notification
 * ```
 *
 * ---
 *
 * ## Features
 *
 * ### 1. Automatic Metric Recomputation
 *
 * When a linked signal changes beyond the threshold:
 * - **EV (Expected Value)** is recalculated
 * - **VaR95 (Value at Risk)** is recalculated
 * - **CVaR95 (Conditional VaR)** is recalculated
 * - **Utility** is recalculated (if configured)
 * - **RAROC** is recalculated
 * - **Economic Capital** is recalculated
 *
 * ### 2. Timestamp Tracking
 *
 * Each decision includes a `last_refreshed_at` field:
 * ```typescript
 * interface Decision {
 *   // ... other fields
 *   last_refreshed_at?: number; // Unix timestamp
 * }
 * ```
 *
 * ### 3. Audit Logging
 *
 * Every auto-refresh generates an audit event:
 * ```typescript
 * {
 *   eventType: "decision.auto_refreshed",
 *   payload: {
 *     decisionId: string,
 *     decisionTitle: string,
 *     tenantId: string,
 *     triggeredBy: SignalUpdate[],
 *     refreshedAt: number,
 *     success: boolean,
 *     significantChanges: MetricChange[],
 *     message: "Decision auto-updated due to signal change."
 *   }
 * }
 * ```
 *
 * ### 4. Configurable Thresholds
 *
 * ```typescript
 * interface AutoRefreshConfig {
 *   enabled: boolean;              // Enable/disable auto-refresh
 *   changeThreshold: number;       // Min % change (default: 5%)
 *   batchSize: number;             // Max decisions per batch (default: 10)
 *   debounceMs: number;            // Debounce time (default: 2000ms)
 * }
 * ```
 *
 * ### 5. Batch Processing
 *
 * Multiple decisions are refreshed in batches to optimize performance:
 * - Configurable batch size
 * - Progress tracking
 * - Error handling per decision
 * - Parallel processing within batches
 *
 * ### 6. Debouncing
 *
 * Multiple signal updates are debounced to avoid excessive recomputation:
 * - Configurable debounce time
 * - Accumulates updates during debounce period
 * - Single batch refresh after debounce
 *
 * ---
 *
 * ## Usage
 *
 * ### Integration in Prototype
 *
 * ```typescript
 * import { onSignalUpdate } from "@/polymet/data/auto-refresh-engine";
 * import { startSignalMonitoring } from "@/polymet/data/signal-monitor";
 *
 * function AppWithMonitoring() {
 *   const { decisions } = useRetinaStore();
 *
 *   useEffect(() => {
 *     // Start signal monitoring
 *     const cleanup = startSignalMonitoring(
 *       () => decisions,
 *       (tag) => {
 *         // Trigger auto-refresh when tag is created
 *         if (tag.triggered_by && tag.triggered_by.length > 0) {
 *           onSignalUpdate(tag.triggered_by, tenantId, (results) => {
 *             console.log("Auto-refresh completed:", results);
 *           });
 *         }
 *       }
 *     );
 *
 *     return cleanup;
 *   }, [decisions]);
 * }
 * ```
 *
 * ### Manual Refresh
 *
 * ```typescript
 * import { manualRefresh } from "@/polymet/data/auto-refresh-engine";
 *
 * const results = await manualRefresh(
 *   ["dec-1", "dec-2"], // Decision IDs
 *   "t-demo",           // Tenant ID
 *   (results) => {
 *     console.log("Manual refresh completed:", results);
 *   }
 * );
 * ```
 *
 * ### Configuration Management
 *
 * ```typescript
 * import {
 *   getAutoRefreshConfig,
 *   setAutoRefreshConfig
 * } from "@/polymet/data/auto-refresh-engine";
 *
 * // Get current config
 * const config = getAutoRefreshConfig();
 *
 * // Update config
 * setAutoRefreshConfig({
 *   enabled: true,
 *   changeThreshold: 0.05, // 5%
 *   batchSize: 10,
 *   debounceMs: 2000
 * });
 * ```
 *
 * ### Status Component
 *
 * ```typescript
 * import { AutoRefreshStatus } from "@/polymet/components/auto-refresh-status";
 *
 * // Full card view
 * <AutoRefreshStatus tenantId="t-demo" showConfig={true} />
 *
 * // Compact view
 * <AutoRefreshStatus tenantId="t-demo" showConfig={true} compact={true} />
 * ```
 *
 * ---
 *
 * ## Signal Update Flow
 *
 * ### 1. Signal Change Detection
 *
 * The signal monitor polls signals every 60 seconds:
 * ```typescript
 * const currentValues = await fetchSignalValues(signalIds);
 * const history = getSignalHistory();
 *
 * // Compare with historical values
 * const changePercent = Math.abs((newValue - oldValue) / oldValue);
 *
 * if (changePercent >= CHANGE_THRESHOLD) {
 *   // Create signal update
 *   updates.push({
 *     signal_id,
 *     signal_label,
 *     old_value: oldValue,
 *     new_value: newValue,
 *     change_percent: changePercent,
 *     timestamp: Date.now()
 *   });
 * }
 * ```
 *
 * ### 2. Decision Tagging
 *
 * Decisions with linked signals are tagged for re-evaluation:
 * ```typescript
 * const tag = tagDecisionForRevaluation(decision, updates);
 * ```
 *
 * ### 3. Auto-Refresh Trigger
 *
 * The auto-refresh engine is triggered with signal updates:
 * ```typescript
 * onSignalUpdate(signalUpdates, tenantId, (results) => {
 *   // Results contain success/failure for each decision
 * });
 * ```
 *
 * ### 4. Scenario Variable Update
 *
 * Linked signals update scenario variables based on direction:
 * ```typescript
 * // Positive correlation: increase mean
 * if (linkedSignal.direction === "positive") {
 *   const changeRatio = newValue / oldValue;
 *   updatedParams = [mean * changeRatio, stdDev];
 * }
 *
 * // Negative correlation: decrease mean
 * if (linkedSignal.direction === "negative") {
 *   const changeRatio = oldValue / newValue;
 *   updatedParams = [mean * changeRatio, stdDev];
 * }
 * ```
 *
 * ### 5. Simulation Rerun
 *
 * The simulation is rerun with updated scenario variables:
 * ```typescript
 * const newResults = runSimulation(
 *   decision.options,
 *   updatedScenarioVars,
 *   decision.seed,
 *   decision.runs,
 *   decision.utilityParams,
 *   // ... other params
 * );
 * ```
 *
 * ### 6. Store Update
 *
 * The decision is updated in the store:
 * ```typescript
 * const updatedDecision = {
 *   ...decision,
 *   simulationResults: newResults,
 *   scenarioVars: updatedScenarioVars,
 *   last_refreshed_at: Date.now()
 * };
 * ```
 *
 * ### 7. Audit Logging
 *
 * An audit event is logged:
 * ```typescript
 * store.addAudit("decision.auto_refreshed", {
 *   decisionId,
 *   decisionTitle,
 *   tenantId,
 *   triggeredBy: signalUpdates,
 *   refreshedAt: Date.now(),
 *   success: true,
 *   message: "Decision auto-updated due to signal change."
 * });
 * ```
 *
 * ---
 *
 * ## Metric Comparison
 *
 * The engine compares old and new metrics:
 * ```typescript
 * interface MetricComparison {
 *   optionId: string;
 *   optionLabel: string;
 *   ev: {
 *     old: number;
 *     new: number;
 *     delta: number;
 *     deltaPercent: number;
 *   };
 *   var95: { ... };
 *   cvar95: { ... };
 *   utility?: { ... };
 * }
 * ```
 *
 * Significant changes (>5%) are highlighted in audit logs.
 *
 * ---
 *
 * ## Configuration Options
 *
 * ### Enable/Disable
 *
 * ```typescript
 * setAutoRefreshConfig({ enabled: false });
 * ```
 *
 * ### Change Threshold
 *
 * Minimum signal change to trigger refresh:
 * ```typescript
 * setAutoRefreshConfig({ changeThreshold: 0.10 }); // 10%
 * ```
 *
 * ### Batch Size
 *
 * Maximum decisions to refresh in one batch:
 * ```typescript
 * setAutoRefreshConfig({ batchSize: 20 });
 * ```
 *
 * ### Debounce Time
 *
 * Wait time before processing multiple updates:
 * ```typescript
 * setAutoRefreshConfig({ debounceMs: 5000 }); // 5 seconds
 * ```
 *
 * ---
 *
 * ## Error Handling
 *
 * ### Per-Decision Errors
 *
 * Each decision refresh is isolated:
 * ```typescript
 * {
 *   decisionId: "dec-1",
 *   success: false,
 *   error: "Simulation failed: Invalid parameters",
 *   refreshedAt: Date.now()
 * }
 * ```
 *
 * ### Batch Errors
 *
 * Failed refreshes don't block successful ones:
 * ```typescript
 * const results = await batchRecomputeMetrics(decisions, signalUpdates);
 * const successful = results.filter(r => r.success);
 * const failed = results.filter(r => !r.success);
 * ```
 *
 * ---
 *
 * ## Performance Considerations
 *
 * ### Debouncing
 *
 * Multiple signal updates within the debounce window are batched:
 * - Reduces redundant recomputations
 * - Improves performance for rapid signal changes
 *
 * ### Batch Processing
 *
 * Large numbers of decisions are processed in batches:
 * - Prevents UI blocking
 * - Allows progress tracking
 * - Enables cancellation
 *
 * ### Selective Refresh
 *
 * Only decisions with linked signals are monitored:
 * - Reduces unnecessary checks
 * - Improves monitoring efficiency
 *
 * ---
 *
 * ## Testing
 *
 * ### Mock Signal Updates
 *
 * ```typescript
 * const mockUpdates = [
 *   {
 *     signal_id: "sig-cost-index",
 *     signal_label: "Cost Index (CPI)",
 *     old_value: 285.2,
 *     new_value: 302.8,
 *     change_percent: 0.062,
 *     timestamp: Date.now()
 *   }
 * ];
 *
 * onSignalUpdate(mockUpdates, "t-demo");
 * ```
 *
 * ### Manual Trigger
 *
 * ```typescript
 * const results = await manualRefresh(["dec-1"], "t-demo");
 * console.log(results);
 * ```
 *
 * ---
 *
 * ## Best Practices
 *
 * ### 1. Link Signals Carefully
 *
 * Only link signals that truly affect decision outcomes:
 * - Reduces unnecessary refreshes
 * - Improves signal-to-noise ratio
 *
 * ### 2. Set Appropriate Thresholds
 *
 * Balance sensitivity vs. stability:
 * - Too low: Excessive refreshes
 * - Too high: Missed important changes
 * - Recommended: 5-10%
 *
 * ### 3. Monitor Audit Logs
 *
 * Review auto-refresh events regularly:
 * - Identify frequently refreshed decisions
 * - Adjust thresholds if needed
 * - Detect anomalies
 *
 * ### 4. Use Compact Status Display
 *
 * Show auto-refresh status in decision views:
 * ```typescript
 * <AutoRefreshStatus tenantId={tenantId} compact={true} />
 * ```
 *
 * ### 5. Communicate to Users
 *
 * Use the plain-language tooltip:
 * - "When conditions shift, results refresh automatically — no manual rerun needed."
 * - Helps users understand the feature
 * - Builds trust in automated updates
 *
 * ---
 *
 * ## Future Enhancements
 *
 * ### 1. Smart Thresholds
 *
 * Adaptive thresholds based on signal volatility:
 * - Higher thresholds for volatile signals
 * - Lower thresholds for stable signals
 *
 * ### 2. Refresh Scheduling
 *
 * Schedule refreshes during off-peak hours:
 * - Reduces impact on user experience
 * - Optimizes resource usage
 *
 * ### 3. Selective Metric Refresh
 *
 * Refresh only affected metrics:
 * - Faster recomputation
 * - Reduced resource usage
 *
 * ### 4. Refresh Notifications
 *
 * Notify users of significant changes:
 * - Toast notifications
 * - Email alerts
 * - Dashboard badges
 *
 * ### 5. Refresh History
 *
 * Detailed history of all refreshes:
 * - Metric trends over time
 * - Signal impact analysis
 * - Performance metrics
 *
 * ---
 *
 * ## API Reference
 *
 * ### `onSignalUpdate(signalUpdates, tenantId, onComplete?)`
 *
 * Main trigger function for auto-refresh.
 *
 * **Parameters:**
 * - `signalUpdates: SignalUpdate[]` - Array of signal updates
 * - `tenantId: string` - Tenant ID
 * - `onComplete?: (results: RefreshResult[]) => void` - Callback
 *
 * **Returns:** `void`
 *
 * ### `manualRefresh(decisionIds, tenantId, onComplete?)`
 *
 * Manually trigger refresh for specific decisions.
 *
 * **Parameters:**
 * - `decisionIds: string[]` - Array of decision IDs
 * - `tenantId: string` - Tenant ID
 * - `onComplete?: (results: RefreshResult[]) => void` - Callback
 *
 * **Returns:** `Promise<RefreshResult[]>`
 *
 * ### `recomputeDecisionMetrics(decision, signalUpdates)`
 *
 * Recompute metrics for a single decision.
 *
 * **Parameters:**
 * - `decision: Decision` - Decision object
 * - `signalUpdates: SignalUpdate[]` - Array of signal updates
 *
 * **Returns:** `Promise<RefreshResult>`
 *
 * ### `batchRecomputeMetrics(decisions, signalUpdates, onProgress?)`
 *
 * Batch recompute metrics for multiple decisions.
 *
 * **Parameters:**
 * - `decisions: Decision[]` - Array of decisions
 * - `signalUpdates: SignalUpdate[]` - Array of signal updates
 * - `onProgress?: (completed: number, total: number) => void` - Progress callback
 *
 * **Returns:** `Promise<RefreshResult[]>`
 *
 * ### `compareMetrics(previousResults, newResults)`
 *
 * Compare old and new simulation results.
 *
 * **Parameters:**
 * - `previousResults: SimulationResult[]` - Old results
 * - `newResults: SimulationResult[]` - New results
 *
 * **Returns:** `MetricComparison[]`
 *
 * ### `getAutoRefreshConfig()`
 *
 * Get current auto-refresh configuration.
 *
 * **Returns:** `AutoRefreshConfig`
 *
 * ### `setAutoRefreshConfig(config)`
 *
 * Update auto-refresh configuration.
 *
 * **Parameters:**
 * - `config: Partial<AutoRefreshConfig>` - Configuration updates
 *
 * **Returns:** `void`
 *
 * ---
 *
 * ## Summary
 *
 * The Auto-Refresh Engine provides:
 * ✅ Automatic metric recomputation when signals change
 * ✅ Timestamp tracking with `last_refreshed_at`
 * ✅ Comprehensive audit logging
 * ✅ Configurable thresholds and batching
 * ✅ Debouncing for multiple updates
 * ✅ Error handling and recovery
 * ✅ Status monitoring and configuration UI
 * ✅ Plain-language tooltips for user clarity
 *
 * **Plain-Language Summary:**
 * "When conditions shift, results refresh automatically — no manual rerun needed."
 */

export default {
  name: "Auto-Refresh Engine System",
  version: "1.0.0",
  description: "Automatic decision metric recomputation when signals update",
  components: [
    "@/polymet/data/auto-refresh-engine",
    "@/polymet/data/signal-monitor",
    "@/polymet/components/auto-refresh-status",
    "@/polymet/data/retina-store",
  ],

  features: [
    "Automatic metric recomputation",
    "Timestamp tracking",
    "Audit logging",
    "Configurable thresholds",
    "Batch processing",
    "Debouncing",
    "Error handling",
    "Status monitoring",
  ],
};
