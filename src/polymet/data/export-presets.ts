import { ThemeTokens } from "@/polymet/data/theme-tokens";

/**
 * Export Presets
 *
 * Two report generation presets that match Layer 8 (Decision finalization & export) needs:
 * - Executive (intermediate): Larger margins, descriptive captions, limited tables, friendly titles
 * - Technical (advanced): Dense tables, parameter appendices, model snapshots
 *
 * Both presets read from ThemeTokens to maintain brand consistency and support tenant logo injection.
 */

// ============================================================================
// Types
// ============================================================================

export type ExportPresetType =
  | "executive"
  | "technical"
  | "compliance"
  | "audit";

export interface ExportPresetConfig {
  type: ExportPresetType;
  name: string;
  description: string;

  // Layout settings
  layout: {
    pageSize: "letter" | "a4";
    orientation: "portrait" | "landscape";
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    columnCount: 1 | 2;
  };

  // Typography settings (from ThemeTokens)
  typography: {
    titleSize: number;
    headingSize: number;
    bodySize: number;
    captionSize: number;
    lineHeight: number;
    fontFamily: string;
  };

  // Content settings
  content: {
    includeExecutiveSummary: boolean;
    includeDetailedMetrics: boolean;
    includeParameterAppendix: boolean;
    includeModelSnapshots: boolean;
    includeAssumptions: boolean;
    includeGuardrails: boolean;
    includeSensitivityAnalysis: boolean;
    includePartnerDetails: boolean;
    maxTableRows: number | null; // null = unlimited
    useFriendlyTitles: boolean;
    useDescriptiveCaptions: boolean;
  };

  // Visual settings
  visual: {
    includeCharts: boolean;
    chartSize: "small" | "medium" | "large";
    includeSparklines: boolean;
    colorScheme: "color" | "grayscale";
    tableDensity: "compact" | "normal" | "comfortable";
  };

  // Branding
  branding: {
    includeLogo: boolean;
    includeWatermark: boolean;
    includeFooter: boolean;
    customColors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  };
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Get theme tokens for a specific interface level
 */
const getThemeTokens = (level: "intermediate" | "advanced"): ThemeTokens => {
  const tokens: Record<"intermediate" | "advanced", ThemeTokens> = {
    intermediate: {
      spacing: {
        section: "24px",
        card: "16px",
        element: "12px",
        inline: "8px",
      },
      typography: {
        title: "24px",
        heading: "18px",
        body: "14px",
        caption: "12px",
        lineHeight: 1.6,
      },
      border: {
        width: "1px",
        radius: "8px",
      },
      shadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
        hover: "0 4px 12px rgba(0,0,0,0.12)",
      },
      animation: {
        duration: "200ms",
        easing: "ease-in-out",
      },
    },
    advanced: {
      spacing: {
        section: "16px",
        card: "12px",
        element: "8px",
        inline: "4px",
      },
      typography: {
        title: "20px",
        heading: "16px",
        body: "13px",
        caption: "11px",
        lineHeight: 1.4,
      },
      border: {
        width: "1px",
        radius: "4px",
      },
      shadow: {
        card: "0 1px 4px rgba(0,0,0,0.06)",
        hover: "0 2px 8px rgba(0,0,0,0.1)",
      },
      animation: {
        duration: "150ms",
        easing: "ease-out",
      },
    },
  };
  return tokens[level];
};

/**
 * Executive Preset (Intermediate Level)
 *
 * Designed for board members and senior stakeholders:
 * - Larger margins for readability
 * - Descriptive captions explaining context
 * - Limited tables (top 5-10 items)
 * - Friendly, plain-language titles
 * - Focus on insights over raw data
 */
export const EXECUTIVE_PRESET: ExportPresetConfig = {
  type: "executive",
  name: "Executive Summary",
  description: "Board-ready report with clear insights and friendly language",

  layout: {
    pageSize: "letter",
    orientation: "portrait",
    margins: {
      top: 72, // 1 inch
      right: 72,
      bottom: 72,
      left: 72,
    },
    columnCount: 1,
  },

  typography: {
    titleSize: 24,
    headingSize: 18,
    bodySize: 14,
    captionSize: 12,
    lineHeight: 1.6,
    fontFamily: "Inter, system-ui, sans-serif",
  },

  content: {
    includeExecutiveSummary: true,
    includeDetailedMetrics: false,
    includeParameterAppendix: false,
    includeModelSnapshots: false,
    includeAssumptions: true,
    includeGuardrails: true,
    includeSensitivityAnalysis: false,
    includePartnerDetails: true,
    maxTableRows: 10,
    useFriendlyTitles: true,
    useDescriptiveCaptions: true,
  },

  visual: {
    includeCharts: true,
    chartSize: "large",
    includeSparklines: false,
    colorScheme: "color",
    tableDensity: "comfortable",
  },

  branding: {
    includeLogo: true,
    includeWatermark: false,
    includeFooter: true,
  },
};

