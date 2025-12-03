import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NetworkIcon,
  TrendingUpIcon,
  LinkIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "lucide-react";
import type { KnowledgeGraph } from "@/polymet/data/knowledge-graph";
import {
  getGraphStats,
  findLearningPaths,
  calculateCentrality,
} from "@/polymet/data/knowledge-graph";
import { KnowledgeGraphViewer } from "@/polymet/components/knowledge-graph-viewer";

interface KnowledgeGraphWidgetProps {
  graph: KnowledgeGraph;
  onAuditEvent?: (eventType: string, payload: any) => void;
  className?: string;
}

export function KnowledgeGraphWidget({
  graph,
  onAuditEvent,
  className,
}: KnowledgeGraphWidgetProps) {
  const [showFullGraph, setShowFullGraph] = useState(false);

  const stats = getGraphStats(graph);
  const learningPaths = findLearningPaths(graph);
  const centrality = calculateCentrality(graph);

  // Find most connected nodes
  const mostConnectedNodes = Object.entries(centrality)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([nodeId]) => graph.nodes.find((n) => n.id === nodeId))
    .filter(Boolean);

  // Count active learning paths
  const activeLearningPaths = learningPaths.filter((path) => {
    const pathNodes = path.path.map((id) =>
      graph.nodes.find((n) => n.id === id)
    );
    return pathNodes.every((node) => node?.metadata?.status !== "archived");
  });

  // Calculate graph health score (0-100)
  const healthScore = Math.min(
    100,
    Math.round(
      (stats.totalEdges / Math.max(stats.totalNodes, 1)) * 20 +
        activeLearningPaths.length * 10 +
        (stats.edgesByType.SHARES_VARIABLE / Math.max(stats.totalEdges, 1)) * 50
    )
  );

  const handleOpenFullGraph = () => {
    setShowFullGraph(true);
    onAuditEvent?.("knowledge_graph_opened", {
      tenantId: graph.tenantId,
      totalNodes: stats.totalNodes,
      totalEdges: stats.totalEdges,
    });
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <NetworkIcon className="h-5 w-5" />
                Knowledge Graph
              </CardTitle>
              <CardDescription>
                Learning backbone connecting decisions, signals, and outcomes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenFullGraph}>
              View Full Graph
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Score */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Graph Health
              </div>
              <div className="text-2xl font-bold">{healthScore}/100</div>
            </div>
            <div className="flex items-center gap-2">
              {healthScore >= 70 ? (
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              ) : healthScore >= 40 ? (
                <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
              ) : (
                <AlertTriangleIcon className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-card border border-border rounded-lg">
              <div className="text-2xl font-bold text-chart-1">
                {stats.totalNodes}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Nodes</div>
            </div>
            <div className="text-center p-3 bg-card border border-border rounded-lg">
              <div className="text-2xl font-bold text-chart-2">
                {stats.totalEdges}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Connections
              </div>
            </div>
            <div className="text-center p-3 bg-card border border-border rounded-lg">
              <div className="text-2xl font-bold text-chart-3">
                {activeLearningPaths.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Learning Paths
              </div>
            </div>
          </div>

          {/* Node Distribution */}
          <div>
            <div className="text-sm font-medium mb-2">Node Distribution</div>
            <div className="space-y-2">
              {Object.entries(stats.nodesByType)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(count / stats.totalNodes) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Most Connected Nodes */}
          {mostConnectedNodes.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4" />
                Most Connected Nodes
              </div>
              <div className="space-y-2">
                {mostConnectedNodes.map((node) => {
                  if (!node) return null;
                  return (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {node.type}
                        </Badge>
                        <span className="truncate">{node.label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                        <LinkIcon className="h-3 w-3" />

                        <span className="text-xs">{centrality[node.id]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Learning Paths */}
          {activeLearningPaths.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">
                Active Learning Paths
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {activeLearningPaths.slice(0, 3).map((path, idx) => (
                  <div key={idx} className="text-xs p-2 bg-muted rounded">
                    {path.description}
                  </div>
                ))}
              </div>
              {activeLearningPaths.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleOpenFullGraph}
                >
                  View {activeLearningPaths.length - 3} more paths
                </Button>
              )}
            </div>
          )}

          {/* Connection Insights */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">💡 Insight</div>
            <div className="text-muted-foreground">
              {stats.edgesByType.SHARES_VARIABLE > 0 ? (
                <>
                  {stats.edgesByType.SHARES_VARIABLE} decisions share common
                  variables, enabling cross-decision learning and pattern
                  recognition.
                </>
              ) : (
                <>
                  No shared variables detected between decisions. Consider
                  linking decisions with common risk factors for better
                  insights.
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Graph Dialog */}
      <Dialog open={showFullGraph} onOpenChange={setShowFullGraph}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Knowledge Graph - Full View</DialogTitle>
            <DialogDescription>
              Interactive visualization of all relationships in the system
            </DialogDescription>
          </DialogHeader>
          <KnowledgeGraphViewer
            graph={graph}
            onAuditEvent={onAuditEvent}
            onNodeClick={(node) => {
              console.log("Node clicked:", node);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
