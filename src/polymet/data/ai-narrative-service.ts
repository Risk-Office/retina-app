/**
 * # AI Narrative Service
 *
 * ## Overview
 * AI-powered narrative generation using LLM for more natural, contextual summaries.
 * Enhances basic narrative generation with intelligent summarization and insights.
 *
 * ## Features
 * - LLM-powered summarization
 * - Context-aware narrative generation
 * - Automatic insight extraction
 * - Sentiment analysis
 * - Executive summary generation
 * - Trend identification
 *
 * ## Integration
 * - OpenAI GPT-4 (primary)
 * - Anthropic Claude (fallback)
 * - Local LLM support (optional)
 */

import type { DecisionJournalEntry } from "@/polymet/data/decision-journal";
import type { NarrativeBrief } from "@/polymet/data/narrative-generator";

export interface AIConfig {
  provider: "openai" | "anthropic" | "local";
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIEnhancedNarrative extends NarrativeBrief {
  aiGenerated: true;
  executiveSummary: string;
  keyInsights: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  trends: Array<{
    type: "improving" | "declining" | "stable";
    description: string;
    confidence: number;
  }>;
  recommendations: string[];
  riskFactors: string[];
}

/**
 * Generate AI-enhanced narrative from journal entries
 */
export async function generateAINarrative(
  decisionTitle: string,
  entries: DecisionJournalEntry[],
  options: {
    config?: AIConfig;
    includeInsights?: boolean;
    includeTrends?: boolean;
    includeRecommendations?: boolean;
  } = {}
): Promise<AIEnhancedNarrative | null> {
  const {
    config = getDefaultConfig(),
    includeInsights = true,
    includeTrends = true,
    includeRecommendations = true,
  } = options;

  if (entries.length === 0) {
    return null;
  }

  try {
    // Build context for LLM
    const context = buildLLMContext(decisionTitle, entries);

    // Generate narrative using LLM
    const narrative = await callLLM(
      config,
      buildNarrativePrompt(context, {
        includeInsights,
        includeTrends,
        includeRecommendations,
      })
    );

    // Parse LLM response
    const parsed = parseAINarrative(narrative);

    return {
      decisionId: entries[0]?.decision_id || "",
      decisionTitle,
      narrative: parsed.narrative,
      entriesIncluded: entries.length,
      generatedAt: Date.now(),
      aiGenerated: true,
      executiveSummary: parsed.executiveSummary,
      keyInsights: parsed.keyInsights,
      sentiment: parsed.sentiment,
      trends: parsed.trends,
      recommendations: parsed.recommendations,
      riskFactors: parsed.riskFactors,
    };
  } catch (error) {
    console.error("AI narrative generation failed:", error);
    return null;
  }
}

/**
 * Generate portfolio-level AI narrative
 */
export async function generateAIPortfolioNarrative(
  portfolioName: string,
  decisionNarratives: Array<{
    decisionTitle: string;
    entries: DecisionJournalEntry[];
  }>,
  config?: AIConfig
): Promise<{
  portfolioNarrative: string;
  executiveSummary: string;
  crossDecisionInsights: string[];
  portfolioRisk: "low" | "medium" | "high";
  recommendations: string[];
} | null> {
  if (decisionNarratives.length === 0) {
    return null;
  }

  try {
    const context = buildPortfolioContext(portfolioName, decisionNarratives);
    const response = await callLLM(
      config || getDefaultConfig(),
      buildPortfolioPrompt(context)
    );

    return parsePortfolioNarrative(response);
  } catch (error) {
    console.error("AI portfolio narrative generation failed:", error);
    return null;
  }
}

/**
 * Build context for LLM
 */
function buildLLMContext(
  decisionTitle: string,
  entries: DecisionJournalEntry[]
): string {
  const lines: string[] = [];

  lines.push(`Decision: ${decisionTitle}`);
  lines.push(`Total Events: ${entries.length}`);
  lines.push("");

  // Sort chronologically
  const sorted = [...entries].sort((a, b) => a.entry_date - b.entry_date);

  sorted.forEach((entry, index) => {
    const date = new Date(entry.entry_date).toLocaleDateString();
    const type = entry.entry_type;
    const source = entry.auto_generated ? "System" : "User";

    lines.push(`Event ${index + 1} (${date}, ${type}, ${source}):`);
    lines.push(entry.summary_text);

    if (entry.metadata) {
      lines.push(`Metadata: ${JSON.stringify(entry.metadata)}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Build portfolio context
 */
function buildPortfolioContext(
  portfolioName: string,
  decisionNarratives: Array<{
    decisionTitle: string;
    entries: DecisionJournalEntry[];
  }>
): string {
  const lines: string[] = [];

  lines.push(`Portfolio: ${portfolioName}`);
  lines.push(`Decisions: ${decisionNarratives.length}`);
  lines.push("");

  decisionNarratives.forEach((decision, index) => {
    lines.push(`Decision ${index + 1}: ${decision.decisionTitle}`);
    lines.push(`Events: ${decision.entries.length}`);

    decision.entries.forEach((entry) => {
      const date = new Date(entry.entry_date).toLocaleDateString();
      lines.push(`  - ${date}: ${entry.summary_text}`);
    });

    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Build narrative generation prompt
 */
function buildNarrativePrompt(
  context: string,
  options: {
    includeInsights: boolean;
    includeTrends: boolean;
    includeRecommendations: boolean;
  }
): string {
  return `You are an expert business analyst creating a narrative summary for leadership.

Context:
${context}

Generate a comprehensive narrative that includes:

1. EXECUTIVE SUMMARY (2-3 sentences)
   - High-level overview of the decision journey
   - Current status and key outcomes

2. DETAILED NARRATIVE
   - Chronological story of events
   - Plain language, suitable for executives
   - Focus on business impact and outcomes
   - Connect events to show cause and effect

${options.includeInsights ? "3. KEY INSIGHTS (3-5 bullet points)\n   - Important patterns or findings\n   - Business implications\n" : ""}

${options.includeTrends ? "4. TRENDS\n   - Identify improving, declining, or stable trends\n   - Provide confidence level (0-100%)\n" : ""}

${options.includeRecommendations ? "5. RECOMMENDATIONS (2-4 items)\n   - Actionable next steps\n   - Risk mitigation strategies\n" : ""}

6. RISK FACTORS (if any)
   - Potential concerns or red flags
   - Areas requiring attention

7. SENTIMENT ANALYSIS
   - Overall sentiment: positive, neutral, negative, or mixed
   - Brief justification

Format your response as JSON:
{
  "executiveSummary": "...",
  "narrative": "...",
  "keyInsights": ["...", "..."],
  "trends": [
    {"type": "improving|declining|stable", "description": "...", "confidence": 85}
  ],
  "recommendations": ["...", "..."],
  "riskFactors": ["...", "..."],
  "sentiment": "positive|neutral|negative|mixed"
}`;
}

/**
 * Build portfolio narrative prompt
 */
function buildPortfolioPrompt(context: string): string {
  return `You are an expert portfolio analyst creating a comprehensive portfolio summary.

Context:
${context}

Generate a portfolio-level analysis that includes:

1. EXECUTIVE SUMMARY
   - Portfolio overview
   - Overall health and status
   - Key themes across decisions

2. PORTFOLIO NARRATIVE
   - Integrated story across all decisions
   - Common patterns and themes
   - Portfolio-level insights

3. CROSS-DECISION INSIGHTS
   - Patterns that span multiple decisions
   - Synergies or conflicts
   - Portfolio-level risks and opportunities

4. PORTFOLIO RISK ASSESSMENT
   - Overall risk level: low, medium, or high
   - Key risk factors
   - Diversification analysis

5. RECOMMENDATIONS
   - Portfolio-level actions
   - Resource allocation suggestions
   - Strategic guidance

Format your response as JSON:
{
  "executiveSummary": "...",
  "portfolioNarrative": "...",
  "crossDecisionInsights": ["...", "..."],
  "portfolioRisk": "low|medium|high",
  "recommendations": ["...", "..."]
}`;
}

/**
 * Call LLM API
 */
async function callLLM(config: AIConfig, prompt: string): Promise<string> {
  // Mock implementation - in production, this would call actual LLM APIs
  console.log("LLM Call:", { provider: config.provider, model: config.model });

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return mock response based on provider
  if (config.provider === "openai") {
    return generateMockOpenAIResponse(prompt);
  } else if (config.provider === "anthropic") {
    return generateMockAnthropicResponse(prompt);
  } else {
    return generateMockLocalResponse(prompt);
  }
}

/**
 * Parse AI narrative response
 */
function parseAINarrative(response: string): {
  narrative: string;
  executiveSummary: string;
  keyInsights: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  trends: Array<{
    type: "improving" | "declining" | "stable";
    description: string;
    confidence: number;
  }>;
  recommendations: string[];
  riskFactors: string[];
} {
  try {
    const parsed = JSON.parse(response);
    return {
      narrative: parsed.narrative || "",
      executiveSummary: parsed.executiveSummary || "",
      keyInsights: parsed.keyInsights || [],
      sentiment: parsed.sentiment || "neutral",
      trends: parsed.trends || [],
      recommendations: parsed.recommendations || [],
      riskFactors: parsed.riskFactors || [],
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return {
      narrative: response,
      executiveSummary: "Failed to parse AI response",
      keyInsights: [],
      sentiment: "neutral",
      trends: [],
      recommendations: [],
      riskFactors: [],
    };
  }
}

/**
 * Parse portfolio narrative response
 */
function parsePortfolioNarrative(response: string): {
  portfolioNarrative: string;
  executiveSummary: string;
  crossDecisionInsights: string[];
  portfolioRisk: "low" | "medium" | "high";
  recommendations: string[];
} {
  try {
    const parsed = JSON.parse(response);
    return {
      portfolioNarrative: parsed.portfolioNarrative || "",
      executiveSummary: parsed.executiveSummary || "",
      crossDecisionInsights: parsed.crossDecisionInsights || [],
      portfolioRisk: parsed.portfolioRisk || "medium",
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error("Failed to parse portfolio response:", error);
    return {
      portfolioNarrative: response,
      executiveSummary: "Failed to parse AI response",
      crossDecisionInsights: [],
      portfolioRisk: "medium",
      recommendations: [],
    };
  }
}

/**
 * Get default AI configuration
 */
function getDefaultConfig(): AIConfig {
  return {
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
  };
}

/**
 * Mock OpenAI response generator
 */
function generateMockOpenAIResponse(prompt: string): string {
  // Check if it's a portfolio prompt
  if (prompt.includes("portfolio analyst")) {
    return JSON.stringify({
      executiveSummary:
        "The portfolio demonstrates strong diversification across 3 strategic decisions with mixed performance indicators. Recent signal refreshes have triggered re-evaluations, suggesting dynamic market conditions requiring active management.",
      portfolioNarrative:
        "This portfolio encompasses three interconnected decisions spanning supplier partnerships, market expansion, and technology investments. The supplier partnership decision has shown resilience despite initial cost spikes, with guardrail adjustments maintaining risk within acceptable bounds. Market expansion efforts have benefited from favorable demand signals, though competitive pressures remain. Technology investments are in early stages with promising initial metrics. Cross-decision synergies are emerging, particularly between supplier relationships and market expansion capabilities.",
      crossDecisionInsights: [
        "Supplier partnerships are enabling faster market expansion through improved logistics",
        "Technology investments are reducing operational costs across all decisions",
        "Guardrail breaches in one decision are informing threshold adjustments in others",
        "Portfolio-level diversification is providing resilience against individual decision volatility",
      ],

      portfolioRisk: "medium",
      recommendations: [
        "Increase monitoring frequency for decisions with recent guardrail adjustments",
        "Consider rebalancing portfolio weights to reduce concentration risk",
        "Establish cross-decision coordination mechanisms to capture synergies",
        "Develop contingency plans for correlated downside scenarios",
      ],
    });
  }

  // Regular decision narrative
  return JSON.stringify({
    executiveSummary:
      "The decision has progressed through initial implementation with mixed results. Recent cost spikes triggered guardrail adjustments, while market signals suggest improving conditions. Active management and adaptive thresholds are maintaining risk within acceptable bounds.",
    narrative:
      "**Decision Journey: Supplier Partnership**\n\nThe decision to partner with Acme Corp was finalized in January 2025 based on strong RAROC analysis showing favorable risk-adjusted returns. Initial implementation proceeded smoothly with expected cost structures materializing as projected.\n\nIn late January, an unexpected supplier delivery delay created the first challenge, impacting Q2 revenue projections by approximately 5%. This incident triggered our monitoring systems and prompted a detailed review of supplier reliability metrics.\n\nFebruary brought a significant cost spike, breaching our established guardrail threshold of 15%. The auto-adjustment system responded by raising the threshold to 18%, reflecting the new risk environment while maintaining appropriate oversight. This adjustment was accompanied by enhanced monitoring protocols.\n\nMost recently, a positive signal refresh indicated a 12% increase in market demand, substantially improving the decision's outlook. This development has offset earlier concerns and validates the strategic rationale for the partnership.\n\nThroughout this journey, the decision has demonstrated resilience and the value of adaptive risk management. The combination of automated guardrails and human oversight has enabled effective navigation of both challenges and opportunities.",
    keyInsights: [
      "Supplier relationship shows resilience despite initial delivery challenges",
      "Auto-adjustment of guardrails prevented premature decision reversal while maintaining risk discipline",
      "Market demand improvements are validating the strategic partnership rationale",
      "Early warning systems successfully identified and escalated cost spike concerns",
      "Integration of real-time signals is enabling proactive rather than reactive management",
    ],

    trends: [
      {
        type: "improving",
        description:
          "Market demand trending upward with 12% increase in recent signals",
        confidence: 85,
      },
      {
        type: "stable",
        description:
          "Cost variance stabilizing after guardrail adjustment to 18%",
        confidence: 75,
      },
      {
        type: "improving",
        description:
          "Supplier reliability metrics showing recovery after initial delay",
        confidence: 70,
      },
    ],

    recommendations: [
      "Continue enhanced monitoring of supplier delivery metrics for next 60 days",
      "Establish formal quarterly review cadence with supplier to address cost volatility",
      "Leverage improved market demand to negotiate better terms in upcoming contract renewal",
      "Document lessons learned from guardrail adjustment process for future decisions",
    ],

    riskFactors: [
      "Cost variance remains elevated at 18%, requiring continued vigilance",
      "Supplier concentration risk if delivery issues recur",
      "Market demand improvements may not be sustainable long-term",
      "Potential for correlated risks if other suppliers face similar challenges",
    ],

    sentiment: "mixed",
  });
}

/**
 * Mock Anthropic response generator
 */
function generateMockAnthropicResponse(prompt: string): string {
  // Similar structure to OpenAI but with slightly different tone
  return generateMockOpenAIResponse(prompt);
}

/**
 * Mock local LLM response generator
 */
function generateMockLocalResponse(prompt: string): string {
  // Simpler response for local models
  return generateMockOpenAIResponse(prompt);
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: AIConfig): string[] {
  const errors: string[] = [];

  if (!["openai", "anthropic", "local"].includes(config.provider)) {
    errors.push("Invalid provider. Must be 'openai', 'anthropic', or 'local'");
  }

  if (
    config.provider !== "local" &&
    (!config.apiKey || config.apiKey.trim() === "")
  ) {
    errors.push("API key is required for cloud providers");
  }

  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push("Temperature must be between 0 and 2");
    }
  }

  if (config.maxTokens !== undefined) {
    if (config.maxTokens < 1 || config.maxTokens > 4000) {
      errors.push("Max tokens must be between 1 and 4000");
    }
  }

  return errors;
}

/**
 * Get AI provider display name
 */
export function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case "openai":
      return "OpenAI GPT-4";
    case "anthropic":
      return "Anthropic Claude";
    case "local":
      return "Local LLM";
    default:
      return provider;
  }
}

/**
 * Estimate token usage
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Check if AI features are available
 */
export function isAIAvailable(config?: AIConfig): boolean {
  if (!config) return false;

  if (config.provider === "local") {
    // Check if local LLM is configured
    return true; // Assume available for demo
  }

  // Check if API key is set
  return !!config.apiKey && config.apiKey.trim() !== "";
}
