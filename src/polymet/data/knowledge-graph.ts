/**
 * # Knowledge Graph System
 *
 * ## Overview
 * Creates a knowledge graph linking Decisions, Signals, Incidents, Outcomes, and Guardrails
 * via shared variables. This forms the learning backbone showing how each decision relates to others.
 *
 * ## Node Types
 * - Decision: Core decision nodes with options and variables
 * - RiskSignal: External signals linked to decisions
 * - Incident: Events that impact decisions
 * - Outcome: Actual results from decisions
 * - Guardrail: Rules and thresholds governing decisions
 *
 * ## Edge Types
 * - LINKED_TO: Signal → Decision (via shared variable)
 * - TRIGGERED: Incident → Decision (via signal match)
 * - RESULTED_IN: Decision → Outcome (actual result)
 * - GOVERNED_BY: Decision → Guardrail (rule application)
 * - INFLUENCED: Outcome → Guardrail (auto-adjustment)
 * - SHARES_VARIABLE: Decision ↔ Decision (common variables)
 */

export type NodeType =
  | "Decision"
  | "RiskSignal"
  | "Incident"
  | "Outcome"
  | "Guardrail";

export type EdgeType =
  | "LINKED_TO"
  | "TRIGGERED"
  | "RESULTED_IN"
  | "GOVERNED_BY"
  | "INFLUENCED"
  | "SHARES_VARIABLE";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  metadata: Record<string, any>;
  variables?: string[]; // Shared variables for linking
  timestamp?: number;
}

export interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: EdgeType;
  weight: number; // Strength of relationship (0-1)
  metadata?: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tenantId: string;
  lastUpdated: number;
}

/**
 * Build knowledge graph from system data
 */
