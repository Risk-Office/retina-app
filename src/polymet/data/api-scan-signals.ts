// Mock API handler for /api/scan/signals
// In a real Next.js app, this would be in pages/api/scan/signals.ts

export interface ScanSignal {
  source: string;
  relevance: number;
  snippet: string;
  url: string;
}

export interface ScanSignalsResponse {
  signals: ScanSignal[];
  decisionId: string;
  tenantId: string;
}

// Extended signal source types
export type SignalCategory =
  | "economic"
  | "market"
  | "operational"
  | "financial"
  | "customer"
  | "competitor"
  | "regulatory"
  | "technology";

export interface LiveSignalSource {
  id: string;
  label: string;
  category: SignalCategory;
  unit: string;
  description: string;
  updateFrequency: "realtime" | "hourly" | "daily" | "weekly";
  currentValue: number;
  historicalData: Array<{
    timestamp: number;
    value: number;
  }>;
  forecast?: Array<{
    timestamp: number;
    predicted: number;
    confidence: number; // 0-1
  }>;
  trend?: "up" | "down" | "stable";
  volatility?: number; // 0-1
}

// Mock signal sources with expanded data
export const MOCK_SIGNAL_SOURCES: LiveSignalSource[] = [
  {
    id: "sig-cost-index",
    label: "Cost Index (CPI)",
    category: "economic",
    unit: "index",
    description: "Consumer Price Index tracking inflation and cost trends",
    updateFrequency: "daily",
    currentValue: 285.2,
    historicalData: generateHistoricalData(285.2, 30, 0.02),
    trend: "up",
    volatility: 0.15,
  },
  {
    id: "sig-demand-score",
    label: "Demand Score",
    category: "market",
    unit: "score",
    description: "Market demand indicator based on search trends and inquiries",
    updateFrequency: "hourly",
    currentValue: 72.5,
    historicalData: generateHistoricalData(72.5, 30, 0.05),
    trend: "up",
    volatility: 0.25,
  },
  {
    id: "sig-market-volatility",
    label: "Market Volatility",
    category: "market",
    unit: "percentage",
    description: "Market volatility index measuring price fluctuations",
    updateFrequency: "realtime",
    currentValue: 18.3,
    historicalData: generateHistoricalData(18.3, 30, 0.1),
    trend: "stable",
    volatility: 0.4,
  },
  {
    id: "sig-competitor-price",
    label: "Competitor Pricing",
    category: "competitor",
    unit: "currency",
    description: "Average competitor pricing for similar products/services",
    updateFrequency: "daily",
    currentValue: 149.99,
    historicalData: generateHistoricalData(149.99, 30, 0.03),
    trend: "down",
    volatility: 0.12,
  },
  {
    id: "sig-supply-chain",
    label: "Supply Chain Index",
    category: "operational",
    unit: "score",
    description: "Supply chain health indicator (0-100)",
    updateFrequency: "daily",
    currentValue: 91.2,
    historicalData: generateHistoricalData(91.2, 30, 0.02),
    trend: "stable",
    volatility: 0.08,
  },
  {
    id: "sig-customer-sentiment",
    label: "Customer Sentiment",
    category: "customer",
    unit: "score",
    description: "Customer satisfaction and sentiment score (0-10)",
    updateFrequency: "daily",
    currentValue: 8.1,
    historicalData: generateHistoricalData(8.1, 30, 0.04),
    trend: "up",
    volatility: 0.18,
  },
  {
    id: "sig-interest-rate",
    label: "Interest Rate",
    category: "financial",
    unit: "percentage",
    description: "Central bank interest rate affecting borrowing costs",
    updateFrequency: "weekly",
    currentValue: 5.25,
    historicalData: generateHistoricalData(5.25, 30, 0.01),
    trend: "stable",
    volatility: 0.05,
  },
  {
    id: "sig-fx-rate",
    label: "FX Rate (USD/EUR)",
    category: "financial",
    unit: "rate",
    description: "Foreign exchange rate for international operations",
    updateFrequency: "realtime",
    currentValue: 1.08,
    historicalData: generateHistoricalData(1.08, 30, 0.02),
    trend: "down",
    volatility: 0.22,
  },
  {
    id: "sig-regulatory-risk",
    label: "Regulatory Risk Index",
    category: "regulatory",
    unit: "score",
    description: "Regulatory change risk indicator (0-100)",
    updateFrequency: "weekly",
    currentValue: 32.5,
    historicalData: generateHistoricalData(32.5, 30, 0.06),
    trend: "up",
    volatility: 0.3,
  },
  {
    id: "sig-tech-adoption",
    label: "Technology Adoption Rate",
    category: "technology",
    unit: "percentage",
    description: "Rate of technology adoption in target market",
    updateFrequency: "weekly",
    currentValue: 67.8,
    historicalData: generateHistoricalData(67.8, 30, 0.03),
    trend: "up",
    volatility: 0.15,
  },
  {
    id: "sig-employee-satisfaction",
    label: "Employee Satisfaction",
    category: "operational",
    unit: "score",
    description: "Internal employee satisfaction score (0-100)",
    updateFrequency: "weekly",
    currentValue: 78.5,
    historicalData: generateHistoricalData(78.5, 30, 0.02),
    trend: "stable",
    volatility: 0.1,
  },
  {
    id: "sig-market-share",
    label: "Market Share",
    category: "market",
    unit: "percentage",
    description: "Company market share in target segment",
    updateFrequency: "weekly",
    currentValue: 23.4,
    historicalData: generateHistoricalData(23.4, 30, 0.02),
    trend: "up",
    volatility: 0.12,
  },
];

