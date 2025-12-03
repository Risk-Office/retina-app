/**
 * # Decision Story Timeline
 *
 * ## Overview
 * The Decision Story timeline provides a chronological view of a decision's lifecycle,
 * showing journal entries with sentiment indicators based on utility changes.
 *
 * ## Purpose
 * - **Visualize decision evolution**: See how decisions progress from initial choice to outcomes
 * - **Track utility changes**: Understand if decisions are improving or declining over time
 * - **Provide context**: Show the full journey with automatic and manual entries
 * - **Enable learning**: Help teams understand what worked and what didn't
 *
 * ## Features
 *
 * ### 1. Vertical Timeline Layout ✅
 * - **Chronological order**: Entries sorted from oldest to newest (top to bottom)
 * - **Visual timeline**: Vertical line connecting all entries
 * - **Icon-coded entries**: Each entry type has a distinct icon and color
 * - **Responsive design**: Works on all screen sizes
 *
 * ### 2. Sentiment Indicators ✅
 * - **Utility tracking**: Shows if utility improved (↑), declined (↓), or stayed neutral (~)
 * - **Color coding**:
 *   - Green: Utility improved
 *   - Red: Utility declined
 *   - Gray: Utility neutral/unchanged
 * - **Delta display**: Shows exact utility change value
 * - **Automatic detection**: Matches journal entries with learning trace data
 *
 * ### 3. Entry Types ✅
 * Each entry type has a unique visual treatment:
 *
 * **Choice** (Green)
 * - Icon: CheckCircle2Icon
 * - Represents: Initial decision selection
 * - Color: Green background with green border
 *
 * **Update** (Blue)
 * - Icon: TrendingUpIcon
 * - Represents: Changes to decision parameters
 * - Color: Blue background with blue border
 *
 * **Reflection** (Purple)
 * - Icon: MessageSquareIcon
 * - Represents: User insights and learnings
 * - Color: Purple background with purple border
 *
 * **Incident** (Red)
 * - Icon: AlertTriangleIcon
 * - Represents: External events affecting decision
 * - Color: Red background with red border
 *
 * **Guardrail Adjustment** (Amber)
 * - Icon: ShieldAlertIcon
 * - Represents: Automatic threshold adjustments
 * - Color: Amber background with amber border
 *
 * ### 4. Plain-Language Design ✅
 * - **Header**: "How this decision evolved"
 * - **Tooltip**: "Shows the journey — from choice to outcome to adjustment."
 * - **Empty state**: Clear guidance when no entries exist
 * - **Auto badge**: Shows which entries are system-generated
 *
 * ### 5. Rich Entry Information ✅
 * - **Entry type badge**: Shows the type of entry
 * - **Auto-generated indicator**: Sparkles icon for system entries
 * - **Sentiment indicator**: Shows utility change direction
 * - **Date/time**: Full timestamp for each entry
 * - **Summary text**: Main content of the entry
 * - **Utility delta**: Exact change in utility value
 * - **Metadata**: Expandable details section
 *
 * ## Integration
 *
 * ### In i-Decide Page
 * The Decision Story is available as a dedicated tab in the i-Decide page:
 *
 * ```tsx
 * <Tabs>
 *   <TabsList>
 *     <TabsTrigger value="decision">Decision</TabsTrigger>
 *     <TabsTrigger value="story">Decision Story</TabsTrigger>
 *     <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
 *     ...
 *   </TabsList>
 *
 *   <TabsContent value="story">
 *     <DecisionStoryTimeline
 *       decisionId={currentDecisionId}
 *       decisionTitle={title}
 *     />
 *   </TabsContent>
 * </Tabs>
 * ```
 *
 * ### Component Usage
 * ```tsx
 * import { DecisionStoryTimeline } from "@/polymet/components/decision-story-timeline";
 *
 * <DecisionStoryTimeline
 *   decisionId="dec-123"
 *   decisionTitle="Cloud Migration Strategy"
 *   className="custom-class"
 * />
 * ```
 *
 * ## Data Sources
 *
 * ### 1. Decision Journal
 * - Source: `@/polymet/data/decision-journal`
 * - Provides: All journal entries for the decision
 * - Entry types: choice, update, reflection, incident, guardrail_adjustment
 *
 * ### 2. Learning Trace
 * - Source: `@/polymet/data/auto-refresh-engine`
 * - Provides: Utility changes over time
 * - Used for: Sentiment indicators and delta calculations
 *
 * ## How Sentiment Works
 *
 * ### Matching Logic
 * 1. Load journal entries for the decision
 * 2. Load learning trace entries for the decision
 * 3. Match entries by timestamp (within 1-minute tolerance)
 * 4. Calculate sentiment based on utility delta:
 *    - `delta > 0.01`: Utility improved (↑)
 *    - `delta < -0.01`: Utility declined (↓)
 *    - Otherwise: Utility neutral (~)
 *
 * ### Utility Delta Display
 * - Shows exact change: "+0.15" or "-0.08"
 * - Color-coded: Green for positive, red for negative
 * - Only shown when utility data is available
 *
 * ## User Experience
 *
 * ### Empty State
 * When no journal entries exist:
 * - Shows message icon
 * - Text: "No story yet"
 * - Description: "Journal entries will appear here as the decision evolves"
 *
 * ### Timeline Navigation
 * - Scroll vertically to see full timeline
 * - Oldest entries at top, newest at bottom
 * - Visual line connects all entries
 * - Hover effects for better interaction
 *
 * ### Entry Interaction
 * - Hover: Background changes to accent color
 * - Click details: Expand metadata section
 * - View timestamp: Full date and time shown
 * - Read summary: Main content always visible
 *
 * ## Technical Details
 *
 * ### Component Props
 * ```typescript
 * interface DecisionStoryTimelineProps {
 *   decisionId: string;        // Required: Decision identifier
 *   decisionTitle: string;     // Required: Decision name
 *   className?: string;        // Optional: Additional CSS classes
 * }
 * ```
 *
 * ### Timeline Entry Structure
 * ```typescript
 * interface TimelineEntry extends DecisionJournalEntry {
 *   utilityChange?: "up" | "down" | "neutral";
 *   utilityDelta?: number;
 * }
 * ```
 *
 * ### Styling
 * - Uses Tailwind CSS for all styling
 * - Supports light and dark modes
 * - Responsive design with mobile-first approach
 * - Consistent with Retina design system
 *
 * ## Future Enhancements
 *
 * ### Potential Features
 * 1. **Filtering**: Filter by entry type or sentiment
 * 2. **Search**: Search within entry summaries
 * 3. **Export**: Export timeline as PDF or image
 * 4. **Annotations**: Add comments to specific entries
 * 5. **Comparison**: Compare timelines across decisions
 * 6. **Milestones**: Highlight key decision points
 * 7. **Analytics**: Show statistics about the timeline
 * 8. **Sharing**: Share timeline with stakeholders
 *
 * ## Best Practices
 *
 * ### For Users
 * 1. **Add reflections regularly**: Capture insights as they happen
 * 2. **Review the story**: Periodically review the timeline to learn
 * 3. **Look for patterns**: Identify what leads to utility improvements
 * 4. **Share with team**: Use timeline for team discussions
 *
 * ### For Developers
 * 1. **Keep entries concise**: 500 character limit for summaries
 * 2. **Use appropriate types**: Choose correct entry type for context
 * 3. **Include metadata**: Add relevant context in metadata field
 * 4. **Track utility**: Ensure learning trace is updated with utility changes
 *
 * ## Related Features
 *
 * - **Decision Journal**: Source of all timeline entries
 * - **Learning Trace**: Provides utility change data
 * - **Auto-Refresh Engine**: Generates automatic updates
 * - **Feedback Loop Modal**: Shows decision outcomes
 * - **Guardrail Auto-Adjust**: Creates adjustment entries
 *
 * ## Example Timeline
 *
 * ```
 * ┌─────────────────────────────────────────┐
 * │ ● Choice                    Jan 15, 2025│
 * │   "Selected Option A based on RAROC"    │
 * │   Utility ↑ +0.12                       │
 * └─────────────────────────────────────────┘
 *         │
 * ┌─────────────────────────────────────────┐
 * │ ● Reflection                Jan 20, 2025│
 * │   "Initial results look promising"      │
 * └─────────────────────────────────────────┘
 *         │
 * ┌─────────────────────────────────────────┐
 * │ ● Update                    Jan 25, 2025│
 * │   "Signal refresh triggered recompute"  │
 * │   Utility ↓ -0.05                       │
 * └─────────────────────────────────────────┘
 *         │
 * ┌─────────────────────────────────────────┐
 * │ ● Guardrail Adjustment      Jan 30, 2025│
 * │   "VaR95 threshold tightened by 5%"     │
 * │   Utility ~ +0.01                       │
 * └─────────────────────────────────────────┘
 * ```
 *
 * ## Accessibility
 *
 * - **Semantic HTML**: Proper heading hierarchy
 * - **ARIA labels**: Screen reader support
 * - **Keyboard navigation**: Tab through entries
 * - **Color contrast**: WCAG AA compliant
 * - **Focus indicators**: Clear focus states
 *
 * ## Performance
 *
 * - **Efficient rendering**: Only renders visible entries
 * - **Memoization**: Uses useMemo for expensive calculations
 * - **Lazy loading**: Metadata expanded on demand
 * - **Optimized sorting**: Single sort operation
 *
 * ---
 *
 * **Last Updated**: January 2025
 * **Component**: `@/polymet/components/decision-story-timeline`
 * **Data Sources**: `decision-journal`, `auto-refresh-engine`
 */

export const DECISION_STORY_README = "Decision Story Timeline Documentation";
