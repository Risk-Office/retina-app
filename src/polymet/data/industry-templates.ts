import type { ReportTemplate } from "@/polymet/data/board-summary-templates";

/**
 * Industry-specific report templates
 * These templates are tailored for specific industries with relevant sections and styling
 */

export const INDUSTRY_TEMPLATES: ReportTemplate[] = [
  // Banking & Financial Services
  {
    id: "banking-credit-decision",
    name: "Banking: Credit Decision Report",
    description: "Credit risk assessment for banking and lending decisions",
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
      primaryColor: "#1e3a8a",
      accentColor: "#3b82f6",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "banking-portfolio-review",
    name: "Banking: Portfolio Review",
    description: "Quarterly portfolio performance and risk review",
    audience: "executive",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: true,
      sensitiveFactors: true,
      partnerAnalysis: false,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#0f172a",
      accentColor: "#475569",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: true,
    },
  },

  // Healthcare
  {
    id: "healthcare-investment",
    name: "Healthcare: Investment Decision",
    description: "Healthcare investment and capital allocation analysis",
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
      primaryColor: "#0891b2",
      accentColor: "#06b6d4",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "healthcare-compliance",
    name: "Healthcare: Compliance Report",
    description: "Regulatory compliance and risk assessment",
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
      primaryColor: "#0e7490",
      accentColor: "#22d3ee",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: false,
    },
  },

  // Manufacturing
  {
    id: "manufacturing-capex",
    name: "Manufacturing: CapEx Decision",
    description: "Capital expenditure and equipment investment analysis",
    audience: "executive",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: true,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#ea580c",
      accentColor: "#f97316",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "manufacturing-supplier",
    name: "Manufacturing: Supplier Risk Analysis",
    description: "Supply chain and supplier dependency assessment",
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
      primaryColor: "#c2410c",
      accentColor: "#fb923c",
      headerStyle: "minimal",
      includeCharts: true,
      includeLogos: false,
    },
  },

  // Retail
  {
    id: "retail-expansion",
    name: "Retail: Market Expansion",
    description: "New market entry and expansion decision analysis",
    audience: "board",
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
      primaryColor: "#be123c",
      accentColor: "#f43f5e",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "retail-vendor",
    name: "Retail: Vendor Partnership",
    description: "Vendor selection and partnership evaluation",
    audience: "stakeholder",
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
      primaryColor: "#9f1239",
      accentColor: "#fb7185",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },

  // Technology
  {
    id: "tech-product-launch",
    name: "Technology: Product Launch",
    description: "New product launch decision and market analysis",
    audience: "executive",
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
      primaryColor: "#7c3aed",
      accentColor: "#a78bfa",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },
  {
    id: "tech-rd-investment",
    name: "Technology: R&D Investment",
    description: "Research and development investment analysis",
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
      primaryColor: "#6d28d9",
      accentColor: "#c4b5fd",
      headerStyle: "modern",
      includeCharts: true,
      includeLogos: true,
    },
  },

  // Energy & Utilities
  {
    id: "energy-project",
    name: "Energy: Project Investment",
    description: "Energy project and infrastructure investment analysis",
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
      primaryColor: "#15803d",
      accentColor: "#22c55e",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: true,
    },
  },

  // Real Estate
  {
    id: "realestate-acquisition",
    name: "Real Estate: Acquisition Analysis",
    description: "Property acquisition and development decision",
    audience: "board",
    sections: {
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: true,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: false,
    },
    styling: {
      primaryColor: "#0369a1",
      accentColor: "#38bdf8",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: true,
    },
  },

  // Insurance
  {
    id: "insurance-underwriting",
    name: "Insurance: Underwriting Decision",
    description: "Underwriting risk assessment and pricing analysis",
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
      primaryColor: "#0f766e",
      accentColor: "#14b8a6",
      headerStyle: "formal",
      includeCharts: true,
      includeLogos: false,
    },
  },
];

// Get templates by industry
export function getTemplatesByIndustry(industry: string): ReportTemplate[] {
  const industryPrefix = industry.toLowerCase();
  return INDUSTRY_TEMPLATES.filter((t) => t.id.startsWith(industryPrefix));
}

// Get all industries
export function getAvailableIndustries(): string[] {
  const industries = new Set<string>();
  INDUSTRY_TEMPLATES.forEach((t) => {
    const industry = t.id.split("-")[0];
    industries.add(industry);
  });
  return Array.from(industries);
}
