import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileTextIcon,
  DownloadIcon,
  Loader2Icon,
  MailIcon,
  PaletteIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getLabel } from "@/polymet/data/terms";
import type {
  SimulationResult,
  ScenarioVar,
} from "@/polymet/data/scenario-engine";
import type { Partner } from "@/polymet/components/option-partners-section";
import { computeRunFingerprint } from "@/polymet/data/run-fingerprint";
import { BoardSummaryEmailDialog } from "@/polymet/components/board-summary-email-dialog";
import { BrandingConfigDialog } from "@/polymet/components/branding-config-dialog";
import { PDFExportOptionsDialog } from "@/polymet/components/pdf-export-options";
import { ExportPresetDialog } from "@/polymet/components/export-preset-dialog";
import { PresetCustomizationDialog } from "@/polymet/components/preset-customization-dialog";
import {
  generatePDF,
  type BoardSummaryData,
} from "@/polymet/data/preset-pdf-generator";
import {
  type ExportOptions,
  type TenantBranding as PresetTenantBranding,
} from "@/polymet/data/export-presets";
import {
  getAllTemplates,
  getBrandingConfig,
  type ReportTemplate,
  type BrandingConfig,
} from "@/polymet/data/board-summary-templates";
import {
  sendEmail,
  generateBoardSummaryEmail,
} from "@/polymet/data/email-backend";
import { useTenant } from "@/polymet/data/tenant-context";
import { GuardrailsSummarySection } from "@/polymet/components/guardrails-summary-section";
import { getAllGuardrailsForDecision } from "@/polymet/data/decision-guardrails";
import { getActiveViolations } from "@/polymet/data/guardrail-violations";

interface BoardSummaryGeneratorProps {
  decisionTitle: string;
  chosenOptionId: string;
  chosenOptionLabel: string;
  simulationResults: SimulationResult[];
  topSensitiveFactors?: Array<{
    paramName: string;
    impact: number;
  }>;
  partners?: Partner[];
  onAuditEvent: (eventType: string, payload: any) => void;
  plainLanguage?: boolean;
  // Additional props for fingerprint computation
  decisionId?: string;
  seed?: number;
  runs?: number;
  options?: Array<{
    id: string;
    label: string;
    expectedReturn?: number;
    cost?: number;
  }>;
  scenarioVars?: ScenarioVar[];
}

interface BoardSummary {
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
  highDependencyPartners: Partner[];
  guardrails: {
    total: number;
    violations: number;
  };
  narrative: {
    decision: string;
    metrics: string;
    risks: string;
    partners: string;
    guardrails: string;
  };
  generatedAt: string;
}