/**
 * Technical Preset (Advanced Level)
 *
 * Designed for analysts and technical stakeholders:
 * - Smaller margins to maximize content
 * - Dense tables with all data points
 * - Parameter appendices with full details
 * - Model snapshots and technical terms
 * - Focus on completeness and precision
 */
export const TECHNICAL_PRESET: ExportPresetConfig = {
  type: "technical",
  name: "Technical Report",
  description: "Comprehensive report with full data and model details",

  layout: {
    pageSize: "letter",
    orientation: "landscape",
    margins: {
      top: 36, // 0.5 inch
      right: 36,
      bottom: 36,
      left: 36,
    },
    columnCount: 2,
  },

  typography: {
    titleSize: 20,
    headingSize: 16,
    bodySize: 13,
    captionSize: 11,
    lineHeight: 1.4,
    fontFamily: "Inter, system-ui, sans-serif",
  },

  content: {
    includeExecutiveSummary: false,
    includeDetailedMetrics: true,
    includeParameterAppendix: true,
    includeModelSnapshots: true,
    includeAssumptions: true,
    includeGuardrails: true,
    includeSensitivityAnalysis: true,
    includePartnerDetails: true,
    maxTableRows: null, // unlimited
    useFriendlyTitles: false,
    useDescriptiveCaptions: false,
  },

  visual: {
    includeCharts: true,
    chartSize: "small",
    includeSparklines: true,
    colorScheme: "color",
    tableDensity: "compact",
  },

  branding: {
    includeLogo: true,
    includeWatermark: true,
    includeFooter: true,
  },
};

// ============================================================================
// Preset Utilities
// ============================================================================

/**
 * Compliance Preset (Intermediate Level)
 *
 * Designed for compliance officers and auditors:
 * - Structured format with clear sections
 * - All guardrails and violations prominently displayed
 * - Assumptions and model parameters documented
 * - Audit trail with timestamps and user info
 * - Focus on traceability and accountability
 */
export const COMPLIANCE_PRESET: ExportPresetConfig = {
  type: "compliance",
  name: "Compliance Report",
  description: "Structured report for compliance review with full audit trail",

  layout: {
    pageSize: "letter",
    orientation: "portrait",
    margins: {
      top: 54, // 0.75 inch
      right: 54,
      bottom: 54,
      left: 54,
    },
    columnCount: 1,
  },

  typography: {
    titleSize: 22,
    headingSize: 17,
    bodySize: 13,
    captionSize: 11,
    lineHeight: 1.5,
    fontFamily: "Inter, system-ui, sans-serif",
  },

  content: {
    includeExecutiveSummary: true,
    includeDetailedMetrics: true,
    includeParameterAppendix: true,
    includeModelSnapshots: true,
    includeAssumptions: true,
    includeGuardrails: true,
    includeSensitivityAnalysis: true,
    includePartnerDetails: true,
    maxTableRows: 50, // Show more data for compliance
    useFriendlyTitles: false,
    useDescriptiveCaptions: true,
  },

  visual: {
    includeCharts: true,
    chartSize: "medium",
    includeSparklines: false,
    colorScheme: "color",
    tableDensity: "normal",
  },

  branding: {
    includeLogo: true,
    includeWatermark: true,
    includeFooter: true,
  },
};

/**
 * Audit Preset (Advanced Level)
 *
 * Designed for internal/external auditors:
 * - Complete data export with all parameters
 * - Detailed model configuration and fingerprints
 * - Full assumption documentation
 * - Comprehensive guardrail history
 * - Focus on verification and reproducibility
 */
export const AUDIT_PRESET: ExportPresetConfig = {
  type: "audit",
  name: "Audit Report",
  description: "Comprehensive report for audit purposes with complete data",

  layout: {
    pageSize: "letter",
    orientation: "landscape",
    margins: {
      top: 36, // 0.5 inch
      right: 36,
      bottom: 36,
      left: 36,
    },
    columnCount: 2,
  },

  typography: {
    titleSize: 18,
    headingSize: 15,
    bodySize: 12,
    captionSize: 10,
    lineHeight: 1.3,
    fontFamily: "Inter, system-ui, sans-serif",
  },

  content: {
    includeExecutiveSummary: false,
    includeDetailedMetrics: true,
    includeParameterAppendix: true,
    includeModelSnapshots: true,
    includeAssumptions: true,
    includeGuardrails: true,
    includeSensitivityAnalysis: true,
    includePartnerDetails: true,
    maxTableRows: null, // unlimited
    useFriendlyTitles: false,
    useDescriptiveCaptions: false,
  },

  visual: {
    includeCharts: true,
    chartSize: "small",
    includeSparklines: true,
    colorScheme: "grayscale", // Grayscale for formal audit reports
    tableDensity: "compact",
  },

  branding: {
    includeLogo: true,
    includeWatermark: true,
    includeFooter: true,
  },
};

