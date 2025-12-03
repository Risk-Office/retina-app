/**
 * Expert Workbench System - README
 *
 * Dense, expert workbench for advanced analysis with split panes,
 * matrix tables, expert toggles, and statistical overlays.
 *
 * Optimized for 1440×900 resolution with 2-3 complex widgets simultaneously.
 */

// ============================================================================
// OVERVIEW
// ============================================================================

/**
 * The Expert Workbench is a comprehensive analytical environment designed for
 * advanced users who need to work with multiple complex panels simultaneously.
 *
 * Key Features:
 * - Split panes with draggable resizers (horizontal/vertical)
 * - Matrix/table hybrids with sortable and resizable columns
 * - Expert toggles for showing parameter IDs and technical details
 * - Export/import JSON for model configurations
 * - Charts with interactive features (brushing, zoom, statistical overlays)
 * - Compact typography and tight spacing from ThemeTokens.advanced
 * - "Reset to recommended defaults" action on each panel
 * - Optimized for 1440×900 with 2-3 panels visible
 */

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * 1. SplitPaneContainer
 * Location: @/polymet/components/split-pane-container
 *
 * Provides draggable split panes for horizontal or vertical layouts.
 *
 * Features:
 * - Horizontal and vertical split directions
 * - Draggable resizer with visual feedback
 * - Minimum pane size enforcement
 * - Triple split pane support (3 panels)
 * - Callback for split percentage changes
 *
 * Usage:
 * ```tsx
 * <SplitPaneContainer
 *   direction="horizontal"
 *   initialSplit={50}
 *   minSize={200}
 *   leftPane={<Panel1 />}
 *   rightPane={<Panel2 />}
 * />
 * ```
 */

/**
 * 2. ExpertMatrixTable
 * Location: @/polymet/components/expert-matrix-table
 *
 * Matrix/table hybrid with sortable and resizable columns.
 *
 * Features:
 * - Sortable columns (asc/desc/none)
 * - Resizable columns with drag handles
 * - Expert mode showing parameter IDs
 * - Custom cell renderers
 * - Row click callbacks
 * - Compact typography from advanced theme
 *
 * Usage:
 * ```tsx
 * <ExpertMatrixTable
 *   columns={[
 *     {
 *       id: "name",
 *       label: "Parameter",
 *       accessor: "name",
 *       sortable: true,
 *       parameterId: "param_name",
 *     },
 *   ]}
 *   data={scenarioVars}
 *   expertMode={true}
 *   resizable={true}
 *   sortable={true}
 * />
 * ```
 */

/**
 * 3. ExpertPanelWrapper
 * Location: @/polymet/components/expert-panel-wrapper
 *
 * Wrapper component providing expert controls for any panel.
 *
 * Features:
 * - Expert mode toggle (show/hide parameter IDs)
 * - Export configuration as JSON
 * - Import configuration from JSON
 * - Reset to recommended defaults
 * - Collapsible panels
 * - Badge support (e.g., "Beta", "Advanced")
 * - Compact styling from advanced theme
 *
 * Usage:
 * ```tsx
 * <ExpertPanelWrapper
 *   title="Scenario Configuration"
 *   description="Configure scenario parameters"
 *   badge="Advanced"
 *   config={currentConfig}
 *   defaultConfig={defaultConfig}
 *   onConfigImport={(config) => setConfig(config)}
 *   onReset={() => setConfig(defaultConfig)}
 *   expertMode={expertMode}
 *   onExpertModeChange={setExpertMode}
 * >
 *   <YourPanelContent />
 * </ExpertPanelWrapper>
 * ```
 */

/**
 * 4. CorrelationHeatmap
 * Location: @/polymet/components/correlation-heatmap
 *
 * Interactive correlation matrix visualization.
 *
 * Features:
 * - Diverging color scale (red → white → blue)
 * - Interactive cells with hover states
 * - Tooltips showing correlation values
 * - Click callbacks for cell selection
 * - Legend showing color scale
 * - Diagonal highlighting
 * - Compact cell sizing
 *
 * Usage:
 * ```tsx
 * <CorrelationHeatmap
 *   labels={["Var1", "Var2", "Var3"]}
 *   matrix={[
 *     [1.0, 0.5, -0.3],
 *     [0.5, 1.0, 0.2],
 *     [-0.3, 0.2, 1.0],
 *   ]}
 *   showValues={true}
 *   cellSize={60}
 *   onCellClick={(row, col, value) => console.log(value)}
 * />
 * ```
 */