export function BoardSummaryGenerator({
  decisionTitle,
  chosenOptionId,
  chosenOptionLabel,
  simulationResults,
  topSensitiveFactors = [],
  partners = [],
  onAuditEvent,
  plainLanguage = false,
  decisionId,
  seed,
  runs,
  options,
  scenarioVars,
}: BoardSummaryGeneratorProps) {
  const { tenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<BoardSummary | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("executive-summary");
  const [branding, setBranding] = useState<BrandingConfig>(
    getBrandingConfig(tenant.tenantId)
  );
  const [templates] = useState<ReportTemplate[]>(
    getAllTemplates(tenant.tenantId)
  );
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);

  // Find the chosen option's results
  const chosenResult = simulationResults.find(
    (r) => r.optionId === chosenOptionId
  );

  // Filter high dependency partners (> 0.7)
  const highDependencyPartners = partners.filter(
    (p) => (p.dependencyScore || 0) > 0.7
  );

  // Generate plain language narratives
  const generateNarratives = (
    result: SimulationResult,
    factors: Array<{ paramName: string; impact: number }>,
    highDepPartners: Partner[],
    guardrails: any[],
    violations: any[]
  ) => {
    // Decision narrative
    const decisionNarrative = `We have decided to proceed with "${chosenOptionLabel}" after careful analysis of multiple options. This decision was made based on comprehensive risk-adjusted metrics and sensitivity analysis to ensure the best outcome for our organization.`;

    // Metrics narrative
    const evLabel = plainLanguage ? "Expected Value" : "EV";
    const rarocLabel = plainLanguage ? "Risk-Adjusted Return" : "RAROC";
    const utilityLabel = plainLanguage ? "Utility Score" : "Utility";

    const metricsNarrative = `The chosen option shows an ${evLabel} of ${result.ev.toFixed(2)}, with a ${rarocLabel} of ${result.raroc.toFixed(4)}. The ${utilityLabel} score is ${result.certaintyEquivalent?.toFixed(2) || "N/A"}, indicating ${result.raroc > 0.1 ? "strong" : result.raroc > 0.05 ? "moderate" : "cautious"} performance expectations. Our risk exposure (VaR95) is ${result.var95.toFixed(2)}, with tail risk (CVaR95) at ${result.cvar95.toFixed(2)}.`;

    // Risks narrative
    let risksNarrative = "";
    if (factors.length > 0) {
      const topFactor = factors[0];
      const factorsList = factors
        .slice(0, 3)
        .map((f) => f.paramName)
        .join(", ");
      risksNarrative = `Our sensitivity analysis identified ${factors.length} key risk factors. The most significant is "${topFactor.paramName}" with an impact of ${Math.abs(topFactor.impact).toFixed(2)}. Other important factors include: ${factorsList}. We recommend monitoring these parameters closely as they can significantly affect outcomes.`;
    } else {
      risksNarrative = `Sensitivity analysis is pending. We recommend conducting a thorough sensitivity analysis to identify key risk factors before final implementation.`;
    }

    // Partners narrative
    let partnersNarrative = "";
    if (highDepPartners.length > 0) {
      const partnerNames = highDepPartners
        .map((p) => p.name)
        .slice(0, 3)
        .join(", ");
      const totalExposure = highDepPartners.reduce(
        (sum, p) => sum + (p.creditExposure || 0),
        0
      );
      partnersNarrative = `We have identified ${highDepPartners.length} high-dependency partner(s) with dependency scores above 70%: ${partnerNames}. Total credit exposure to these partners is ${totalExposure > 0 ? `$${totalExposure.toLocaleString()}` : "not specified"}. These partnerships require active management and contingency planning to mitigate concentration risk.`;
    } else {
      partnersNarrative = `No high-dependency partners (>70% dependency) were identified for this decision. This indicates a well-diversified partner portfolio with manageable concentration risk.`;
    }

    // Guardrails narrative
    let guardrailsNarrative = "";
    if (guardrails.length > 0) {
      const criticalViolations = violations.filter(
        (v) => v.alertLevel === "critical"
      );
      if (violations.length > 0) {
        guardrailsNarrative = `We have ${guardrails.length} guardrails configured to monitor key risk metrics. Currently, ${violations.length} guardrail${violations.length > 1 ? "s are" : " is"} violated${criticalViolations.length > 0 ? `, including ${criticalViolations.length} critical violation${criticalViolations.length > 1 ? "s" : ""}` : ""}. These violations require immediate attention to bring metrics back within acceptable ranges and ensure risk remains within our tolerance levels.`;
      } else {
        guardrailsNarrative = `We have ${guardrails.length} guardrails configured to monitor key risk metrics. All guardrails are currently within acceptable ranges, indicating that the decision's risk profile aligns with our predefined risk tolerance levels. We recommend continuing to monitor these metrics as the decision progresses.`;
      }
    } else {
      guardrailsNarrative = `No guardrails have been configured for this decision. We recommend setting up guardrails to monitor key risk metrics such as VaR95, RAROC, and credit risk scores to ensure proactive risk management.`;
    }

    return {
      decision: decisionNarrative,
      metrics: metricsNarrative,
      risks: risksNarrative,
      partners: partnersNarrative,
      guardrails: guardrailsNarrative,
    };
  };

  // Generate board summary
  const handleGenerateSummary = async () => {
    if (!chosenResult) {
      return;
    }

    setIsGenerating(true);

    // Compute run fingerprint if parameters are available
    let runFingerprint: string | undefined;
    if (seed !== undefined && runs !== undefined && options && scenarioVars) {
      try {
        runFingerprint = await computeRunFingerprint(
          seed,
          runs,
          options,
          scenarioVars
        );
      } catch (error) {
        console.error("Failed to compute run fingerprint:", error);
      }
    }

    // Compute parameter hashes for each scenario variable
    const parameterHashes: Record<string, string> = {};
    if (scenarioVars) {
      for (const variable of scenarioVars) {
        try {
          const paramString = JSON.stringify({
            name: variable.name,
            dist: variable.dist,
            params: variable.params,
            appliesTo: variable.appliesTo,
            weight: variable.weight ?? 1,
          });
          const encoder = new TextEncoder();
          const data = encoder.encode(paramString);
          const hashBuffer = await crypto.subtle.digest("SHA-256", data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          parameterHashes[variable.name] = hashHex.substring(0, 12);
        } catch (error) {
          console.error(
            `Failed to compute hash for parameter ${variable.name}:`,
            error
          );
        }
      }
    }

    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Calculate credit risk score (simple average of partner dependency scores)
    const creditRiskScore =
      highDependencyPartners.length > 0
        ? highDependencyPartners.reduce(
            (sum, p) => sum + (p.dependencyScore || 0),
            0
          ) / highDependencyPartners.length
        : 0;

    // Load guardrails and violations
    const allGuardrails = decisionId
      ? getAllGuardrailsForDecision(decisionId)
      : [];
    const activeViolations = decisionId ? getActiveViolations(decisionId) : [];

    const narratives = generateNarratives(
      chosenResult,
      topSensitiveFactors,
      highDependencyPartners,
      allGuardrails,
      activeViolations
    );

    const boardSummary: BoardSummary = {
      decisionTitle,
      chosenOption: chosenOptionLabel,
      keyMetrics: {
        ev: chosenResult.ev,
        var95: chosenResult.var95,
        cvar95: chosenResult.cvar95,
        raroc: chosenResult.raroc,
        utility: chosenResult.certaintyEquivalent || 0,
        creditRiskScore,
      },
      topSensitiveFactors: topSensitiveFactors.slice(0, 3),
      highDependencyPartners,
      guardrails: {
        total: allGuardrails.length,
        violations: activeViolations.length,
      },
      narrative: narratives,
      generatedAt: new Date().toISOString(),
    };

    setSummary(boardSummary);
    setIsGenerating(false);

    // Add comprehensive audit event with run fingerprint and parameter hashes
    onAuditEvent("board.brief.generated", {
      decisionId: decisionId || "unknown",
      decisionTitle,
      chosenOptionId,
      chosenOptionLabel,
      runFingerprint,
      seed,
      runs,
      parameterHashes,
      metricsCount: 6,
      sensitiveFactorsCount: topSensitiveFactors.length,
      highDependencyPartnersCount: highDependencyPartners.length,
      guardrailsCount: allGuardrails.length,
      guardrailViolationsCount: activeViolations.length,
      metrics: {
        ev: chosenResult.ev,
        var95: chosenResult.var95,
        cvar95: chosenResult.cvar95,
        raroc: chosenResult.raroc,
        utility: chosenResult.certaintyEquivalent || 0,
        creditRiskScore,
      },
      generatedAt: boardSummary.generatedAt,
    });
  };

  // Export as CSV
  const exportCSV = () => {
    if (!summary) return;

    const rows = [
      ["Board-Ready Summary"],
      ["Generated", new Date(summary.generatedAt).toLocaleString()],
      [""],
      ["Decision", summary.decisionTitle],
      ["Chosen Option", summary.chosenOption],
      [""],
      ["Key Metrics"],
      ["Expected Value (EV)", summary.keyMetrics.ev.toFixed(2)],
      ["Value at Risk 95% (VaR95)", summary.keyMetrics.var95.toFixed(2)],
      ["Conditional VaR 95% (CVaR95)", summary.keyMetrics.cvar95.toFixed(2)],

      ["Risk-Adjusted Return (RAROC)", summary.keyMetrics.raroc.toFixed(4)],
      ["Utility Score", summary.keyMetrics.utility.toFixed(2)],
      ["Credit Risk Score", summary.keyMetrics.creditRiskScore.toFixed(2)],

      [""],
      ["Top Sensitive Factors"],
      ["Parameter", "Impact"],
      ...summary.topSensitiveFactors.map((f) => [
        f.paramName,
        f.impact.toFixed(2),
      ]),
      [""],
      ["High Dependency Partners (>70%)"],
      ["Name", "Relationship", "Dependency Score", "Credit Exposure"],
      ...summary.highDependencyPartners.map((p) => [
        p.name,
        p.relationship,
        ((p.dependencyScore || 0) * 100).toFixed(0) + "%",
        p.creditExposure ? `$${p.creditExposure.toLocaleString()}` : "N/A",
      ]),
      [""],
      ["Decision Summary"],
      [summary.narrative.decision],
      [""],
      ["Metrics Summary"],
      [summary.narrative.metrics],
      [""],
      ["Risk Summary"],
      [summary.narrative.risks],
      [""],
      ["Partner Summary"],
      [summary.narrative.partners],
      [""],
      ["Guardrails Summary"],
      ["Total Guardrails", summary.guardrails.total.toString()],
      ["Active Violations", summary.guardrails.violations.toString()],
      [""],
      [summary.narrative.guardrails],
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", "_")
      .replace(/:/g, "");
    link.setAttribute("href", url);
    link.setAttribute("download", `board_summary_${timestamp}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Add audit event
    onAuditEvent("board.summary.exported", {
      format: "csv",
      decisionTitle,
    });
  };

  // Handle email send
  const handleSendEmail = async (
    recipients: string[],
    subject: string,
    message: string,
    templateId: string
  ) => {
    if (!summary) return;

    try {
      // Generate HTML email body
      const htmlBody = generateBoardSummaryEmail(
        decisionTitle,
        summary,
        branding
      );

      // Send email using backend
      const response = await sendEmail({
        to: recipients.map((email) => ({ email })),
        subject,
        htmlBody,
        textBody: message,
      });

      if (response.success) {
        // Add audit event
        onAuditEvent("board.summary.emailed", {
          decisionTitle,
          recipientCount: recipients.length,
          template: templateId,
          messageId: response.messageId,
        });

        alert(`Email sent successfully to ${recipients.length} recipient(s)`);
      } else {
        alert(`Failed to send email: ${response.error}`);
      }
    } catch (error) {
      console.error("Email send error:", error);
      alert("Failed to send email. Please try again.");
    }
  };

  // Get current template
  const currentTemplate =
    templates.find((t) => t.id === selectedTemplate) || templates[0];

  // Export as PDF using preset-based generator
  const exportPDFWithPreset = (options: ExportOptions) => {
    if (!summary) return;

    // Convert summary to BoardSummaryData format
    const boardData: BoardSummaryData = {
      decisionTitle: summary.decisionTitle,
      chosenOption: summary.chosenOption,
      keyMetrics: summary.keyMetrics,
      topSensitiveFactors: summary.topSensitiveFactors,
      highDependencyPartners: summary.highDependencyPartners,
      guardrails: summary.guardrails,
      narrative: summary.narrative,
      generatedAt: summary.generatedAt,
    };

    // Convert branding to preset format
    const presetBranding: PresetTenantBranding = {
      companyName: branding.companyName,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
    };

    // Generate PDF
    generatePDF({
      preset: options.preset,
      data: boardData,
      tenantBranding: presetBranding,
      includeTimestamp: options.includeTimestamp,
      includeUserInfo: options.includeUserInfo,
    });

    // Add audit event
    onAuditEvent("board.summary.exported", {
      format: options.format,
      preset: options.preset.type,
      decisionTitle,
    });
  };

  // Export as PDF (simplified - creates a printable HTML version with branding)
  const exportPDF = () => {
    if (!summary) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Board-Ready Summary - ${summary.decisionTitle}</title>
          <style>
            body {
              font-family: ${branding.fontFamily || "Arial, sans-serif"};
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header-logo {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid ${branding.primaryColor};
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: ${branding.primaryColor};
            }
            .logo {
              max-height: 60px;
              max-width: 200px;
            }
            h1 {
              color: #1a1a1a;
              border-bottom: 3px solid ${branding.primaryColor};
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              color: ${branding.primaryColor};
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .header {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 30px;
            }
            .metric-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .metric-card {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid ${branding.accentColor};
            }
            .metric-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
            }
            .narrative {
              background: #fff;
              padding: 20px;
              border-left: 4px solid ${branding.accentColor};
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background: #f5f5f5;
              font-weight: bold;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .badge-high {
              background: #fee;
              color: #c00;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          ${
            currentTemplate.styling.includeLogos
              ? `
          <div class="header-logo">
            <div class="company-name">${branding.companyName}</div>
            ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" class="logo" />` : ""}
          </div>
          `
              : ""
          }
          
          <h1>Board-Ready Summary</h1>
          
          <div class="header">
            <p><strong>Decision:</strong> ${summary.decisionTitle}</p>
            <p><strong>Chosen Option:</strong> ${summary.chosenOption}</p>
            <p><strong>Generated:</strong> ${new Date(summary.generatedAt).toLocaleString()}</p>
          </div>

          <h2>Executive Summary</h2>
          <div class="narrative">
            <p>${summary.narrative.decision}</p>
          </div>

          <h2>Key Metrics</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Expected Value (EV)</div>
              <div class="metric-value">${summary.keyMetrics.ev.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Risk-Adjusted Return (RAROC)</div>
              <div class="metric-value">${summary.keyMetrics.raroc.toFixed(4)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Value at Risk 95% (VaR95)</div>
              <div class="metric-value">${summary.keyMetrics.var95.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Conditional VaR 95% (CVaR95)</div>
              <div class="metric-value">${summary.keyMetrics.cvar95.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Utility Score</div>
              <div class="metric-value">${summary.keyMetrics.utility.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Credit Risk Score</div>
              <div class="metric-value">${summary.keyMetrics.creditRiskScore.toFixed(2)}</div>
            </div>
          </div>

          <div class="narrative">
            <p>${summary.narrative.metrics}</p>
          </div>

          <h2>Top Sensitive Factors</h2>
          ${
            summary.topSensitiveFactors.length > 0
              ? `
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              ${summary.topSensitiveFactors
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
          `
              : "<p>No sensitivity analysis data available.</p>"
          }

          <div class="narrative">
            <p>${summary.narrative.risks}</p>
          </div>

          <h2>High Dependency Partners</h2>
          ${
            summary.highDependencyPartners.length > 0
              ? `
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
              ${summary.highDependencyPartners
                .map(
                  (p) => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.relationship}</td>
                  <td><span class="badge badge-high">${((p.dependencyScore || 0) * 100).toFixed(0)}%</span></td>
                  <td>${p.creditExposure ? `$${p.creditExposure.toLocaleString()}` : "N/A"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          `
              : "<p>No high-dependency partners identified.</p>"
          }

          <div class="narrative">
            <p>${summary.narrative.partners}</p>
          </div>

          <h2>Guardrails Summary</h2>
          <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr);">
            <div class="metric-card">
              <div class="metric-label">Total Guardrails</div>
              <div class="metric-value">${summary.guardrails.total}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Active Violations</div>
              <div class="metric-value" style="color: ${summary.guardrails.violations > 0 ? "#dc2626" : "#16a34a"}">${summary.guardrails.violations}</div>
            </div>
          </div>

          <div class="narrative">
            <p>${summary.narrative.guardrails}</p>
          </div>

          <div class="footer">
            <p>This board-ready summary was automatically generated by ${branding.companyName}.</p>
            <p>For questions or additional information, please contact the decision support team.</p>
            <p style="margin-top: 20px; color: #999; font-size: 11px;">Template: ${currentTemplate.name}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);

    // Add audit event
    onAuditEvent("board.summary.exported", {
      format: "pdf",
      decisionTitle,
      template: selectedTemplate,
      branding: branding.companyName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(true);
                  if (!summary) {
                    handleGenerateSummary();
                  }
                }}
              >
                <FileTextIcon className="w-4 h-4 mr-2" />

                {plainLanguage
                  ? "Board-Ready Summary"
                  : "Generate Board Summary"}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Creates a simple brief showing what we decided, why, and main
              risks.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plainLanguage ? "Board-Ready Summary" : "Board Summary"}
          </DialogTitle>
          <DialogDescription>
            Comprehensive decision summary with key metrics, risks, and partner
            analysis
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="w-8 h-8 animate-spin text-primary" />

            <span className="ml-3 text-muted-foreground">
              Generating summary...
            </span>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Template & Branding Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PaletteIcon className="w-4 h-4" />

                  <CardTitle className="text-base">
                    Report Template & Branding
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Report Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((tmpl) => (
                        <SelectItem key={tmpl.id} value={tmpl.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{tmpl.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {tmpl.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>Company: {branding.companyName}</div>
                  <div>Style: {currentTemplate.styling.headerStyle}</div>
                </div>
              </CardContent>
            </Card>

            {/* Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {summary.decisionTitle}
                </CardTitle>
                <CardDescription>
                  Chosen Option: <strong>{summary.chosenOption}</strong>
                  <br />
                  Generated: {new Date(summary.generatedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Decision Narrative */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {summary.narrative.decision}
                </p>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      {getLabel("ev", { plain: plainLanguage })}
                    </div>
                    <div className="text-xl font-bold">
                      {summary.keyMetrics.ev.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      {getLabel("var95", { plain: plainLanguage })}
                    </div>
                    <div className="text-xl font-bold">
                      {summary.keyMetrics.var95.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      {getLabel("cvar95", { plain: plainLanguage })}
                    </div>
                    <div className="text-xl font-bold">
                      {summary.keyMetrics.cvar95.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      {getLabel("raroc", { plain: plainLanguage })}
                    </div>
                    <div className="text-xl font-bold">
                      {summary.keyMetrics.raroc.toFixed(4)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      {getLabel("ce", { plain: plainLanguage })}
                    </div>
                    <div className="text-xl font-bold">
                      {summary.keyMetrics.utility.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      Credit Risk Score
                    </div>
                    <div className="text-xl font-bold">
                      {summary.keyMetrics.creditRiskScore.toFixed(2)}
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {summary.narrative.metrics}
                </p>
              </CardContent>
            </Card>

            {/* Top Sensitive Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Top Sensitive Factors
                </CardTitle>
                <CardDescription>
                  {summary.topSensitiveFactors.length > 0
                    ? `${summary.topSensitiveFactors.length} key risk factors identified`
                    : "No sensitivity analysis data available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.topSensitiveFactors.length > 0 && (
                  <div className="space-y-2">
                    {summary.topSensitiveFactors.map((factor, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <span className="text-sm font-medium">
                          {factor.paramName}
                        </span>
                        <Badge variant="outline">
                          Impact: {Math.abs(factor.impact).toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {summary.narrative.risks}
                </p>
              </CardContent>
            </Card>

            {/* Guardrails Summary */}
            {decisionId && (
              <GuardrailsSummarySection
                guardrails={getAllGuardrailsForDecision(decisionId)}
                violations={getActiveViolations(decisionId)}
                plainLanguage={plainLanguage}
                decisionId={decisionId}
              />
            )}

            {/* High Dependency Partners */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  High Dependency Partners (&gt;70%)
                </CardTitle>
                <CardDescription>
                  {summary.highDependencyPartners.length > 0
                    ? `${summary.highDependencyPartners.length} partner(s) with high dependency`
                    : "No high-dependency partners identified"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.highDependencyPartners.length > 0 && (
                  <div className="space-y-2">
                    {summary.highDependencyPartners.map((partner, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{partner.name}</span>
                          <Badge className="bg-red-500 text-white">
                            {((partner.dependencyScore || 0) * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Relationship:</span>{" "}
                          {partner.relationship}
                        </div>
                        {partner.creditExposure && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">
                              Credit Exposure:
                            </span>{" "}
                            ${partner.creditExposure.toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {summary.narrative.partners}
                </p>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => setPresetDialogOpen(true)}
                  variant="default"
                  className="flex-1"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Export with Preset
                </Button>

                <Button
                  onClick={exportCSV}
                  variant="outline"
                  className="flex-1"
                >
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => setEmailDialogOpen(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <MailIcon className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
              <div className="flex justify-between">
                <Button
                  onClick={() => setCustomizationDialogOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <PaletteIcon className="w-4 h-4 mr-2" />
                  Customize Preset
                </Button>
                <BrandingConfigDialog
                  tenantId={tenant.tenantId}
                  currentBranding={branding}
                  onBrandingUpdate={(newBranding) => {
                    setBranding(newBranding);
                  }}
                  onAuditEvent={onAuditEvent}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Click "Generate Board Summary" to create the report
            </p>
          </div>
        )}
      </DialogContent>

      {/* Email Dialog */}
      <BoardSummaryEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        decisionTitle={decisionTitle}
        summary={summary}
        branding={branding}
        onSendEmail={handleSendEmail}
      />

      {/* Export Preset Dialog */}
      <ExportPresetDialog
        open={presetDialogOpen}
        onOpenChange={setPresetDialogOpen}
        decisionTitle={decisionTitle}
        onExport={exportPDFWithPreset}
        tenantBranding={{
          companyName: branding.companyName,
          logoUrl: branding.logoUrl,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          accentColor: branding.accentColor,
        }}
      />

      {/* Preset Customization Dialog */}
      <PresetCustomizationDialog
        open={customizationDialogOpen}
        onOpenChange={setCustomizationDialogOpen}
        onSavePreset={(preset) => {
          console.log("Custom preset saved:", preset);
          // Could save to localStorage here
          onAuditEvent("preset.custom.created", {
            presetName: preset.name,
            presetType: preset.type,
          });
        }}
        tenantId={tenant.tenantId}
      />
    </Dialog>
  );
}
