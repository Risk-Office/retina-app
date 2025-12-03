/**
 * # Narrative Generator - Documentation
 *
 * ## Overview
 * The Narrative Generator creates plain-language briefs from recent journal entries,
 * making it easy to generate summaries for leadership updates and reports.
 *
 * ## Features
 *
 * ### 1. **Decision-Level Narratives**
 * - Concatenates last 3-5 journal entries into a cohesive story
 * - Configurable entry count (3, 4, or 5 entries)
 * - Plain-language formatting for non-technical audiences
 * - Includes metadata details (optional)
 *
 * ### 2. **Portfolio-Level Narratives**
 * - Aggregates narratives across multiple decisions
 * - Shows portfolio-wide trends and patterns
 * - Useful for executive summaries
 *
 * ### 3. **Keyword Search**
 * - Search by keywords: "supplier", "cost spike", "guardrail", etc.
 * - Filter entries by specific terms
 * - Highlight relevant entries across decisions
 *
 * ### 4. **Export Options**
 * - **Markdown**: Formatted with headers and metadata
 * - **Plain Text**: Simple text format for emails
 * - **Copy to Clipboard**: Quick sharing
 *
 * ### 5. **Audit Logging**
 * - Tag: `narrative.generated`
 * - Tracks when narratives are created
 * - Records keywords used, entries included, and export actions
 *
 * ## Plain-Language Labels
 *
 * - **Button Label**: "Generate Summary Narrative"
 * - **Dialog Title**: "Generate Summary Narrative"
 * - **Description**: "Quick summary for reports"
 * - **Tooltip**: "Turns recent events into a short story for leadership updates."
 *
 * ## Usage
 *
 * ### Decision-Level Narrative
 *
 * ```tsx
 * import { NarrativeGeneratorDialog } from "@/polymet/components/narrative-generator-dialog";
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>
 *         <FileTextIcon className="h-4 w-4 mr-2" />
 *         Generate Summary Narrative
 *       </Button>
 *
 *       <NarrativeGeneratorDialog
 *         open={open}
 *         onOpenChange={setOpen}
 *         decisionId="dec-123"
 *         decisionTitle="Supplier Partnership Decision"
 *         onAuditEvent={(eventType, payload) => {
 *           console.log("Audit:", eventType, payload);
 *         }}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * ### Portfolio-Level Narrative
 *
 * ```tsx
 * <NarrativeGeneratorDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   portfolioDecisionIds={["dec-1", "dec-2", "dec-3"]}
 *   portfolioName="Q4 Strategic Decisions"
 *   onAuditEvent={handleAuditEvent}
 * />
 * ```
 *
 * ### Programmatic Generation
 *
 * ```tsx
 * import {
 *   generateDecisionNarrative,
 *   generatePortfolioNarrative,
 * } from "@/polymet/data/narrative-generator";
 *
 * // Generate decision narrative
 * const narrative = generateDecisionNarrative(
 *   "dec-123",
 *   "t-demo",
 *   {
 *     entryCount: 5,
 *     keywords: ["supplier", "cost"],
 *     includeMetadata: true,
 *   }
 * );
 *
 * console.log(narrative.narrative);
 * console.log(narrative.entriesIncluded);
 *
 * // Generate portfolio narrative
 * const portfolioNarrative = generatePortfolioNarrative(
 *   "t-demo",
 *   ["dec-1", "dec-2", "dec-3"],
 *   { entryCount: 3 }
 * );
 *
 * console.log(portfolioNarrative.portfolioNarrative);
 * console.log(portfolioNarrative.totalEntries);
 * ```
 *
 * ## Narrative Format
 *
 * ### Decision Narrative Example
 *
 * ```
 * **Supplier Partnership Decision**
 *
 * 1. **Choice** (Jan 15, 2025) 🤖: Selected Option A based on RAROC analysis.
 *    Supplier partnership with Acme Corp offers best risk-adjusted returns.
 *
 * 2. **Reflection** (Jan 20, 2025) 👤: Initial results look promising.
 *    Cost spike concerns mitigated by long-term contract.
 *
 * 3. **Incident** (Jan 25, 2025) 🤖: Supplier delivery delay reported.
 *    Impact on Q2 revenue estimated at 5%.
 *
 * 4. **Guardrail Adjustment** (Jan 28, 2025) 🤖: Guardrail threshold adjusted
 *    from 15% to 18% due to repeated breaches in cost variance.
 *
 * 5. **Update** (Feb 1, 2025) 🤖: Signal refresh triggered recompute.
 *    Market demand increased by 12%, improving outlook.
 *
 * _Generated on 2/5/2025 at 10:30:00 AM_
 * ```
 *
 * ### Portfolio Narrative Example
 *
 * ```
 * # Portfolio Decision Summary
 *
 * This brief covers 3 decision(s) with 12 recent events.
 *
 * ## 1. Supplier Partnership Decision
 *
 * 1. **Choice** (Jan 15, 2025) 🤖: Selected Option A...
 * 2. **Reflection** (Jan 20, 2025) 👤: Initial results...
 *
 * ## 2. Market Expansion Decision
 *
 * 1. **Choice** (Jan 18, 2025) 🤖: Chose Option B...
 * 2. **Update** (Jan 22, 2025) 🤖: Market conditions...
 *
 * ## 3. Technology Investment Decision
 *
 * 1. **Choice** (Jan 20, 2025) 🤖: Selected Option C...
 * 2. **Incident** (Jan 25, 2025) 🤖: Budget overrun...
 *
 * _Generated on 2/5/2025 at 10:30:00 AM_
 * ```
 *
 * ## Keyword Search
 *
 * ### Common Keywords
 *
 * The system recognizes these common decision-related keywords:
 *
 * - **Suppliers**: supplier, vendor, partner
 * - **Costs**: cost, spike, price, budget
 * - **Risks**: risk, guardrail, threshold, breach
 * - **Performance**: revenue, profit, loss, quality
 * - **Issues**: incident, problem, delay, issue
 * - **Changes**: adjustment, change, update, improvement
 * - **Market**: market, demand, supply, customer
 *
 * ### Search Example
 *
 * ```tsx
 * import { searchNarrativeKeywords } from "@/polymet/data/narrative-generator";
 *
 * const results = searchNarrativeKeywords("t-demo", ["supplier", "cost spike"]);
 *
 * results.forEach((result) => {
 *   console.log(`${result.decisionTitle}: ${result.matchCount} matches`);
 *   result.matchingEntries.forEach((entry) => {
 *     console.log(`  - ${entry.summary_text}`);
 *   });
 * });
 * ```
 *
 * ## Audit Events
 *
 * ### narrative.generated
 *
 * Logged when a narrative is generated.
 *
 * **Payload**:
 * ```typescript
 * {
 *   type: "decision" | "portfolio",
 *   decisionId?: string,
 *   decisionTitle?: string,
 *   portfolioName?: string,
 *   decisionCount?: number,
 *   entriesIncluded: number,
 *   keywords?: string[],
 *   tenantId: string,
 *   timestamp: number
 * }
 * ```
 *
 * ### narrative.searched
 *
 * Logged when a keyword search is performed.
 *
 * **Payload**:
 * ```typescript
 * {
 *   keywords: string[],
 *   resultsCount: number,
 *   tenantId: string,
 *   timestamp: number
 * }
 * ```
 *
 * ### narrative.downloaded
 *
 * Logged when a narrative is downloaded.
 *
 * **Payload**:
 * ```typescript
 * {
 *   type: "decision" | "portfolio",
 *   format: "markdown" | "text",
 *   tenantId: string,
 *   timestamp: number
 * }
 * ```
 *
 * ## Integration Points
 *
 * ### 1. Decision Story Timeline
 *
 * The "Generate Summary Narrative" button is integrated into the Decision Story
 * timeline component, allowing users to quickly generate a narrative from the
 * timeline view.
 *
 * **Location**: `@/polymet/components/decision-story-timeline`
 *
 * ### 2. Portfolio Manager
 *
 * Portfolio-level narratives can be generated from the Portfolio Manager,
 * providing executive summaries across multiple decisions.
 *
 * **Location**: `@/polymet/components/portfolio-manager`
 *
 * ### 3. i-Decide Page
 *
 * The narrative generator is accessible from the "Decision Story" tab in the
 * i-Decide page.
 *
 * **Location**: `@/polymet/pages/retina-i-decide`
 *
 * ## Configuration Options
 *
 * ### NarrativeOptions
 *
 * ```typescript
 * interface NarrativeOptions {
 *   entryCount?: number;        // Default: 5 (3-5 range)
 *   includeMetadata?: boolean;  // Default: false
 *   keywords?: string[];        // Filter by keywords
 *   entryTypes?: JournalEntryType[]; // Filter by entry types
 *   startDate?: number;         // Filter by date range
 *   endDate?: number;
 * }
 * ```
 *
 * ### Example with All Options
 *
 * ```tsx
 * const narrative = generateDecisionNarrative(
 *   "dec-123",
 *   "t-demo",
 *   {
 *     entryCount: 4,
 *     includeMetadata: true,
 *     keywords: ["supplier", "cost"],
 *     entryTypes: ["incident", "guardrail_adjustment"],
 *     startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
 *     endDate: Date.now(),
 *   }
 * );
 * ```
 *
 * ## Statistics
 *
 * Get narrative statistics:
 *
 * ```tsx
 * import { getNarrativeStatistics } from "@/polymet/data/narrative-generator";
 *
 * const stats = getNarrativeStatistics(narrative);
 *
 * console.log(`Word count: ${stats.wordCount}`);
 * console.log(`Character count: ${stats.characterCount}`);
 * console.log(`Entry count: ${stats.entryCount}`);
 * console.log(`Date span: ${stats.dateSpan} days`);
 * ```
 *
 * ## Best Practices
 *
 * ### 1. **Use Appropriate Entry Counts**
 * - **3 entries**: Quick summaries, recent updates
 * - **4 entries**: Balanced view, standard reports
 * - **5 entries**: Comprehensive story, executive briefings
 *
 * ### 2. **Leverage Keywords**
 * - Use keywords to focus on specific topics
 * - Combine multiple keywords for precise filtering
 * - Use suggested keywords from the dialog
 *
 * ### 3. **Include Metadata When Needed**
 * - Enable metadata for technical audiences
 * - Disable for executive summaries
 * - Metadata shows option labels, metric changes, etc.
 *
 * ### 4. **Export Appropriately**
 * - **Markdown**: For documentation, wikis, GitHub
 * - **Plain Text**: For emails, chat messages
 * - **Copy**: For quick sharing in meetings
 *
 * ### 5. **Audit Tracking**
 * - Always provide `onAuditEvent` callback
 * - Track narrative generation for compliance
 * - Monitor keyword usage patterns
 *
 * ## Troubleshooting
 *
 * ### No Entries Found
 *
 * **Problem**: Narrative generation returns null or empty.
 *
 * **Solutions**:
 * - Check if decision has journal entries
 * - Verify keywords match entry content
 * - Adjust date range filters
 * - Check entry type filters
 *
 * ### Keywords Not Matching
 *
 * **Problem**: Search returns no results despite relevant entries.
 *
 * **Solutions**:
 * - Use lowercase keywords (search is case-insensitive)
 * - Try partial matches (e.g., "cost" instead of "cost spike")
 * - Check for typos in keywords
 * - Use suggested keywords from the dialog
 *
 * ### Narrative Too Long
 *
 * **Problem**: Generated narrative is too verbose.
 *
 * **Solutions**:
 * - Reduce entry count (3 instead of 5)
 * - Disable metadata inclusion
 * - Use keyword filtering to focus on specific topics
 * - Filter by entry types (e.g., only "choice" and "incident")
 *
 * ### Narrative Too Short
 *
 * **Problem**: Generated narrative lacks detail.
 *
 * **Solutions**:
 * - Increase entry count (5 instead of 3)
 * - Enable metadata inclusion
 * - Remove keyword filters
 * - Expand date range
 *
 * ## Future Enhancements
 *
 * ### Planned Features
 *
 * 1. **AI-Powered Summarization**
 *    - Use LLM to generate more natural narratives
 *    - Automatic key point extraction
 *    - Sentiment analysis
 *
 * 2. **Template System**
 *    - Pre-defined narrative templates
 *    - Custom template creation
 *    - Industry-specific formats
 *
 * 3. **Scheduled Generation**
 *    - Automatic weekly/monthly narratives
 *    - Email delivery
 *    - Slack/Teams integration
 *
 * 4. **Visualization**
 *    - Timeline charts
 *    - Sentiment graphs
 *    - Keyword clouds
 *
 * 5. **Collaboration**
 *    - Shared narratives
 *    - Comments and annotations
 *    - Version history
 *
 * ## Related Documentation
 *
 * - **Decision Journal**: `@/polymet/data/decision-journal`
 * - **Decision Story Timeline**: `@/polymet/components/decision-story-timeline`
 * - **Auto-Journal Generator**: `@/polymet/data/auto-journal-generator`
 * - **Learning Trace**: `@/polymet/data/learning-trace-readme`
 *
 * ## Support
 *
 * For questions or issues with the Narrative Generator:
 *
 * 1. Check this documentation
 * 2. Review the decision journal documentation
 * 3. Inspect audit logs for generation events
 * 4. Contact the Retina support team
 *
 * ---
 *
 * **Last Updated**: February 2025
 * **Version**: 1.0.0
 * **Status**: Production Ready ✅
 */

export const NARRATIVE_GENERATOR_README = "See documentation above";
