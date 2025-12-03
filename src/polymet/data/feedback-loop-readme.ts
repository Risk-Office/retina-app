/**
 * # Feedback Loop Visualization
 *
 * ## Overview
 * The feedback loop visualization provides a clear, animated representation of how
 * the Retina system learns and adapts from finalized decisions. It shows the complete
 * cycle: Decision → Outcome → Adjustment.
 *
 * ## Purpose
 * - **Educational**: Helps users understand the continuous learning process
 * - **Transparency**: Shows how actual outcomes influence future decisions
 * - **Trust Building**: Demonstrates that the system adapts based on real-world results
 *
 * ## User Experience
 *
 * ### Access Points
 * 1. **Dashboard**: Loop icon on Post-Decision Snapshot cards (30+ days old decisions)
 * 2. **i-Decide**: Loop icon on each closed decision in the Closed Decisions list
 *
 * ### Visual Design
 * - **Icon**: Small circular button with rotating arrows (RefreshCwIcon/RotateCcwIcon)
 * - **Position**: Top-right corner of decision cards
 * - **Interaction**: Hover tooltip + click to open modal
 * - **Color**: Primary theme color with hover effects
 *
 * ## Modal Structure
 *
 * ### Three-Node Cycle
 *
 * #### 1. Decision Node (Blue)
 * - **Label**: "What we did"
 * - **Icon**: CheckCircle (checkmark)
 * - **Content**:
 *   - Decision title
 *   - Chosen option
 *   - Decision date
 *
 * #### 2. Outcome Node (Green)
 * - **Label**: "What happened"
 * - **Icon**: TrendingUp (chart)
 * - **Content**:
 *   - Outcome status (logged/pending)
 *   - Outcome summary
 *   - Outcome date
 *
 * #### 3. Adjustment Node (Purple)
 * - **Label**: "What changed"
 * - **Icon**: RefreshCw (circular arrows)
 * - **Content**:
 *   - Number of adjustments
 *   - Last adjustment description
 *   - Adjustment date
 *
 * ### Animation
 * - **Cycle Duration**: 2 seconds per node
 * - **Active State**: Node scales up, border highlights, icon colorizes
 * - **Arrow Animation**: Arrows between nodes pulse when active
 * - **Continuous Loop**: Cycles through all three nodes repeatedly
 * - **Feedback Arrow**: Shows "Continuous Learning" badge at bottom
 *
 * ### Plain-Language Label
 * - **Header**: "Feedback Loop"
 * - **Subtitle**: "How we learn and adapt"
 * - **Explanation**: Clear description of the learning cycle
 *
 * ## Data Flow
 *
 * ### Decision Data
 * ```typescript
 * {
 *   decisionTitle: string;
 *   decisionDate: number;
 *   chosenOption: string;
 * }
 * ```
 *
 * ### Outcome Data
 * ```typescript
 * {
 *   logged: boolean;
 *   date?: number;
 *   summary?: string;
 * }
 * ```
 *
 * ### Adjustment Data
 * ```typescript
 * {
 *   count: number;
 *   lastAdjustment?: string;
 *   date?: number;
 * }
 * ```
 *
 * ## Implementation Details
 *
 * ### Component: FeedbackLoopModal
 * - **Location**: `@/polymet/components/feedback-loop-modal`
 * - **Props**: Decision, outcome, and adjustment data
 * - **State**: Active step (0-2) for animation
 * - **Effect**: Auto-cycles through steps when modal is open
 *
 * ### Integration Points
 *
 * #### Dashboard (RetinaDashboard)
 * ```typescript
 * // Icon on Post-Decision Snapshot cards
 * <button onClick={() => {
 *   setSelectedDecisionForLoop(metrics.decisionId);
 *   setFeedbackLoopOpen(true);
 * }}>
 *   <RefreshCwIcon />
 * </button>
 * ```
 *
 * #### i-Decide (RetinaIDecide)
 * ```typescript
 * // Icon on closed decision cards
 * <button onClick={(e) => {
 *   e.stopPropagation();
 *   setSelectedDecisionForLoop(decision.id);
 *   setFeedbackLoopOpen(true);
 * }}>
 *   <RotateCcwIcon />
 * </button>
 * ```
 *
 * ## Mock Data vs Real Data
 *
 * ### Current Implementation (Mock)
 * - Randomly generates outcome and adjustment data for demo
 * - 70% chance of having outcome logged
 * - 60% chance of adjustments if outcome exists
 * - Random adjustment counts (1-3)
 *
 * ### Production Implementation
 * ```typescript
 * // Fetch from backend
 * const outcomeData = await fetchOutcomeData(decisionId);
 * const adjustmentData = await fetchAdjustmentHistory(decisionId);
 * ```
 *
 * ## User Benefits
 *
 * ### 1. Understanding
 * - Clear visualization of the learning process
 * - Plain-language explanations
 * - Animated flow shows causality
 *
 * ### 2. Confidence
 * - See that outcomes are tracked
 * - Understand how adjustments are made
 * - Trust in the adaptive system
 *
 * ### 3. Accountability
 * - Track what was decided
 * - Monitor what actually happened
 * - Review what changed as a result
 *
 * ## Future Enhancements
 *
 * ### 1. Detailed History
 * - Click on any node to see full details
 * - Timeline view of all adjustments
 * - Comparison of multiple decisions
 *
 * ### 2. Interactive Controls
 * - Pause/play animation
 * - Step through manually
 * - Adjust animation speed
 *
 * ### 3. Metrics Integration
 * - Show actual vs expected metrics
 * - Visualize impact of adjustments
 * - Display confidence intervals
 *
 * ### 4. Export & Sharing
 * - Export feedback loop as PDF
 * - Share with stakeholders
 * - Include in board summaries
 *
 * ### 5. Multi-Decision View
 * - Compare feedback loops across decisions
 * - Identify patterns in adjustments
 * - Learn from collective experience
 *
 * ## Technical Notes
 *
 * ### Performance
 * - Animation uses CSS transitions (hardware accelerated)
 * - Interval cleanup on unmount
 * - Minimal re-renders with proper state management
 *
 * ### Accessibility
 * - Keyboard navigation support
 * - Screen reader friendly labels
 * - Reduced motion support (future)
 *
 * ### Responsive Design
 * - 3-column grid on desktop
 * - Stacked layout on mobile (future)
 * - Touch-friendly button sizes
 *
 * ## Related Features
 * - **Post-Decision Snapshot**: Shows 30-day outcomes
 * - **Guardrail Auto-Adjustment**: Implements the "What changed" step
 * - **Outcome Logger**: Captures the "What happened" data
 * - **Audit Trail**: Records all feedback loop events
 *
 * ## Example Usage
 *
 * ```typescript
 * import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setOpen(true)}>
 *         View Feedback Loop
 *       </button>
 *
 *       <FeedbackLoopModal
 *         open={open}
 *         onOpenChange={setOpen}
 *         decisionTitle="Expand to New Market"
 *         decisionDate={Date.now() - 45 * 24 * 60 * 60 * 1000}
 *         chosenOption="Option A: Gradual Expansion"
 *         outcomeData={{
 *           logged: true,
 *           date: Date.now() - 15 * 24 * 60 * 60 * 1000,
 *           summary: "Revenue 15% above projection",
 *         }}
 *         adjustmentData={{
 *           count: 3,
 *           lastAdjustment: "Tightened VaR95 threshold by 5%",
 *           date: Date.now() - 10 * 24 * 60 * 60 * 1000,
 *         }}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

export const FEEDBACK_LOOP_README = "See comments above for documentation";
