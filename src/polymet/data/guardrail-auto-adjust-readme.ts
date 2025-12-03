/**
 * # Guardrail Auto-Adjustment System
 *
 * ## Overview
 * The guardrail auto-adjustment system automatically tightens guardrail thresholds
 * when actual outcomes repeatedly breach the configured limits. This creates a
 * self-learning system that adapts to real-world performance and helps prevent
 * future violations.
 *
 * ## Key Features
 *
 * ### 1. Outcome Logging
 * - Log actual outcomes from signals, incidents, or manual entry
 * - Track metric values over time
 * - Link outcomes to specific decision options
 * - Support multiple data sources (signal feed, incident reports, manual input)
 *
 * ### 2. Breach Detection
 * - Automatically detect when actual outcomes breach guardrail thresholds
 * - Record violations with full context (metric, value, threshold, timestamp)
 * - Track breach history within configurable time windows
 *
 * ### 3. Auto-Adjustment Logic
 * - **Trigger Condition**: 2 breaches within 90 days
 * - **Adjustment**: Tighten threshold by 10%
 * - **Direction-Aware**:
 *   - "above" thresholds: reduce by 10% (make stricter)
 *   - "below" thresholds: increase by 10% (make stricter)
 * - **Audit Trail**: Complete history of all adjustments
 *
 * ### 4. Audit Logging
 * - Every outcome logged: `guardrail.outcome_breach`
 * - Every auto-adjustment: `guardrail.auto_adjusted`
 * - Comprehensive payload with all relevant data
 * - Run fingerprints and parameter hashes for traceability
 *
 * ## Configuration
 *
 * ```typescript
 * const config = {
 *   breachWindowDays: 90,        // Time window for counting breaches
 *   breachThresholdCount: 2,     // Number of breaches to trigger adjustment
 *   tighteningPercent: 0.1,      // 10% tightening
 *   plainLanguageTooltip: "Learns from repeated problems and makes our limits stricter."
 * };
 * ```
 *
 * ## Usage Examples
 *
 * ### Logging an Outcome
 *
 * ```typescript
 * import { processActualOutcome } from "@/polymet/data/guardrail-auto-adjust";
 *
 * const result = processActualOutcome(
 *   decisionId,
 *   optionId,
 *   optionLabel,
 *   "VaR95",           // metric name
 *   85.5,              // actual value
 *   "signal",          // source: signal | incident | manual
 *   "sig-001",         // source ID (optional)
 *   "Detected in weekly scan", // notes (optional)
 *   onAuditEvent       // audit callback
 * );
 *
 * // Result contains:
 * // - outcome: ActualOutcome
 * // - violation?: GuardrailViolation (if breached)
 * // - adjustment?: AutoAdjustmentRecord (if auto-adjusted)
 * ```
 *
 * ### Using the Outcome Logger Component
 *
 * ```typescript
 * import { OutcomeLogger } from "@/polymet/components/outcome-logger";
 *
 * <OutcomeLogger
 *   decisionId={decisionId}
 *   optionId={optionId}
 *   optionLabel={optionLabel}
 *   onAuditEvent={onAuditEvent}
 *   onToast={onToast}
 * />
 * ```
 *
 * ### Viewing Adjustment History
 *
 * ```typescript
 * import {
 *   loadAdjustmentRecords,
 *   getGuardrailAdjustmentHistory
 * } from "@/polymet/data/guardrail-auto-adjust";
 *
 * // All adjustments for a decision
 * const allAdjustments = loadAdjustmentRecords(decisionId);
 *
 * // Adjustments for a specific guardrail
 * const guardrailHistory = getGuardrailAdjustmentHistory(
 *   decisionId,
 *   guardrailId
 * );
 * ```
 *
 * ## Data Structures
 *
 * ### ActualOutcome
 * ```typescript
 * interface ActualOutcome {
 *   id: string;
 *   decisionId: string;
 *   optionId: string;
 *   optionLabel: string;
 *   metricName: string;
 *   actualValue: number;
 *   recordedAt: string;
 *   source: "signal" | "incident" | "manual";
 *   sourceId?: string;
 *   notes?: string;
 * }
 * ```
 *
 * ### AutoAdjustmentRecord
 * ```typescript
 * interface AutoAdjustmentRecord {
 *   id: string;
 *   guardrailId: string;
 *   decisionId: string;
 *   optionId: string;
 *   metricName: string;
 *   oldThreshold: number;
 *   newThreshold: number;
 *   adjustmentPercent: number;
 *   reason: string;
 *   triggeredBy: string[];  // violation IDs
 *   adjustedAt: string;
 * }
 * ```
 *
 * ## Integration Points
 *
 * ### 1. Option Summary Cards
 * - Added "Log Outcome" button next to "Guardrails" button
 * - Opens outcome logger sheet for quick data entry
 * - Displays auto-adjustment notifications
 *
 * ### 2. Board Summary Generator
 * - Shows auto-adjustment history in guardrails section
 * - Includes adjustment count in narrative
 * - Exports adjustment data in CSV/PDF
 *
 * ### 3. Guardrails Summary Section
 * - Displays recent auto-adjustments (last 3)
 * - Shows adjustment details (old → new threshold)
 * - Plain language explanation for non-technical users
 *
 * ### 4. Audit Log
 * - Two new event types:
 *   - `guardrail.outcome_breach`: When outcome breaches threshold
 *   - `guardrail.auto_adjusted`: When threshold is auto-adjusted
 * - Full payload with all relevant data
 * - Filterable by event type in audit page
 *
 * ## Workflow
 *
 * 1. **Outcome Logged**
 *    - User logs actual outcome via OutcomeLogger component
 *    - System stores outcome with timestamp and source
 *
 * 2. **Breach Detection**
 *    - System checks if outcome breaches any guardrail
 *    - If breached, creates violation record
 *    - Logs audit event: `guardrail.outcome_breach`
 *
 * 3. **Breach History Check**
 *    - System counts breaches within 90-day window
 *    - Includes current breach in count
 *
 * 4. **Auto-Adjustment Trigger**
 *    - If breach count >= 2, trigger auto-adjustment
 *    - Calculate new threshold (10% tighter)
 *    - Update guardrail with new threshold
 *
 * 5. **Adjustment Recording**
 *    - Create adjustment record with full details
 *    - Log audit event: `guardrail.auto_adjusted`
 *    - Show notification to user
 *
 * 6. **Ongoing Monitoring**
 *    - Continue monitoring with new threshold
 *    - Process repeats if new breaches occur
 *    - System progressively tightens thresholds
 *
 * ## Plain Language Explanations
 *
 * ### For Users
 * "Learns from repeated problems and makes our limits stricter."
 *
 * ### For Board Members
 * "The system automatically adjusts risk limits when we see repeated issues,
 * helping us stay ahead of problems before they become serious."
 *
 * ### For Technical Teams
 * "Auto-adjustment system monitors actual outcomes against guardrail thresholds.
 * When 2+ breaches occur within 90 days, thresholds are automatically tightened
 * by 10% to prevent future violations."
 *
 * ## Benefits
 *
 * 1. **Proactive Risk Management**
 *    - Automatically adapts to changing risk profiles
 *    - Prevents repeated violations
 *    - Reduces manual threshold management
 *
 * 2. **Learning System**
 *    - Learns from actual outcomes
 *    - Improves over time
 *    - Adapts to real-world performance
 *
 * 3. **Audit Trail**
 *    - Complete history of all adjustments
 *    - Transparent decision-making
 *    - Regulatory compliance
 *
 * 4. **User-Friendly**
 *    - Simple outcome logging interface
 *    - Clear notifications
 *    - Plain language explanations
 *
 * ## Future Enhancements
 *
 * 1. **Configurable Parameters**
 *    - Allow per-tenant configuration
 *    - Adjust window days, breach count, tightening percent
 *
 * 2. **Smart Adjustments**
 *    - Variable tightening based on severity
 *    - Consider breach magnitude, not just count
 *    - Machine learning for optimal thresholds
 *
 * 3. **Notifications**
 *    - Email alerts for auto-adjustments
 *    - Slack/Teams integration
 *    - Dashboard widgets
 *
 * 4. **Analytics**
 *    - Adjustment effectiveness metrics
 *    - Breach reduction tracking
 *    - Threshold optimization recommendations
 *
 * ## Testing
 *
 * ### Manual Testing
 * 1. Create a guardrail with threshold 100
 * 2. Log outcome with value 85 (breach)
 * 3. Wait or adjust timestamp
 * 4. Log second outcome with value 80 (breach)
 * 5. Verify threshold auto-adjusted to 110 (10% tighter)
 *
 * ### Automated Testing
 * ```typescript
 * import { processActualOutcome } from "@/polymet/data/guardrail-auto-adjust";
 * import { addGuardrail } from "@/polymet/data/decision-guardrails";
 *
 * // Setup
 * const guardrail = addGuardrail(decisionId, optionId, {
 *   metricName: "VaR95",
 *   thresholdValue: 100,
 *   direction: "below",
 *   alertLevel: "critical"
 * });
 *
 * // First breach
 * const result1 = processActualOutcome(
 *   decisionId, optionId, "Option A", "VaR95", 85, "manual"
 * );
 * expect(result1.violation).toBeDefined();
 * expect(result1.adjustment).toBeUndefined();
 *
 * // Second breach (triggers adjustment)
 * const result2 = processActualOutcome(
 *   decisionId, optionId, "Option A", "VaR95", 80, "manual"
 * );
 * expect(result2.violation).toBeDefined();
 * expect(result2.adjustment).toBeDefined();
 * expect(result2.adjustment.newThreshold).toBe(110); // 10% tighter
 * ```
 *
 * ## Storage
 *
 * All data is stored in localStorage with the following keys:
 * - `retina:outcomes:{decisionId}` - Actual outcomes
 * - `retina:guardrail-adjustments:{decisionId}` - Adjustment records
 * - `retina:guardrail-violations:{decisionId}` - Violation records (existing)
 * - `retina:guardrails:{decisionId}` - Guardrail configurations (existing)
 *
 * ## API Integration (Future)
 *
 * When backend is available, replace localStorage with API calls:
 *
 * ```typescript
 * // POST /api/outcomes
 * // POST /api/guardrails/{id}/adjust
 * // GET /api/guardrails/{id}/adjustments
 * // GET /api/outcomes?decisionId={id}
 * ```
 */

export const GUARDRAIL_AUTO_ADJUST_README =
  "See file comments for documentation";
