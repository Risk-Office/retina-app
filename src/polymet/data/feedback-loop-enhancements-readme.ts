/**
 * # Feedback Loop Modal - Enhanced Features
 *
 * ## Overview
 *
 * The enhanced Feedback Loop modal provides a comprehensive visualization of the
 * Decision → Outcome → Adjustment cycle with advanced features including:
 * - Detailed timeline view with full event history
 * - Interactive play/pause and manual stepping controls
 * - Metrics visualization with charts (Expected vs Actual)
 * - Export functionality for reports and board summaries
 * - Multi-decision comparison capabilities (foundation)
 *
 * ## New Features
 *
 * ### 1. Three View Modes (Tabbed Interface)
 *
 * #### **Cycle View** (Default)
 * - Animated visual cycle with three nodes
 * - Plain-language labels: "What we did", "What happened", "What changed"
 * - Interactive play/pause controls
 * - Manual stepping through cycle phases
 * - Content cards showing details for each node
 * - "Continuous Learning" badge emphasizing the feedback loop
 *
 * #### **Timeline View**
 * - Chronological list of all events
 * - Click any event to see full details
 * - Visual connectors between events
 * - Color-coded by event type:
 *   - Decision: Blue (CheckCircleIcon)
 *   - Outcome: Green (TrendingUpIcon)
 *   - Adjustment: Purple (RefreshCwIcon)
 *   - Review: Orange (FileTextIcon)
 * - Metrics display for each event (expected, actual, variance)
 * - Expandable detail panel for selected events
 * - Hover effects and selection highlighting
 *
 * #### **Metrics View**
 * - **Line Chart**: Expected vs Actual performance over time
 * - **Bar Chart**: Performance variance visualization
 * - **Summary Statistics**: Average expected, actual, variance, and adjustment count
 * - Interactive charts with tooltips and legends
 * - Responsive design adapts to container size
 * - Export-ready visualizations
 *
 * ### 2. Interactive Controls
 *
 * #### Play/Pause Button
 * - Pause animation to examine specific phases
 * - Resume animation with smooth transitions
 * - Auto-play on modal open
 * - Icon changes: PlayIcon ↔ PauseIcon
 *
 * #### Step Forward/Backward
 * - Manual control over cycle progression
 * - Step forward: Advance to next phase
 * - Step backward: Return to previous phase
 * - Works independently of play/pause state
 * - Icons: SkipForwardIcon, SkipBackIcon
 *
 * ### 3. Export Functionality
 *
 * #### Export Button
 * - Located in dialog header (top-right)
 * - Downloads complete feedback loop data as JSON
 * - Filename format: `feedback-loop-{decisionId}-{timestamp}.json`
 * - Icon: DownloadIcon
 *
 * #### Export Data Structure
 * ```json
 * {
 *   "decisionId": "dec-001",
 *   "decisionTitle": "Expand to New Market",
 *   "chosenOption": "Option A: Gradual Expansion",
 *   "decisionDate": "2024-01-15T00:00:00.000Z",
 *   "timeline": [
 *     {
 *       "id": "1",
 *       "type": "decision",
 *       "date": 1705276800000,
 *       "title": "Decision Finalized",
 *       "description": "Chose Option A: Gradual Expansion",
 *       "metrics": {
 *         "expectedValue": 100
 *       }
 *     },
 *     {
 *       "id": "2",
 *       "type": "outcome",
 *       "date": 1706486400000,
 *       "title": "Outcome Logged",
 *       "description": "Revenue 15% above projection",
 *       "metrics": {
 *         "expectedValue": 100,
 *         "actualValue": 115,
 *         "variance": 15
 *       }
 *     },
 *     {
 *       "id": "3",
 *       "type": "adjustment",
 *       "date": 1706918400000,
 *       "title": "Guardrails Adjusted",
 *       "description": "Tightened VaR95 threshold by 5%",
 *       "metrics": {
 *         "expectedValue": 100,
 *         "actualValue": 115,
 *         "variance": 15
 *       }
 *     }
 *   ],
 *   "metrics": [
 *     { "month": "Month 1", "expected": 100, "actual": 98, "variance": -2 },
 *     { "month": "Month 2", "expected": 105, "actual": 110, "variance": 5 },
 *     { "month": "Month 3", "expected": 110, "actual": 115, "variance": 5 },
 *     { "month": "Month 4", "expected": 115, "actual": 112, "variance": -3 },
 *     { "month": "Month 5", "expected": 120, "actual": 125, "variance": 5 },
 *     { "month": "Month 6", "expected": 125, "actual": 130, "variance": 5 }
 *   ],
 *   "summary": {
 *     "totalEvents": 3,
 *     "outcomeLogged": true,
 *     "adjustmentsMade": 3,
 *     "averageVariance": 3.33
 *   }
 * }
 * ```
 *
 * ### 4. Timeline Event Details
 *
 * #### Event Card Structure
 * - Icon with color-coded background
 * - Event title and date
 * - Event description
 * - Metrics (if available): Expected, Actual, Variance
 * - Click to expand full details
 *
 * #### Detail Panel
 * - Event type badge
 * - Full timestamp
 * - Complete description
 * - Metrics breakdown in grid layout
 * - Color-coded variance (green for positive, red for negative)
 *
 * ### 5. Metrics Visualization
 *
 * #### Line Chart: Expected vs Actual
 * - X-axis: Time periods (months)
 * - Y-axis: Performance values
 * - Two lines:
 *   - Expected (chart-1 color)
 *   - Actual (chart-2 color)
 * - Interactive tooltips on hover
 * - Legend for data series
 * - Responsive container
 *
 * #### Bar Chart: Variance
 * - X-axis: Time periods (months)
 * - Y-axis: Variance percentage
 * - Single bar series (chart-3 color)
 * - Shows positive and negative variance
 * - Interactive tooltips
 *
 * #### Summary Statistics
 * - Average Expected: Mean of all expected values
 * - Average Actual: Mean of all actual values
 * - Average Variance: Mean variance percentage
 * - Total Adjustments: Count of adjustments made
 * - Color-coded variance (green/red)
 *
 * ## Enhanced Props
 *
 * ```typescript
 * interface TimelineEvent {
 *   id: string;
 *   type: "decision" | "outcome" | "adjustment" | "review";
 *   date: number;
 *   title: string;
 *   description: string;
 *   metrics?: {
 *     expectedValue?: number;
 *     actualValue?: number;
 *     variance?: number;
 *   };
 * }
 *
 * interface MetricsData {
 *   month: string;
 *   expected: number;
 *   actual: number;
 *   variance: number;
 * }
 *
 * interface FeedbackLoopModalProps {
 *   // Basic props
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   decisionTitle: string;
 *   decisionDate: number;
 *   chosenOption: string;
 *   outcomeData?: {
 *     logged: boolean;
 *     date?: number;
 *     summary?: string;
 *   };
 *   adjustmentData?: {
 *     count: number;
 *     lastAdjustment?: string;
 *     date?: number;
 *   };
 *
 *   // Enhanced props
 *   timelineEvents?: TimelineEvent[];
 *   metricsHistory?: MetricsData[];
 *   decisionId?: string;
 * }
 * ```
 *
 * ## Usage Examples
 *
 * ### Basic Usage (Auto-Generated Data)
 *
 * ```typescript
 * import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <FeedbackLoopModal
 *       open={open}
 *       onOpenChange={setOpen}
 *       decisionTitle="Expand to New Market"
 *       decisionDate={Date.now() - 45 * 24 * 60 * 60 * 1000}
 *       chosenOption="Option A: Gradual Expansion"
 *       outcomeData={{
 *         logged: true,
 *         date: Date.now() - 15 * 24 * 60 * 60 * 1000,
 *         summary: "Revenue 15% above projection",
 *       }}
 *       adjustmentData={{
 *         count: 3,
 *         lastAdjustment: "Tightened VaR95 threshold by 5%",
 *         date: Date.now() - 10 * 24 * 60 * 60 * 1000,
 *       }}
 *       decisionId="dec-001"
 *     />
 *   );
 * }
 * ```
 *
 * ### Advanced Usage (Custom Timeline & Metrics)
 *
 * ```typescript
 * import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   // Custom timeline events
 *   const timelineEvents = [
 *     {
 *       id: "1",
 *       type: "decision" as const,
 *       date: Date.now() - 60 * 24 * 60 * 60 * 1000,
 *       title: "Decision Finalized",
 *       description: "Chose Option A: Gradual Expansion",
 *       metrics: { expectedValue: 100 },
 *     },
 *     {
 *       id: "2",
 *       type: "outcome" as const,
 *       date: Date.now() - 45 * 24 * 60 * 60 * 1000,
 *       title: "Outcome Logged",
 *       description: "Revenue 15% above projection",
 *       metrics: {
 *         expectedValue: 100,
 *         actualValue: 115,
 *         variance: 15,
 *       },
 *     },
 *     {
 *       id: "3",
 *       type: "adjustment" as const,
 *       date: Date.now() - 40 * 24 * 60 * 60 * 1000,
 *       title: "Guardrails Adjusted",
 *       description: "Tightened VaR95 threshold by 5%",
 *       metrics: {
 *         expectedValue: 100,
 *         actualValue: 115,
 *         variance: 15,
 *       },
 *     },
 *     {
 *       id: "4",
 *       type: "review" as const,
 *       date: Date.now() - 30 * 24 * 60 * 60 * 1000,
 *       title: "Quarterly Review",
 *       description: "Performance review conducted",
 *       metrics: {
 *         expectedValue: 110,
 *         actualValue: 118,
 *         variance: 7.3,
 *       },
 *     },
 *   ];
 *
 *   // Custom metrics history
 *   const metricsHistory = [
 *     { month: "Jan", expected: 100, actual: 98, variance: -2 },
 *     { month: "Feb", expected: 105, actual: 110, variance: 5 },
 *     { month: "Mar", expected: 110, actual: 115, variance: 5 },
 *     { month: "Apr", expected: 115, actual: 112, variance: -3 },
 *     { month: "May", expected: 120, actual: 125, variance: 5 },
 *     { month: "Jun", expected: 125, actual: 130, variance: 5 },
 *   ];
 *
 *   return (
 *     <FeedbackLoopModal
 *       open={open}
 *       onOpenChange={setOpen}
 *       decisionTitle="Expand to New Market"
 *       decisionDate={Date.now() - 60 * 24 * 60 * 60 * 1000}
 *       chosenOption="Option A: Gradual Expansion"
 *       outcomeData={{
 *         logged: true,
 *         date: Date.now() - 45 * 24 * 60 * 60 * 1000,
 *         summary: "Revenue 15% above projection",
 *       }}
 *       adjustmentData={{
 *         count: 3,
 *         lastAdjustment: "Tightened VaR95 threshold by 5%",
 *         date: Date.now() - 40 * 24 * 60 * 60 * 1000,
 *       }}
 *       timelineEvents={timelineEvents}
 *       metricsHistory={metricsHistory}
 *       decisionId="dec-001"
 *     />
 *   );
 * }
 * ```
 *
 * ### Integration with Backend
 *
 * ```typescript
 * import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
 *
 * function MyComponent({ decisionId }: { decisionId: string }) {
 *   const [open, setOpen] = useState(false);
 *   const [data, setData] = useState(null);
 *
 *   useEffect(() => {
 *     if (open && decisionId) {
 *       // Fetch real data from backend
 *       Promise.all([
 *         fetch(`/api/decisions/${decisionId}`),
 *         fetch(`/api/decisions/${decisionId}/timeline`),
 *         fetch(`/api/decisions/${decisionId}/metrics`),
 *       ])
 *         .then(([decision, timeline, metrics]) =>
 *           Promise.all([decision.json(), timeline.json(), metrics.json()])
 *         )
 *         .then(([decisionData, timelineData, metricsData]) => {
 *           setData({
 *             decision: decisionData,
 *             timeline: timelineData,
 *             metrics: metricsData,
 *           });
 *         });
 *     }
 *   }, [open, decisionId]);
 *
 *   if (!data) return null;
 *
 *   return (
 *     <FeedbackLoopModal
 *       open={open}
 *       onOpenChange={setOpen}
 *       decisionTitle={data.decision.title}
 *       decisionDate={data.decision.closedAt}
 *       chosenOption={data.decision.chosenOption}
 *       outcomeData={data.decision.outcome}
 *       adjustmentData={data.decision.adjustments}
 *       timelineEvents={data.timeline}
 *       metricsHistory={data.metrics}
 *       decisionId={decisionId}
 *     />
 *   );
 * }
 * ```
 *
 * ## Technical Implementation
 *
 * ### State Management
 * - `activeStep`: Current cycle phase (0-2)
 * - `isPlaying`: Animation play/pause state
 * - `activeTab`: Current view mode (cycle/timeline/metrics)
 * - `selectedEvent`: Currently selected timeline event
 *
 * ### Animation Logic
 * ```typescript
 * useEffect(() => {
 *   if (!open) {
 *     setActiveStep(0);
 *     setIsPlaying(true);
 *     return;
 *   }
 *
 *   if (!isPlaying) return;
 *
 *   const interval = setInterval(() => {
 *     setActiveStep((prev) => (prev + 1) % 3);
 *   }, 2000);
 *
 *   return () => clearInterval(interval);
 * }, [open, isPlaying]);
 * ```
 *
 * ### Export Handler
 * ```typescript
 * const handleExport = () => {
 *   const exportData = {
 *     decisionId: decisionId || "unknown",
 *     decisionTitle,
 *     chosenOption,
 *     decisionDate: new Date(decisionDate).toISOString(),
 *     timeline,
 *     metrics,
 *     summary: {
 *       totalEvents: timeline.length,
 *       outcomeLogged: outcomeData?.logged || false,
 *       adjustmentsMade: adjustmentData?.count || 0,
 *       averageVariance:
 *         metrics.reduce((sum, m) => sum + m.variance, 0) / metrics.length,
 *     },
 *   };
 *
 *   const blob = new Blob([JSON.stringify(exportData, null, 2)], {
 *     type: "application/json",
 *   });
 *   const url = URL.createObjectURL(blob);
 *   const a = document.createElement("a");
 *   a.href = url;
 *   a.download = `feedback-loop-${decisionId || "export"}-${Date.now()}.json`;
 *   document.body.appendChild(a);
 *   a.click();
 *   document.body.removeChild(a);
 *   URL.revokeObjectURL(url);
 * };
 * ```
 *
 * ### Mock Data Generation
 * ```typescript
 * // Generate mock timeline if not provided
 * const timeline: TimelineEvent[] = timelineEvents || [
 *   {
 *     id: "1",
 *     type: "decision",
 *     date: decisionDate,
 *     title: "Decision Finalized",
 *     description: `Chose ${chosenOption}`,
 *     metrics: { expectedValue: 100 },
 *   },
 *   // ... additional events based on outcomeData and adjustmentData
 * ];
 *
 * // Generate mock metrics if not provided
 * const metrics: MetricsData[] = metricsHistory || [
 *   { month: "Month 1", expected: 100, actual: 98, variance: -2 },
 *   { month: "Month 2", expected: 105, actual: 110, variance: 5 },
 *   // ... additional months
 * ];
 * ```
 *
 * ## Integration Points
 *
 * ### Dashboard
 * - Loop icon on Post-Decision Snapshot cards
 * - Opens modal with decision-specific data
 * - Loads timeline and metrics for 30+ day old decisions
 *
 * ### i-Decide Page
 * - Loop icon on closed decision cards
 * - Available for all closed decisions
 * - Prevents card click-through with stopPropagation
 *
 * ### Board Summary Generator
 * - Export data can be included in board summaries
 * - JSON format compatible with report generation
 * - Charts can be embedded in PDF exports
 *
 * ### Audit Trail
 * - Timeline events logged to audit system
 * - Export actions tracked for compliance
 * - User interactions recorded for analytics
 *
 * ## Performance Considerations
 *
 * - Animation pauses when modal is closed to save resources
 * - Charts use ResponsiveContainer for optimal rendering
 * - Event handlers properly cleaned up on unmount
 * - Efficient state updates with minimal re-renders
 * - Lazy loading of chart components
 * - Debounced export to prevent multiple downloads
 *
 * ## Accessibility
 *
 * - Keyboard navigation support
 * - ARIA labels on interactive elements
 * - Focus management for modal
 * - Color contrast meets WCAG AA standards
 * - Screen reader friendly descriptions
 * - Semantic HTML structure
 * - Tab order follows logical flow
 *
 * ## Future Enhancements
 *
 * ### Multi-Decision Comparison (Planned)
 * - Compare feedback loops across multiple decisions
 * - Identify patterns in adjustments
 * - Learn from collective experience
 * - Side-by-side timeline view
 * - Aggregate metrics visualization
 *
 * ### Real-time Updates (Planned)
 * - Live data streaming for active decisions
 * - WebSocket integration for instant updates
 * - Notification when new events occur
 * - Auto-refresh timeline and metrics
 *
 * ### Predictive Analytics (Planned)
 * - Forecast future adjustments based on patterns
 * - Machine learning integration
 * - Confidence intervals for predictions
 * - Risk assessment for upcoming decisions
 *
 * ### Collaborative Annotations (Planned)
 * - Team comments on timeline events
 * - @mentions for stakeholder notifications
 * - Threaded discussions
 * - Approval workflows
 *
 * ### Advanced Export Options (Planned)
 * - PDF export with charts
 * - CSV export for spreadsheet analysis
 * - PowerPoint slides generation
 * - Email integration for sharing
 *
 * ## Related Features
 *
 * - **Post-Decision Snapshot**: Shows 30-day outcomes
 * - **Guardrail Auto-Adjustment**: Implements the "What changed" step
 * - **Outcome Logger**: Captures the "What happened" data
 * - **Audit Trail**: Records all feedback loop events
 * - **Board Summary Generator**: Includes feedback loop data in reports
 * - **Metrics Section**: Provides detailed performance analysis
 *
 * ## Testing Scenarios
 *
 * ### Complete Cycle
 * - Decision made, outcome logged, adjustments applied
 * - All three nodes active with data
 * - Full timeline with multiple events
 * - Metrics showing positive variance
 *
 * ### Outcome Only
 * - Decision made, outcome logged, no adjustments yet
 * - Two nodes active (decision, outcome)
 * - Timeline shows decision and outcome events
 * - Metrics showing mixed variance
 *
 * ### Pending Outcome
 * - Decision made, awaiting outcome data
 * - One node active (decision only)
 * - Timeline shows decision event only
 * - Metrics showing expected values only
 *
 * ### Multiple Adjustments
 * - Decision with several adjustment iterations
 * - Timeline shows progression of adjustments
 * - Metrics showing improvement over time
 * - Export includes complete adjustment history
 */

export const FEEDBACK_LOOP_ENHANCEMENTS_README =
  "See comments above for enhanced features documentation";
