/**
 * Preset-Based PDF Generator
 *
 * Generates PDF reports that respect export preset rules:
 * - Layout: margins, orientation, columns
 * - Typography: font sizes, line heights
 * - Content: section inclusion, table limits, title styles
 * - Branding: logo, colors, watermark
 */

import {
  type ExportPresetConfig,
  type TenantBranding,
  getSectionTitle,
  getTableCaption,
  filterTableRows,
  SECTION_TITLES,
} from "@/polymet/data/export-presets";

// ============================================================================
// Types
// ============================================================================

export interface BoardSummaryData {
  decisionTitle: string;
  chosenOption: string;
  keyMetrics: {
    ev: number;
    var95: number;
    cvar95: number;
    raroc: number;
    utility: number;
    creditRiskScore: number;
  };
  topSensitiveFactors: Array<{
    paramName: string;
    impact: number;
  }>;
  highDependencyPartners: Array<{
    name: string;
    relationship: string;
    dependencyScore: number;
    creditExposure?: number;
    notes?: string;
  }>;
  guardrails: {
    total: number;
    violations: number;
    details?: Array<{
      metric: string;
      threshold: number;
      actual: number;
      status: "pass" | "warning" | "critical";
    }>;
  };
  narrative: {
    decision: string;
    metrics: string;
    risks: string;
    partners: string;
    guardrails: string;
  };
  assumptions?: Array<{
    category: string;
    description: string;
    value: string;
  }>;
  modelSnapshot?: {
    seed: number;
    runs: number;
    timestamp: string;
    runFingerprint?: string;
  };
  generatedAt: string;
  generatedBy?: {
    name: string;
    role: string;
  };
}

export interface PDFGenerationOptions {
  preset: ExportPresetConfig;
  data: BoardSummaryData;
  tenantBranding?: TenantBranding;
  includeTimestamp: boolean;
  includeUserInfo: boolean;
}

// ============================================================================
// HTML Template Generator
// ============================================================================

/**
 * Generate HTML content for PDF based on preset rules
 */
