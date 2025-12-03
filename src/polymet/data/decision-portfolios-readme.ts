/**
 * # Decision Portfolio System - Complete Documentation
 *
 * ## Overview
 * The Decision Portfolio system allows users to group related decisions under common themes,
 * enabling holistic analysis and management of decision bundles.
 *
 * ## Plain-Language Label
 * "Group related choices under one theme."
 *
 * ## Tooltip
 * "Lets you view several decisions together — like an investment or strategy bundle."
 *
 * ---
 *
 * ## Data Model
 *
 * ### Portfolio Entity
 * ```typescript
 * interface PortfolioMetrics {
 *   aggregate_expected_value: number;  // Weighted sum of EVs
 *   aggregate_var95: number;           // Portfolio-level VaR95 via copula
 *   aggregate_cvar95: number;          // Portfolio-level CVaR95 via copula
 *   diversification_index: number;     // 1 - (Σ pairwise corr / n²)
 *   antifragility_score: number;       // 0-100, placeholder for Set 13
 *   plain_language_label: string;      // "How sturdy or spread-out..."
 *   computed_at: number;               // Timestamp of computation
 * }
 *
 * interface DecisionPortfolio {
 *   id: string;                    // Unique portfolio identifier
 *   tenantId: string;              // Tenant isolation
 *   portfolio_name: string;        // Name of the portfolio
 *   description: string;           // Purpose and context
 *   owner: string;                 // Portfolio owner/creator
 *   time_horizon_months: number;   // Planning horizon
 *   goal_alignment: string;        // Free text describing goal alignment
 *   decision_ids: string[];        // Array of linked decision IDs
 *   createdAt: number;             // Creation timestamp
 *   updatedAt: number;             // Last update timestamp
 *   metrics?: PortfolioMetrics;    // Computed metrics (optional)
 * }
 * ```
 *
 * ### Decision Link
 * Decisions can be linked to portfolios via:
 * - Portfolio's `decision_ids` array (1-to-many relationship)
 * - Decision's optional `portfolio_id` field (for primary portfolio)
 *
 * ---
 *
 * ## Core Features
 *
 * ### 1. Portfolio Management
 * - **Create**: Define new portfolios with name, description, owner, horizon, and goals
 * - **Update**: Modify portfolio metadata and settings
 * - **Delete**: Remove portfolios (decisions remain intact)
 * - **List**: View all portfolios for a tenant
 *
 * ### 2. Decision Assignment
 * - **Assign**: Add decisions to one or more portfolios
 * - **Unassign**: Remove decisions from portfolios
 * - **Multi-assignment**: Decisions can belong to multiple portfolios
 * - **Visual indicators**: Current portfolio highlighted in UI
 *
 * ### 3. Portfolio Analytics
 * - **Statistics**: Total portfolios, decisions, averages
 * - **Decision count**: Track portfolio size
 * - **Time tracking**: Creation and update timestamps
 * - **Owner tracking**: Portfolio ownership and responsibility
 *
 * ### 4. Computed Metrics
 * Portfolio-level metrics computed from closed decisions:
 *
 * #### Aggregate Expected Value (EV)
 * - **Formula**: Weighted sum of individual decision EVs
 * - **Interpretation**: Total expected return across all decisions
 * - **Plain Language**: "What we expect to gain from all these choices combined"
 *
 * #### Aggregate VaR95 (Value at Risk)
 * - **Formula**: Portfolio-level VaR via Iman-Conover copula approach
 * - **Interpretation**: 95th percentile worst-case loss for the portfolio
 * - **Plain Language**: "The worst loss we might see (95% confidence)"
 * - **Method**: Uses correlation matrix to account for dependencies
 *
 * #### Aggregate CVaR95 (Conditional Value at Risk)
 * - **Formula**: Portfolio-level CVaR via copula approach
 * - **Interpretation**: Expected loss given that VaR threshold is breached
 * - **Plain Language**: "If things go really bad, how bad could it get?"
 *
 * #### Diversification Index
 * - **Formula**: 1 - (Σ pairwise correlations / n²)
 * - **Range**: 0 to 1 (higher = better diversification)
 * - **Interpretation**: Measures how spread-out the portfolio is
 * - **Plain Language**: "How different the choices are from each other"
 *
 * #### Antifragility Score
 * - **Range**: 0 to 100
 * - **Current**: Placeholder heuristic (diversification + positive EV + risk/return)
 * - **Future**: Enhanced in Set 13 with advanced antifragility metrics
 * - **Plain Language**: "How sturdy or spread-out this group of choices is"
 *
 * ---
 *
 * ## Usage Examples
 *
 * ### Creating a Portfolio
 * ```typescript
 * import { createPortfolio } from "@/polymet/data/decision-portfolios";
 *
 * const portfolio = createPortfolio(tenantId, {
 *   portfolio_name: "Cloud Migration Strategy",
 *   description: "All decisions related to our cloud migration initiative",
 *   owner: "Admin User",
 *   time_horizon_months: 24,
 *   goal_alignment: "Aligns with digital transformation goals and cost optimization",
 *   decision_ids: [],
 * });
 * ```
 *
 * ### Assigning Decisions
 * ```typescript
 * import { addDecisionToPortfolio } from "@/polymet/data/decision-portfolios";
 *
 * // Add decision to portfolio
 * addDecisionToPortfolio(tenantId, portfolioId, decisionId);
 * ```
 *
 * ### Querying Portfolios
 * ```typescript
 * import {
 *   loadPortfolios,
 *   getPortfoliosForDecision,
 *   getPortfolioStats,
 * } from "@/polymet/data/decision-portfolios";
 *
 * // Get all portfolios
 * const portfolios = loadPortfolios(tenantId);
 *
 * // Get portfolios for a specific decision
 * const decisionPortfolios = getPortfoliosForDecision(tenantId, decisionId);
 *
 * // Get statistics
 * const stats = getPortfolioStats(tenantId);
 * ```
 *
 * ---
 *
 * ## Component Integration
 *
 * ### PortfolioManager Component
 * The main UI component for portfolio management:
 *
 * ```tsx
 * import { PortfolioManager } from "@/polymet/components/portfolio-manager";
 *
 * <PortfolioManager
 *   tenantId={tenant.tenantId}
 *   currentDecisionId={decisionId}
 *   currentDecisionTitle={title}
 *   onAuditEvent={addAudit}
 * />
 * ```
 *
 * **Features:**
 * - Create/edit/delete portfolios
 * - Assign decisions to portfolios
 * - Visual portfolio cards with metadata
 * - Current decision highlighting
 * - Audit event tracking
 *
 * ---
 *
 * ## Storage & Persistence
 *
 * ### LocalStorage Key Structure
 * ```
 * retina:portfolios:{tenantId}
 * ```
 *
 * ### Data Format
 * Portfolios are stored as JSON array in localStorage:
 * ```json
 * [
 *   {
 *     "id": "portfolio-1234567890-abc123",
 *     "tenantId": "t-demo",
 *     "portfolio_name": "Cloud Migration Strategy",
 *     "description": "All decisions related to cloud migration",
 *     "owner": "Admin User",
 *     "time_horizon_months": 24,
 *     "goal_alignment": "Digital transformation goals",
 *     "decision_ids": ["decision-1", "decision-2"],
 *     "createdAt": 1234567890000,
 *     "updatedAt": 1234567890000
 *   }
 * ]
 * ```
 *
 * ---
 *
 * ## Audit Events
 *
 * The portfolio system generates audit events for tracking:
 *
 * ### portfolio.created
 * ```typescript
 * {
 *   portfolioId: string;
 *   portfolioName: string;
 *   initialDecisions: number;
 * }
 * ```
 *
 * ### portfolio.updated
 * ```typescript
 * {
 *   portfolioId: string;
 *   portfolioName: string;
 * }
 * ```
 *
 * ### portfolio.deleted
 * ```typescript
 * {
 *   portfolioId: string;
 *   portfolioName: string;
 * }
 * ```
 *
 * ### decision.portfolios.updated
 * ```typescript
 * {
 *   decisionId: string;
 *   decisionTitle: string;
 *   added: number;
 *   removed: number;
 *   totalPortfolios: number;
 * }
 * ```
 *
 * ### portfolio.metrics.computed
 * ```typescript
 * {
 *   portfolioId: string;
 *   portfolioName: string;
 *   decisionsAnalyzed: number;
 *   metrics: PortfolioMetrics;
 * }
 * ```
 *
 * ---
 *
 * ## Use Cases
 *
 * ### 1. Strategic Initiatives
 * Group all decisions related to a strategic initiative:
 * - "Digital Transformation 2024"
 * - "Market Expansion APAC"
 * - "Product Line Refresh"
 *
 * ### 2. Investment Portfolios
 * Bundle investment decisions for portfolio analysis:
 * - "Q1 Capital Allocation"
 * - "R&D Investment Portfolio"
 * - "Infrastructure Upgrades"
 *
 * ### 3. Risk Management
 * Group decisions by risk category:
 * - "High-Risk Ventures"
 * - "Regulatory Compliance"
 * - "Business Continuity"
 *
 * ### 4. Departmental Decisions
 * Organize decisions by department or team:
 * - "Engineering Decisions"
 * - "Marketing Campaigns"
 * - "Operations Optimization"
 *
 * ---
 *
 * ## Best Practices
 *
 * ### Portfolio Design
 * 1. **Clear naming**: Use descriptive, meaningful names
 * 2. **Focused scope**: Keep portfolios focused on a single theme
 * 3. **Time-bound**: Set realistic time horizons
 * 4. **Goal alignment**: Clearly articulate strategic alignment
 *
 * ### Decision Assignment
 * 1. **Relevant grouping**: Only add truly related decisions
 * 2. **Multi-portfolio**: Use multiple portfolios for cross-cutting decisions
 * 3. **Regular review**: Periodically review and update assignments
 * 4. **Archive old**: Remove or archive completed portfolios
 *
 * ### Ownership
 * 1. **Clear ownership**: Assign a single owner per portfolio
 * 2. **Accountability**: Owner responsible for portfolio health
 * 3. **Regular updates**: Keep portfolio metadata current
 *
 * ---
 *
 * ## Integration Points
 *
 * ### i-Decide Module
 * - Portfolio tab in decision workflow
 * - Assign decisions during creation
 * - View portfolio context for decisions
 *
 * ### Dashboard
 * - Portfolio overview cards
 * - Decision count metrics
 * - Portfolio health indicators
 *
 * ### Audit System
 * - Track portfolio lifecycle events
 * - Monitor decision assignments
 * - Compliance reporting
 *
 * ---
 *
 * ## Future Enhancements
 *
 * ### Planned Features
 * 1. **Advanced Antifragility Metrics (Set 13)**
 *    - Convexity analysis (benefit from volatility)
 *    - Tail risk asymmetry (upside vs downside)
 *    - Stress test performance
 *    - Adaptive capacity measures
 *
 * 2. **Portfolio Optimization**
 *    - Suggest optimal decision weights
 *    - Efficient frontier analysis
 *    - Risk-adjusted portfolio recommendations
 *
 * 3. **Portfolio Visualization**
 *    - Decision relationship graphs
 *    - Timeline views
 *    - Dependency mapping
 *    - Correlation heatmaps
 *
 * 4. **Portfolio Templates**
 *    - Pre-configured portfolio types
 *    - Industry-specific templates
 *    - Quick-start wizards
 *
 * 5. **Collaboration**
 *    - Shared portfolio ownership
 *    - Portfolio comments/notes
 *    - Team notifications
 *
 * 6. **Export & Reporting**
 *    - Portfolio summary reports
 *    - CSV/PDF exports
 *    - Board-ready presentations
 *    - Metrics history tracking
 *
 * ---
 *
 * ## Technical Notes
 *
 * ### Performance Considerations
 * - Portfolios stored in localStorage (client-side)
 * - No server-side persistence in current implementation
 * - Suitable for moderate portfolio counts (<100)
 * - Consider backend storage for large-scale deployments
 *
 * ### Multi-tenancy
 * - Full tenant isolation via tenantId
 * - Separate storage keys per tenant
 * - No cross-tenant portfolio access
 *
 * ### Data Integrity
 * - Decision IDs are references only
 * - Deleting decisions doesn't auto-update portfolios
 * - Consider cleanup routines for orphaned references
 *
 * ---
 *
 * ## API Reference
 *
 * ### Core Functions
 *
 * #### loadPortfolios(tenantId: string): DecisionPortfolio[]
 * Load all portfolios for a tenant.
 *
 * #### createPortfolio(tenantId: string, data: PortfolioData): DecisionPortfolio
 * Create a new portfolio.
 *
 * #### updatePortfolio(tenantId: string, portfolioId: string, updates: Partial<PortfolioData>): DecisionPortfolio | null
 * Update an existing portfolio.
 *
 * #### deletePortfolio(tenantId: string, portfolioId: string): boolean
 * Delete a portfolio.
 *
 * #### addDecisionToPortfolio(tenantId: string, portfolioId: string, decisionId: string): boolean
 * Add a decision to a portfolio.
 *
 * #### removeDecisionFromPortfolio(tenantId: string, portfolioId: string, decisionId: string): boolean
 * Remove a decision from a portfolio.
 *
 * #### getPortfolioById(tenantId: string, portfolioId: string): DecisionPortfolio | null
 * Get a specific portfolio by ID.
 *
 * #### getPortfoliosForDecision(tenantId: string, decisionId: string): DecisionPortfolio[]
 * Get all portfolios containing a specific decision.
 *
 * #### getPortfolioStats(tenantId: string): PortfolioStats
 * Get portfolio statistics for a tenant.
 *
 * #### computePortfolioMetrics(decisions: DecisionMetricsData[]): PortfolioMetrics
 * Compute all portfolio metrics from decision data.
 *
 * #### updatePortfolioMetrics(tenantId: string, portfolioId: string, decisions: DecisionMetricsData[]): DecisionPortfolio | null
 * Compute and update portfolio metrics.
 *
 * ---
 *
 * ## Support & Feedback
 *
 * For questions, issues, or feature requests related to Decision Portfolios:
 * - Check the component render code for usage examples
 * - Review audit logs for troubleshooting
 * - Consult the terms dictionary for terminology
 *
 * ---
 *
 * **Version:** 1.0.0
 * **Last Updated:** 2025
 * **Status:** Production Ready
 */

export const PORTFOLIO_SYSTEM_VERSION = "1.0.0";
