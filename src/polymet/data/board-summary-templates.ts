export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  audience: "executive" | "technical" | "stakeholder" | "board";
  sections: {
    executiveSummary: boolean;
    keyMetrics: boolean;
    detailedMetrics: boolean;
    sensitiveFactors: boolean;
    partnerAnalysis: boolean;
    riskAssessment: boolean;
    recommendations: boolean;
    technicalDetails: boolean;
  };
  styling: {
    primaryColor: string;
    accentColor: string;
    headerStyle: "formal" | "modern" | "minimal";
    includeCharts: boolean;
    includeLogos: boolean;
  };
}

export interface BrandingConfig {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
}

export const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "High-level overview for C-suite and board members",
    audience: "executive",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: false,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#0066cc",
      accentColor: "#00a3e0",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "technical-report",
    name: "Technical Report",
    description: "Comprehensive analysis for technical teams and analysts",
    audience: "technical",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: true,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: true,
    },
    styling: {
      primaryColor: "#1a1a1a",
      accentColor: "#0066cc",
      headerStyle: "minimal",
      includeCharts: true,
      includeLogos: false,
    },
  },
  {
    id: "stakeholder-update",
    name: "Stakeholder Update",
    description: "Balanced overview for general stakeholders",
    audience: "stakeholder",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: false,
      sensitiveFactors: true,
      partnerAnalysis: false,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#0066cc",
      accentColor: "#00a3e0",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "board-presentation",
    name: "Board Presentation",
    description: "Formal report for board meetings",
    audience: "board",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: false,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#1a1a1a",
      accentColor: "#0066cc",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "risk-committee",
    name: "Risk Committee Report",
    description: "Detailed risk analysis for risk committee meetings",
    audience: "board",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: true,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: true,
    },
    styling: {
      primaryColor: "#dc2626",
      accentColor: "#ef4444",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "investor-update",
    name: "Investor Update",
    description: "Quarterly update for investors and shareholders",
    audience: "stakeholder",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: false,
      sensitiveFactors: false,
      partnerAnalysis: false,
      riskAssessment: true,
      recommendations: false,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#059669",
      accentColor: "#10b981",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "audit-compliance",
    name: "Audit & Compliance",
    description: "Comprehensive report for audit and compliance teams",
    audience: "technical",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: true,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: true,
    },
    styling: {
      primaryColor: "#7c3aed",
      accentColor: "#a78bfa",
      headerStyle: "minimal",
      includeCharts: true,
      includeLogos: false,
    },
  },
  {
    id: "quick-summary",
    name: "Quick Summary",
    description: "One-page summary for quick reviews",
    audience: "executive",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: false,
      sensitiveFactors: false,
      partnerAnalysis: false,
      riskAssessment: false,
      recommendations: true,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#0066cc",
      accentColor: "#00a3e0",
      headerStyle: "modern",
      includeCharts: false,
      includeLogos: true,
    },
  },
];

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: "Retina Intelligence Suite",
  primaryColor: "#0066cc",
  secondaryColor: "#00a3e0",
  accentColor: "#0099cc",
  fontFamily: "Inter, system-ui, sans-serif",
};

// Template storage functions
export function saveCustomTemplate(
  tenantId: string,
  template: ReportTemplate
): void {
  const storageKey = `retina:templates:${tenantId}`;
  const existing = localStorage.getItem(storageKey);
  const templates = existing ? JSON.parse(existing) : [];

  const index = templates.findIndex(
    (t: ReportTemplate) => t.id === template.id
  );
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }

  localStorage.setItem(storageKey, JSON.stringify(templates));
}

export function getCustomTemplates(tenantId: string): ReportTemplate[] {
  const storageKey = `retina:templates:${tenantId}`;
  const existing = localStorage.getItem(storageKey);
  return existing ? JSON.parse(existing) : [];
}

export function getAllTemplates(tenantId: string): ReportTemplate[] {
  const customTemplates = getCustomTemplates(tenantId);
  // Import industry templates
  const { INDUSTRY_TEMPLATES } = require("@/polymet/data/industry-templates");
  return [...DEFAULT_TEMPLATES, ...INDUSTRY_TEMPLATES, ...customTemplates];
}

export function deleteCustomTemplate(
  tenantId: string,
  templateId: string
): void {
  const storageKey = `retina:templates:${tenantId}`;
  const existing = localStorage.getItem(storageKey);
  if (!existing) return;

  const templates = JSON.parse(existing);
  const filtered = templates.filter((t: ReportTemplate) => t.id !== templateId);
  localStorage.setItem(storageKey, JSON.stringify(filtered));
}

// Branding storage functions
export function saveBrandingConfig(
  tenantId: string,
  branding: BrandingConfig
): void {
  const storageKey = `retina:branding:${tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(branding));
}

export function getBrandingConfig(tenantId: string): BrandingConfig {
  const storageKey = `retina:branding:${tenantId}`;
  const existing = localStorage.getItem(storageKey);
  return existing ? JSON.parse(existing) : DEFAULT_BRANDING;
}