/**
 * 5. ExpertWorkbench
 * Location: @/polymet/components/expert-workbench
 *
 * Main workbench container orchestrating all expert panels.
 *
 * Features:
 * - Single, dual, or triple layout modes
 * - Dynamic panel selection (Game, Bayesian, Copula, Correlation, Variables)
 * - Integrated with existing panels (GameInteractionPanel, BayesianPriorPanel, etc.)
 * - Configuration management across panels
 * - Audit event tracking
 * - Toast notifications
 * - Optimized for 1440×900 resolution
 *
 * Usage:
 * ```tsx
 * <ExpertWorkbench
 *   decisionId={decisionId}
 *   tenantId={tenantId}
 *   options={options}
 *   scenarioVars={scenarioVars}
 *   runs={5000}
 *   onConfigChange={(config) => console.log(config)}
 *   onAuditEvent={addAudit}
 *   onToast={toast}
 * />
 * ```
 */

// ============================================================================
// THEME TOKENS (ADVANCED LEVEL)
// ============================================================================

/**
 * The expert workbench uses ThemeTokens.advanced for compact, dense styling.
 *
 * Typography:
 * - xs: 10px (0.625rem)
 * - sm: 12px (0.75rem)
 * - base: 14px (0.875rem)
 * - lg: 16px (1rem)
 * - xl: 18px (1.125rem)
 *
 * Spacing:
 * - xs: 4px (0.25rem)
 * - sm: 6px (0.375rem)
 * - md: 8px (0.5rem)
 * - lg: 12px (0.75rem)
 * - xl: 16px (1rem)
 *
 * Radius:
 * - sm: 2px (0.125rem)
 * - md: 4px (0.25rem)
 * - lg: 6px (0.375rem)
 * - xl: 8px (0.5rem)
 *
 * Line Height:
 * - tight: 1.15
 * - normal: 1.35
 * - relaxed: 1.5
 *
 * These values create a dense, information-rich interface suitable for
 * expert users who need to see multiple complex widgets simultaneously.
 */

// ============================================================================
// LAYOUT MODES
// ============================================================================

/**
 * Single Mode:
 * - One panel at full width
 * - Maximum detail for complex analysis
 * - Best for deep-dive into a single panel
 *
 * Dual Mode (Default):
 * - Two panels side-by-side (50/50 split)
 * - Draggable resizer between panels
 * - Optimal for comparing two analyses
 * - Recommended for 1440×900 resolution
 *
 * Triple Mode:
 * - Three panels (33/33/33 split)
 * - Two draggable resizers
 * - Maximum information density
 * - Best for 1920×1080 or larger
 * - Still usable at 1440×900 with 350px minimum per panel
 */

// ============================================================================
// PANEL TYPES
// ============================================================================

/**
 * Game Interaction (2×2):
 * - Strategy-based multipliers
 * - 2×2 payoff matrix
 * - Option strategy configuration
 * - Export/import game config
 *
 * Bayesian Prior:
 * - Conjugate Normal-Normal updating
 * - Prior and posterior visualization
 * - Variable selection
 * - Export/import Bayesian config
 *
 * Copula Matrix:
 * - k×k correlation matrix editor
 * - Iman-Conover reordering
 * - Frobenius error tracking
 * - Heatmap visualization
 * - Export/import copula config
 *
 * Correlation Heatmap:
 * - Visual correlation matrix
 * - Interactive cells
 * - Diverging color scale
 * - Click to inspect correlations
 *
 * Scenario Variables:
 * - Matrix table view
 * - Sortable and resizable columns
 * - Expert mode with parameter IDs
 * - Row selection
 */

// ============================================================================
// EXPERT MODE FEATURES
// ============================================================================

/**
 * When Expert Mode is enabled:
 *
 * 1. Parameter IDs are shown in brackets
 *    Example: "Market Volatility [param_vol]"
 *
 * 2. Technical details are visible
 *    - Distribution parameters
 *    - Correlation coefficients
 *    - Statistical measures
 *
 * 3. Advanced controls are accessible
 *    - Export/import JSON
 *    - Reset to defaults
 *    - Fine-grained configuration
 *
 * 4. Compact typography is used
 *    - Smaller font sizes
 *    - Tighter line heights
 *    - Reduced spacing
 *
 * 5. Matrix tables show all columns
 *    - Including technical columns
 *    - With parameter IDs
 *    - Sortable and resizable
 */

// ============================================================================
// EXPORT/IMPORT JSON
// ============================================================================

/**
 * Configuration Export:
 * - Click the download icon in panel header
 * - Downloads JSON file with current configuration
 * - Filename: "{panel-name}-config.json"
 * - Includes all panel-specific settings
 *
 * Configuration Import:
 * - Click the upload icon in panel header
 * - Select JSON file from file picker
 * - Validates and applies configuration
 * - Shows error if format is invalid
 *
 * JSON Format Example (Game Interaction):
 * ```json
 * {
 *   "enabled": true,
 *   "myStrategy": "cooperate",
 *   "theirStrategy": "defect",
 *   "payoffMatrix": {
 *     "cooperate_cooperate": 1.2,
 *     "cooperate_defect": 0.8,
 *     "defect_cooperate": 1.5,
 *     "defect_defect": 0.9
 *   }
 * }
 * ```
 */

