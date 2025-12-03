// Mock API handler for /api/events
// In a real Next.js app, this would be in pages/api/events.ts

export interface Event {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  timestamp: number;
  description?: string;
}

export interface EventsResponse {
  events: Event[];
  decisionId?: string;
  tenantId: string;
}

// Mock data generator
function generateMockEvents(tenantId: string, decisionId?: string): Event[] {
  const mockEvents: Event[] = [
    {
      id: "evt-001",
      title: "Security Alert: Unusual Access Pattern",
      severity: "high",
      status: "investigating",
      timestamp: Date.now() - 3600000, // 1 hour ago
      description:
        "Multiple failed login attempts detected from unknown IP addresses",
    },
    {
      id: "evt-002",
      title: "Performance Degradation in API Gateway",
      severity: "medium",
      status: "open",
      timestamp: Date.now() - 7200000, // 2 hours ago
      description: "Response times increased by 40% in the last hour",
    },
    {
      id: "evt-003",
      title: "Database Backup Completed Successfully",
      severity: "low",
      status: "resolved",
      timestamp: Date.now() - 10800000, // 3 hours ago
      description: "Scheduled backup completed without errors",
    },
  ];

  // Vary data slightly based on tenant
  if (tenantId === "t-acme") {
    mockEvents[0].title = "Acme Security Alert: Access Review Required";
    mockEvents[0].severity = "critical";
  }

  return mockEvents;
}

// Mock API handler
export async function getEvents(
  tenantId: string,
  decisionId?: string
): Promise<EventsResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Generate mock data
  const events = generateMockEvents(tenantId, decisionId);

  return {
    events,
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

      const response = await getEvents(tenantId, decisionId);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