export function buildKnowledgeGraph(
  tenantId: string,
  decisions: any[],
  signals: any[],
  incidents: any[],
  outcomes: any[],
  guardrails: any[]
): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add Decision nodes
  decisions.forEach((decision) => {
    const variables = extractVariablesFromDecision(decision);
    nodes.push({
      id: `decision-${decision.id}`,
      type: "Decision",
      label: decision.title || "Untitled Decision",
      metadata: {
        status: decision.status,
        chosenOption: decision.chosenOptionId,
        createdAt: decision.createdAt,
        finalizedAt: decision.finalizedAt,
      },
      variables,
      timestamp: decision.createdAt,
    });
  });

  // Add RiskSignal nodes
  signals.forEach((signal) => {
    nodes.push({
      id: `signal-${signal.signalId}`,
      type: "RiskSignal",
      label: signal.name,
      metadata: {
        category: signal.category,
        currentValue: signal.currentValue,
        trend: signal.trend,
      },
      variables: [signal.name],
      timestamp: signal.lastUpdated,
    });

    // Link signals to decisions via shared variables
    decisions.forEach((decision) => {
      const linkedSignals = decision.linkedSignals || [];
      const match = linkedSignals.find(
        (ls: any) => ls.signalId === signal.signalId
      );
      if (match) {
        edges.push({
          id: `signal-${signal.signalId}-decision-${decision.id}`,
          source: `signal-${signal.signalId}`,
          target: `decision-${decision.id}`,
          type: "LINKED_TO",
          weight: 0.8,
          metadata: {
            variableKey: match.variableKey,
          },
        });
      }
    });
  });

  // Add Incident nodes
  incidents.forEach((incident) => {
    nodes.push({
      id: `incident-${incident.id}`,
      type: "Incident",
      label: incident.title,
      metadata: {
        severity: incident.severity,
        category: incident.category,
        resolved: incident.resolved,
      },
      timestamp: incident.timestamp,
    });

    // Link incidents to decisions via signal matches
    const affectedDecisions = incident.affectedDecisions || [];
    affectedDecisions.forEach((decisionId: string) => {
      edges.push({
        id: `incident-${incident.id}-decision-${decisionId}`,
        source: `incident-${incident.id}`,
        target: `decision-${decisionId}`,
        type: "TRIGGERED",
        weight: incident.severity === "critical" ? 1.0 : 0.6,
      });
    });
  });

  // Add Outcome nodes
  outcomes.forEach((outcome) => {
    nodes.push({
      id: `outcome-${outcome.id}`,
      type: "Outcome",
      label: `Outcome: ${outcome.decisionId}`,
      metadata: {
        actualValue: outcome.actualValue,
        expectedValue: outcome.expectedValue,
        variance: outcome.variance,
      },
      timestamp: outcome.loggedAt,
    });

    // Link outcomes to decisions
    edges.push({
      id: `decision-${outcome.decisionId}-outcome-${outcome.id}`,
      source: `decision-${outcome.decisionId}`,
      target: `outcome-${outcome.id}`,
      type: "RESULTED_IN",
      weight: 1.0,
    });

    // Link outcomes to guardrails if they influenced adjustments
    if (outcome.triggeredAdjustment) {
      guardrails.forEach((guardrail) => {
        if (guardrail.decisionId === outcome.decisionId) {
          edges.push({
            id: `outcome-${outcome.id}-guardrail-${guardrail.id}`,
            source: `outcome-${outcome.id}`,
            target: `guardrail-${guardrail.id}`,
            type: "INFLUENCED",
            weight: 0.7,
          });
        }
      });
    }
  });

  // Add Guardrail nodes
  guardrails.forEach((guardrail) => {
    nodes.push({
      id: `guardrail-${guardrail.id}`,
      type: "Guardrail",
      label: guardrail.name,
      metadata: {
        metric: guardrail.metric,
        threshold: guardrail.threshold,
        alertLevel: guardrail.alertLevel,
      },
      timestamp: guardrail.createdAt,
    });

    // Link guardrails to decisions
    edges.push({
      id: `decision-${guardrail.decisionId}-guardrail-${guardrail.id}`,
      source: `decision-${guardrail.decisionId}`,
      target: `guardrail-${guardrail.id}`,
      type: "GOVERNED_BY",
      weight: 0.9,
    });
  });

  // Create SHARES_VARIABLE edges between decisions
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      if (nodeA.type === "Decision" && nodeB.type === "Decision") {
        const sharedVars = findSharedVariables(
          nodeA.variables || [],
          nodeB.variables || []
        );
        if (sharedVars.length > 0) {
          edges.push({
            id: `${nodeA.id}-shares-${nodeB.id}`,
            source: nodeA.id,
            target: nodeB.id,
            type: "SHARES_VARIABLE",
            weight:
              sharedVars.length /
              Math.max(
                nodeA.variables?.length || 1,
                nodeB.variables?.length || 1
              ),
            metadata: {
              sharedVariables: sharedVars,
            },
          });
        }
      }
    }
  }

  return {
    nodes,
    edges,
    tenantId,
    lastUpdated: Date.now(),
  };
}

/**
 * Extract variable names from decision
 */
function extractVariablesFromDecision(decision: any): string[] {
  const variables: string[] = [];

  if (decision.scenarioVars) {
    decision.scenarioVars.forEach((v: any) => {
      variables.push(v.name);
    });
  }

  if (decision.linkedSignals) {
    decision.linkedSignals.forEach((ls: any) => {
      if (ls.variableKey) {
        variables.push(ls.variableKey);
      }
    });
  }

  return [...new Set(variables)]; // Remove duplicates
}

/**
 * Find shared variables between two lists
 */
function findSharedVariables(varsA: string[], varsB: string[]): string[] {
  return varsA.filter((v) => varsB.includes(v));
}

/**
 * Get neighbors of a node
 */
export function getNodeNeighbors(
  graph: KnowledgeGraph,
  nodeId: string
): GraphNode[] {
  const neighborIds = new Set<string>();

  graph.edges.forEach((edge) => {
    if (edge.source === nodeId) {
      neighborIds.add(edge.target);
    }
    if (edge.target === nodeId) {
      neighborIds.add(edge.source);
    }
  });

  return graph.nodes.filter((node) => neighborIds.has(node.id));
}

