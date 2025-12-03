# Expert Workbench System Plan

## User Request
Create dense, expert workbench for Game/Bayesian/Copula/Portfolio panels with:
- Split panes with draggable resizers
- Matrix/table hybrids (sortable, resizable columns)
- Expert toggles (show parameter IDs, export/import JSON)
- Charts with brushing/zoom and statistical overlays (quantiles, correlation heatmaps)
- Compact typography and tight spacing from ThemeTokens.advanced
- "Reset to recommended defaults" action on each panel
- Support 2-3 complex widgets simultaneously at 1440×900

## Related Files
- @/polymet/data/theme-tokens (to view) - Advanced theme tokens
- @/polymet/components/split-pane-container (to create) - Draggable split pane system
- @/polymet/components/expert-matrix-table (to create) - Matrix/table hybrid with sorting and resizing
- @/polymet/components/expert-panel-wrapper (to create) - Wrapper with expert toggles and reset
- @/polymet/components/expert-game-panel (to create) - Advanced Game Interaction panel
- @/polymet/components/expert-bayesian-panel (to create) - Advanced Bayesian Prior panel
- @/polymet/components/expert-copula-panel (to create) - Advanced Copula Matrix panel
- @/polymet/components/expert-portfolio-panel (to create) - Advanced Portfolio Optimizer panel
- @/polymet/components/correlation-heatmap (to create) - Correlation heatmap visualization
- @/polymet/components/quantile-overlay (to create) - Statistical quantile overlay
- @/polymet/components/expert-workbench (to create) - Main workbench container
- @/polymet/pages/retina-i-decide (to update) - Add expert mode toggle

## TODO List
- [x] View theme tokens to understand advanced level
- [x] Create split pane container with draggable resizers
- [x] Create expert matrix table component
- [x] Create expert panel wrapper with toggles and reset
- [x] Create correlation heatmap visualization
- [x] Create main expert workbench container
- [x] Update i-Decide page with expert mode toggle

## Important Notes
- Use ThemeTokens.advanced for compact typography and tight spacing
- Support 1440×900 resolution with 2-3 widgets visible
- All panels must have export/import JSON functionality
- All panels must have "Reset to recommended defaults" button
- Matrix tables must support column sorting and resizing
- Charts must support brushing/zoom interactions
- Show parameter IDs in expert mode
- Use semantic colors and proper accessibility

  
## Plan Information
*This plan is created when the project is at iteration 183, and date 2025-10-09T17:42:31.308Z*