// ============================================================================
// RESET TO DEFAULTS
// ============================================================================

/**
 * Each panel has a "Reset to recommended defaults" button (rotate icon).
 *
 * Clicking reset will:
 * 1. Clear current configuration
 * 2. Restore default values
 * 3. Show confirmation toast
 * 4. Trigger audit event
 *
 * Default configurations are defined per panel:
 * - Game: No game interaction (undefined)
 * - Bayesian: No prior override (undefined)
 * - Copula: No correlation matrix (undefined)
 * - Variables: Original scenario variables
 */

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Planned keyboard shortcuts (not yet implemented):
 *
 * Layout:
 * - Cmd/Ctrl + 1: Single mode
 * - Cmd/Ctrl + 2: Dual mode
 * - Cmd/Ctrl + 3: Triple mode
 *
 * Panels:
 * - Cmd/Ctrl + G: Focus Game panel
 * - Cmd/Ctrl + B: Focus Bayesian panel
 * - Cmd/Ctrl + C: Focus Copula panel
 * - Cmd/Ctrl + H: Focus Correlation heatmap
 * - Cmd/Ctrl + V: Focus Variables table
 *
 * Actions:
 * - Cmd/Ctrl + E: Toggle expert mode
 * - Cmd/Ctrl + S: Export current panel config
 * - Cmd/Ctrl + R: Reset current panel
 */

// ============================================================================
// PERFORMANCE CONSIDERATIONS
// ============================================================================

/**
 * Optimization strategies:
 *
 * 1. Lazy rendering:
 *    - Only render visible panels
 *    - Unmount collapsed panels
 *
 * 2. Memoization:
 *    - Use React.memo for expensive components
 *    - useMemo for computed values
 *    - useCallback for event handlers
 *
 * 3. Virtual scrolling:
 *    - For large matrix tables (>1000 rows)
 *    - For correlation heatmaps (>20×20)
 *
 * 4. Debouncing:
 *    - Resize events (100ms)
 *    - Sort events (50ms)
 *    - Filter events (200ms)
 *
 * 5. Web Workers:
 *    - Matrix computations
 *    - Correlation calculations
 *    - Large data transformations
 */

// ============================================================================
// ACCESSIBILITY
// ============================================================================

/**
 * Accessibility features:
 *
 * 1. Keyboard navigation:
 *    - Tab through all interactive elements
 *    - Enter/Space to activate buttons
 *    - Arrow keys for table navigation
 *
 * 2. Screen reader support:
 *    - ARIA labels on all controls
 *    - ARIA live regions for updates
 *    - Semantic HTML structure
 *
 * 3. Focus management:
 *    - Visible focus indicators
 *    - Focus trap in modals
 *    - Logical focus order
 *
 * 4. Color contrast:
 *    - WCAG AA compliant
 *    - High contrast mode support
 *    - Color-blind friendly palettes
 *
 * 5. Responsive design:
 *    - Works at 1440×900 minimum
 *    - Scales up to 4K
 *    - Touch-friendly on tablets
 */

// ============================================================================
// INTEGRATION WITH I-DECIDE
// ============================================================================

/**
 * The Expert Workbench is integrated into the i-Decide page as a new tab.
 *
 * Location: @/polymet/pages/retina-i-decide
 * Tab: "Expert Workbench" (7th tab)
 *
 * Requirements:
 * - Decision must be created (currentDecisionId exists)
 * - Scenario variables must be defined (scenarioVars.length > 0)
 *
 * Integration points:
 * 1. Configuration changes flow back to parent state
 * 2. Audit events are logged via addAudit callback
 * 3. Toast notifications use parent toast function
 * 4. Panel configurations sync with main simulation
 *
 * State synchronization:
 * - gameConfig ↔ Expert Game panel
 * - bayesianConfig ↔ Expert Bayesian panel
 * - copulaConfig ↔ Expert Copula panel
 * - scenarioVars ↔ Expert Variables table
 */

// ============================================================================
// FUTURE ENHANCEMENTS
// ============================================================================

