import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  RefreshCwIcon,
} from "lucide-react";
import type {
  DependencyGraph,
  GraphNode,
  GraphEdge,
} from "@/polymet/data/use-goal-graph-v2";

interface DependencyGraphV2Props {
  graph: DependencyGraph;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
}

interface SimulationNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimulationLink {
  source: SimulationNode | string;
  target: SimulationNode | string;
  type: "depends_on" | "enables";
}

export function DependencyGraphV2({
  graph,
  onNodeClick,
  className,
}: DependencyGraphV2Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const simulationRef = useRef<any>(null);

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Financial: "#3b82f6", // blue
      Operational: "#10b981", // green
      Strategic: "#8b5cf6", // purple
      "Compliance & Regulatory": "#f59e0b", // amber
      "People & Culture": "#ec4899", // pink
      "Resilience & Continuity": "#06b6d4", // cyan
      "Technology & Digital": "#6366f1", // indigo
      "Sustainability & ESG": "#22c55e", // green
      "Customer & Market": "#f97316", // orange
      "Innovation & Learning": "#a855f7", // purple
    };
    return colors[category] || "#6b7280"; // gray as fallback
  };

  // Status opacity
  const getStatusOpacity = (status: string) => {
    switch (status) {
      case "active":
        return 1;
      case "draft":
        return 0.6;
      case "paused":
        return 0.5;
      case "retired":
        return 0.3;
      default:
        return 1;
    }
  };

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Initialize and update D3 force simulation
  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    // Dynamic import of d3-force
    import("d3-force").then((d3) => {
      const svg = svgRef.current!;
      const { width, height } = dimensions;

      // Clear previous content
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      // Create container group for zoom/pan
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute(
        "transform",
        `translate(${pan.x},${pan.y}) scale(${zoom})`
      );
      svg.appendChild(g);

      // Prepare nodes and links
      const nodes: SimulationNode[] = graph.nodes.map((node) => ({ ...node }));
      const links: SimulationLink[] = graph.edges.map((edge) => ({
        source: edge.from,
        target: edge.to,
        type: edge.type,
      }));

      // Create force simulation
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(150)
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(50));

      simulationRef.current = simulation;

      // Create arrow markers for edges
      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );

      // Solid arrow for depends_on
      const markerDependsOn = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
      );
      markerDependsOn.setAttribute("id", "arrow-depends-on");
      markerDependsOn.setAttribute("viewBox", "0 -5 10 10");
      markerDependsOn.setAttribute("refX", "25");
      markerDependsOn.setAttribute("refY", "0");
      markerDependsOn.setAttribute("markerWidth", "6");
      markerDependsOn.setAttribute("markerHeight", "6");
      markerDependsOn.setAttribute("orient", "auto");
      const pathDependsOn = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      pathDependsOn.setAttribute("d", "M0,-5L10,0L0,5");
      pathDependsOn.setAttribute("fill", "#64748b");
      markerDependsOn.appendChild(pathDependsOn);
      defs.appendChild(markerDependsOn);

      // Dashed arrow for enables
      const markerEnables = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
      );
      markerEnables.setAttribute("id", "arrow-enables");
      markerEnables.setAttribute("viewBox", "0 -5 10 10");
      markerEnables.setAttribute("refX", "25");
      markerEnables.setAttribute("refY", "0");
      markerEnables.setAttribute("markerWidth", "6");
      markerEnables.setAttribute("markerHeight", "6");
      markerEnables.setAttribute("orient", "auto");
      const pathEnables = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      pathEnables.setAttribute("d", "M0,-5L10,0L0,5");
      pathEnables.setAttribute("fill", "#94a3b8");
      markerEnables.appendChild(pathEnables);
      defs.appendChild(markerEnables);

      g.appendChild(defs);

      // Create links
      const linkElements = links.map((link) => {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute(
          "stroke",
          link.type === "depends_on" ? "#64748b" : "#94a3b8"
        );
        line.setAttribute("stroke-width", "2");
        line.setAttribute(
          "stroke-dasharray",
          link.type === "enables" ? "5,5" : "0"
        );
        line.setAttribute("marker-end", `url(#arrow-${link.type})`);
        line.setAttribute("opacity", "0.6");
        g.appendChild(line);
        return { element: line, data: link };
      });

      // Create nodes
      const nodeElements = nodes.map((node) => {
        const nodeGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        nodeGroup.setAttribute("cursor", "pointer");

        // Circle
        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        circle.setAttribute("r", "20");
        circle.setAttribute("fill", getCategoryColor(node.category));
        circle.setAttribute(
          "opacity",
          getStatusOpacity(node.status).toString()
        );
        circle.setAttribute("stroke", "#fff");
        circle.setAttribute("stroke-width", "2");
        nodeGroup.appendChild(circle);

        // Label
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dy", "35");
        text.setAttribute("font-size", "12");
        text.setAttribute("fill", "currentColor");
        text.textContent =
          node.label.length > 30 ? node.label.slice(0, 30) + "..." : node.label;
        nodeGroup.appendChild(text);

        // Event handlers
        nodeGroup.addEventListener("click", () => {
          setSelectedNode(node.id);
          if (onNodeClick) {
            onNodeClick(node);
          }
        });

        nodeGroup.addEventListener("mouseenter", () => {
          circle.setAttribute("stroke-width", "3");
          circle.setAttribute("r", "22");
        });

        nodeGroup.addEventListener("mouseleave", () => {
          circle.setAttribute("stroke-width", "2");
          circle.setAttribute("r", "20");
        });

        // Drag behavior
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;

        nodeGroup.addEventListener("mousedown", (e) => {
          isDragging = true;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          node.fx = node.x;
          node.fy = node.y;
          e.stopPropagation();
        });

        const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const dx = (e.clientX - dragStartX) / zoom;
          const dy = (e.clientY - dragStartY) / zoom;
          node.fx = (node.fx || node.x || 0) + dx;
          node.fy = (node.fy || node.y || 0) + dy;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          simulation.alpha(0.3).restart();
        };

        const handleMouseUp = () => {
          if (isDragging) {
            isDragging = false;
            node.fx = null;
            node.fy = null;
          }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        g.appendChild(nodeGroup);
        return { element: nodeGroup, data: node, circle };
      });

      // Update positions on tick
      simulation.on("tick", () => {
        linkElements.forEach(({ element, data }) => {
          const source = data.source as SimulationNode;
          const target = data.target as SimulationNode;
          element.setAttribute("x1", (source.x || 0).toString());
          element.setAttribute("y1", (source.y || 0).toString());
          element.setAttribute("x2", (target.x || 0).toString());
          element.setAttribute("y2", (target.y || 0).toString());
        });

        nodeElements.forEach(({ element, data }) => {
          element.setAttribute(
            "transform",
            `translate(${data.x || 0},${data.y || 0})`
          );
        });
      });

      // Highlight selected node
      if (selectedNode) {
        nodeElements.forEach(({ circle, data }) => {
          if (data.id === selectedNode) {
            circle.setAttribute("stroke", "#f59e0b");
            circle.setAttribute("stroke-width", "4");
          }
        });
      }
    });

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [graph, dimensions, zoom, pan, selectedNode, onNodeClick]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  const handleFitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (graph.nodes.length === 0) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-[600px] text-muted-foreground">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">No goals to display</p>
            <p className="text-sm">Create goals to see the dependency graph</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="relative h-[600px]" ref={containerRef}>
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomInIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOutIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleFitToScreen}>
            <MaximizeIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur border border-border rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold">Edge Types</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-500" />

            <span className="text-xs">Depends On</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-400 border-dashed border-t-2 border-slate-400" />

            <span className="text-xs">Enables</span>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur border border-border rounded-lg p-3">
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Nodes:</span>{" "}
              <span className="font-medium">{graph.nodes.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Edges:</span>{" "}
              <span className="font-medium">{graph.edges.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zoom:</span>{" "}
              <span className="font-medium">{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full"
        />
      </div>
    </Card>
  );
}
