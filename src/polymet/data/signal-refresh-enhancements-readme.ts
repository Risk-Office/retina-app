/**
 * # Signal Refresh Banner Enhancements - Complete Documentation
 *
 * ## Overview
 * Enhanced signal refresh banner with filtering, affected decisions, export functionality,
 * critical notifications, and historical trends.
 *
 * ## Features Implemented
 *
 * ### 1. Filtering System
 *
 * #### Signal Type Filter
 * - **Types**: Financial, Market, Risk, Operational, Customer, Competitive, Other
 * - **Auto-detection**: Signal types are automatically detected from signal IDs
 * - **Dynamic options**: Filter dropdown shows only types present in current data
 *
 * #### Severity Filter
 * - **Levels**: Critical (>20%), High (>10%), Medium (>5%), Low (≤5%)
 * - **Auto-calculation**: Severity is computed from change percentage
 * - **Visual indicators**: Color-coded badges for each severity level
 *
 * #### Filter UI
 * - Dropdown selects for type and severity
 * - "All" option to clear filters
 * - Real-time filtering without page reload
 * - Results count display: "Showing X of Y signal updates"
 *
 * ---
 *
 * ### 2. Affected Decisions Display
 *
 * #### Decision Linking
 * - **Auto-detection**: Finds decisions with linked signals matching the signal ID
 * - **Status display**: Shows decision status (active, analyzing, closed)
 * - **Direct navigation**: Click decision name to navigate to i-Decide page
 *
 * #### Decision Card
 * ```
 * Affected Decisions:
 * → [Decision Title] [Status Badge]
 * → [Another Decision] [Status Badge]
 * ```
 *
 * #### Implementation
 * - Searches localStorage for decisions with matching linked_signals
 * - Displays decision title, status, and link
 * - Uses react-router Link component for navigation
 * - External link icon for visual clarity
 *
 * ---
 *
 * ### 3. Export Functionality
 *
 * #### CSV Export
 * **Format:**
 * ```csv
 * Signal ID,Signal Label,Type,Old Value,New Value,Change %,Severity,Affected Decisions,Timestamp
 * sig-cost-index,Cost Index (CPI),Financial,285.20,302.80,6.20%,medium,2,2025-01-15T10:30:00.000Z
 * ```
 *
 * **Features:**
 * - Includes all visible (filtered) signals
 * - Proper CSV formatting with headers
 * - ISO timestamp format
 * - Automatic download with tenant ID in filename
 *
 * #### PDF Export
 * **Format:**
 * ```
 * Signal Changes Report
 * Tenant: t-demo
 * Generated: 1/15/2025, 10:30:00 AM
 *
 * Signal Updates (Last 24 Hours):
 *
 * Cost Index (CPI) (sig-cost-index)
 *   Type: Financial
 *   Change: 285.20 → 302.80 (6.20%)
 *   Severity: medium
 *   Affected Decisions: 2
 *   Updated: 1/15/2025, 10:30:00 AM
 * ```
 *
 * **Features:**
 * - Plain text format for easy viewing
 * - Includes all signal details
 * - Automatic download with tenant ID in filename
 *
 * #### Export UI
 * - Dropdown menu with "Export as CSV" and "Export as PDF" options
 * - Download icon for visual clarity
 * - Exports only filtered results
 *
 * ---
 *
 * ### 4. Critical Signal Notifications
 *
 * #### Notification Triggers
 * - **Threshold**: Change > 20% (absolute value)
 * - **Auto-creation**: Notifications created automatically when critical signals detected
 * - **Frequency**: Checked every minute during banner refresh cycle
 *
 * #### Notification Structure
 * ```typescript
 * {
 *   id: "signal-critical-sig-cost-index-1234567890",
 *   type: "signal_critical",
 *   title: "Critical Signal Change Detected",
 *   message: "Cost Index (CPI) changed by 35.0%. Review affected decisions immediately.",
 *   severity: "critical",
 *   signal_id: "sig-cost-index",
 *   signal_label: "Cost Index (CPI)",
 *   change_percent: 0.35,
 *   affected_decisions: 2,
 *   timestamp: 1234567890,
 *   read: false
 * }
 * ```
 *
 * #### Notification Display
 * - **Bell icon**: In header with unread count badge
 * - **Badge color**: Red for critical notifications
 * - **Popover**: Click bell to view all notifications
 * - **Scroll area**: Scrollable list for many notifications
 *
 * #### Notification Actions
 * - **Mark as read**: Click notification to mark as read
 * - **Dismiss**: X button to remove notification
 * - **Clear all**: Button to clear all notifications
 * - **View details**: Link to re-evaluation tags dashboard
 *
 * #### Visual Indicators
 * - **Unread**: Blue background highlight
 * - **Severity dot**: Red (critical), Amber (warning), Blue (info)
 * - **Badges**: Signal label, change %, affected decisions count
 *
 * ---
 *
 * ### 5. Historical Trends
 *
 * #### Trend Chart
 * - **Library**: Recharts with ChartContainer wrapper
 * - **Type**: Line chart with monotone interpolation
 * - **Data**: Last 7 days of signal values
 * - **Axes**: Date labels on X-axis, values on Y-axis
 *
 * #### Chart Features
 * - **Responsive**: Adapts to container width
 * - **Tooltip**: Hover to see exact values
 * - **Grid**: Dashed grid lines for readability
 * - **Dots**: Data points marked with dots
 * - **Color**: Uses theme chart-1 color
 *
 * #### Navigation
 * - **Tabs**: "Signal List" and "Historical Trends" tabs
 * - **Selection**: Click "View Historical Trend" button on any signal
 * - **Back button**: Return to signal list
 * - **Empty state**: Message when no historical data available
 *
 * #### Data Storage
 * - **Key**: `retina:signal-updates:{tenantId}`
 * - **Format**: Array of SignalUpdate objects
 * - **Filtering**: By signal_id and date range
 * - **Sorting**: Chronological order
 *
 * ---
 *
 * ## Technical Implementation
 *
 * ### Component Structure
 *
 * #### SignalRefreshBanner
 * - Main banner component with modal
 * - Manages state for filters, selected signal, modal open
 * - Integrates with retina-store for decisions data
 *
 * #### SignalNotifications
 * - Separate notification component
 * - Popover with scrollable list
 * - Auto-refresh every 30 seconds
 * - Integrated into RetinaHeader
 *
 * ### Data Flow
 *
 * ```
 * 1. Signal Monitor → Detects signal changes
 * 2. recordSignalUpdate() → Stores in localStorage
 * 3. createCriticalNotification() → Creates notification if critical
 * 4. SignalRefreshBanner → Displays banner with count
 * 5. SignalNotifications → Shows notification in header
 * 6. User clicks → Opens modal/popover
 * 7. Filters applied → Updates display
 * 8. Export clicked → Downloads file
 * 9. Trend viewed → Shows chart
 * ```
 *
 * ### Storage Keys
 *
 * ```typescript
 * // Signal updates (for banner and trends)
 * `retina:signal-updates:{tenantId}` → SignalUpdate[]
 *
 * // Notifications (for bell icon)
 * `retina:notifications:{tenantId}` → SignalNotification[]
 *
 * // Decisions (for affected decisions)
 * `retina:decisions:{tenantId}` → Decision[]
 * ```
 *
 * ---
 *
 * ## User Workflows
 *
 * ### Workflow 1: Viewing Signal Changes
 * 1. User sees banner: "4 active signals refreshed in last 24h"
 * 2. User clicks banner → Modal opens
 * 3. User sees list of signals sorted by impact
 * 4. User applies filters (e.g., "Financial" type, "High" severity)
 * 5. User sees filtered results: "Showing 2 of 4 signal updates"
 * 6. User clicks signal → Expands to show affected decisions
 * 7. User clicks decision link → Navigates to i-Decide page
 *
 * ### Workflow 2: Exporting Signal Data
 * 1. User opens signal changes modal
 * 2. User applies filters (optional)
 * 3. User clicks "Export" dropdown
 * 4. User selects "Export as CSV" or "Export as PDF"
 * 5. File downloads automatically
 * 6. User opens file in Excel/text editor
 *
 * ### Workflow 3: Responding to Critical Notifications
 * 1. System detects critical signal change (>20%)
 * 2. Notification created automatically
 * 3. Bell icon shows red badge with count
 * 4. User clicks bell → Popover opens
 * 5. User sees critical notification with red dot
 * 6. User clicks notification → Marked as read
 * 7. User clicks "View Details" → Navigates to re-evaluation tags
 * 8. User reviews affected decisions and takes action
 *
 * ### Workflow 4: Analyzing Historical Trends
 * 1. User opens signal changes modal
 * 2. User clicks "View Historical Trend" on a signal
 * 3. Modal switches to "Historical Trends" tab
 * 4. User sees line chart of last 7 days
 * 5. User hovers over chart → Tooltip shows exact values
 * 6. User identifies trend (increasing, decreasing, volatile)
 * 7. User clicks "Back to List" → Returns to signal list
 *
 * ---
 *
 * ## Integration Points
 *
 * ### RetinaHeader
 * - Integrated SignalNotifications component
 * - Replaced static bell icon with dynamic notification system
 * - Passes tenantId from tenant context
 *
 * ### Signal Monitor
 * - Enhanced with recordSignalUpdate() function
 * - Stores updates in localStorage for banner tracking
 * - Maintains history for trend analysis
 *
 * ### Retina Store
 * - Used to fetch decisions for affected decisions display
 * - Filters decisions by linked_signals matching signal_id
 *
 * ---
 *
 * ## Configuration
 *
 * ### Thresholds
 * ```typescript
 * // Severity levels
 * Critical: > 20%
 * High: > 10%
 * Medium: > 5%
 * Low: ≤ 5%
 *
 * // Time ranges
 * Banner: Last 24 hours
 * Trends: Last 7 days
 *
 * // Refresh intervals
 * Banner: 60 seconds
 * Notifications: 30 seconds
 * ```
 *
 * ### Signal Types
 * ```typescript
 * Financial: Contains "cost"
 * Market: Contains "demand"
 * Risk: Contains "volatility"
 * Operational: Contains "supply"
 * Customer: Contains "sentiment"
 * Competitive: Contains "competitor"
 * Other: Default fallback
 * ```
 *
 * ---
 *
 * ## Testing
 *
 * ### Manual Testing
 * 1. **Filtering**: Apply different type/severity filters, verify results
 * 2. **Export**: Download CSV/PDF, verify content and formatting
 * 3. **Notifications**: Trigger critical signal, verify notification appears
 * 4. **Trends**: View historical chart, verify data accuracy
 * 5. **Affected Decisions**: Click decision links, verify navigation
 *
 * ### Mock Data
 * - seedMockSignalUpdates() creates 4 sample signals
 * - Covers different types, severities, and time ranges
 * - Includes one critical signal (35% change) for notification testing
 *
 * ---
 *
 * ## Future Enhancements
 *
 * ### Potential Additions
 * 1. **Email notifications**: Send email for critical signals
 * 2. **Slack integration**: Post to Slack channel
 * 3. **Custom thresholds**: Per-signal severity thresholds
 * 4. **Forecast integration**: Show predicted future values
 * 5. **Anomaly detection**: Highlight unusual patterns
 * 6. **Correlation analysis**: Show related signal changes
 * 7. **Export to Excel**: Rich formatting with charts
 * 8. **Scheduled reports**: Daily/weekly signal summaries
 *
 * ---
 *
 * ## Summary
 *
 * The enhanced signal refresh banner provides a comprehensive system for monitoring,
 * analyzing, and responding to signal changes. Key improvements include:
 *
 * ✅ **Filtering**: Type and severity filters for focused analysis
 * ✅ **Affected Decisions**: Direct links to impacted decisions
 * ✅ **Export**: CSV and PDF export for reporting
 * ✅ **Critical Notifications**: Automatic alerts for major changes
 * ✅ **Historical Trends**: 7-day charts for pattern analysis
 *
 * These features enable users to:
 * - Quickly identify important signal changes
 * - Understand impact on their decisions
 * - Export data for external analysis
 * - Respond promptly to critical changes
 * - Analyze trends over time
 */

export const SIGNAL_REFRESH_ENHANCEMENTS_README = `
Signal Refresh Banner Enhancements

This file documents the enhanced signal refresh banner system with filtering,
affected decisions, export functionality, critical notifications, and historical trends.

See inline documentation above for complete details.
`;
