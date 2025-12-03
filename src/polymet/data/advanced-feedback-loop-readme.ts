/**
 * # Advanced Feedback Loop Features
 *
 * ## Overview
 * This document describes the advanced features for the feedback loop system,
 * including multi-decision comparison, real-time updates, predictive analytics,
 * collaborative annotations, pattern recognition, and risk assessment.
 *
 * ## Features
 *
 * ### 1. Multi-Decision Comparison
 * **Component**: `@/polymet/components/multi-decision-comparison`
 *
 * Compare feedback loops across multiple decisions side-by-side to identify
 * patterns and learn from past decisions.
 *
 * #### Key Features:
 * - Select up to 4 decisions for comparison
 * - Grid view showing key metrics for each decision
 * - Chart view with variance trends over time
 * - Comparison summary with best performer and averages
 * - Status badges (outperforming, tracking, underperforming, pending)
 *
 * #### Usage Example:
 * ```tsx
 * import { MultiDecisionComparison } from "@/polymet/components/multi-decision-comparison";
 *
 * <MultiDecisionComparison
 *   open={open}
 *   onOpenChange={setOpen}
 *   availableDecisions={[
 *     {
 *       id: "dec-001",
 *       title: "Cloud Migration Strategy",
 *       chosenOption: "Hybrid Cloud Approach",
 *       decisionDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
 *       outcomeLogged: true,
 *       adjustmentCount: 3,
 *       avgVariance: 8.5,
 *       status: "outperforming",
 *     },
 *     // ... more decisions
 *   ]}
 *   onDecisionSelect={(id) => console.log("Selected:", id)}
 * />
 * ```
 *
 * #### Props:
 * - `open`: boolean - Dialog open state
 * - `onOpenChange`: (open: boolean) => void - Dialog state handler
 * - `availableDecisions`: DecisionSummary[] - Array of decisions to compare
 * - `onDecisionSelect`: (decisionId: string) => void - Callback when viewing details
 *
 * #### Data Structure:
 * ```typescript
 * interface DecisionSummary {
 *   id: string;
 *   title: string;
 *   chosenOption: string;
 *   decisionDate: number;
 *   outcomeLogged: boolean;
 *   adjustmentCount: number;
 *   avgVariance: number;
 *   status: "outperforming" | "tracking" | "underperforming" | "pending";
 * }
 * ```
 *
 * ---
 *
 * ### 2. Real-time Updates
 * **Hook**: `@/polymet/data/use-realtime-feedback`
 *
 * WebSocket integration for live data streaming of feedback loop updates.
 *
 * #### Key Features:
 * - WebSocket connection management
 * - Automatic reconnection on disconnect
 * - Real-time timeline event updates
 * - Live metrics history streaming
 * - Connection status monitoring
 * - Mock mode for development/testing
 *
 * #### Usage Example:
 * ```tsx
 * import { useRealtimeFeedback } from "@/polymet/data/use-realtime-feedback";
 *
 * const { data, isConnected, error, reconnect } = useRealtimeFeedback({
 *   decisionId: "dec-001",
 *   enabled: true,
 *   wsUrl: "ws://localhost:3001/feedback",
 *   onUpdate: (data) => {
 *     console.log("New update:", data);
 *     // Update your UI with new data
 *   },
 *   onError: (error) => {
 *     console.error("WebSocket error:", error);
 *   },
 * });
 * ```
 *
 * #### Mock Mode (for development):
 * ```tsx
 * import { useMockRealtimeFeedback } from "@/polymet/data/use-realtime-feedback";
 *
 * const { data, isConnected } = useMockRealtimeFeedback({
 *   decisionId: "dec-001",
 *   enabled: true,
 *   updateInterval: 10000, // Update every 10 seconds
 *   onUpdate: (data) => console.log("Mock update:", data),
 * });
 * ```
 *
 * #### Return Values:
 * - `data`: RealtimeFeedbackData | null - Latest feedback data
 * - `isConnected`: boolean - WebSocket connection status
 * - `isLoading`: boolean - Initial connection loading state
 * - `error`: Error | null - Connection error if any
 * - `reconnect`: () => void - Manual reconnection function
 * - `disconnect`: () => void - Manual disconnection function
 *
 * #### WebSocket Message Format:
 * ```json
 * {
 *   "type": "feedback_update",
 *   "decisionId": "dec-001",
 *   "timelineEvents": [...],
 *   "metricsHistory": [...],
 *   "timestamp": 1234567890
 * }
 * ```
 *
 * ---
 *
 * ### 3. Predictive Analytics
 * **Component**: `@/polymet/components/predictive-analytics-panel`
 *
 * AI-powered forecasting for future adjustments based on historical patterns.
 *
 * #### Key Features:
 * - Pattern analysis (adjustment frequency, variance trend)
 * - 3-month variance forecast with confidence intervals
 * - Adjustment predictions with likelihood scores
 * - Confidence levels (high, medium, low)
 * - Suggested actions for each prediction
 * - Time-series visualization
 *
 * #### Usage Example:
 * ```tsx
 * import { PredictiveAnalyticsPanel } from "@/polymet/components/predictive-analytics-panel";
 *
 * <PredictiveAnalyticsPanel
 *   decisionId="dec-001"
 *   decisionTitle="Cloud Migration Strategy"
 *   timelineEvents={timelineEvents}
 *   currentVariance={13}
 *   onApplyPrediction={(prediction) => {
 *     console.log("Applying:", prediction.suggestedAction);
 *   }}
 * />
 * ```
 *
 * #### Prediction Algorithm:
 * 1. **Pattern Analysis**:
 *    - Adjustment frequency (adjustments per month)
 *    - Variance trend (increasing, decreasing, stable)
 *    - Average time between adjustments
 *
 * 2. **Forecast Generation**:
 *    - Historical data (last 6 months)
 *    - Predicted data (next 3 months)
 *    - Confidence intervals (widening over time)
 *
 * 3. **Likelihood Calculation**:
 *    - Based on variance magnitude
 *    - Adjustment frequency patterns
 *    - Time since last adjustment
 *
 * #### Prediction Data Structure:
 * ```typescript
 * interface AdjustmentPrediction {
 *   likelihood: number; // 0-100
 *   timeframe: string;
 *   reason: string;
 *   confidence: "high" | "medium" | "low";
 *   suggestedAction?: string;
 * }
 * ```
 *
 * ---
 *
 * ### 4. Collaborative Annotations
 * **Component**: `@/polymet/components/collaborative-annotations`
 *
 * Team comments and discussions on timeline events with threading and reactions.
 *
 * #### Key Features:
 * - Comment on timeline events
 * - Reply to comments (threaded discussions)
 * - Like/unlike comments
 * - Pin important comments
 * - Edit own comments
 * - Delete own comments
 * - User avatars and roles
 * - Timestamp formatting (relative time)
 *
 * #### Usage Example:
 * ```tsx
 * import { CollaborativeAnnotations } from "@/polymet/components/collaborative-annotations";
 *
 * <CollaborativeAnnotations
 *   event={timelineEvent}
 *   annotations={annotations}
 *   currentUser={{
 *     id: "user-1",
 *     name: "John Doe",
 *     avatar: "https://...",
 *     role: "Risk Manager",
 *   }}
 *   onAddAnnotation={(eventId, content) => {
 *     // Add new annotation
 *   }}
 *   onReplyToAnnotation={(annotationId, content, eventId) => {
 *     // Add reply
 *   }}
 *   onLikeAnnotation={(annotationId, eventId) => {
 *     // Toggle like
 *   }}
 *   onPinAnnotation={(annotationId, eventId) => {
 *     // Toggle pin
 *   }}
 *   onDeleteAnnotation={(annotationId, eventId) => {
 *     // Delete annotation
 *   }}
 *   onEditAnnotation={(annotationId, content, eventId) => {
 *     // Edit annotation
 *   }}
 * />
 * ```
 *
 * #### Annotation Data Structure:
 * ```typescript
 * interface Annotation {
 *   id: string;
 *   eventId: string;
 *   userId: string;
 *   userName: string;
 *   userAvatar?: string;
 *   userRole?: string;
 *   content: string;
 *   timestamp: number;
 *   likes: string[]; // Array of user IDs
 *   replies: Annotation[];
 *   isPinned?: boolean;
 *   isEdited?: boolean;
 * }
 * ```
 *
 * #### Dialog Wrapper:
 * ```tsx
 * import { CollaborativeAnnotationsDialog } from "@/polymet/components/collaborative-annotations";
 *
 * <CollaborativeAnnotationsDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   {...annotationProps}
 * />
 * ```
 *
 * ---
 *
 * ### 5. Pattern Recognition
 * **Component**: `@/polymet/components/pattern-recognition-panel`
 *
 * Machine learning to identify adjustment patterns across multiple decisions.
 *
 * #### Key Features:
 * - Pattern detection (variance spike, gradual drift, frequent adjustments)
 * - Pattern clustering (grouping similar decisions)
 * - Confidence scoring for each pattern
 * - Impact assessment (high, medium, low)
 * - Pattern categories (variance_spike, gradual_drift, threshold_breach, etc.)
 * - Actionable recommendations
 *
 * #### Usage Example:
 * ```tsx
 * import { PatternRecognitionPanel } from "@/polymet/components/pattern-recognition-panel";
 *
 * <PatternRecognitionPanel
 *   decisions={[
 *     {
 *       id: "dec-001",
 *       title: "Cloud Migration Strategy",
 *       adjustmentCount: 5,
 *       avgVariance: 12.5,
 *       status: "outperforming",
 *     },
 *     // ... more decisions
 *   ]}
 *   onApplyInsight={(insight) => {
 *     console.log("Applying insight:", insight);
 *   }}
 * />
 * ```
 *
 * #### Pattern Detection Algorithm:
 * 1. **Individual Patterns**:
 *    - Variance Spike: |variance| > 10%
 *    - Gradual Drift: adjustments >= 3 AND |variance| > 5%
 *    - Frequent Adjustments: adjustments >= 4
 *
 * 2. **Clustering**:
 *    - High Variance Cluster: decisions with |variance| > 10%
 *    - Frequent Adjustment Cluster: decisions with adjustments >= 3
 *    - Stable Performance Cluster: |variance| < 5% AND adjustments <= 1
 *
 * 3. **Confidence Scoring**:
 *    - Based on pattern consistency
 *    - Number of matching decisions
 *    - Statistical significance
 *
 * #### Pattern Data Structure:
 * ```typescript
 * interface DecisionPattern {
 *   id: string;
 *   decisionId: string;
 *   decisionTitle: string;
 *   pattern: string;
 *   frequency: number;
 *   confidence: number; // 0-1
 *   impact: "high" | "medium" | "low";
 *   category: "variance_spike" | "gradual_drift" | "seasonal" | "threshold_breach" | "correlation";
 * }
 *
 * interface PatternCluster {
 *   id: string;
 *   name: string;
 *   description: string;
 *   decisions: string[];
 *   commonality: string;
 *   strength: number; // 0-1
 *   recommendation?: string;
 * }
 * ```
 *
 * ---
 *
 * ### 6. Risk Assessment
 * **Component**: `@/polymet/components/risk-assessment-panel`
 *
 * Comprehensive risk scoring to predict likelihood of future adjustments.
 *
 * #### Key Features:
 * - Overall risk score (0-100)
 * - Risk level classification (critical, high, medium, low)
 * - Adjustment likelihood percentage
 * - Time to next adjustment estimation
 * - Multi-factor risk analysis
 * - Radar chart visualization
 * - Factor-specific mitigation actions
 * - Actionable recommendations
 *
 * #### Usage Example:
 * ```tsx
 * import { RiskAssessmentPanel } from "@/polymet/components/risk-assessment-panel";
 *
 * <RiskAssessmentPanel
 *   decisionId="dec-001"
 *   decisionTitle="Cloud Migration Strategy"
 *   timelineEvents={timelineEvents}
 *   currentVariance={18.3}
 *   thresholds={{ critical: 80, high: 60, medium: 40 }}
 *   onApplyMitigation={(action) => {
 *     console.log("Applying mitigation:", action);
 *   }}
 * />
 * ```
 *
 * #### Risk Factors:
 * 1. **Variance Magnitude** (weight: 30%)
 *    - Current variance percentage
 *    - Score: min(|variance| * 5, 100)
 *
 * 2. **Adjustment Frequency** (weight: 25%)
 *    - Adjustments per month
 *    - Score: min(frequency * 50, 100)
 *
 * 3. **Variance Volatility** (weight: 20%)
 *    - Standard deviation of variances
 *    - Score: min(stdDev * 10, 100)
 *
 * 4. **Timing Risk** (weight: 15%)
 *    - Days since last adjustment
 *    - Score: (daysSince / avgDaysBetween) * 100
 *
 * 5. **Trend Consistency** (weight: 10%)
 *    - Consistency of variance direction
 *    - Score: 75 if consistent, 25 if inconsistent
 *
 * #### Risk Calculation:
 * ```
 * Overall Risk Score = Σ(factor.score * factor.weight)
 *
 * Risk Level:
 * - Critical: score >= 80
 * - High: score >= 60
 * - Medium: score >= 40
 * - Low: score < 40
 *
 * Adjustment Likelihood = (
 *   varianceMagnitude * 0.4 +
 *   frequencyScore * 0.3 +
 *   volatilityScore * 0.2 +
 *   timingScore * 0.1
 * ) * 1.2
 * ```
 *
 * #### Risk Data Structure:
 * ```typescript
 * interface RiskFactor {
 *   id: string;
 *   name: string;
 *   description: string;
 *   score: number; // 0-100
 *   trend: "increasing" | "decreasing" | "stable";
 *   weight: number; // 0-1
 *   mitigationActions?: string[];
 * }
 *
 * interface RiskAssessment {
 *   overallRiskScore: number; // 0-100
 *   riskLevel: "critical" | "high" | "medium" | "low";
 *   adjustmentLikelihood: number; // 0-100
 *   timeToNextAdjustment: {
 *     min: number;
 *     max: number;
 *     mostLikely: number;
 *   };
 *   factors: RiskFactor[];
 *   recommendations: string[];
 * }
 * ```
 *
 * ---
 *
 * ## Integration Guide
 *
 * ### 1. Integrating with Feedback Loop Modal
 * Add tabs or sections to the existing feedback loop modal:
 *
 * ```tsx
 * import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
 * import { PredictiveAnalyticsPanel } from "@/polymet/components/predictive-analytics-panel";
 * import { RiskAssessmentPanel } from "@/polymet/components/risk-assessment-panel";
 *
 * // Add new tabs to the modal
 * <Tabs>
 *   <TabsList>
 *     <TabsTrigger value="cycle">Cycle</TabsTrigger>
 *     <TabsTrigger value="timeline">Timeline</TabsTrigger>
 *     <TabsTrigger value="metrics">Metrics</TabsTrigger>
 *     <TabsTrigger value="analytics">Analytics</TabsTrigger>
 *     <TabsTrigger value="risk">Risk</TabsTrigger>
 *   </TabsList>
 *
 *   <TabsContent value="analytics">
 *     <PredictiveAnalyticsPanel {...props} />
 *   </TabsContent>
 *
 *   <TabsContent value="risk">
 *     <RiskAssessmentPanel {...props} />
 *   </TabsContent>
 * </Tabs>
 * ```
 *
 * ### 2. Adding Real-time Updates
 * Wrap your feedback loop with real-time data:
 *
 * ```tsx
 * function FeedbackLoopWithRealtime({ decisionId }) {
 *   const { data, isConnected } = useRealtimeFeedback({
 *     decisionId,
 *     enabled: true,
 *     onUpdate: (data) => {
 *       // Update your state with new data
 *     },
 *   });
 *
 *   return (
 *     <>
 *       {isConnected && <Badge>Live</Badge>}
 *       <FeedbackLoopModal
 *         timelineEvents={data?.timelineEvents}
 *         metricsHistory={data?.metricsHistory}
 *         {...otherProps}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * ### 3. Adding Multi-Decision Comparison
 * Add a comparison button to your dashboard:
 *
 * ```tsx
 * const [comparisonOpen, setComparisonOpen] = useState(false);
 *
 * <Button onClick={() => setComparisonOpen(true)}>
 *   Compare Decisions
 * </Button>
 *
 * <MultiDecisionComparison
 *   open={comparisonOpen}
 *   onOpenChange={setComparisonOpen}
 *   availableDecisions={closedDecisions}
 * />
 * ```
 *
 * ### 4. Adding Collaborative Annotations
 * Add annotations to timeline events:
 *
 * ```tsx
 * // In your timeline view
 * {timelineEvents.map((event) => (
 *   <div key={event.id}>
 *     <TimelineEventCard event={event} />
 *     <Button onClick={() => openAnnotations(event)}>
 *       <MessageSquareIcon /> {annotationCount}
 *     </Button>
 *   </div>
 * ))}
 *
 * <CollaborativeAnnotationsDialog
 *   open={annotationsOpen}
 *   onOpenChange={setAnnotationsOpen}
 *   event={selectedEvent}
 *   annotations={annotations}
 *   currentUser={currentUser}
 *   {...handlers}
 * />
 * ```
 *
 * ---
 *
 * ## Backend Requirements
 *
 * ### WebSocket Server
 * For real-time updates, implement a WebSocket server:
 *
 * ```javascript
 * // Example Node.js WebSocket server
 * const WebSocket = require('ws');
 * const wss = new WebSocket.Server({ port: 3001 });
 *
 * wss.on('connection', (ws, req) => {
 *   const params = new URLSearchParams(req.url.split('?')[1]);
 *   const decisionId = params.get('decisionId');
 *
 *   ws.on('message', (message) => {
 *     const data = JSON.parse(message);
 *     if (data.type === 'subscribe') {
 *       // Subscribe to decision updates
 *       subscribeToDecision(decisionId, (update) => {
 *         ws.send(JSON.stringify({
 *           type: 'feedback_update',
 *           decisionId: update.decisionId,
 *           timelineEvents: update.timelineEvents,
 *           metricsHistory: update.metricsHistory,
 *           timestamp: Date.now(),
 *         }));
 *       });
 *     }
 *   });
 * });
 * ```
 *
 * ### API Endpoints
 * Required endpoints for full functionality:
 *
 * ```
 * GET    /api/decisions/:id/feedback-loop
 * GET    /api/decisions/:id/timeline-events
 * GET    /api/decisions/:id/metrics-history
 * POST   /api/decisions/:id/annotations
 * PUT    /api/annotations/:id
 * DELETE /api/annotations/:id
 * POST   /api/annotations/:id/like
 * POST   /api/annotations/:id/pin
 * GET    /api/decisions/patterns
 * GET    /api/decisions/:id/risk-assessment
 * ```
 *
 * ---
 *
 * ## Performance Considerations
 *
 * ### 1. WebSocket Connection Management
 * - Implement connection pooling
 * - Use heartbeat/ping-pong to detect stale connections
 * - Implement exponential backoff for reconnection
 * - Close connections when components unmount
 *
 * ### 2. Data Caching
 * - Cache timeline events and metrics history
 * - Implement incremental updates (only send deltas)
 * - Use local storage for offline support
 *
 * ### 3. Computation Optimization
 * - Memoize expensive calculations (risk scores, patterns)
 * - Debounce real-time updates
 * - Use web workers for ML computations
 *
 * ### 4. UI Performance
 * - Virtualize long lists of annotations
 * - Lazy load chart components
 * - Implement pagination for large datasets
 *
 * ---
 *
 * ## Security Considerations
 *
 * ### 1. WebSocket Security
 * - Use WSS (WebSocket Secure) in production
 * - Implement authentication tokens
 * - Validate all incoming messages
 * - Rate limit connections per user
 *
 * ### 2. Annotation Permissions
 * - Verify user permissions before allowing edits/deletes
 * - Implement role-based access control
 * - Sanitize user input to prevent XSS
 * - Audit all annotation changes
 *
 * ### 3. Data Privacy
 * - Encrypt sensitive decision data
 * - Implement tenant isolation
 * - Log all access to decision data
 * - Comply with data retention policies
 *
 * ---
 *
 * ## Testing
 *
 * ### Unit Tests
 * ```typescript
 * describe("RiskAssessmentPanel", () => {
 *   it("calculates risk score correctly", () => {
 *     const assessment = calculateRiskAssessment(mockData);
 *     expect(assessment.overallRiskScore).toBeGreaterThan(0);
 *   });
 * });
 * ```
 *
 * ### Integration Tests
 * ```typescript
 * describe("Real-time Updates", () => {
 *   it("receives WebSocket updates", async () => {
 *     const { result } = renderHook(() => useRealtimeFeedback({
 *       decisionId: "test-001",
 *       enabled: true,
 *     }));
 *
 *     await waitFor(() => {
 *       expect(result.current.isConnected).toBe(true);
 *     });
 *   });
 * });
 * ```
 *
 * ---
 *
 * ## Future Enhancements
 *
 * 1. **Advanced ML Models**
 *    - LSTM networks for time-series prediction
 *    - Anomaly detection algorithms
 *    - Reinforcement learning for optimal adjustments
 *
 * 2. **Enhanced Collaboration**
 *    - Video/audio annotations
 *    - Screen sharing for discussions
 *    - Integration with Slack/Teams
 *
 * 3. **Advanced Visualizations**
 *    - 3D network graphs for decision relationships
 *    - Animated timeline playback
 *    - Interactive what-if scenarios
 *
 * 4. **Mobile Support**
 *    - Native mobile apps
 *    - Push notifications for high-risk alerts
 *    - Offline mode with sync
 *
 * ---
 *
 * ## Support & Resources
 *
 * - Documentation: /docs/feedback-loop
 * - API Reference: /api-docs
 * - Examples: /examples/feedback-loop
 * - Support: support@retina.ai
 */

export const ADVANCED_FEEDBACK_LOOP_VERSION = "2.0.0";

export const FEATURE_FLAGS = {
  MULTI_DECISION_COMPARISON: true,
  REALTIME_UPDATES: true,
  PREDICTIVE_ANALYTICS: true,
  COLLABORATIVE_ANNOTATIONS: true,
  PATTERN_RECOGNITION: true,
  RISK_ASSESSMENT: true,
};

export const DEFAULT_THRESHOLDS = {
  risk: {
    critical: 80,
    high: 60,
    medium: 40,
  },
  variance: {
    high: 10,
    medium: 5,
  },
  adjustmentFrequency: {
    high: 0.5, // per month
  },
};