// Helper function to generate historical data
function generateHistoricalData(
  currentValue: number,
  days: number,
  volatility: number
): Array<{ timestamp: number; value: number }> {
  const data: Array<{ timestamp: number; value: number }> = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    // Generate value with random walk
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const value = currentValue * (1 + randomChange * (i / days));
    data.push({ timestamp, value });
  }

  return data;
}

// Mock data generator
function generateMockSignals(
  tenantId: string,
  decisionId: string
): ScanSignal[] {
  const mockSignals: ScanSignal[] = [
    {
      source: "Industry Report Q4 2024",
      relevance: 92,
      snippet:
        "Market analysis indicates a 23% increase in demand for cloud-based solutions, with enterprise adoption accelerating...",
      url: "https://example.com/reports/q4-2024",
    },
    {
      source: "Competitor Analysis - TechCorp",
      relevance: 87,
      snippet:
        "Recent product launches show focus on AI integration and automation, capturing 15% market share in the segment...",
      url: "https://example.com/analysis/techcorp",
    },
    {
      source: "Customer Feedback Survey",
      relevance: 78,
      snippet:
        "85% of respondents expressed interest in enhanced security features, citing compliance requirements as primary driver...",
      url: "https://example.com/surveys/customer-feedback",
    },
  ];

  // Vary data slightly based on tenant
  if (tenantId === "t-acme") {
    mockSignals[0].source = "Acme Industry Insights";
    mockSignals[0].relevance = 95;
  }

  return mockSignals;
}

// Mock API handler
export async function getScanSignals(
  decisionId: string,
  tenantId: string
): Promise<ScanSignalsResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Generate mock data
  const signals = generateMockSignals(tenantId, decisionId);

  return {
    signals,
    decisionId,
    tenantId,
  };
}

// Next.js API route handler (for reference)
export const apiHandler = {
  GET: async (req: any, res: any) => {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const decisionId = req.query.decisionId;

      if (!tenantId) {
        return res.status(400).json({ error: "Missing x-tenant-id header" });
      }

      if (!decisionId) {
        return res.status(400).json({ error: "Missing decisionId parameter" });
      }

      const response = await getScanSignals(decisionId, tenantId);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
