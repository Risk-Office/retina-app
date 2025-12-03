import { useState, useEffect, useCallback, useRef } from "react";

interface TimelineEvent {
  id: string;
  type: "decision" | "outcome" | "adjustment" | "review";
  date: number;
  title: string;
  description: string;
  metrics?: {
    expectedValue?: number;
    actualValue?: number;
    variance?: number;
  };
}

interface MetricsUpdate {
  month: string;
  expected: number;
  actual: number;
  variance: number;
}

interface RealtimeFeedbackData {
  decisionId: string;
  timelineEvents: TimelineEvent[];
  metricsHistory: MetricsUpdate[];
  lastUpdate: number;
}

interface UseRealtimeFeedbackOptions {
  decisionId: string;
  enabled?: boolean;
  wsUrl?: string;
  onUpdate?: (data: RealtimeFeedbackData) => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
}

interface UseRealtimeFeedbackReturn {
  data: RealtimeFeedbackData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for real-time feedback loop updates using WebSocket
 *
 * @example
 * ```tsx
 * const { data, isConnected, error } = useRealtimeFeedback({
 *   decisionId: "dec-001",
 *   enabled: true,
 *   onUpdate: (data) => console.log("New update:", data),
 * });
 * ```
 */
export function useRealtimeFeedback({
  decisionId,
  enabled = true,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/feedback",
  onUpdate,
  onError,
  reconnectInterval = 5000,
}: UseRealtimeFeedbackOptions): UseRealtimeFeedbackReturn {
  const [data, setData] = useState<RealtimeFeedbackData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || !decisionId) {
      setIsLoading(false);
      return;
    }

    try {
      // Construct WebSocket URL with decision ID
      const url = `${wsUrl}?decisionId=${encodeURIComponent(decisionId)}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(
          `[WebSocket] Connected to feedback stream for ${decisionId}`
        );
        setIsConnected(true);
        setIsLoading(false);
        setError(null);

        // Send initial subscription message
        ws.send(
          JSON.stringify({
            type: "subscribe",
            decisionId,
            timestamp: Date.now(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "feedback_update") {
            const updateData: RealtimeFeedbackData = {
              decisionId: message.decisionId,
              timelineEvents: message.timelineEvents || [],
              metricsHistory: message.metricsHistory || [],
              lastUpdate: message.timestamp || Date.now(),
            };

            setData(updateData);
            onUpdate?.(updateData);
          } else if (message.type === "error") {
            const err = new Error(message.message || "WebSocket error");
            setError(err);
            onError?.(err);
          }
        } catch (err) {
          console.error("[WebSocket] Failed to parse message:", err);
          const parseError = new Error("Failed to parse WebSocket message");
          setError(parseError);
          onError?.(parseError);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        const wsError = new Error("WebSocket connection error");
        setError(wsError);
        onError?.(wsError);
      };

      ws.onclose = (event) => {
        console.log(`[WebSocket] Disconnected (code: ${event.code})`);
        setIsConnected(false);

        // Attempt to reconnect if enabled and not manually closed
        if (shouldReconnectRef.current && enabled) {
          console.log(`[WebSocket] Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[WebSocket] Connection failed:", err);
      const connectionError =
        err instanceof Error ? err : new Error("Failed to connect");
      setError(connectionError);
      setIsLoading(false);
      onError?.(connectionError);
    }
  }, [decisionId, enabled, wsUrl, onUpdate, onError, reconnectInterval]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    connect();
  }, [connect, disconnect]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    reconnect,
    disconnect,
  };
}

/**
 * Mock WebSocket server simulator for development/testing
 * This simulates real-time updates without requiring an actual WebSocket server
 */
export function useMockRealtimeFeedback({
  decisionId,
  enabled = true,
  updateInterval = 10000, // Update every 10 seconds
  onUpdate,
}: {
  decisionId: string;
  enabled?: boolean;
  updateInterval?: number;
  onUpdate?: (data: RealtimeFeedbackData) => void;
}): UseRealtimeFeedbackReturn {
  const [data, setData] = useState<RealtimeFeedbackData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateMockUpdate = useCallback((): RealtimeFeedbackData => {
    const now = Date.now();
    const eventCount = Math.floor(Math.random() * 3) + 1;

    const timelineEvents: TimelineEvent[] = Array.from(
      { length: eventCount },
      (_, i) => ({
        id: `event-${now}-${i}`,
        type: ["outcome", "adjustment", "review"][
          Math.floor(Math.random() * 3)
        ] as TimelineEvent["type"],
        date: now - (eventCount - i) * 5 * 24 * 60 * 60 * 1000,
        title: `Event ${i + 1}`,
        description: `Mock event description ${i + 1}`,
        metrics: {
          expectedValue: 100 + Math.random() * 20,
          actualValue: 100 + Math.random() * 30,
          variance: -10 + Math.random() * 20,
        },
      })
    );

    const metricsHistory: MetricsUpdate[] = Array.from(
      { length: 6 },
      (_, i) => {
        const expected = 100 + i * 5;
        const variance = -5 + Math.random() * 15;
        return {
          month: `M${i + 1}`,
          expected,
          actual: expected + variance,
          variance,
        };
      }
    );

    return {
      decisionId,
      timelineEvents,
      metricsHistory,
      lastUpdate: now,
    };
  }, [decisionId]);

  const connect = useCallback(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);

      // Generate initial data
      const initialData = generateMockUpdate();
      setData(initialData);
      onUpdate?.(initialData);

      // Set up periodic updates
      intervalRef.current = setInterval(() => {
        const updateData = generateMockUpdate();
        setData(updateData);
        onUpdate?.(updateData);
      }, updateInterval);
    }, 1000);
  }, [enabled, generateMockUpdate, onUpdate, updateInterval]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    data,
    isConnected,
    isLoading,
    error: null,
    reconnect,
    disconnect,
  };
}
