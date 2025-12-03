/**
 * # Linked Signals System (Enhanced)
 *
 * ## Overview
 * The Linked Signals system connects decisions to real-world data signals,
 * enabling automatic re-evaluation when signal values change significantly.
 * Now includes forecasting, trend analysis, anomaly detection, and a comprehensive dashboard.
 *
 * ## Architecture
 *
 * ### Core Components
 * 1. **LinkedSignalsPanel** - Enhanced UI with forecasting and trend indicators
 * 2. **Signal Monitor** - Background service for tracking signal updates (60s polling)
 * 3. **Signal Forecasting** - Time-series prediction with multiple methods
 * 4. **Revaluation Tags Dashboard** - Centralized view of all re-evaluation tags
 * 5. **Decision Schema Extension** - Added `linked_signals[]` to Decision type
 * 6. **Expanded Signal Sources** - 12 signals across 8 categories
 *
 * ## Data Schema
 *
 * ### LinkedSignal Interface
 * ```typescript
 * interface LinkedSignal {
 *   signal_id: string;           // Unique identifier for the signal
 *   variable_name: string;        // Scenario variable this affects
 *   direction: "positive" | "negative";  // Impact direction
 *   sensitivity: number;          // 0-1 scale, how strongly signal affects variable
 *   signal_label?: string;        // Human-readable label
 *   last_value?: number;          // Last known value from signal
 *   last_updated?: number;        // Timestamp of last update
 * }
 * ```
 *
 * ### Decision Schema Extension
 * ```typescript
 * interface Decision {
 *   // ... existing fields
 *   linked_signals?: LinkedSignal[];  // Array of linked signals
 * }
 * ```
 *
 * ## Features
 *
 * ### 1. Signal Linking
 * - Connect live signals to scenario variables
 * - Configure impact direction (positive/negative)
 * - Set sensitivity level (0-1 scale)
 * - Visual feedback with icons and colors
 *
 * ### 2. Signal Monitoring
 * - Periodic polling of signal values (60s interval)
 * - Change detection with 5% threshold
 * - Automatic decision tagging for re-evaluation
 * - Historical tracking of signal values
 *
 * ### 3. Re-evaluation Tags
 * - Automatic tagging when signals change
 * - Notification generation
 * - Acknowledgment workflow
 * - 7-day cleanup of old tags
 *
 * ### 4. Audit Logging
 * - Signal linked/unlinked events
 * - Sensitivity updates
 * - Re-evaluation triggers
 * - Tag acknowledgments
 *
 * ## User Workflow
 *
 * ### Linking a Signal
 * 1. Navigate to i-Decide page
 * 2. Create or open a decision
 * 3. Scroll to "Linked Signals" panel
 * 4. Click "Link Signal" button
 * 5. Select signal source (e.g., "Cost Index")
 * 6. Select scenario variable to affect
 * 7. Choose impact direction (positive/negative)
 * 8. Set sensitivity level (0-1)
 * 9. Click "Link Signal"
 *
 * ### Managing Signals
 * - **View**: See all linked signals with current values
 * - **Adjust**: Drag sensitivity slider to change impact strength
 * - **Remove**: Click trash icon to unlink signal
 * - **Monitor**: Auto re-evaluation banner shows when signals update
 *
 * ### Responding to Re-evaluation Tags
 * 1. Receive notification when signal updates
 * 2. Review signal changes and impact
 * 3. Navigate to decision
 * 4. Re-run simulation with updated parameters
 * 5. Acknowledge re-evaluation tag
 *
 * ## Technical Implementation
 *
 * ### Signal Sources (Expanded)
 * Current implementation includes 12 signals across 8 categories:
 *
 * **Economic**:
 * - Cost Index (CPI) - Daily updates
 * - Interest Rate - Weekly updates
 *
 * **Market**:
 * - Demand Score - Hourly updates
 * - Market Volatility - Real-time updates
 * - Market Share - Weekly updates
 *
 * **Financial**:
 * - FX Rate (USD/EUR) - Real-time updates
 *
 * **Operational**:
 * - Supply Chain Index - Daily updates
 * - Employee Satisfaction - Weekly updates
 *
 * **Customer**:
 * - Customer Sentiment - Daily updates
 *
 * **Competitor**:
 * - Competitor Pricing - Daily updates
 *
 * **Regulatory**:
 * - Regulatory Risk Index - Weekly updates
 *
 * **Technology**:
 * - Technology Adoption Rate - Weekly updates
 *
 * Each signal includes:
 * - Current value
 * - Historical data (30 days)
 * - Trend direction (up/down/stable)
 * - Volatility score
 * - Update frequency
 * - Category classification
 *
 * In production, these would connect to:
 * - External APIs (Bloomberg, Reuters, etc.)
 * - Internal data warehouses
 * - Real-time data streams
 * - IoT sensors
 *
 * ### Monitoring Service
 * ```typescript
 * // Start monitoring
 * const cleanup = startSignalMonitoring(
 *   () => getDecisions(),
 *   (tag) => {
 *     // Handle new re-evaluation tag
 *     showNotification(tag);
 *   }
 * );
 *
 * // Stop monitoring
 * cleanup();
 * ```
 *
 * ### Storage
 * - **Signal History**: `retina:signal-history` (localStorage)
 * - **Revaluation Tags**: `retina:revaluation-tags` (localStorage)
 * - **Signal Base Values**: `signal:{id}:base` (localStorage)
 *
 * ## Configuration
 *
 * ### Thresholds
 * ```typescript
 * const CHANGE_THRESHOLD = 0.05;  // 5% change triggers re-evaluation
 * const POLL_INTERVAL = 60000;    // 60 seconds
 * ```
 *
 * ### Sensitivity Levels
 * - **Very Low**: 0.0 - 0.2
 * - **Low**: 0.2 - 0.4
 * - **Medium**: 0.4 - 0.6
 * - **High**: 0.6 - 0.8
 * - **Very High**: 0.8 - 1.0
 *
 * ## UI Components
 *
 * ### LinkedSignalsPanel
 * **Location**: `@/polymet/components/linked-signals-panel`
 *
 * **Props**:
 * ```typescript
 * interface LinkedSignalsPanelProps {
 *   decisionId: string;
 *   linkedSignals: LinkedSignal[];
 *   scenarioVars: Array<{ key: string; label: string }>;
 *   onUpdateSignals: (signals: LinkedSignal[]) => void;
 *   onAuditEvent: (eventType: string, payload: any) => void;
 * }
 * ```
 *
 * **Features**:
 * - Add/remove signal connections
 * - Adjust sensitivity with slider
 * - View current signal values
 * - See last update timestamps
 * - Auto re-evaluation warning
 *
 * ## Integration Points
 *
 * ### i-Decide Page
 * The LinkedSignalsPanel is integrated into the i-Decide page's
 * Scenario Builder section, appearing after the Option Partners section.
 *
 * ### Signal Monitor Service
 * Can be started in the main app component:
 * ```typescript
 * useEffect(() => {
 *   const cleanup = startSignalMonitoring(
 *     () => useRetinaStore.getState().decisions,
 *     (tag) => {
 *       // Show notification
 *       toast({
 *         title: "Decision Re-evaluation Required",
 *         description: tag.decision_title,
 *       });
 *     }
 *   );
 *   return cleanup;
 * }, []);
 * ```
 *
 * ## API Endpoints (Future)
 *
 * ### GET /api/signals
 * Fetch available signals for a tenant
 * ```typescript
 * Response: {
 *   signals: Array<{
 *     id: string;
 *     label: string;
 *     current_value: number;
 *     unit: string;
 *     source: string;
 *   }>;
 * }
 * ```
 *
 * ### GET /api/signals/:id/history
 * Fetch historical values for a signal
 * ```typescript
 * Response: {
 *   signal_id: string;
 *   values: Array<{
 *     timestamp: number;
 *     value: number;
 *   }>;
 * }
 * ```
 *
 * ### POST /api/decisions/:id/signals
 * Link a signal to a decision
 * ```typescript
 * Request: {
 *   signal_id: string;
 *   variable_name: string;
 *   direction: "positive" | "negative";
 *   sensitivity: number;
 * }
 * ```
 *
 * ### DELETE /api/decisions/:id/signals/:signalId
 * Unlink a signal from a decision
 *
 * ### GET /api/revaluation-tags
 * Fetch pending re-evaluation tags for a tenant
 * ```typescript
 * Response: {
 *   tags: DecisionRevaluationTag[];
 * }
 * ```
 *
 * ### POST /api/revaluation-tags/:id/acknowledge
 * Acknowledge a re-evaluation tag
 *
 * ## Audit Events
 *
 * ### decision.signal_linked
 * ```typescript
 * {
 *   decisionId: string;
 *   signalId: string;
 *   variableName: string;
 *   direction: "positive" | "negative";
 *   sensitivity: number;
 * }
 * ```
 *
 * ### decision.signal_unlinked
 * ```typescript
 * {
 *   decisionId: string;
 *   signalId: string;
 * }
 * ```
 *
 * ### decision.signal_sensitivity_updated
 * ```typescript
 * {
 *   decisionId: string;
 *   signalId: string;
 *   sensitivity: number;
 * }
 * ```
 *
 * ### decision.revaluation_tagged
 * ```typescript
 * {
 *   decisionId: string;
 *   signalUpdates: SignalUpdate[];
 *   taggedAt: number;
 * }
 * ```
 *
 * ### decision.revaluation_acknowledged
 * ```typescript
 * {
 *   decisionId: string;
 *   acknowledgedAt: number;
 * }
 * ```
 *
 * ## Best Practices
 *
 * ### Signal Selection
 * - Link signals that directly impact scenario variables
 * - Avoid linking too many signals (3-5 recommended)
 * - Choose signals with reliable data sources
 * - Consider signal update frequency
 *
 * ### Sensitivity Configuration
 * - Start with medium sensitivity (0.5)
 * - Adjust based on observed impact
 * - Higher sensitivity = stronger variable adjustment
 * - Lower sensitivity = more stable decisions
 *
 * ### Re-evaluation Workflow
 * - Review signal changes before re-simulating
 * - Document reasons for parameter adjustments
 * - Compare results with previous simulation
 * - Acknowledge tags promptly to keep queue clean
 *
 * ## New Features (Implemented)
 *
 * ### 1. Signal Forecasting
 * **Location**: `@/polymet/data/signal-forecasting`
 *
 * **Methods**:
 * - **Moving Average**: 7-day simple moving average
 * - **Linear Regression**: Trend-based forecasting with R²
 * - **Exponential Smoothing**: α = 0.3 smoothing factor
 *
 * **Features**:
 * - Automatic method selection based on confidence
 * - 7-day forecast with confidence intervals
 * - Upper and lower bounds (95% confidence)
 * - Forecast accuracy metrics (MAE, MAPE, RMSE)
 *
 * **Usage**:
 * ```typescript
 * const forecast = getBestForecast(historicalData, 7);
 * console.log(forecast.method); // "linear_regression"
 * console.log(forecast.confidence); // 0.85
 * forecast.forecast.forEach(point => {
 *   console.log(point.predicted, point.confidence);
 * });
 * ```
 *
 * ### 2. Trend Analysis
 * **Features**:
 * - Direction detection (up/down/stable)
 * - Trend strength (0-1 scale)
 * - Linear regression slope
 * - R-squared goodness of fit
 *
 * **Usage**:
 * ```typescript
 * const trend = analyzeTrend(historicalData);
 * console.log(trend.direction); // "up"
 * console.log(trend.strength); // 0.78
 * console.log(trend.r_squared); // 0.85
 * ```
 *
 * ### 3. Anomaly Detection
 * **Features**:
 * - Z-score based detection
 * - Configurable threshold (default: 2.5σ)
 * - Anomaly score (0-1)
 * - Detailed reason messages
 *
 * **Usage**:
 * ```typescript
 * const anomaly = detectAnomaly(historicalData, currentValue);
 * if (anomaly.isAnomaly) {
 *   console.log(anomaly.reason);
 *   console.log(anomaly.score); // 0.92
 * }
 * ```
 *
 * ### 4. Re-evaluation Tags Dashboard
 * **Location**: `@/polymet/components/revaluation-tags-dashboard`
 * **Route**: `/retina/revaluation-tags`
 *
 * **Features**:
 * - View all pending and acknowledged tags
 * - Search by decision or signal name
 * - Filter by status (all/pending/acknowledged)
 * - Real-time updates every 30 seconds
 * - Navigate directly to decisions
 * - Acknowledge tags with one click
 * - View signal change details
 *
 * **Stats**:
 * - Pending tags count
 * - Total tags
 * - Acknowledged tags
 *
 * ### 5. Enhanced Linked Signals Panel
 * **New Features**:
 * - Signal category badges
 * - Real-time forecast display
 * - Trend indicators (↑↓→)
 * - Anomaly warnings
 * - Signal details (frequency, volatility)
 * - Historical data visualization
 *
 * ### 6. Monitoring Service Integration
 * **Location**: `@/polymet/prototypes/retina-app`
 *
 * The monitoring service now starts automatically when the app loads:
 * ```typescript
 * useEffect(() => {
 *   seedMockSignalValues();
 *   const cleanup = startSignalMonitoring(
 *     () => decisions,
 *     (tag) => console.log("Re-evaluation tag:", tag)
 *   );
 *   return cleanup;
 * }, [decisions]);
 * ```
 *
 * ### 7. Sidebar Integration
 * **New Menu Item**: "Re-evaluation Tags"
 * - Badge showing pending count
 * - Updates every 30 seconds
 * - Tooltip explaining purpose
 * - Located under i-Decide section
 *
 * ## Future Enhancements
 *
 * ### Planned Features
 * 1. **Correlation Analysis**: Identify signal relationships
 * 2. **Custom Signals**: User-defined signal sources
 * 3. **Signal Alerts**: Email/SMS notifications
 * 4. **Historical Playback**: Replay past signal changes
 * 5. **Signal Quality Metrics**: Track signal reliability
 * 6. **Multi-variable Impact**: One signal affects multiple variables
 * 7. **Advanced Forecasting**: ARIMA, Prophet, ML models
 * 8. **Signal Recommendations**: AI-suggested signal links
 *
 * ### Integration Opportunities
 * - **i-Scan**: Auto-link signals from scan results
 * - **i-Event**: Trigger re-evaluation from incidents
 * - **Portfolios**: Monitor signals across portfolio decisions
 * - **Guardrails**: Adjust guardrails based on signal trends
 *
 * ## Troubleshooting
 *
 * ### Signals Not Updating
 * - Check signal source availability
 * - Verify polling interval configuration
 * - Review browser console for errors
 * - Check localStorage for signal history
 *
 * ### Re-evaluation Tags Not Appearing
 * - Ensure change threshold is appropriate
 * - Verify signal values are changing
 * - Check monitoring service is running
 * - Review audit log for signal updates
 *
 * ### Performance Issues
 * - Reduce polling frequency
 * - Limit number of linked signals
 * - Implement signal caching
 * - Use WebSocket for real-time updates
 *
 * ## Example Usage
 *
 * ### Basic Signal Linking
 * ```typescript
 * // Link a cost signal to unit_cost variable
 * const signal: LinkedSignal = {
 *   signal_id: "sig-cost-index",
 *   variable_name: "unit_cost",
 *   direction: "positive",
 *   sensitivity: 0.7,
 *   signal_label: "Cost Index (CPI)",
 *   last_value: 285.2,
 *   last_updated: Date.now(),
 * };
 *
 * // Add to decision
 * const updatedSignals = [...linkedSignals, signal];
 * onUpdateSignals(updatedSignals);
 * ```
 *
 * ### Forecasting
 * ```typescript
 * import { getBestForecast, analyzeTrend, detectAnomaly } from "@/polymet/data/signal-forecasting";
 *
 * // Get best forecast
 * const forecast = getBestForecast(historicalData, 7);
 * console.log(`Method: ${forecast.method}`);
 * console.log(`Confidence: ${(forecast.confidence * 100).toFixed(1)}%`);
 *
 * // Analyze trend
 * const trend = analyzeTrend(historicalData);
 * console.log(`Trend: ${trend.direction} (strength: ${trend.strength})`);
 *
 * // Detect anomalies
 * const anomaly = detectAnomaly(historicalData, currentValue);
 * if (anomaly.isAnomaly) {
 *   console.warn(`Anomaly detected: ${anomaly.reason}`);
 * }
 * ```
 *
 * ### Monitoring Service
 * ```typescript
 * import { startSignalMonitoring } from "@/polymet/data/signal-monitor";
 *
 * // Start monitoring
 * const cleanup = startSignalMonitoring(
 *   () => decisions,
 *   (tag) => {
 *     console.log("Re-evaluation needed:", tag.decision_title);
 *     // Show notification
 *     toast({
 *       title: "Decision Re-evaluation Required",
 *       description: tag.decision_title,
 *     });
 *   }
 * );
 *
 * // Cleanup on unmount
 * return cleanup;
 * ```
 *
 * ### Dashboard Integration
 * ```typescript
 * import { RevaluationTagsDashboard } from "@/polymet/components/revaluation-tags-dashboard";
 *
 * <RevaluationTagsDashboard
 *   onNavigateToDecision={(id) => navigate(`/retina/modules/i-decide?decision=${id}`)}
 *   onAuditEvent={(type, payload) => console.log(type, payload)}
 * />
 * ```
 */

export const LINKED_SIGNALS_README = `
# Linked Signals System

Connect decisions to real-world data for automatic re-evaluation.

## Quick Start
1. Create a decision in i-Decide
2. Scroll to "Linked Signals" panel
3. Click "Link Signal"
4. Select signal and variable
5. Configure direction and sensitivity
6. Monitor for automatic re-evaluation tags

## Key Concepts
- **Signal**: Real-world data source (cost, demand, etc.)
- **Variable**: Scenario variable affected by signal
- **Direction**: Positive (↑↑) or Negative (↑↓)
- **Sensitivity**: 0-1 scale, impact strength
- **Re-evaluation Tag**: Notification when signal changes

## Documentation
See full documentation in this file for:
- Architecture details
- API endpoints
- Integration guide
- Best practices
- Troubleshooting
`;