/**
 * Get preset configuration by type
 */
export const getPresetConfig = (type: ExportPresetType): ExportPresetConfig => {
  const presets = {
    executive: EXECUTIVE_PRESET,
    technical: TECHNICAL_PRESET,
    compliance: COMPLIANCE_PRESET,
    audit: AUDIT_PRESET,
  };
  return presets[type];
};

/**
 * Get all available presets
 */
export const getAllPresets = (): ExportPresetConfig[] => {
  return [EXECUTIVE_PRESET, TECHNICAL_PRESET, COMPLIANCE_PRESET, AUDIT_PRESET];
};

/**
 * Apply theme tokens to preset
 *
 * This function merges theme tokens with preset configuration to ensure
 * brand consistency across all exports.
 */
export const applyThemeTokensToPreset = (
  preset: ExportPresetConfig
): ExportPresetConfig => {
  const level = preset.type === "executive" ? "intermediate" : "advanced";
  const tokens = getThemeTokens(level);

  return {
    ...preset,
    typography: {
      ...preset.typography,
      titleSize: parseInt(tokens.typography.title),
      headingSize: parseInt(tokens.typography.heading),
      bodySize: parseInt(tokens.typography.body),
      captionSize: parseInt(tokens.typography.caption),
      lineHeight: tokens.typography.lineHeight,
    },
  };
};

/**
 * Apply tenant branding to preset
 */
export interface TenantBranding {
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  companyName: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  watermarkText?: string;
}

export const applyTenantBranding = (
  preset: ExportPresetConfig,
  branding: TenantBranding
): ExportPresetConfig => {
  return {
    ...preset,
    branding: {
      ...preset.branding,
      customColors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        accent: branding.accentColor,
      },
    },
  };
};

/**
 * Generate section titles based on preset
 */
export const getSectionTitle = (
  technicalTitle: string,
  friendlyTitle: string,
  preset: ExportPresetConfig
): string => {
  return preset.content.useFriendlyTitles ? friendlyTitle : technicalTitle;
};

/**
 * Generate table caption based on preset
 */
export const getTableCaption = (
  shortCaption: string,
  descriptiveCaption: string,
  preset: ExportPresetConfig
): string => {
  return preset.content.useDescriptiveCaptions
    ? descriptiveCaption
    : shortCaption;
};

/**
 * Filter table rows based on preset limits
 */
export const filterTableRows = <T,>(
  rows: T[],
  preset: ExportPresetConfig
): T[] => {
  if (preset.content.maxTableRows === null) {
    return rows;
  }
  return rows.slice(0, preset.content.maxTableRows);
};

// ============================================================================
// Section Titles Mapping
// ============================================================================

export const SECTION_TITLES = {
  executiveSummary: {
    technical: "Executive Summary",
    friendly: "Key Insights at a Glance",
  },
  metrics: {
    technical: "Simulation Results",
    friendly: "What the Numbers Tell Us",
  },
  sensitivity: {
    technical: "Sensitivity Analysis",
    friendly: "What Matters Most",
  },
  assumptions: {
    technical: "Key Assumptions",
    friendly: "What We're Assuming",
  },
  guardrails: {
    technical: "Risk Guardrails",
    friendly: "Safety Limits",
  },
  partners: {
    technical: "Partner Exposure",
    friendly: "Who We're Working With",
  },
  parameters: {
    technical: "Model Parameters",
    friendly: "Technical Details",
  },
  modelSnapshot: {
    technical: "Model Configuration",
    friendly: "How We Ran the Analysis",
  },
};

// ============================================================================
// Export Format Options
// ============================================================================

export type ExportFormat = "pdf" | "csv" | "excel" | "json";

export interface ExportOptions {
  preset: ExportPresetConfig;
  format: ExportFormat;
  tenantBranding?: TenantBranding;
  includeTimestamp: boolean;
  includeUserInfo: boolean;
  filename?: string;
}

/**
 * Generate default export options
 */
export const getDefaultExportOptions = (
  presetType: ExportPresetType
): ExportOptions => {
  return {
    preset: getPresetConfig(presetType),
    format: "pdf",
    includeTimestamp: true,
    includeUserInfo: true,
  };
};
