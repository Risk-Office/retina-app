import React, { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NetworkIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  FilterIcon,
  SearchIcon,
  InfoIcon,
} from "lucide-react";
import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
} from "@/polymet/data/knowledge-graph";
import {
  getNodeNeighbors,
  getSubgraph,
  calculateCentrality,
  findLearningPaths,
  getGraphStats,
} from "@/polymet/data/knowledge-graph";

interface KnowledgeGraphViewerProps {
  graph: KnowledgeGraph;
  onNodeClick?: (node: GraphNode) => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

interface NodeWithPosition extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COLORS: Record<NodeType, string> = {
  Decision: "hsl(var(--chart-1))",
  RiskSignal: "hsl(var(--chart-2))",
  Incident: "hsl(var(--chart-3))",
  Outcome: "hsl(var(--chart-4))",
  Guardrail: "hsl(var(--chart-5))",
};

const NODE_ICONS: Record<NodeType, string> = {
  Decision: "D",
  RiskSignal: "S",
  Incident: "I",
  Outcome: "O",
  Guardrail: "G",
};

const EDGE_COLORS: Record<EdgeType, string> = {
  LINKED_TO: "#3b82f6",
  TRIGGERED: "#ef4444",
  RESULTED_IN: "#10b981",
  GOVERNED_BY: "#f59e0b",
  INFLUENCED: "#8b5cf6",
  SHARES_VARIABLE: "#6b7280",
};

export function KnowledgeGraphViewer({
  graph,
  onNodeClick,
  onAuditEvent,
  className,
}: KnowledgeGraphViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NodeWithPosition[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [filterNodeType, setFilterNodeType] = useState<NodeType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(false);

  // Initialize node positions with force-directed layout
  useEffect(() => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialNodes: NodeWithPosition[] = graph.nodes.map((node, i) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(initialNodes);
  }, [graph]);

  // Force-directed layout simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        const newNodes = [...prevNodes];
        const alpha = 0.1;

        // Apply forces
        newNodes.forEach((node, i) => {
          let fx = 0;
          let fy = 0;

          // Repulsion between all nodes
          newNodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // Attraction along edges
          graph.edges.forEach((edge) => {
            const isSource = edge.source === node.id;
            const isTarget = edge.target === node.id;
            if (!isSource && !isTarget) return;

            const otherId = isSource ? edge.target : edge.source;
            const other = newNodes.find((n) => n.id === otherId);
            if (!other) return;

            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 100) * 0.01 * edge.weight;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // Center gravity
          const centerX = 400;
          const centerY = 300;
          fx += (centerX - node.x) * 0.001;
          fy += (centerY - node.y) * 0.001;

          // Update velocity and position
          node.vx = (node.vx + fx) * 0.9;
          node.vy = (node.vy + fy) * 0.9;
          node.x += node.vx * alpha;
          node.y += node.vy * alpha;
        });

        return newNodes;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [nodes.length, graph.edges]);

  // Draw graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Filter nodes
    const filteredNodes = nodes.filter((node) => {
      if (filterNodeType !== "all" && node.type !== filterNodeType)
        return false;
      if (
        searchQuery &&
        !node.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Draw edges
    graph.edges.forEach((edge) => {
      if (
        !filteredNodeIds.has(edge.source) ||
        !filteredNodeIds.has(edge.target)
      )
        return;

      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.strokeStyle = EDGE_COLORS[edge.type];
      ctx.lineWidth = edge.weight * 2;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    filteredNodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const radius = isSelected ? 25 : isHovered ? 22 : 20;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = NODE_COLORS[node.type];
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#000" : "#fff";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node icon
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(NODE_ICONS[node.type], node.x, node.y);
    });

    ctx.restore();
  }, [
    nodes,
    graph.edges,
    zoom,
    pan,
    selectedNode,
    hoveredNode,
    filterNodeType,
    searchQuery,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Find clicked node
    const clickedNode = nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      onNodeClick?.(clickedNode);
      onAuditEvent?.("knowledge_graph_node_clicked", {
        nodeId: clickedNode.id,
        nodeType: clickedNode.type,
        nodeLabel: clickedNode.label,
      });
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const hoveredNode = nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    setHoveredNode(hoveredNode || null);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const stats = getGraphStats(graph);
  const learningPaths = findLearningPaths(graph);
  const centrality = calculateCentrality(graph);

  const neighbors = selectedNode
    ? getNodeNeighbors(graph, selectedNode.id)
    : [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <NetworkIcon className="h-5 w-5" />
              Knowledge Graph
            </CardTitle>
            <CardDescription>
              Forms the learning backbone — showing how each decision relates to
              others
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            <InfoIcon className="h-4 w-4 mr-2" />
            {showStats ? "Hide" : "Show"} Stats
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground">Total Nodes</div>
              <div className="text-2xl font-bold">{stats.totalNodes}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Edges</div>
              <div className="text-2xl font-bold">{stats.totalEdges}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg Degree</div>
              <div className="text-2xl font-bold">
                {stats.avgDegree.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Learning Paths
              </div>
              <div className="text-2xl font-bold">{learningPaths.length}</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                id="search"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-48">
            <Select
              value={filterNodeType}
              onValueChange={(value) =>
                setFilterNodeType(value as NodeType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Decision">Decisions</SelectItem>
                <SelectItem value="RiskSignal">Signals</SelectItem>
                <SelectItem value="Incident">Incidents</SelectItem>
                <SelectItem value="Outcome">Outcomes</SelectItem>
                <SelectItem value="Guardrail">Guardrails</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative border border-border rounded-lg overflow-hidden bg-background">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="cursor-pointer"
          />

          <div className="absolute top-2 right-2 flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomIn}
                  >
                    <ZoomInIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomOut}
                  >
                    <ZoomOutIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleResetView}
                  >
                    <MaximizeIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <Badge
              key={type}
              variant="outline"
              className="gap-2"
              style={{ borderColor: color }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />

              {type}
            </Badge>
          ))}
        </div>

        {selectedNode && (
          <div className="border border-border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{selectedNode.label}</div>
                <Badge variant="secondary">{selectedNode.type}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Connections: {centrality[selectedNode.id] || 0}
              </div>
            </div>

            {selectedNode.variables && selectedNode.variables.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Variables</div>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.variables.map((v) => (
                    <Badge key={v} variant="outline" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {neighbors.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">
                  Connected Nodes ({neighbors.length})
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {neighbors.map((neighbor) => (
                    <div
                      key={neighbor.id}
                      className="text-xs p-2 bg-muted rounded flex items-center justify-between"
                    >
                      <span>{neighbor.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {neighbor.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {learningPaths.length > 0 && (
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="text-sm font-medium mb-2">Learning Paths</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {learningPaths.slice(0, 5).map((path, idx) => (
                <div key={idx} className="text-xs p-2 bg-muted rounded">
                  {path.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
