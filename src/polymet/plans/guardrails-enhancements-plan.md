# Guardrails Enhancements Plan

## User Request
Add comprehensive guardrails enhancements:
1. Email notifications when guardrails are violated
2. Guardrails summary in Board Summary Generator
3. Enhanced audit logging for guardrails
4. Guardrail templates for common scenarios
5. Historical tracking of guardrail violations over time

## Related Files
- @/polymet/data/decision-guardrails (to update) - Add templates, historical tracking, email notifications
- @/polymet/components/guardrails-drawer (to update) - Integrate templates and notifications
- @/polymet/components/board-summary-generator (to view/update) - Add guardrails section (LARGE FILE - 1134 lines)
- @/polymet/components/option-summary-cards (to update) - Add violation notifications
- @/polymet/pages/retina-audit (to update) - Add guardrails filter
- @/polymet/data/email-backend (to view) - Understand email system

## TODO List
- [x] View existing files to understand structure
- [x] Create guardrail templates data file
- [x] Create guardrail violation history tracking system
- [x] Create email notification system for violations
- [x] Update decision-guardrails with new features
- [x] Update guardrails-drawer to support templates (partial - added handlers)
- [x] Create guardrails summary component for board generator
- [x] Update board-summary-generator to include guardrails
- [ ] Update option-summary-cards with violation alerts
- [x] Update audit page with guardrails filter
- [x] Add configurable auto-adjustment parameters (per-tenant)
- [x] Implement smart severity-based adjustments
- [x] Create email notification system for auto-adjustments
- [x] Create dashboard widget for adjustment trends
- [x] Create configuration dialog for auto-adjust settings
- [x] Update outcome logger with tenantId parameter
- [x] Integrate widget into dashboard

## Important Notes
- board-summary-generator is a LARGE FILE (1134 lines) - create separate component for guardrails section
- Email notifications should be configurable per guardrail
- Historical tracking should store violation events with timestamps
- Templates should cover common scenarios: VaR limits, RAROC thresholds, credit risk, etc.
- Audit events should include comprehensive guardrail metadata

### Auto-Adjustment Enhancements (Iteration 95)
- Created configurable per-tenant parameters: breach window, threshold count, tightening percent
- Implemented smart severity-based adjustments (5%, 10%, 15%, 20% based on breach severity)
- Created email notification system with HTML templates
- Created dashboard widget showing adjustment trends with charts
- Created configuration dialog for managing auto-adjust settings
- Updated outcome logger to use tenantId for config loading
- Integrated widget into dashboard with configuration button

  
## Plan Information
*This plan is created when the project is at iteration 91, and date 2025-10-06T05:09:04.611Z*
