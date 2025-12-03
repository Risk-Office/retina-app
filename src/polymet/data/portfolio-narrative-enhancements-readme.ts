/**
 * # Portfolio Narrative Enhancements
 *
 * ## Overview
 * Comprehensive narrative generation system for portfolios with AI-powered
 * summarization, scheduled generation, and automated reporting.
 *
 * ## Features Implemented
 *
 * ### 1. Portfolio-Level Narrative Generation ✅
 * - **Basic Generation**: Concatenates journal entries across portfolio decisions
 * - **AI-Enhanced Generation**: Uses LLM for natural language narratives
 * - **Executive Summaries**: High-level overviews for leadership
 * - **Cross-Decision Insights**: Identifies patterns across multiple decisions
 * - **Portfolio Risk Assessment**: Aggregated risk analysis
 *
 * ### 2. AI-Powered Summarization ✅
 * - **Multiple Providers**: OpenAI GPT-4, Anthropic Claude, Local LLM
 * - **Configurable Settings**: Temperature, max tokens, model selection
 * - **Enhanced Narratives**: Includes insights, trends, recommendations
 * - **Sentiment Analysis**: Positive, neutral, negative, mixed
 * - **Trend Identification**: Improving, declining, stable trends
 * - **Risk Factor Extraction**: Automatic identification of concerns
 *
 * ### 3. Scheduled Narrative Generation ✅
 * - **Flexible Schedules**: Daily, weekly, monthly, quarterly
 * - **Automatic Generation**: Runs on schedule without manual intervention
 * - **Email Distribution**: Sends to configured recipients
 * - **AI or Basic**: Choose generation method per schedule
 * - **History Tracking**: Maintains record of all generated narratives
 * - **Enable/Disable**: Toggle schedules on/off
 *
 * ### 4. Portfolio Narrative Manager Component ✅
 * - **Tabbed Interface**: Generate, Schedule, History tabs
 * - **On-Demand Generation**: Generate narratives anytime
 * - **Schedule Management**: Create and manage recurring reports
 * - **History Viewing**: Browse past narratives
 * - **Export Options**: Copy, download narratives
 * - **AI Configuration**: Per-portfolio AI settings
 *
 * ## Architecture
 *
 * ### Data Layer
 * ```
 * @/polymet/data/
 * ├── narrative-generator.ts          # Basic narrative generation
 * ├── ai-narrative-service.ts         # AI-powered generation
 * ├── scheduled-narrative-generator.ts # Scheduling system
 * └── email-scheduler.ts              # Email scheduling (existing)
 * ```
 *
 * ### Component Layer
 * ```
 * @/polymet/components/
 * ├── portfolio-narrative-manager.tsx  # Main narrative UI
 * ├── portfolio-manager.tsx            # Integration point
 * └── narrative-generator-dialog.tsx   # Decision-level (existing)
 * ```
 *
 * ## Usage Examples
 *
 * ### 1. Generate Portfolio Narrative (Basic)
 * ```typescript
 * import { generatePortfolioNarrative } from "@/polymet/data/narrative-generator";
 *
 * const result = generatePortfolioNarrative(
 *   tenantId,
 *   ["decision-1", "decision-2", "decision-3"],
 *   {
 *     entryCount: 5,
 *     includeMetadata: true,
 *     keywords: ["cost", "supplier"],
 *   }
 * );
 *
 * if (result) {
 *   console.log(result.portfolioNarrative);
 *   console.log(`${result.totalEntries} entries analyzed`);
 * }
 * ```
 *
 * ### 2. Generate AI-Enhanced Narrative
 * ```typescript
 * import { generateAIPortfolioNarrative } from "@/polymet/data/ai-narrative-service";
 *
 * const aiConfig = {
 *   provider: "openai",
 *   model: "gpt-4",
 *   apiKey: "sk-...",
 *   temperature: 0.7,
 *   maxTokens: 2000,
 * };
 *
 * const result = await generateAIPortfolioNarrative(
 *   "Strategic Initiatives Portfolio",
 *   [
 *     { decisionTitle: "Decision A", entries: [...] },
 *     { decisionTitle: "Decision B", entries: [...] },
 *   ],
 *   aiConfig
 * );
 *
 * if (result) {
 *   console.log(result.executiveSummary);
 *   console.log(result.crossDecisionInsights);
 *   console.log(result.portfolioRisk); // "low" | "medium" | "high"
 *   console.log(result.recommendations);
 * }
 * ```
 *
 * ### 3. Create Scheduled Narrative
 * ```typescript
 * import { createNarrativeSchedule } from "@/polymet/data/scheduled-narrative-generator";
 *
 * const schedule = createNarrativeSchedule(
 *   tenantId,
 *   portfolioId,
 *   "Strategic Initiatives Portfolio",
 *   "weekly",
 *   ["exec@company.com", "board@company.com"],
 *   "Admin User",
 *   {
 *     dayOfWeek: 1, // Monday
 *     time: "09:00",
 *     useAI: true,
 *     aiConfig: {
 *       provider: "openai",
 *       model: "gpt-4",
 *       apiKey: "sk-...",
 *     },
 *     entryCount: 5,
 *     includeInsights: true,
 *     includeTrends: true,
 *     includeRecommendations: true,
 *   }
 * );
 *
 * console.log(`Schedule created: ${schedule.id}`);
 * console.log(`Next run: ${schedule.nextScheduled}`);
 * ```
 *
 * ### 4. Process Due Schedules
 * ```typescript
 * import { processDueNarrativeSchedules } from "@/polymet/data/scheduled-narrative-generator";
 *
 * // Run this periodically (e.g., every hour)
 * const results = await processDueNarrativeSchedules(tenantId);
 *
 * console.log(`Processed ${results.length} schedules`);
 * results.forEach((history) => {
 *   console.log(`Generated for portfolio: ${history.portfolioId}`);
 *   console.log(`Sent to: ${history.sentTo.join(", ")}`);
 * });
 * ```
 *
 * ### 5. Use Portfolio Narrative Manager Component
 * ```tsx
 * import { PortfolioNarrativeManager } from "@/polymet/components/portfolio-narrative-manager";
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *   const portfolio = { ... }; // Portfolio object
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>
 *         Generate Narrative
 *       </Button>
 *
 *       <PortfolioNarrativeManager
 *         open={open}
 *         onOpenChange={setOpen}
 *         portfolio={portfolio}
 *         tenantId={tenantId}
 *         onAuditEvent={(type, payload) => {
 *           console.log("Audit:", type, payload);
 *         }}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * ## AI Configuration
 *
 * ### OpenAI GPT-4
 * ```typescript
 * const config: AIConfig = {
 *   provider: "openai",
 *   model: "gpt-4",
 *   apiKey: process.env.OPENAI_API_KEY,
 *   temperature: 0.7, // 0-2, higher = more creative
 *   maxTokens: 2000,  // Response length limit
 * };
 * ```
 *
 * ### Anthropic Claude
 * ```typescript
 * const config: AIConfig = {
 *   provider: "anthropic",
 *   model: "claude-3-opus",
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   temperature: 0.7,
 *   maxTokens: 2000,
 * };
 * ```
 *
 * ### Local LLM
 * ```typescript
 * const config: AIConfig = {
 *   provider: "local",
 *   model: "llama-2-7b",
 *   // No API key needed
 *   temperature: 0.7,
 *   maxTokens: 2000,
 * };
 * ```
 *
 * ## Narrative Output Structure
 *
 * ### Basic Narrative
 * ```
 * # Portfolio Decision Summary
 *
 * This brief covers 3 decision(s) with 12 recent events.
 *
 * ## 1. Supplier Partnership Decision
 *
 * 1. **Choice** (Jan 15, 2025) 🤖: Selected Option A based on RAROC analysis.
 * 2. **Reflection** (Jan 20, 2025) 👤: Initial results look promising.
 * 3. **Incident** (Jan 25, 2025) 🤖: Supplier delivery delay reported.
 * ...
 *
 * ## 2. Market Expansion Decision
 * ...
 *
 * _Generated on 2/5/2025 at 10:30:00 AM_
 * ```
 *
 * ### AI-Enhanced Narrative
 * ```json
 * {
 *   "executiveSummary": "The portfolio demonstrates strong diversification...",
 *   "portfolioNarrative": "This portfolio encompasses three interconnected decisions...",
 *   "crossDecisionInsights": [
 *     "Supplier partnerships are enabling faster market expansion",
 *     "Technology investments are reducing operational costs",
 *     "Guardrail breaches in one decision inform threshold adjustments in others"
 *   ],
 *   "portfolioRisk": "medium",
 *   "recommendations": [
 *     "Increase monitoring frequency for decisions with recent guardrail adjustments",
 *     "Consider rebalancing portfolio weights to reduce concentration risk",
 *     "Establish cross-decision coordination mechanisms"
 *   ]
 * }
 * ```
 *
 * ## Schedule Configuration
 *
 * ### Weekly Schedule
 * ```typescript
 * {
 *   frequency: "weekly",
 *   dayOfWeek: 1,      // 0 = Sunday, 1 = Monday, etc.
 *   time: "09:00",     // HH:MM format
 *   recipients: ["exec@company.com"],
 *   useAI: true,
 *   entryCount: 5,
 * }
 * ```
 *
 * ### Monthly Schedule
 * ```typescript
 * {
 *   frequency: "monthly",
 *   dayOfMonth: 1,     // 1-31
 *   time: "09:00",
 *   recipients: ["board@company.com"],
 *   useAI: true,
 *   entryCount: 10,
 * }
 * ```
 *
 * ### Quarterly Schedule
 * ```typescript
 * {
 *   frequency: "quarterly",
 *   monthOfQuarter: 1, // 1-3 (first, second, third month of quarter)
 *   time: "09:00",
 *   recipients: ["leadership@company.com"],
 *   useAI: true,
 *   entryCount: 10,
 * }
 * ```
 *
 * ## Integration Points
 *
 * ### Portfolio Manager
 * - **Location**: `@/polymet/components/portfolio-manager`
 * - **Integration**: "Generate Narrative" button in portfolio cards
 * - **Opens**: Portfolio Narrative Manager dialog
 *
 * ### Decision Story Timeline
 * - **Location**: `@/polymet/components/decision-story-timeline`
 * - **Integration**: "Generate Summary" button (decision-level)
 * - **Opens**: Narrative Generator Dialog
 *
 * ### Email System
 * - **Location**: `@/polymet/data/email-scheduler`
 * - **Integration**: Scheduled narratives trigger email sends
 * - **Template**: "narrative-report"
 *
 * ## Audit Events
 *
 * ### portfolio.narrative.generated
 * ```typescript
 * {
 *   portfolioId: string;
 *   portfolioName: string;
 *   aiGenerated: boolean;
 *   decisionsIncluded: number;
 * }
 * ```
 *
 * ### portfolio.narrative.scheduled
 * ```typescript
 * {
 *   portfolioId: string;
 *   portfolioName: string;
 *   frequency: ScheduleFrequency;
 *   recipients: number;
 * }
 * ```
 *
 * ### narrative.generated (decision-level)
 * ```typescript
 * {
 *   decisionId: string;
 *   entryCount: number;
 *   keywords?: string[];
 * }
 * ```
 *
 * ## Storage
 *
 * ### LocalStorage Keys
 * - `retina:narrative-schedules:{tenantId}` - Schedule configurations
 * - `retina:narrative-history:{tenantId}` - Generation history
 * - `retina:email-schedules:{tenantId}` - Email schedules (existing)
 *
 * ### Data Retention
 * - **Schedules**: Unlimited (until deleted)
 * - **History**: Last 100 entries per tenant
 * - **Narratives**: Full text stored in history
 *
 * ## Performance Considerations
 *
 * ### Basic Generation
 * - **Speed**: Fast (~100ms for 5 decisions)
 * - **Cost**: Free
 * - **Quality**: Good for simple summaries
 *
 * ### AI Generation
 * - **Speed**: Slower (~2-5s depending on provider)
 * - **Cost**: API costs apply (varies by provider)
 * - **Quality**: Excellent for insights and analysis
 *
 * ### Recommendations
 * - Use **basic** for frequent updates (daily)
 * - Use **AI** for important reports (weekly/monthly)
 * - Cache AI results to avoid regeneration
 * - Monitor API costs for high-volume usage
 *
 * ## Error Handling
 *
 * ### AI Generation Failures
 * - **Fallback**: Automatically falls back to basic generation
 * - **Logging**: Errors logged to console
 * - **User Feedback**: Toast notification on failure
 *
 * ### Schedule Processing Failures
 * - **Retry**: No automatic retry (waits for next scheduled time)
 * - **Notification**: Admin notification on repeated failures
 * - **Logging**: Failed attempts logged to history
 *
 * ## Future Enhancements
 *
 * ### Planned Features
 * 1. **Real-time AI Streaming**: Stream AI responses as they generate
 * 2. **Custom Prompts**: User-defined prompt templates
 * 3. **Multi-language Support**: Generate narratives in multiple languages
 * 4. **Narrative Comparison**: Compare narratives over time
 * 5. **Automated Insights**: AI-powered anomaly detection
 * 6. **Slack/Teams Integration**: Send narratives to chat platforms
 * 7. **PDF Generation**: Export narratives as formatted PDFs
 * 8. **Narrative Templates**: Pre-built templates for different audiences
 *
 * ### Potential Improvements
 * - **Caching**: Cache AI responses to reduce costs
 * - **Batch Processing**: Process multiple portfolios in parallel
 * - **Smart Scheduling**: Adjust schedule based on activity
 * - **Sentiment Tracking**: Track sentiment trends over time
 * - **Recommendation Engine**: AI-powered action recommendations
 *
 * ## Testing
 *
 * ### Manual Testing
 * 1. Open Portfolio Manager
 * 2. Click "Generate Narrative" on any portfolio
 * 3. Test basic generation (no AI)
 * 4. Test AI generation (with mock API key)
 * 5. Create a schedule
 * 6. View generation history
 * 7. Export narrative
 *
 * ### Automated Testing
 * ```typescript
 * // Test basic generation
 * const result = generatePortfolioNarrative(tenantId, decisionIds);
 * expect(result).toBeDefined();
 * expect(result.decisionNarratives.length).toBeGreaterThan(0);
 *
 * // Test schedule creation
 * const schedule = createNarrativeSchedule(...);
 * expect(schedule.id).toBeDefined();
 * expect(schedule.nextScheduled).toBeDefined();
 *
 * // Test AI validation
 * const errors = validateAIConfig(config);
 * expect(errors.length).toBe(0);
 * ```
 *
 * ## Troubleshooting
 *
 * ### "No journal entries found"
 * - **Cause**: Portfolio has no decisions with journal entries
 * - **Solution**: Add journal entries to decisions or close decisions
 *
 * ### "AI generation failed"
 * - **Cause**: Invalid API key or provider unavailable
 * - **Solution**: Check API key, verify provider status, use fallback
 *
 * ### "Schedule not running"
 * - **Cause**: Schedule disabled or time not reached
 * - **Solution**: Check enabled status, verify next scheduled time
 *
 * ### "Narrative too short"
 * - **Cause**: Not enough journal entries
 * - **Solution**: Increase entry count or add more entries
 *
 * ## Best Practices
 *
 * 1. **Start with Basic**: Test basic generation before enabling AI
 * 2. **Configure AI Carefully**: Set appropriate temperature and token limits
 * 3. **Monitor Costs**: Track AI API usage and costs
 * 4. **Schedule Wisely**: Don't over-schedule (weekly is usually sufficient)
 * 5. **Review Outputs**: Periodically review generated narratives for quality
 * 6. **Use Keywords**: Filter by keywords for focused narratives
 * 7. **Archive Old Schedules**: Disable unused schedules
 * 8. **Test Before Production**: Test AI configuration with small datasets
 *
 * ## Summary
 *
 * The Portfolio Narrative Enhancements provide a comprehensive system for
 * generating, scheduling, and managing portfolio-level narratives. With both
 * basic and AI-powered generation options, flexible scheduling, and robust
 * history tracking, teams can automate their reporting workflows and gain
 * deeper insights into portfolio performance.
 *
 * Key benefits:
 * - **Automation**: Set it and forget it with scheduled generation
 * - **Intelligence**: AI-powered insights and recommendations
 * - **Flexibility**: Choose basic or AI generation per use case
 * - **History**: Track all generated narratives over time
 * - **Integration**: Seamlessly integrated into Portfolio Manager
 *
 * For questions or support, refer to the usage examples and troubleshooting
 * sections above.
 */

export const PORTFOLIO_NARRATIVE_ENHANCEMENTS_VERSION = "1.0.0";
export const PORTFOLIO_NARRATIVE_ENHANCEMENTS_DOCS_URL =
  "https://docs.retina.ai/portfolio-narratives";
