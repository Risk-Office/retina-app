/**
 * # Guardrail Auto-Adjustment Enhancements
 *
 * ## Overview
 * This document describes the enhanced auto-adjustment system for guardrails, including
 * configurable parameters, severity-based smart adjustments, email notifications, and
 * dashboard analytics.
 *
 * ## Features
 *
 * ### 1. Configurable Per-Tenant Parameters
 *
 * Each tenant can customize auto-adjustment behavior through the configuration dialog:
 *
 * #### Breach Detection Settings
 * - **Breach Window**: Time window (in days) to check for repeated breaches (default: 90 days)
 * - **Breach Threshold Count**: Number of breaches required to trigger auto-adjustment (default: 2)
 *
 * #### Adjustment Behavior
 * - **Base Tightening Percentage**: Default percentage to tighten thresholds (default: 10%)
 * - **Severity-Based Adjustment**: Enable/disable smart adjustments based on breach severity
 *
 * #### Email Notifications
 * - **Enable Email Notifications**: Toggle email alerts for auto-adjustments
 * - **Email Recipients**: List of email addresses to notify
 *
 * ### 2. Smart Severity-Based Adjustments
 *
 * When enabled, the system varies tightening percentage based on breach severity:
 *
 * #### Severity Levels
 * - **Minor** (<5% over threshold): 5% tightening
 * - **Moderate** (5-15% over threshold): 10% tightening
 * - **Severe** (15-30% over threshold): 15% tightening
 * - **Critical** (>30% over threshold): 20% tightening
 *
 * #### How It Works
 * ```typescript
 * // Calculate breach severity
 * const breachPercent = Math.abs(
 *   (actualValue - thresholdValue) / thresholdValue
 * );
 *
 * // Determine severity level
 * if (breachPercent >= 0.3) severity = "critical";
 * else if (breachPercent >= 0.15) severity = "severe";
 * else if (breachPercent >= 0.05) severity = "moderate";
 * else severity = "minor";
 *
 * // Apply appropriate tightening
 * const tighteningPercent = SEVERITY_TIGHTENING[severity];
 * ```
 *
 * ### 3. Email Notification System
 *
 * #### Notification Triggers
 * - Auto-adjustment occurs (threshold is tightened)
 * - Email sent to all configured recipients
 * - Email marked as sent to prevent duplicates
 *
 * #### Email Template Features
 * - Professional HTML design with gradient header
 * - Severity-based color coding (red, orange, yellow, green)
 * - Detailed adjustment information table
 * - Plain language explanation
 * - Action items and recommendations
 * - CTA button to view in Retina
 *
 * #### Email Content
 * - Decision title and option
 * - Metric name
 * - Old vs new threshold
 * - Adjustment percentage
 * - Breach severity percentage
 * - Timestamp
 * - Reason for adjustment
 * - Number of triggering breaches
 *
 * #### Summary Emails
 * - Batch notifications for multiple adjustments
 * - Tabular summary of all adjustments
 * - Period-based grouping (e.g., last 30 days)
 *
 * ### 4. Dashboard Widget
 *
 * #### Widget Features
 * - **Time Range Selector**: View trends for 7, 30, or 90 days
 * - **Statistics Grid**:
 *   - Total adjustments with trend indicator (increasing/decreasing/stable)
 *   - Average breach severity with color coding
 *   - Current configuration summary
 * - **Trend Chart**: Line chart showing adjustment count over time
 * - **Top Metrics**: Bar chart of most frequently adjusted metrics
 * - **Configuration Summary**: Current settings display
 * - **Configure Button**: Opens configuration dialog
 *
 * #### Trend Analysis
 * - Compares first half vs second half of time period
 * - Determines if adjustments are increasing, decreasing, or stable
 * - Visual indicators with icons and colors
 *
 * #### Severity Color Coding
 * - Critical (≥30%): Red
 * - Severe (≥15%): Orange
 * - Moderate (≥5%): Yellow
 * - Minor (<5%): Green
 *
 * ### 5. Configuration Dialog
 *
 * #### Access
 * - Dashboard widget "Configure" button
 * - Admin settings page
 *
 * #### Settings Sections
 *
 * **Breach Detection**
 * - Breach window (1-365 days)
 * - Breach threshold count (1-10)
 *
 * **Adjustment Behavior**
 * - Base tightening percentage (1-50%)
 * - Severity-based adjustment toggle
 * - Severity tightening matrix display
 *
 * **Email Notifications**
 * - Enable/disable toggle
 * - Email recipient management
 * - Add/remove recipients
 *
 * #### Validation
 * - Numeric inputs validated
 * - Email format validation
 * - Duplicate email prevention
 *
 * ## Data Structures
 *
 * ### AutoAdjustConfig
 * ```typescript
 * interface AutoAdjustConfig {
 *   breachWindowDays: number;
 *   breachThresholdCount: number;
 *   tighteningPercent: number;
 *   severityBasedAdjustment: boolean;
 *   emailNotifications: boolean;
 *   emailRecipients: string[];
 * }
 * ```
 *
 * ### AutoAdjustmentRecord (Enhanced)
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
 *   triggeredBy: string[];
 *   adjustedAt: string;
 *   severity?: "minor" | "moderate" | "severe" | "critical";
 *   breachSeverityPercent?: number;
 *   emailSent?: boolean;
 *   emailRecipients?: string[];
 * }
 * ```
 *
 * ### AdjustmentTrend
 * ```typescript
 * interface AdjustmentTrend {
 *   date: string;
 *   count: number;
 *   avgSeverity: number;
 *   metrics: {
 *     [metricName: string]: number;
 *   };
 * }
 * ```
 *
 * ## API Functions
 *
 * ### Configuration Management
 * ```typescript
 * // Load tenant configuration
 * loadAutoAdjustConfig(tenantId: string): AutoAdjustConfig
 *
 * // Save tenant configuration
 * saveAutoAdjustConfig(tenantId: string, config: AutoAdjustConfig): void
 * ```
 *
 * ### Trend Analysis
 * ```typescript
 * // Get adjustment trends
 * getAdjustmentTrends(tenantId: string, days: number): AdjustmentTrend[]
 *
 * // Get adjustment statistics
 * getAdjustmentStats(tenantId: string, days: number): {
 *   totalAdjustments: number;
 *   avgSeverity: number;
 *   topMetrics: Array<{ metric: string; count: number }>;
 *   trends: AdjustmentTrend[];
 * }
 * ```
 *
 * ### Email Notifications
 * ```typescript
 * // Send single notification
 * sendAutoAdjustmentNotification(
 *   adjustment: AutoAdjustmentRecord,
 *   decisionId: string,
 *   decisionTitle: string,
 *   tenantName: string
 * ): Promise<boolean>
 *
 * // Send batch notifications
 * sendBatchAutoAdjustmentNotifications(
 *   adjustments: Array<{
 *     adjustment: AutoAdjustmentRecord;
 *     decisionId: string;
 *     decisionTitle: string;
 *   }>,
 *   tenantName: string
 * ): Promise<{ sent: number; failed: number }>
 *
 * // Generate summary email
 * generateAdjustmentSummaryEmail(
 *   adjustments: Array<{
 *     adjustment: AutoAdjustmentRecord;
 *     decisionTitle: string;
 *   }>,
 *   tenantName: string,
 *   periodDays: number
 * ): EmailTemplate
 * ```
 *
 * ### Email Management
 * ```typescript
 * // Mark email as sent
 * markAdjustmentEmailSent(decisionId: string, adjustmentId: string): void
 *
 * // Get pending notifications
 * getPendingEmailNotifications(tenantId: string): AutoAdjustmentRecord[]
 * ```
 *
 * ## Usage Examples
 *
 * ### 1. Configure Auto-Adjustment Settings
 * ```typescript
 * import { AutoAdjustConfigDialog } from "@/polymet/components/auto-adjust-config-dialog";
 *
 * function SettingsPage() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>
 *         Configure Auto-Adjustments
 *       </Button>
 *       <AutoAdjustConfigDialog
 *         open={open}
 *         onOpenChange={setOpen}
 *         onAuditEvent={(type, payload) => console.log(type, payload)}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * ### 2. Display Dashboard Widget
 * ```typescript
 * import { GuardrailAdjustmentWidget } from "@/polymet/components/guardrail-adjustment-widget";
 *
 * function Dashboard() {
 *   return (
 *     <GuardrailAdjustmentWidget
 *       days={30}
 *       onConfigureClick={() => setConfigDialogOpen(true)}
 *     />
 *   );
 * }
 * ```
 *
 * ### 3. Process Outcome with Smart Adjustment
 * ```typescript
 * import { processActualOutcome } from "@/polymet/data/guardrail-auto-adjust";
 *
 * const result = processActualOutcome(
 *   decisionId,
 *   optionId,
 *   optionLabel,
 *   "VaR95",
 *   85.5, // actual value
 *   "signal",
 *   tenantId,
 *   "sig-001",
 *   "Detected in daily scan",
 *   onAuditEvent
 * );
 *
 * if (result.adjustment) {
 *   console.log("Auto-adjusted:", result.adjustment);
 *   console.log("Severity:", result.adjustment.severity);
 *   console.log("Tightening:", result.adjustment.adjustmentPercent);
 * }
 * ```
 *
 * ### 4. Send Email Notifications
 * ```typescript
 * import { sendAutoAdjustmentNotification } from "@/polymet/data/auto-adjust-email";
 *
 * const success = await sendAutoAdjustmentNotification(
 *   adjustment,
 *   decisionId,
 *   "Q4 Investment Decision",
 *   "Demo Co"
 * );
 *
 * if (success) {
 *   console.log("Email sent successfully");
 * }
 * ```
 *
 * ### 5. Analyze Trends
 * ```typescript
 * import { getAdjustmentStats } from "@/polymet/data/guardrail-auto-adjust";
 *
 * const stats = getAdjustmentStats(tenantId, 30);
 *
 * console.log("Total adjustments:", stats.totalAdjustments);
 * console.log("Average severity:", stats.avgSeverity);
 * console.log("Top metrics:", stats.topMetrics);
 * console.log("Trends:", stats.trends);
 * ```
 *
 * ## Integration Points
 *
 * ### Dashboard
 * - Widget displays adjustment trends
 * - Configure button opens settings dialog
 * - Real-time statistics and charts
 *
 * ### Outcome Logger
 * - Uses tenant configuration for processing
 * - Displays severity in adjustment history
 * - Shows email status
 *
 * ### Audit Log
 * - Records configuration changes
 * - Logs auto-adjustments with severity
 * - Tracks email notifications
 *
 * ### Board Summary
 * - Includes adjustment history
 * - Shows severity-based insights
 * - Exports adjustment data
 *
 * ## Best Practices
 *
 * ### Configuration
 * 1. Start with default settings (90 days, 2 breaches, 10% tightening)
 * 2. Enable severity-based adjustment for smarter responses
 * 3. Configure email notifications for critical adjustments
 * 4. Review and adjust settings based on trends
 *
 * ### Monitoring
 * 1. Check dashboard widget regularly
 * 2. Review adjustment trends weekly
 * 3. Investigate increasing trend patterns
 * 4. Analyze top adjusted metrics
 *
 * ### Email Management
 * 1. Add relevant stakeholders to recipient list
 * 2. Use distribution lists for team notifications
 * 3. Review email templates for clarity
 * 4. Monitor email delivery status
 *
 * ### Severity Handling
 * 1. Critical breaches (>30%): Immediate review required
 * 2. Severe breaches (15-30%): Review within 24 hours
 * 3. Moderate breaches (5-15%): Review within week
 * 4. Minor breaches (<5%): Monitor trends
 *
 * ## Testing
 *
 * ### Configuration Testing
 * ```typescript
 * // Test configuration save/load
 * const config: AutoAdjustConfig = {
 *   breachWindowDays: 60,
 *   breachThresholdCount: 3,
 *   tighteningPercent: 0.15,
 *   severityBasedAdjustment: true,
 *   emailNotifications: true,
 *   emailRecipients: ["test@example.com"],
 * };
 *
 * saveAutoAdjustConfig("t-test", config);
 * const loaded = loadAutoAdjustConfig("t-test");
 * expect(loaded).toEqual(config);
 * ```
 *
 * ### Severity Calculation Testing
 * ```typescript
 * // Test severity levels
 * const testCases = [
 *   { breach: 0.03, expected: "minor" },
 *   { breach: 0.10, expected: "moderate" },
 *   { breach: 0.20, expected: "severe" },
 *   { breach: 0.35, expected: "critical" },
 * ];
 *
 * testCases.forEach(({ breach, expected }) => {
 *   const { severity } = calculateBreachSeverity(
 *     100 + breach * 100,
 *     100,
 *     "above"
 *   );
 *   expect(severity).toBe(expected);
 * });
 * ```
 *
 * ### Email Template Testing
 * ```typescript
 * // Test email generation
 * const adjustment: AutoAdjustmentRecord = {
 *   // ... adjustment data
 * };
 *
 * const { subject, body } = generateAutoAdjustmentEmail(
 *   adjustment,
 *   "Test Decision",
 *   "Test Co"
 * );
 *
 * expect(subject).toContain("Guardrail Auto-Adjusted");
 * expect(body).toContain(adjustment.metricName);
 * ```
 *
 * ## Troubleshooting
 *
 * ### Issue: Adjustments not triggering
 * - Check breach window and threshold count settings
 * - Verify guardrails are configured correctly
 * - Ensure outcomes are being logged properly
 * - Review audit log for breach events
 *
 * ### Issue: Emails not sending
 * - Verify email notifications are enabled
 * - Check recipient list is not empty
 * - Review email backend configuration
 * - Check email sent status in adjustment records
 *
 * ### Issue: Widget not showing data
 * - Ensure adjustments exist for the tenant
 * - Check time range selection
 * - Verify tenant context is correct
 * - Review localStorage for adjustment records
 *
 * ### Issue: Severity not calculated
 * - Verify severity-based adjustment is enabled
 * - Check breach severity percentage in records
 * - Review calculation logic for edge cases
 * - Ensure actual values are being captured
 *
 * ## Future Enhancements
 *
 * 1. **Machine Learning Integration**
 *    - Predict optimal tightening percentages
 *    - Anomaly detection for unusual patterns
 *    - Adaptive thresholds based on historical data
 *
 * 2. **Advanced Analytics**
 *    - Correlation analysis between metrics
 *    - Seasonal pattern detection
 *    - Predictive breach forecasting
 *
 * 3. **Enhanced Notifications**
 *    - Slack/Teams integration
 *    - SMS alerts for critical breaches
 *    - Customizable notification rules
 *
 * 4. **Workflow Automation**
 *    - Approval workflows for adjustments
 *    - Automatic rollback on false positives
 *    - Integration with incident management
 *
 * 5. **Reporting**
 *    - Executive summary reports
 *    - Compliance audit trails
 *    - Performance benchmarking
 *
 * ## Related Files
 *
 * - `@/polymet/data/guardrail-auto-adjust` - Core auto-adjustment logic
 * - `@/polymet/data/auto-adjust-email` - Email notification system
 * - `@/polymet/components/guardrail-adjustment-widget` - Dashboard widget
 * - `@/polymet/components/auto-adjust-config-dialog` - Configuration UI
 * - `@/polymet/components/outcome-logger` - Outcome logging interface
 * - `@/polymet/data/guardrail-auto-adjust-readme` - Original documentation
 *
 * ## Support
 *
 * For questions or issues:
 * - Review this documentation
 * - Check audit logs for detailed events
 * - Contact system administrator
 * - Submit feature requests via feedback form
 */

export const AUTO_ADJUST_ENHANCEMENTS_VERSION = "2.0.0";
export const AUTO_ADJUST_ENHANCEMENTS_DATE = "2025-01-06";
