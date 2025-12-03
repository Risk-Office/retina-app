/**
 * Export Presets System - README
 *
 * Complete documentation for the Layer 8 export preset system with Executive and Technical presets.
 */

export const EXPORT_PRESETS_README = `
# Export Presets System

## Overview

The Export Presets system provides two professionally designed report templates for Layer 8 (Decision finalization & export):

1. **Executive Preset (Intermediate)** - Board-ready reports with friendly language
2. **Technical Preset (Advanced)** - Comprehensive reports with full technical details

Both presets read from ThemeTokens to maintain brand consistency and support tenant logo injection.

---

## Architecture

### Core Components

\`\`\`
data/export-presets.ts          → Preset configurations and utilities
components/export-preset-dialog  → UI for preset selection
data/theme-tokens.ts            → Theme token source (spacing, typography, etc.)
\`\`\`

### Data Flow

\`\`\`
1. User opens export dialog
2. Selects preset (Executive or Technical)
3. System applies ThemeTokens to preset
4. System applies tenant branding (logo, colors)
5. User configures additional options
6. Export is generated with preset rules
\`\`\`

---

## Preset Comparison

| Feature | Executive (Intermediate) | Technical (Advanced) |
|---------|-------------------------|---------------------|
| **Target Audience** | Board members, executives | Analysts, technical staff |
| **Page Orientation** | Portrait | Landscape |
| **Margins** | 72px (1 inch) | 36px (0.5 inch) |
| **Columns** | 1 | 2 |
| **Title Size** | 24px | 20px |
| **Body Size** | 14px | 13px |
| **Line Height** | 1.6 | 1.4 |
| **Table Rows** | Limited to 10 | Unlimited |
| **Friendly Titles** | ✅ Yes | ❌ No |
| **Descriptive Captions** | ✅ Yes | ❌ No |
| **Executive Summary** | ✅ Included | ❌ Excluded |
| **Parameter Appendix** | ❌ Excluded | ✅ Included |
| **Model Snapshots** | ❌ Excluded | ✅ Included |
| **Sensitivity Analysis** | ❌ Excluded | ✅ Included |
| **Chart Size** | Large | Small |
| **Sparklines** | ❌ No | ✅ Yes |
| **Table Density** | Comfortable | Compact |

---

## Usage Examples

### 1. Basic Usage

\`\`\`typescript
import { getPresetConfig, applyThemeTokensToPreset } from "@/polymet/data/export-presets";

// Get preset configuration
const preset = getPresetConfig("executive");

// Apply theme tokens for brand consistency
const themedPreset = applyThemeTokensToPreset(preset);

// Use preset settings
console.log(themedPreset.typography.titleSize); // 24px from ThemeTokens
console.log(themedPreset.content.useFriendlyTitles); // true
\`\`\`

### 2. Apply Tenant Branding

\`\`\`typescript
import { applyTenantBranding } from "@/polymet/data/export-presets";

const tenantBranding = {
  logoUrl: "https://example.com/logo.png",
  logoWidth: 120,
  logoHeight: 40,
  companyName: "Acme Corporation",
  primaryColor: "#3b82f6",
  secondaryColor: "#8b5cf6",
  accentColor: "#06b6d4",
  watermarkText: "Confidential - Internal Use Only",
};

const brandedPreset = applyTenantBranding(preset, tenantBranding);
\`\`\`

### 3. Generate Section Titles

\`\`\`typescript
import { getSectionTitle, SECTION_TITLES } from "@/polymet/data/export-presets";

// Executive preset uses friendly titles
const executiveTitle = getSectionTitle(
  SECTION_TITLES.metrics.technical,    // "Simulation Results"
  SECTION_TITLES.metrics.friendly,     // "What the Numbers Tell Us"
  executivePreset
);
// Result: "What the Numbers Tell Us"

// Technical preset uses technical titles
const technicalTitle = getSectionTitle(
  SECTION_TITLES.metrics.technical,
  SECTION_TITLES.metrics.friendly,
  technicalPreset
);
// Result: "Simulation Results"
\`\`\`

### 4. Filter Table Rows

\`\`\`typescript
import { filterTableRows } from "@/polymet/data/export-presets";

const allRows = [/* 50 rows */];

// Executive preset limits to 10 rows
const executiveRows = filterTableRows(allRows, executivePreset);
// Result: First 10 rows

// Technical preset shows all rows
const technicalRows = filterTableRows(allRows, technicalPreset);
// Result: All 50 rows
\`\`\`

### 5. Generate Table Captions

\`\`\`typescript
import { getTableCaption } from "@/polymet/data/export-presets";

// Executive preset uses descriptive captions
const executiveCaption = getTableCaption(
  "Top Options",
  "The following table shows the top 10 options ranked by expected utility, helping you identify the most promising choices.",
  executivePreset
);
// Result: Long descriptive caption

// Technical preset uses short captions
const technicalCaption = getTableCaption(
  "Top Options",
  "The following table shows...",
  technicalPreset
);
// Result: "Top Options"
\`\`\`

---

## Section Title Mappings

The system provides friendly alternatives for all technical terms:

| Technical Title | Friendly Title |
|----------------|----------------|
| Executive Summary | Key Insights at a Glance |
| Simulation Results | What the Numbers Tell Us |
| Sensitivity Analysis | What Matters Most |
| Key Assumptions | What We're Assuming |
| Risk Guardrails | Safety Limits |
| Partner Exposure | Who We're Working With |
| Model Parameters | Technical Details |
| Model Configuration | How We Ran the Analysis |

---

## Theme Token Integration

Both presets read typography settings from ThemeTokens to ensure brand consistency:

\`\`\`typescript
// ThemeTokens for Intermediate (Executive)
{
  typography: {
    title: "24px",
    heading: "18px",
    body: "14px",
    caption: "12px",
    lineHeight: 1.6,
  }
}

// ThemeTokens for Advanced (Technical)
{
  typography: {
    title: "20px",
    heading: "16px",
    body: "13px",
    caption: "11px",
    lineHeight: 1.4,
  }
}
\`\`\`

The \`applyThemeTokensToPreset()\` function automatically merges these values into the preset configuration.

---

## Export Dialog Component

The \`ExportPresetDialog\` component provides a user-friendly interface for:

1. **Preset Selection** - Choose between Executive and Technical
2. **Format Selection** - PDF, CSV, Excel, or JSON
3. **Live Preview** - See preset settings before export
4. **Additional Options** - Timestamp, user info, custom filename
5. **Branding Preview** - Shows tenant logo and colors

### Usage

\`\`\`typescript
import { ExportPresetDialog } from "@/polymet/components/export-preset-dialog";

<ExportPresetDialog
  open={open}
  onOpenChange={setOpen}
  decisionTitle="Q4 Marketing Campaign"
  onExport={(options) => {
    // Generate report with options.preset
    // Apply options.tenantBranding
    // Save as options.format
  }}
  tenantBranding={{
    logoUrl: "https://example.com/logo.png",
    companyName: "Acme Corp",
    primaryColor: "#3b82f6",
  }}
/>
\`\`\`

---

## Integration with Board Summary Generator

The export presets integrate seamlessly with the existing Board Summary Generator:

\`\`\`typescript
import { BoardSummaryGenerator } from "@/polymet/components/board-summary-generator";
import { getPresetConfig, applyThemeTokensToPreset } from "@/polymet/data/export-presets";

const preset = applyThemeTokensToPreset(getPresetConfig("executive"));

<BoardSummaryGenerator
  decisionTitle="Q4 Campaign"
  chosenOptionId="opt-1"
  chosenOptionLabel="Digital Focus"
  simulationResults={results}
  topSensitiveFactors={factors}
  partners={partners}
  onAuditEvent={handleAudit}
  plainLanguage={preset.content.useFriendlyTitles}
  // Pass preset configuration to customize output
/>
\`\`\`

---

## Acceptance Criteria

✅ **Both presets generate with coherent styling from active level**
- Executive preset uses Intermediate ThemeTokens (24px title, 1.6 line height)
- Technical preset uses Advanced ThemeTokens (20px title, 1.4 line height)

✅ **Tenant logo injection supported**
- \`applyTenantBranding()\` function accepts logo URL, dimensions, and colors
- Branding preview shown in export dialog

✅ **Friendly vs technical titles**
- Executive preset: "What the Numbers Tell Us"
- Technical preset: "Simulation Results"

✅ **Descriptive vs short captions**
- Executive preset: Full explanatory captions
- Technical preset: Concise labels

✅ **Content filtering**
- Executive preset: Top 10 rows, no appendices
- Technical preset: All rows, full appendices

✅ **Layout differences**
- Executive: Portrait, 1 column, 72px margins
- Technical: Landscape, 2 columns, 36px margins

---

## Future Enhancements

1. **Custom Presets** - Allow users to create and save custom presets
2. **Template Library** - Industry-specific templates (Finance, Healthcare, etc.)
3. **Interactive Preview** - Live preview of generated report
4. **Batch Export** - Export multiple decisions with same preset
5. **Email Integration** - Send reports directly from export dialog
6. **Version History** - Track changes to preset configurations

---

## Related Files

- \`data/export-presets.ts\` - Core preset configurations
- \`components/export-preset-dialog.tsx\` - UI component
- \`data/theme-tokens.ts\` - Theme token definitions
- \`components/board-summary-generator.tsx\` - Report generation
- \`data/jspdf-generator.ts\` - PDF export implementation
- \`data/csv-export-utils.ts\` - CSV export utilities

---

## Testing

\`\`\`typescript
// Test preset configuration
const preset = getPresetConfig("executive");
expect(preset.content.useFriendlyTitles).toBe(true);
expect(preset.content.maxTableRows).toBe(10);

// Test theme token application
const themedPreset = applyThemeTokensToPreset(preset);
expect(themedPreset.typography.titleSize).toBe(24);

// Test tenant branding
const brandedPreset = applyTenantBranding(preset, branding);
expect(brandedPreset.branding.customColors?.primary).toBe("#3b82f6");

// Test section titles
const title = getSectionTitle("Technical", "Friendly", preset);
expect(title).toBe("Friendly");

// Test table filtering
const filtered = filterTableRows([1,2,3,4,5,6,7,8,9,10,11], preset);
expect(filtered.length).toBe(10);
\`\`\`

---

## Summary

The Export Presets system provides a robust, theme-aware solution for generating professional reports at Layer 8. By reading from ThemeTokens and supporting tenant branding, it ensures brand consistency while offering flexibility for different audiences (executives vs. technical staff).

**Key Benefits:**
- 🎨 Brand consistency through ThemeTokens
- 🏢 Tenant logo and color injection
- 📊 Audience-appropriate content and styling
- 🔧 Extensible architecture for custom presets
- ✅ Meets all Layer 8 acceptance criteria
`;

export default EXPORT_PRESETS_README;