/**
 * Get subgraph around a node (node + neighbors + edges)
 */
export function getSubgraph(
  graph: KnowledgeGraph,
  nodeId: string,
  depth: number = 1
): KnowledgeGraph {
  const includedNodeIds = new Set<string>([nodeId]);
  let currentLayer = [nodeId];

  // BFS to get nodes within depth
  for (let d = 0; d < depth; d++) {
    const nextLayer: string[] = [];
    currentLayer.forEach((currentNodeId) => {
      graph.edges.forEach((edge) => {
        if (
          edge.source === currentNodeId &&
          !includedNodeIds.has(edge.target)
        ) {
          includedNodeIds.add(edge.target);
          nextLayer.push(edge.target);
        }
        if (
          edge.target === currentNodeId &&
          !includedNodeIds.has(edge.source)
        ) {
          includedNodeIds.add(edge.source);
          nextLayer.push(edge.source);
        }
      });
    });
    currentLayer = nextLayer;
  }

  const subgraphNodes = graph.nodes.filter((node) =>
    includedNodeIds.has(node.id)
  );
  const subgraphEdges = graph.edges.filter(
    (edge) =>
      includedNodeIds.has(edge.source) && includedNodeIds.has(edge.target)
  );

  return {
    nodes: subgraphNodes,
    edges: subgraphEdges,
    tenantId: graph.tenantId,
    lastUpdated: graph.lastUpdated,
  };
}

/**
 * Calculate centrality scores (how connected each node is)
 */
export function calculateCentrality(
  graph: KnowledgeGraph
): Record<string, number> {
  const centrality: Record<string, number> = {};

  graph.nodes.forEach((node) => {
    const degree = graph.edges.filter(
      (edge) => edge.source === node.id || edge.target === node.id
    ).length;
    centrality[node.id] = degree;
  });

  return centrality;
}

/**
 * Find learning paths (Decision → Outcome → Guardrail adjustment → New Decision)
 */
export function findLearningPaths(graph: KnowledgeGraph): Array<{
  path: string[];
  description: string;
}> {
  const paths: Array<{ path: string[]; description: string }> = [];

  // Find Decision → Outcome → Guardrail chains
  graph.nodes
    .filter((node) => node.type === "Decision")
    .forEach((decisionNode) => {
      const outcomeEdges = graph.edges.filter(
        (edge) => edge.source === decisionNode.id && edge.type === "RESULTED_IN"
      );

      outcomeEdges.forEach((outcomeEdge) => {
        const influenceEdges = graph.edges.filter(
          (edge) =>
            edge.source === outcomeEdge.target && edge.type === "INFLUENCED"
        );

        influenceEdges.forEach((influenceEdge) => {
          const guardrailNode = graph.nodes.find(
            (n) => n.id === influenceEdge.target
          );
          if (guardrailNode) {
            paths.push({
              path: [decisionNode.id, outcomeEdge.target, guardrailNode.id],
              description: `${decisionNode.label} → Outcome → ${guardrailNode.label} adjustment`,
            });
          }
        });
      });
    });

  return paths;
}

/**
 * Get graph statistics
 */
export function getGraphStats(graph: KnowledgeGraph) {
  const nodesByType: Record<NodeType, number> = {
    Decision: 0,
    RiskSignal: 0,
    Incident: 0,
    Outcome: 0,
    Guardrail: 0,
  };

  graph.nodes.forEach((node) => {
    nodesByType[node.type]++;
  });

  const edgesByType: Record<EdgeType, number> = {
    LINKED_TO: 0,
    TRIGGERED: 0,
    RESULTED_IN: 0,
    GOVERNED_BY: 0,
    INFLUENCED: 0,
    SHARES_VARIABLE: 0,
  };

  graph.edges.forEach((edge) => {
    edgesByType[edge.type]++;
  });

  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    nodesByType,
    edgesByType,
    avgDegree: (graph.edges.length * 2) / graph.nodes.length,
  };
}
