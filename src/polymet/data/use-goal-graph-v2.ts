import { useState, useEffect, useCallback, useMemo } from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import type { GoalV2 } from "@/polymet/data/goal-v2-schema";
import type { UseGoalsV2Filters } from "@/polymet/data/use-goals-v2";

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  status: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "depends_on" | "enables";
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Custom hook for managing goal dependency graph
 */
export function useGoalGraphV2(filters?: UseGoalsV2Filters) {
  const { tenantId } = useTenant();
  const [graph, setGraph] = useState<DependencyGraph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load goals from localStorage and build graph
  const loadGraph = useCallback(() => {
    try {
      setLoading(true);
      const key = `retina_goals_v2_${tenantId}`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        setGraph({ nodes: [], edges: [] });
        setError(null);
        setLoading(false);
        return;
      }

      const goals: GoalV2[] = JSON.parse(stored);

      // Apply filters
      let filteredGoals = goals;

      if (filters) {
        filteredGoals = goals.filter((goal) => {
          // Category filter
          if (filters.category && goal.category !== filters.category) {
            return false;
          }

          // Status filter
          if (filters.status && goal.status !== filters.status) {
            return false;
          }

          // Time horizon filter
          if (
            filters.time_horizon &&
            goal.time_horizon !== filters.time_horizon
          ) {
            return false;
          }

          // Stakeholder filter
          if (filters.stakeholder_id) {
            const isOwner = goal.owners.some(
              (owner) => owner.stakeholder_id === filters.stakeholder_id
            );
            const isRelated = goal.related_stakeholders.includes(
              filters.stakeholder_id
            );
            if (!isOwner && !isRelated) {
              return false;
            }
          }

          // Search query
          if (filters.q) {
            const query = filters.q.toLowerCase();
            const matchesStatement = goal.statement
              .toLowerCase()
              .includes(query);
            const matchesDescription = goal.description
              ?.toLowerCase()
              .includes(query);
            const matchesTags = goal.tags.some((tag) =>
              tag.toLowerCase().includes(query)
            );
            const matchesKPIs = goal.kpis.some((kpi) =>
              kpi.name.toLowerCase().includes(query)
            );
            if (
              !matchesStatement &&
              !matchesDescription &&
              !matchesTags &&
              !matchesKPIs
            ) {
              return false;
            }
          }

          return true;
        });
      }

      // Build nodes
      const nodes: GraphNode[] = filteredGoals.map((goal) => ({
        id: goal.id,
        label: goal.statement,
        category: goal.category,
        status: goal.status,
      }));

      // Build edges
      const edges: GraphEdge[] = [];
      const nodeIds = new Set(nodes.map((n) => n.id));

      filteredGoals.forEach((goal) => {
        // Add "depends_on" edges
        goal.dependencies.depends_on.forEach((depId) => {
          // Only add edge if both nodes are in filtered set
          if (nodeIds.has(depId)) {
            edges.push({
              from: depId,
              to: goal.id,
              type: "depends_on",
            });
          }
        });

        // Add "enables" edges
        goal.dependencies.enables.forEach((enabledId) => {
          // Only add edge if both nodes are in filtered set
          if (nodeIds.has(enabledId)) {
            edges.push({
              from: goal.id,
              to: enabledId,
              type: "enables",
            });
          }
        });
      });

      setGraph({ nodes, edges });
      setError(null);
    } catch (err) {
      setError("Failed to load dependency graph");
      console.error("Error loading graph:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);

  // Load graph on mount or when filters change
  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Get connected nodes for a given node
  const getConnectedNodes = useCallback(
    (nodeId: string) => {
      const connectedIds = new Set<string>();

      graph.edges.forEach((edge) => {
        if (edge.from === nodeId) {
          connectedIds.add(edge.to);
        }
        if (edge.to === nodeId) {
          connectedIds.add(edge.from);
        }
      });

      return graph.nodes.filter((node) => connectedIds.has(node.id));
    },
    [graph]
  );

  // Get incoming edges for a node
  const getIncomingEdges = useCallback(
    (nodeId: string) => {
      return graph.edges.filter((edge) => edge.to === nodeId);
    },
    [graph]
  );

  // Get outgoing edges for a node
  const getOutgoingEdges = useCallback(
    (nodeId: string) => {
      return graph.edges.filter((edge) => edge.from === nodeId);
    },
    [graph]
  );

  // Get graph statistics
  const stats = useMemo(() => {
    const nodeCount = graph.nodes.length;
    const edgeCount = graph.edges.length;
    const dependsOnCount = graph.edges.filter(
      (e) => e.type === "depends_on"
    ).length;
    const enablesCount = graph.edges.filter((e) => e.type === "enables").length;

    // Find nodes with no dependencies (root nodes)
    const nodesWithIncoming = new Set(graph.edges.map((e) => e.to));
    const rootNodes = graph.nodes.filter((n) => !nodesWithIncoming.has(n.id));

    // Find nodes with no dependents (leaf nodes)
    const nodesWithOutgoing = new Set(graph.edges.map((e) => e.from));
    const leafNodes = graph.nodes.filter((n) => !nodesWithOutgoing.has(n.id));

    return {
      nodeCount,
      edgeCount,
      dependsOnCount,
      enablesCount,
      rootNodeCount: rootNodes.length,
      leafNodeCount: leafNodes.length,
    };
  }, [graph]);

  return {
    graph,
    loading,
    error,
    refetch: loadGraph,
    getConnectedNodes,
    getIncomingEdges,
    getOutgoingEdges,
    stats,
  };
}