export const generatePresetHTML = (options: PDFGenerationOptions): string => {
  const { preset, data, tenantBranding, includeTimestamp, includeUserInfo } =
    options;

  // Extract preset settings
  const { layout, typography, content, visual, branding } = preset;

  // Build CSS based on preset
  const css = `
    @page {
      size: ${layout.pageSize} ${layout.orientation};
      margin: ${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px;
    }

    body {
      font-family: ${typography.fontFamily};
      font-size: ${typography.bodySize}px;
      line-height: ${typography.lineHeight};
      color: ${visual.colorScheme === "grayscale" ? "#333" : "#1a1a1a"};
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 100%;
      ${layout.columnCount === 2 ? "column-count: 2; column-gap: 20px;" : ""}
    }

    .header-logo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${tenantBranding?.primaryColor || "#3b82f6"};
      ${layout.columnCount === 2 ? "column-span: all;" : ""}
    }

    .company-name {
      font-size: ${typography.titleSize}px;
      font-weight: bold;
      color: ${tenantBranding?.primaryColor || "#3b82f6"};
    }

    .logo {
      max-height: ${tenantBranding?.logoHeight || 60}px;
      max-width: ${tenantBranding?.logoWidth || 200}px;
    }

    h1 {
      font-size: ${typography.titleSize}px;
      color: #1a1a1a;
      border-bottom: 3px solid ${tenantBranding?.primaryColor || "#3b82f6"};
      padding-bottom: 10px;
      margin-bottom: 20px;
      ${layout.columnCount === 2 ? "column-span: all;" : ""}
    }

    h2 {
      font-size: ${typography.headingSize}px;
      color: ${tenantBranding?.primaryColor || "#3b82f6"};
      margin-top: 30px;
      margin-bottom: 15px;
      ${layout.columnCount === 2 ? "break-after: avoid;" : ""}
    }

    h3 {
      font-size: ${typography.bodySize + 2}px;
      color: #333;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    .header-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
      ${layout.columnCount === 2 ? "column-span: all;" : ""}
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(${layout.columnCount === 2 ? "2" : "3"}, 1fr);
      gap: 15px;
      margin: 20px 0;
      ${layout.columnCount === 2 ? "column-span: all;" : ""}
    }

    .metric-card {
      background: #f9f9f9;
      padding: ${visual.tableDensity === "compact" ? "10px" : visual.tableDensity === "comfortable" ? "20px" : "15px"};
      border-radius: 5px;
      border-left: 4px solid ${tenantBranding?.accentColor || "#8b5cf6"};
      break-inside: avoid;
    }

    .metric-label {
      font-size: ${typography.captionSize}px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .metric-value {
      font-size: ${typography.headingSize + 6}px;
      font-weight: bold;
      color: #1a1a1a;
    }

    .narrative {
      background: #fff;
      padding: ${visual.tableDensity === "compact" ? "12px" : "20px"};
      border-left: 4px solid ${tenantBranding?.accentColor || "#8b5cf6"};
      margin: 20px 0;
      break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: ${typography.bodySize - 1}px;
      break-inside: avoid;
    }

    th, td {
      padding: ${visual.tableDensity === "compact" ? "8px" : visual.tableDensity === "comfortable" ? "16px" : "12px"};
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background: #f5f5f5;
      font-weight: bold;
      font-size: ${typography.captionSize}px;
      text-transform: uppercase;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: ${typography.captionSize}px;
      font-weight: bold;
    }

    .badge-high {
      background: ${visual.colorScheme === "grayscale" ? "#ddd" : "#fee"};
      color: ${visual.colorScheme === "grayscale" ? "#333" : "#c00"};
    }

    .badge-warning {
      background: ${visual.colorScheme === "grayscale" ? "#e5e5e5" : "#fef3c7"};
      color: ${visual.colorScheme === "grayscale" ? "#333" : "#92400e"};
    }

    .badge-success {
      background: ${visual.colorScheme === "grayscale" ? "#f5f5f5" : "#d1fae5"};
      color: ${visual.colorScheme === "grayscale" ? "#333" : "#065f46"};
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: ${typography.captionSize}px;
      color: #666;
      ${layout.columnCount === 2 ? "column-span: all;" : ""}
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72px;
      color: rgba(0, 0, 0, 0.05);
      z-index: -1;
      pointer-events: none;
    }

    .section-break {
      ${layout.columnCount === 2 ? "column-span: all;" : ""}
      page-break-after: avoid;
    }

    .caption {
      font-size: ${typography.captionSize}px;
      color: #666;
      font-style: italic;
      margin-top: 5px;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  `;

  // Build HTML sections based on content settings
  const sections: string[] = [];

  // Header with logo
  if (branding.includeLogo && tenantBranding) {
    sections.push(`
      <div class="header-logo">
        <div class="company-name">${tenantBranding.companyName}</div>
        ${tenantBranding.logoUrl ? `<img src="${tenantBranding.logoUrl}" alt="Logo" class="logo" />` : ""}
      </div>
    `);
  }

  // Title
  sections.push(`
    <h1>${preset.name}</h1>
  `);

  // Header info
  sections.push(`
    <div class="header-info">
      <p><strong>Decision:</strong> ${data.decisionTitle}</p>
      <p><strong>Chosen Option:</strong> ${data.chosenOption}</p>
      ${includeTimestamp ? `<p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>` : ""}
      ${includeUserInfo && data.generatedBy ? `<p><strong>Generated By:</strong> ${data.generatedBy.name} (${data.generatedBy.role})</p>` : ""}
    </div>
  `);

  // Executive Summary
  if (content.includeExecutiveSummary) {
    sections.push(`
      <div class="section-break">
        <h2>${getSectionTitle(SECTION_TITLES.executiveSummary.technical, SECTION_TITLES.executiveSummary.friendly, preset)}</h2>
        <div class="narrative">
          <p>${data.narrative.decision}</p>
        </div>
      </div>
    `);
  }

  // Key Metrics
  sections.push(`
    <div class="section-break">
      <h2>${getSectionTitle(SECTION_TITLES.metrics.technical, SECTION_TITLES.metrics.friendly, preset)}</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Expected Value (EV)</div>
          <div class="metric-value">${data.keyMetrics.ev.toFixed(2)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Risk-Adjusted Return (RAROC)</div>
          <div class="metric-value">${data.keyMetrics.raroc.toFixed(4)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Value at Risk 95% (VaR95)</div>
          <div class="metric-value">${data.keyMetrics.var95.toFixed(2)}</div>
        </div>
        ${
          content.includeDetailedMetrics
            ? `
        <div class="metric-card">
          <div class="metric-label">Conditional VaR 95% (CVaR95)</div>
          <div class="metric-value">${data.keyMetrics.cvar95.toFixed(2)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Utility Score</div>
          <div class="metric-value">${data.keyMetrics.utility.toFixed(2)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Credit Risk Score</div>
          <div class="metric-value">${data.keyMetrics.creditRiskScore.toFixed(2)}</div>
        </div>
        `
            : ""
        }
      </div>
      <div class="narrative">
        <p>${data.narrative.metrics}</p>
      </div>
    </div>
  `);

  // Sensitive Factors
  if (
    content.includeSensitivityAnalysis &&
    data.topSensitiveFactors.length > 0
  ) {
    const filteredFactors = filterTableRows(data.topSensitiveFactors, preset);
    sections.push(`
      <div class="section-break">
        <h2>${getSectionTitle(SECTION_TITLES.sensitivity.technical, SECTION_TITLES.sensitivity.friendly, preset)}</h2>
        ${content.useDescriptiveCaptions ? `<p class="caption">These parameters have the most significant impact on decision outcomes. Changes to these values will substantially affect results.</p>` : ""}
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            ${filteredFactors
              .map(
                (f) => `
              <tr>
                <td>${f.paramName}</td>
                <td>${f.impact.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="narrative">
          <p>${data.narrative.risks}</p>
        </div>
      </div>
    `);
  }

  // Guardrails
  if (content.includeGuardrails) {
    sections.push(`
      <div class="section-break">
        <h2>${getSectionTitle(SECTION_TITLES.guardrails.technical, SECTION_TITLES.guardrails.friendly, preset)}</h2>
        <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="metric-card">
            <div class="metric-label">Total Guardrails</div>
            <div class="metric-value">${data.guardrails.total}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Active Violations</div>
            <div class="metric-value" style="color: ${data.guardrails.violations > 0 ? "#dc2626" : "#16a34a"}">${data.guardrails.violations}</div>
          </div>
        </div>
        ${
          data.guardrails.details && data.guardrails.details.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Threshold</th>
                <th>Actual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.guardrails.details
                .map(
                  (g) => `
                <tr>
                  <td>${g.metric}</td>
                  <td>${g.threshold.toFixed(2)}</td>
                  <td>${g.actual.toFixed(2)}</td>
                  <td><span class="badge badge-${g.status === "pass" ? "success" : g.status === "warning" ? "warning" : "high"}">${g.status.toUpperCase()}</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `
            : ""
        }
        <div class="narrative">
          <p>${data.narrative.guardrails}</p>
        </div>
      </div>
    `);
  }

  // Partners
  if (content.includePartnerDetails && data.highDependencyPartners.length > 0) {
    const filteredPartners = filterTableRows(
      data.highDependencyPartners,
      preset
    );
    sections.push(`
      <div class="section-break">
        <h2>${getSectionTitle(SECTION_TITLES.partners.technical, SECTION_TITLES.partners.friendly, preset)}</h2>
        ${content.useDescriptiveCaptions ? `<p class="caption">Partners with dependency scores above 70% require active monitoring and contingency planning to mitigate concentration risk.</p>` : ""}
        <table>
          <thead>
            <tr>
              <th>Partner Name</th>
              <th>Relationship</th>
              <th>Dependency Score</th>
              <th>Credit Exposure</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPartners
              .map(
                (p) => `
              <tr>
                <td>${p.name}</td>
                <td>${p.relationship}</td>
                <td><span class="badge badge-high">${(p.dependencyScore * 100).toFixed(0)}%</span></td>
                <td>${p.creditExposure ? `$${p.creditExposure.toLocaleString()}` : "N/A"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="narrative">
          <p>${data.narrative.partners}</p>
        </div>
      </div>
    `);
  }

  // Assumptions
  if (
    content.includeAssumptions &&
    data.assumptions &&
    data.assumptions.length > 0
  ) {
    const filteredAssumptions = filterTableRows(data.assumptions, preset);
    sections.push(`
      <div class="section-break">
        <h2>${getSectionTitle(SECTION_TITLES.assumptions.technical, SECTION_TITLES.assumptions.friendly, preset)}</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAssumptions
              .map(
                (a) => `
              <tr>
                <td>${a.category}</td>
                <td>${a.description}</td>
                <td>${a.value}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `);
  }

  // Model Snapshot
  if (content.includeModelSnapshots && data.modelSnapshot) {
    sections.push(`
      <div class="section-break">
        <h2>${getSectionTitle(SECTION_TITLES.modelSnapshot.technical, SECTION_TITLES.modelSnapshot.friendly, preset)}</h2>
        <table>
          <tbody>
            <tr>
              <td><strong>Random Seed</strong></td>
              <td>${data.modelSnapshot.seed}</td>
            </tr>
            <tr>
              <td><strong>Simulation Runs</strong></td>
              <td>${data.modelSnapshot.runs.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Timestamp</strong></td>
              <td>${new Date(data.modelSnapshot.timestamp).toLocaleString()}</td>
            </tr>
            ${
              data.modelSnapshot.runFingerprint
                ? `
            <tr>
              <td><strong>Run Fingerprint</strong></td>
              <td style="font-family: monospace; font-size: ${typography.captionSize}px;">${data.modelSnapshot.runFingerprint}</td>
            </tr>
            `
                : ""
            }
          </tbody>
        </table>
      </div>
    `);
  }

  // Footer
  if (branding.includeFooter) {
    sections.push(`
      <div class="footer">
        <p>This ${preset.name.toLowerCase()} was automatically generated by ${tenantBranding?.companyName || "Retina Intelligence Suite"}.</p>
        <p>For questions or additional information, please contact the decision support team.</p>
        ${includeTimestamp ? `<p style="margin-top: 20px; color: #999; font-size: ${typography.captionSize - 1}px;">Generated: ${new Date(data.generatedAt).toLocaleString()}</p>` : ""}
      </div>
    `);
  }

  // Combine all sections
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${preset.name} - ${data.decisionTitle}</title>
        <style>${css}</style>
      </head>
      <body>
        ${branding.includeWatermark && tenantBranding?.watermarkText ? `<div class="watermark">${tenantBranding.watermarkText}</div>` : ""}
        <div class="container">
          ${sections.join("\n")}
        </div>
      </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Generate and download PDF using browser print
 */
export const generatePDF = (options: PDFGenerationOptions): void => {
  const htmlContent = generatePresetHTML(options);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Failed to open print window. Please allow popups.");
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

/**
 * Generate HTML string for preview
 */
export const generatePreviewHTML = (options: PDFGenerationOptions): string => {
  return generatePresetHTML(options);
};
