/**
 * Dependency Cycle Detection for Goals V2
 * Prevents circular dependencies using DFS-based cycle detection
 */

export interface GoalDependency {
  goalId: string;
  dependsOn: string[]; // Goal IDs this goal depends on
  enables: string[]; // Goal IDs this goal enables
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycle?: string[]; // Array of goal IDs forming the cycle
  message?: string;
}

/**
 * Build adjacency list from dependencies
 */
function buildGraph(dependencies: GoalDependency[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  dependencies.forEach((dep) => {
    if (!graph.has(dep.goalId)) {
      graph.set(dep.goalId, new Set());
    }

    // Add edges: if A depends on B, then B -> A (B must come before A)
    dep.dependsOn.forEach((targetId) => {
      if (!graph.has(targetId)) {
        graph.set(targetId, new Set());
      }
      graph.get(targetId)!.add(dep.goalId);
    });

    // Add edges: if A enables B, then A -> B (A must come before B)
    dep.enables.forEach((targetId) => {
      graph.get(dep.goalId)!.add(targetId);
    });
  });

  return graph;
}

/**
 * DFS-based cycle detection
 */
function detectCycleDFS(
  node: string,
  graph: Map<string, Set<string>>,
  visited: Set<string>,
  recStack: Set<string>,
  path: string[]
): string[] | null {
  visited.add(node);
  recStack.add(node);
  path.push(node);

  const neighbors = graph.get(node) || new Set();

  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const cycle = detectCycleDFS(neighbor, graph, visited, recStack, path);
      if (cycle) return cycle;
    } else if (recStack.has(neighbor)) {
      // Found a cycle - extract the cycle from path
      const cycleStart = path.indexOf(neighbor);
      return path.slice(cycleStart).concat(neighbor);
    }
  }

  recStack.delete(node);
  path.pop();
  return null;
}

/**
 * Check if adding a new dependency would create a cycle
 */
export function wouldCreateCycle(
  existingDependencies: GoalDependency[],
  newGoalId: string,
  newDependsOn: string[],
  newEnables: string[]
): CycleDetectionResult {
  // Create a new dependency entry for the goal being added/updated
  const allDependencies = [
    ...existingDependencies.filter((d) => d.goalId !== newGoalId),
    {
      goalId: newGoalId,
      dependsOn: newDependsOn,
      enables: newEnables,
    },
  ];

  const graph = buildGraph(allDependencies);
  const visited = new Set<string>();

  // Check for cycles starting from each node
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const cycle = detectCycleDFS(node, graph, visited, new Set(), []);
      if (cycle) {
        return {
          hasCycle: true,
          cycle,
          message: `Circular dependency detected: ${cycle.join(" → ")}`,
        };
      }
    }
  }

  return {
    hasCycle: false,
    message: "No circular dependencies detected",
  };
}

/**
 * Validate dependencies for a goal
 */
export function validateDependencies(
  goalId: string,
  dependsOn: string[],
  enables: string[],
  existingDependencies: GoalDependency[]
): { isValid: boolean; error?: string } {
  // Check for self-dependency
  if (dependsOn.includes(goalId) || enables.includes(goalId)) {
    return {
      isValid: false,
      error: "A goal cannot depend on itself",
    };
  }

  // Check for duplicate dependencies
  const duplicates = dependsOn.filter((id) => enables.includes(id));
  if (duplicates.length > 0) {
    return {
      isValid: false,
      error: "A goal cannot both depend on and enable the same goal",
    };
  }

  // Check for cycles
  const cycleResult = wouldCreateCycle(
    existingDependencies,
    goalId,
    dependsOn,
    enables
  );
  if (cycleResult.hasCycle) {
    return {
      isValid: false,
      error: cycleResult.message,
    };
  }

  return { isValid: true };
}

/**
 * Get all goals that would be affected by a change to this goal
 */
export function getAffectedGoals(
  goalId: string,
  dependencies: GoalDependency[]
): { upstream: string[]; downstream: string[] } {
  const graph = buildGraph(dependencies);

  // Upstream: goals this goal depends on (directly or indirectly)
  const upstream = new Set<string>();
  const visitUpstream = (id: string) => {
    const dep = dependencies.find((d) => d.goalId === id);
    if (dep) {
      dep.dependsOn.forEach((depId) => {
        if (!upstream.has(depId)) {
          upstream.add(depId);
          visitUpstream(depId);
        }
      });
    }
  };
  visitUpstream(goalId);

  // Downstream: goals that depend on this goal (directly or indirectly)
  const downstream = new Set<string>();
  const visitDownstream = (id: string) => {
    const neighbors = graph.get(id) || new Set();
    neighbors.forEach((neighborId) => {
      if (!downstream.has(neighborId)) {
        downstream.add(neighborId);
        visitDownstream(neighborId);
      }
    });
  };
  visitDownstream(goalId);

  return {
    upstream: Array.from(upstream),
    downstream: Array.from(downstream),
  };
}

/**
 * Get topological sort of goals (dependency order)
 */
export function getTopologicalOrder(
  dependencies: GoalDependency[]
): string[] | null {
  const graph = buildGraph(dependencies);
  const inDegree = new Map<string, number>();

  // Initialize in-degree
  graph.forEach((_, node) => inDegree.set(node, 0));
  graph.forEach((neighbors) => {
    neighbors.forEach((neighbor) => {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    });
  });

  // Kahn's algorithm
  const queue: string[] = [];
  inDegree.forEach((degree, node) => {
    if (degree === 0) queue.push(node);
  });

  const result: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    const neighbors = graph.get(node) || new Set();
    neighbors.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // If result doesn't contain all nodes, there's a cycle
  if (result.length !== graph.size) {
    return null; // Cycle detected
  }

  return result;
}
