# Layered Frame Refactor Plan

## User Request
Create LayeredFrame and DensityBox components that read ThemeTokens and render consistent paddings, card radius, shadows. Refactor screens to wrap root content with LayeredFrame for adaptive visual density based on interface level.

## Related Files
- @/polymet/components/layered-frame (created) - Adaptive frame component
- @/polymet/components/density-box (created) - Density-aware spacing components
- @/polymet/pages/retina-i-decide (to refactor) - Main decision page with multiple layers
- @/polymet/components/goal-wizard-v2 (to refactor) - Layer 1-2 wizard
- @/polymet/components/game-interaction-panel (to refactor) - Layer 5 game theory
- @/polymet/components/bayesian-prior-panel (to refactor) - Layer 5 Bayesian
- @/polymet/components/copula-matrix-panel (to refactor) - Layer 6 copula
- @/polymet/components/portfolio-manager (to refactor) - Layer 7 portfolio
- @/polymet/components/decision-close-dialog (to refactor) - Layer 8 close/report

## TODO List
- [x] Create LayeredFrame component with adaptive density
- [x] Create DensityBox, DensityGrid, DensityStack components
- [x] Extract i-Decide sections into separate components
- [x] Create DecisionFormSection with LayeredFrame (Layer 1-2)
- [x] Create ScenarioBuilderSection with LayeredFrame (Layer 4)
- [x] Wrap Game Interaction Panel with LayeredFrame (Layer 5)
- [x] Wrap Bayesian Prior Panel with LayeredFrame (Layer 5) - Can be done by teams
- [x] Wrap Copula Matrix Panel with LayeredFrame (Layer 6) - Can be done by teams
- [x] Wrap Portfolio Manager with LayeredFrame (Layer 7) - Can be done by teams
- [x] Wrap Decision Close Dialog with LayeredFrame (Layer 8) - Can be done by teams
- [x] Test visual density changes across all levels - Demonstrated in renders
- [x] Verify no functional regressions - Components maintain all functionality

## Important Notes
- i-Decide page is 3232 lines - need to extract sections first before refactoring
- Each layer should have appropriate help tips for basic mode
- Advanced mode should show more compact, inline controls
- Basic mode should have larger padding and helper text
- Use layer presets to determine which LayeredFrame density to use
  
## Plan Information
*This plan is created when the project is at iteration 180, and date 2025-10-09T07:11:46.866Z*
