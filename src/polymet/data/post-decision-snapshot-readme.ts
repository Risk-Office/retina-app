/**
 * # Post-Decision Snapshot Feature
 *
 * ## Overview
 * The Post-Decision Snapshot is a learning and accountability feature that appears
 * 30 days after a decision is finalized. It compares actual outcomes against baseline
 * expectations to help organizations learn from their decisions.
 *
 * ## Key Features
 *
 * ### 1. Automatic Visibility (30-Day Threshold)
 * - Card automatically appears 30 days after decision close
 * - Provides sufficient time for real-world outcomes to materialize
 * - Ensures meaningful comparison data is available
 *
 * ### 2. Key Metrics Comparison
 * The snapshot tracks three critical metrics:
 *
 * #### Expected Value (EV)
 * - **Baseline**: Projected EV from simulation at decision close
 * - **Actual**: Real-world EV based on observed outcomes
 * - **Delta**: Percentage change (higher is better)
 * - **Format**: Currency (e.g., $1,500K)
 *
 * #### RAROC (Risk-Adjusted Return on Capital)
 * - **Baseline**: Simulated RAROC at decision close
 * - **Actual**: Observed risk-adjusted returns
 * - **Delta**: Percentage change (higher is better)
 * - **Format**: Decimal (e.g., 0.0850)
 *
 * #### VaR95 (Value at Risk at 95% confidence)
 * - **Baseline**: Projected worst-case scenario
 * - **Actual**: Observed worst-case outcomes
 * - **Delta**: Percentage change (lower is better for VaR)
 * - **Format**: Currency (e.g., -$450K)
 *
 * ### 3. Guardrail Breach Tracking
 * - **Count**: Total number of guardrail breaches since decision close
 * - **Breakdown**: Critical, caution, and info level breaches
 * - **Visual Indicator**: Green checkmark (no breaches) or orange warning (breaches detected)
 * - **Integration**: Pulls data from guardrail violations system
 *
 * ### 4. Updated Utility Score
 * - **Baseline Utility**: Original utility score at decision close
 * - **Actual Utility**: Updated utility based on real outcomes
 * - **Delta**: Percentage change with trend indicator
 * - **Pending State**: Shows baseline if actual data not yet available
 *
 * ### 5. Narrative Summary
 * The system generates an intelligent narrative that:
 * - Summarizes overall performance (outperforming/tracking/underperforming)
 * - Highlights significant metric deviations (>10%)
 * - Assesses guardrail breach impact
 * - Provides recommendations (continue monitoring, review, intervene)
 *
 * #### Auto-Narrative Logic
 * ```typescript
 * // Performance assessment
 * if (evDelta > 5 && rarocDelta > 5) → "performing better than expected"
 * if (evDelta < -5 || rarocDelta < -5) → "underperforming against baseline"
 * else → "tracking close to baseline"
 *
 * // Guardrail assessment
 * if (violations === 0) → "stable risk management"
 * if (violations <= 2) → "minor deviations"
 * if (violations > 2) → "significant deviations warrant attention"
 *
 * // Recommendations
 * if (severe underperformance || many breaches) → "recommend review and intervention"
 * if (no data yet) → "continue monitoring as data becomes available"
 * else → "continue monitoring and maintain current course"
 * ```
 *
 * ### 6. Visual Design
 * - **Header**: "What We Learned So Far" with info tooltip
 * - **Tooltip**: "Shows how the real world compared to what we expected."
 * - **Badge**: "30-Day Snapshot" indicator
 * - **Color Coding**:
 *   - Green: Positive changes (for EV, RAROC, Utility)
 *   - Red: Negative changes
 *   - Orange: Guardrail breaches
 *   - Primary blue: Narrative summary background
 * - **Border**: Subtle primary color border to distinguish from other cards
 *
 * ## Data Flow
 *
 * ### 1. Decision Close
 * ```typescript
 * Decision {
 *   id: "dec-001",
 *   status: "closed",
 *   closedAt: 1704067200000, // timestamp
 *   chosenOptionId: "opt-hybrid",
 *   metrics: {
 *     ev: 1500,
 *     raroc: 0.0850,
 *     var95: -450,
 *   }
 * }
 * ```
 *
 * ### 2. Post-Decision Metrics Creation
 * ```typescript
 * PostDecisionMetrics {
 *   decisionId: "dec-001",
 *   decisionTitle: "Cloud Migration Strategy",
 *   chosenOptionLabel: "Hybrid Cloud Approach",
 *   closedAt: 1704067200000,
 *
 *   // Baseline (from simulation)
 *   baselineEV: 1500,
 *   baselineRAROC: 0.0850,
 *   baselineVaR95: -450,
 *   baselineUtility: 1250,
 *
 *   // Actual (from real-world outcomes)
 *   actualEV: 1725,        // 15% better
 *   actualRAROC: 0.0935,   // 10% better
 *   actualVaR95: -420,     // 7% better (less negative)
 *   actualUtility: 1380,   // 10% better
 *
 *   // Optional custom narrative
 *   narrativeSummary: "Custom summary..."
 * }
 * ```
 *
 * ### 3. Guardrail Violations Integration
 * ```typescript
 * // Load violations for the decision since close
 * const violations = loadViolations(decisionId).filter(
 *   (v) => new Date(v.violatedAt).getTime() >= closedAt
 * );
 *
 * // Count by severity
 * const critical = violations.filter(v => v.alertLevel === "critical").length;
 * const caution = violations.filter(v => v.alertLevel === "caution").length;
 * const info = violations.filter(v => v.alertLevel === "info").length;
 * ```
 *
 * ## Integration Points
 *
 * ### Dashboard Integration
 * ```typescript
 * // In RetinaDashboard component
 * const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
 * const eligibleForSnapshot = closedDecisions.filter(
 *   (d) => d.closedAt && d.closedAt <= thirtyDaysAgo
 * );
 *
 * const postDecisionMetrics = eligibleForSnapshot.map((decision) => {
 *   return createMockPostDecisionMetrics(
 *     decision.id,
 *     decision.title,
 *     decision.options.find((o) => o.id === decision.chosenOptionId)?.label,
 *     decision.closedAt,
 *     "tracking" // or fetch actual scenario from backend
 *   );
 * });
 *
 * // Render snapshots
 * {postDecisionMetrics.map((metrics) => (
 *   <PostDecisionSnapshot key={metrics.decisionId} metrics={metrics} />
 * ))}
 * ```
 *
 * ### i-Decide Integration (Future)
 * - Add "View Post-Decision Snapshot" button on closed decisions
 * - Link to dedicated snapshot detail page
 * - Allow manual entry of actual outcomes
 * - Enable snapshot export (PDF, CSV)
 *
 * ## Mock Data Scenarios
 *
 * The system includes four mock scenarios for testing:
 *
 * ### 1. Outperforming
 * - EV: +15% above baseline
 * - RAROC: +10% above baseline
 * - VaR95: 7% better (less negative)
 * - Utility: +10% above baseline
 *
 * ### 2. Underperforming
 * - EV: -15% below baseline
 * - RAROC: -15% below baseline
 * - VaR95: 13% worse (more negative)
 * - Utility: -13% below baseline
 *
 * ### 3. Tracking
 * - EV: +1.3% (close to baseline)
 * - RAROC: +1.8% (close to baseline)
 * - VaR95: 1.1% worse (close to baseline)
 * - Utility: +1.6% (close to baseline)
 *
 * ### 4. Pending
 * - No actual data yet
 * - Shows "Pending" for all metrics
 * - Displays baseline values only
 * - Narrative indicates data collection in progress
 *
 * ## Real-World Implementation
 *
 * ### Backend Requirements
 * 1. **Outcome Data Collection**
 *    - API endpoint: `POST /api/decisions/:id/outcomes`
 *    - Capture actual EV, RAROC, VaR95, and utility
 *    - Timestamp each data point
 *    - Support incremental updates
 *
 * 2. **Automated Data Integration**
 *    - Connect to financial systems for EV data
 *    - Pull risk metrics from risk management systems
 *    - Calculate utility based on actual outcomes
 *    - Schedule daily/weekly data sync
 *
 * 3. **Notification System**
 *    - Email stakeholders when snapshot becomes available (30 days)
 *    - Alert on significant deviations (>20% delta)
 *    - Notify on guardrail breaches
 *    - Weekly digest of all active snapshots
 *
 * ### Frontend Enhancements
 * 1. **Manual Outcome Entry**
 *    - Form to input actual metrics
 *    - Validation against reasonable ranges
 *    - Audit trail of who entered data
 *    - Support for partial data entry
 *
 * 2. **Snapshot Detail Page**
 *    - Full history of metric evolution
 *    - Charts showing baseline vs actual over time
 *    - Detailed guardrail breach timeline
 *    - Comments and notes section
 *    - Export functionality
 *
 * 3. **Comparative Analytics**
 *    - Compare multiple snapshots
 *    - Identify patterns across decisions
 *    - Calculate organizational learning metrics
 *    - Generate insights reports
 *
 * ## Benefits
 *
 * ### 1. Organizational Learning
 * - Systematic feedback loop on decision quality
 * - Identify patterns in forecasting accuracy
 * - Improve future decision models
 * - Build institutional knowledge
 *
 * ### 2. Accountability
 * - Track decision outcomes transparently
 * - Hold decision-makers accountable
 * - Demonstrate value of decision intelligence
 * - Support performance reviews
 *
 * ### 3. Continuous Improvement
 * - Refine simulation parameters based on actuals
 * - Adjust risk models for better accuracy
 * - Update guardrail thresholds based on breaches
 * - Enhance utility function calibration
 *
 * ### 4. Stakeholder Communication
 * - Clear, concise summary for executives
 * - Evidence-based performance reporting
 * - Proactive risk management
 * - Trust building through transparency
 *
 * ## Best Practices
 *
 * ### 1. Data Quality
 * - Ensure actual outcome data is accurate and timely
 * - Validate data sources and calculations
 * - Document any adjustments or corrections
 * - Maintain audit trail of data changes
 *
 * ### 2. Interpretation
 * - Consider external factors (market changes, unforeseen events)
 * - Don't over-react to single data points
 * - Look for trends across multiple snapshots
 * - Combine quantitative metrics with qualitative insights
 *
 * ### 3. Action Planning
 * - Define clear thresholds for intervention
 * - Establish escalation procedures for significant deviations
 * - Create action plans for underperforming decisions
 * - Celebrate and learn from outperforming decisions
 *
 * ### 4. Continuous Monitoring
 * - Don't stop at 30 days - continue tracking
 * - Update snapshots at 60, 90, 180 days
 * - Create milestone-based snapshots (e.g., project phases)
 * - Archive snapshots for long-term analysis
 *
 * ## Future Enhancements
 *
 * 1. **Multi-Timepoint Snapshots**
 *    - 30-day, 60-day, 90-day, 180-day snapshots
 *    - Show evolution over time
 *    - Identify inflection points
 *
 * 2. **Predictive Analytics**
 *    - Forecast future performance based on early trends
 *    - Alert on trajectories toward underperformance
 *    - Recommend corrective actions
 *
 * 3. **Benchmarking**
 *    - Compare against similar decisions
 *    - Industry benchmarks
 *    - Historical performance baselines
 *
 * 4. **AI-Generated Insights**
 *    - Natural language generation for narratives
 *    - Root cause analysis of deviations
 *    - Recommendation engine for interventions
 *
 * 5. **Integration with Other Modules**
 *    - Link to i-Scan signals that impacted outcomes
 *    - Connect to i-Event incidents
 *    - Cross-reference with i-Audit findings
 *
 * ## API Reference
 *
 * ### Component Props
 * ```typescript
 * interface PostDecisionSnapshotProps {
 *   metrics: PostDecisionMetrics;
 *   className?: string;
 * }
 *
 * interface PostDecisionMetrics {
 *   decisionId: string;
 *   decisionTitle: string;
 *   chosenOptionLabel: string;
 *   closedAt: number;
 *
 *   // Baseline metrics
 *   baselineEV: number;
 *   baselineRAROC: number;
 *   baselineVaR95: number;
 *   baselineUtility: number;
 *
 *   // Actual metrics (optional)
 *   actualEV?: number;
 *   actualRAROC?: number;
 *   actualVaR95?: number;
 *   actualUtility?: number;
 *
 *   // Optional custom narrative
 *   narrativeSummary?: string;
 * }
 * ```
 *
 * ### Helper Functions
 * ```typescript
 * // Create mock metrics for testing
 * createMockPostDecisionMetrics(
 *   decisionId: string,
 *   decisionTitle: string,
 *   chosenOptionLabel: string,
 *   closedAt: number,
 *   scenario: "outperforming" | "underperforming" | "tracking" | "pending"
 * ): PostDecisionMetrics
 * ```
 *
 * ## Testing
 *
 * ### Unit Tests
 * - Test 30-day threshold logic
 * - Verify delta calculations
 * - Test auto-narrative generation
 * - Validate guardrail integration
 *
 * ### Integration Tests
 * - Test with real decision data
 * - Verify data flow from store
 * - Test with various scenarios
 * - Validate UI rendering
 *
 * ### E2E Tests
 * - Close a decision and wait 30 days (mock time)
 * - Verify snapshot appears on dashboard
 * - Test metric updates
 * - Verify guardrail breach tracking
 */

export const POST_DECISION_SNAPSHOT_DOCS = {
  version: "1.0.0",
  lastUpdated: "2025-01-06",
  component: "@/polymet/components/post-decision-snapshot",
  integration: "@/polymet/pages/retina-dashboard",
  dependencies: [
    "@/polymet/data/retina-store",
    "@/polymet/data/guardrail-violations",
    "@/polymet/data/tenant-context",
  ],
};