/**
 * Planned features:
 *
 * 1. Chart brushing and zoom:
 *    - Select regions in charts
 *    - Zoom into specific data ranges
 *    - Linked brushing across panels
 *
 * 2. Quantile overlays:
 *    - Show P10, P25, P50, P75, P90 on charts
 *    - Confidence intervals
 *    - Statistical bands
 *
 * 3. Portfolio optimizer panel:
 *    - Efficient frontier visualization
 *    - Constraint management
 *    - Optimization algorithms
 *
 * 4. Sensitivity analysis panel:
 *    - Tornado charts
 *    - Spider plots
 *    - Parameter sweep visualization
 *
 * 5. Custom panel builder:
 *    - Drag-and-drop components
 *    - Custom chart configurations
 *    - Save/load custom layouts
 *
 * 6. Collaborative features:
 *    - Share panel configurations
 *    - Comment on specific cells/values
 *    - Real-time collaboration
 *
 * 7. Advanced filtering:
 *    - Multi-column filters
 *    - Custom filter expressions
 *    - Saved filter presets
 *
 * 8. Data export:
 *    - Export visible data as CSV
 *    - Export charts as PNG/SVG
 *    - Export full report as PDF
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Common issues and solutions:
 *
 * Issue: Panels not resizing properly
 * Solution: Check minSize prop (default 200px, triple mode needs 350px)
 *
 * Issue: Expert mode toggle not working
 * Solution: Ensure onExpertModeChange callback is provided
 *
 * Issue: JSON import fails
 * Solution: Validate JSON format matches expected schema
 *
 * Issue: Correlation heatmap shows wrong colors
 * Solution: Ensure matrix values are in [-1, 1] range
 *
 * Issue: Matrix table columns not sortable
 * Solution: Set sortable: true in column definition
 *
 * Issue: Performance issues with large datasets
 * Solution: Enable virtual scrolling or pagination
 *
 * Issue: Layout breaks at 1440×900
 * Solution: Use dual mode instead of triple mode
 */

// ============================================================================
// EXAMPLES
// ============================================================================

/**
 * Example 1: Basic dual-pane workbench
 * ```tsx
 * <ExpertWorkbench
 *   decisionId="dec-123"
 *   tenantId="tenant-456"
 *   options={[
 *     { id: "opt-1", label: "Option A" },
 *     { id: "opt-2", label: "Option B" },
 *   ]}
 *   scenarioVars={DEFAULT_SCENARIO_VARS}
 *   runs={5000}
 *   onConfigChange={(config) => {
 *     console.log("Config changed:", config);
 *   }}
 *   onAuditEvent={(type, payload) => {
 *     console.log("Audit:", type, payload);
 *   }}
 *   onToast={(message) => {
 *     console.log("Toast:", message);
 *   }}
 * />
 * ```
 *
 * Example 2: Custom matrix table
 * ```tsx
 * <ExpertMatrixTable
 *   columns={[
 *     {
 *       id: "name",
 *       label: "Parameter",
 *       accessor: "name",
 *       sortable: true,
 *       width: 200,
 *       parameterId: "param_name",
 *     },
 *     {
 *       id: "value",
 *       label: "Value",
 *       accessor: "value",
 *       sortable: true,
 *       width: 120,
 *       align: "right",
 *       cell: (value) => value.toFixed(3),
 *     },
 *   ]}
 *   data={scenarioVars}
 *   expertMode={true}
 *   resizable={true}
 *   sortable={true}
 *   onRowClick={(row) => {
 *     console.log("Selected:", row);
 *   }}
 * />
 * ```
 *
 * Example 3: Correlation heatmap
 * ```tsx
 * <CorrelationHeatmap
 *   labels={["Var1", "Var2", "Var3", "Var4"]}
 *   matrix={[
 *     [1.0, 0.5, -0.3, 0.2],
 *     [0.5, 1.0, 0.1, -0.4],
 *     [-0.3, 0.1, 1.0, 0.6],
 *     [0.2, -0.4, 0.6, 1.0],
 *   ]}
 *   showValues={true}
 *   cellSize={60}
 *   onCellClick={(row, col, value) => {
 *     console.log(`Correlation: ${labels[row]} × ${labels[col]} = ${value}`);
 *   }}
 * />
 * ```
 */

export const EXPERT_WORKBENCH_README = {
  version: "1.0.0",
  lastUpdated: "2025-01-10",
  components: [
    "SplitPaneContainer",
    "ExpertMatrixTable",
    "ExpertPanelWrapper",
    "CorrelationHeatmap",
    "ExpertWorkbench",
  ],

  features: [
    "Split panes with draggable resizers",
    "Matrix tables with sortable/resizable columns",
    "Expert mode with parameter IDs",
    "Export/import JSON configurations",
    "Reset to recommended defaults",
    "Correlation heatmap visualization",
    "Compact typography from advanced theme",
    "Optimized for 1440×900 resolution",
  ],

  status: "Production Ready",
};
