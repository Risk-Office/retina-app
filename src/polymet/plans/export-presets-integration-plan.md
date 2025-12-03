# Export Presets Integration Plan

## User Request
Integrate export presets with Board Summary Generator, add more preset options (Compliance, Audit), create PDF generation logic that respects preset rules, and add preset customization UI for creating custom presets.

## Related Files
- @/polymet/data/export-presets (view) - Core preset configurations
- @/polymet/components/export-preset-dialog (view) - Preset selection dialog
- @/polymet/components/board-summary-generator (edit) - Large file (1207 lines) - needs integration
- @/polymet/data/jspdf-generator (view) - PDF generation utilities
- @/polymet/data/board-summary-templates (view) - Report templates

## TODO List
- [x] View board-summary-generator to understand current implementation
- [x] View export-presets and export-preset-dialog
- [x] Add Compliance and Audit presets to export-presets
- [x] Create PDF generator that respects preset rules
- [x] Create preset customization UI component
- [x] Integrate export-preset-dialog with board-summary-generator
- [x] Update board-summary-generator to use preset-based PDF generation
- [x] Test integration with all presets

## Important Notes
- Board Summary Generator is a large file (1207 lines) - avoid making it larger
- Current PDF export uses simple window.print() - needs proper PDF generation
- Need to respect preset rules: margins, typography, content sections, table limits
- Presets should read from ThemeTokens for brand consistency
- Support tenant branding (logo, colors, watermark)

  
## Plan Information
*This plan is created when the project is at iteration 197, and date 2025-10-09T19:39:26.018Z*
