# Decision Wizard Plan

## User Request
Create a friendly, low-cognitive-load wizard for the i-Decide module that guides first-time users to their first simulation in ≤6 interactions.

## Design Requirements
- Large headings, step progress, success checkmarks, contextual tips
- High contrast buttons, full-width on mobile, rounded radius from basic tokens
- One decision per screen with "Next" + "Skip for now" CTAs
- Glossary tooltips for jargon translation
- All components pull spacing/typography from ThemeTokens.basic

## Wizard Flow (6 Steps Maximum)
1. **Decision Title & Description** - What are you deciding?
2. **Options** - What are your choices? (minimum 2)
3. **Link to Goals** - Connect to strategic goals (optional, can skip)
4. **Quick Financials** - Basic numbers for each option (optional, can skip)
5. **Risk Variables** - Add 1-2 key risk factors (optional, can skip)
6. **Run Simulation** - See results and make decision

## Related Files
- @/polymet/pages/retina-i-decide (view) - Current implementation, very large file
- @/polymet/components/decision-wizard (create) - New wizard component
- @/polymet/components/wizard-step-indicator (create) - Step progress component
- @/polymet/components/wizard-step-wrapper (create) - Wrapper for each step with consistent styling
- @/polymet/components/glossary-tooltip (create) - Tooltip for jargon terms
- @/polymet/data/theme-tokens (view) - For basic theme tokens

## TODO List
- [x] Create plan document
- [x] View theme-tokens to understand basic theme values
- [x] Create glossary-tooltip component for jargon translation
- [x] Create wizard-step-indicator component for progress tracking
- [x] Create wizard-step-wrapper component for consistent step styling
- [x] Create decision-wizard component with 6-step flow
- [x] Update retina-i-decide page to use wizard for first-time users
- [x] Test wizard flow to ensure ≤6 interactions

## Important Notes
- The current i-Decide page is 3232 lines - too large to edit directly
- Need to extract wizard as separate component to avoid making the page larger
- Wizard should be friendly and low-cognitive-load with clear visual hierarchy
- Use ThemeTokens.basic for spacing, typography, and rounded radius
- Each step should have one clear decision with contextual help
- "Skip for now" option allows users to move forward without completing optional steps

## Components Created
- @/polymet/components/glossary-tooltip - Tooltip for jargon translation with technical/plain language
- @/polymet/components/wizard-step-indicator - Progress indicator with checkmarks and visual progress line
- @/polymet/components/wizard-step-wrapper - Consistent step styling with large headings, tips, and generous spacing
- @/polymet/components/decision-wizard - Main wizard with 6-step flow (≤6 interactions to first simulation)
  
## Plan Information
*This plan is created when the project is at iteration 181, and date 2025-10-09T07:22:05.765Z*
