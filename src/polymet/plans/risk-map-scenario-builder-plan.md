# Risk Map and Scenario Builder Analytical Structure

## User Request
Create an analytical structure for Risk Map and Scenario Builder with:
- Grid layout with side info panel
- Collapsible sections
- Table cards with subtle acrylic backgrounds
- Inline "info" micro-tips
- Tidy grid charts with axis labels, units, and accessible legends
- Keyboard navigation and focus rings per Carbon accessibility guidance
- Pull density, radius, typography from ThemeTokens.intermediate
- No horizontal scroll at 1280px
- Screen reader reads section headings logically

## Related Files
- @/polymet/pages/retina-i-decide (to view) - Large file (3359 lines), need to extract scenario builder section
- @/polymet/components/scenario-builder-section (exists) - Already extracted, need to enhance with new structure
- @/polymet/data/theme-tokens (to view) - For intermediate theme tokens
- @/polymet/components/layered-frame (exists) - For density-aware layout

## TODO List
- [x] View theme-tokens to understand intermediate level tokens
- [x] Create info-micro-tip component for inline help
- [x] Create scenario-variable-card component with acrylic background
- [x] Create risk-map-panel component with grid layout and info panel
- [x] Ensure keyboard navigation and ARIA labels
- [x] Test responsive layout at 1280px
- [ ] Integration: Update i-Decide page to use RiskMapPanel (optional)

## Important Notes
- i-Decide page is 3359 lines - avoided making it larger by creating separate components
- Used ThemeTokens.intermediate for spacing, typography, radius throughout
- Implemented Carbon Design System accessibility patterns:
  - Keyboard navigation (Tab, Enter, Space, Escape)
  - Focus rings with ring-2 ring-ring ring-offset-2
  - ARIA labels, roles, and expanded states
  - Screen reader friendly structure
- Collapsible sections with proper ARIA attributes (aria-expanded, aria-controls)
- Responsive grid: 8 cols (main) + 4 cols (info panel) on desktop, stacks on mobile
- No horizontal scroll at 1280px - tested with max-w constraints

## Components Created
1. **info-micro-tip** - Inline tooltip with accessible keyboard nav
2. **scenario-variable-card** - Card with acrylic background (backdrop-blur-sm bg-card/80)
3. **risk-map-panel** - Main panel with grid layout and collapsible sections
  
## Plan Information
*This plan is created when the project is at iteration 182, and date 2025-10-09T17:33:28.517Z*
